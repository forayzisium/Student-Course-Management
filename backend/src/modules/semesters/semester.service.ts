import { prisma } from "../../config/prisma";

type SemesterInput = {
  name: string;
  startDate: Date;
  endDate: Date;
  isCurrent?: boolean;
  costPerCredit: number;
};

function validateDates(startDate: Date, endDate: Date) {
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()))
    throw new Error("Valid start and end dates are required");

  if (startDate >= endDate)
    throw new Error("End date must be after start date");
}

export function getSemesters() {
  return prisma.semester.findMany({
    include: { _count: { select: { courses: true } } },
    orderBy: [{ isCurrent: "desc" }, { startDate: "desc" }],
  });
}

export function getSemester(id: number) {
  return prisma.semester.findUnique({
    where: { id },
    include: { _count: { select: { courses: true } } },
  });
}

export async function createSemester(data: SemesterInput) {
  validateDates(data.startDate, data.endDate);

  if (!Number.isFinite(data.costPerCredit) || data.costPerCredit < 0)
    throw new Error("Cost per credit must be zero or greater");

  return prisma.$transaction(
    async (tx) => {
      if (data.isCurrent) {
        await tx.semester.updateMany({
          data: { isCurrent: false },
        });
      }

      return tx.semester.create({ data });
    },
    {
      maxWait: 10000,
      timeout: 15000,
    },
  );
}

export async function updateSemester(
  id: number,
  data: Partial<SemesterInput>,
) {
  const existing = await prisma.semester.findUnique({
    where: { id },
  });

  if (!existing) throw new Error("Semester not found");

  const startDate = data.startDate ?? existing.startDate;
  const endDate = data.endDate ?? existing.endDate;

  validateDates(startDate, endDate);

  if (
    data.costPerCredit !== undefined &&
    (!Number.isFinite(data.costPerCredit) || data.costPerCredit < 0)
  ) {
    throw new Error("Cost per credit must be zero or greater");
  }

  return prisma.$transaction(
    async (tx) => {
      if (data.isCurrent) {
        await tx.semester.updateMany({
          where: {
            id: {
              not: id,
            },
          },
          data: {
            isCurrent: false,
          },
        });
      }

      const semester = await tx.semester.update({
        where: { id },
        data,
      });

      if (data.name && data.name !== existing.name) {
        await tx.course.updateMany({
          where: {
            semesterId: id,
          },
          data: {
            semester: data.name,
          },
        });
      }

      if (data.costPerCredit !== undefined) {
        const enrollments = await tx.enrollment.findMany({
          where: {
            status: "ACTIVE",
            course: {
              semesterId: id,
            },
          },
          include: {
            course: true,
            fee: {
              include: {
                payments: {
                  where: {
                    status: "PAID",
                  },
                  select: {
                    amount: true,
                  },
                },
              },
            },
          },
        });

        const now = new Date();

        const dueDate = new Date(
          Math.min(
            Math.max(semester.startDate.getTime(), now.getTime()),
            semester.endDate.getTime(),
          ),
        );

        for (const enrollment of enrollments) {
          const amount =
            Math.round(
              enrollment.course.credits * data.costPerCredit * 100,
            ) / 100;

          const paid =
            enrollment.fee?.payments.reduce(
              (sum, payment) => sum + payment.amount,
              0,
            ) ?? 0;

          const status =
            paid >= amount
              ? "PAID"
              : paid > 0
                ? "PARTIAL"
                : dueDate < now
                  ? "OVERDUE"
                  : "UNPAID";

          await tx.fee.upsert({
            where: {
              enrollmentId: enrollment.id,
            },
            create: {
              studentId: enrollment.studentId,
              courseId: enrollment.courseId,
              semesterId: id,
              enrollmentId: enrollment.id,
              feeType: `${enrollment.course.code} Tuition (${enrollment.course.credits} credits)`,
              amount,
              dueDate,
              status,
            },
            update: {
              amount,
              dueDate,
              status,
              feeType: `${enrollment.course.code} Tuition (${enrollment.course.credits} credits)`,
            },
          });
        }
      }

      return semester;
    },
    {
      maxWait: 10000,
      timeout: 15000,
    },
  );
}

export async function deleteSemester(id: number) {
  const semester = await prisma.semester.findUnique({
    where: { id },
    include: { _count: { select: { courses: true } } },
  });

  if (!semester) throw new Error("Semester not found");

  if (semester._count.courses > 0)
    throw new Error("Move this semester's courses before deleting it");

  return prisma.semester.delete({
    where: { id },
  });
}