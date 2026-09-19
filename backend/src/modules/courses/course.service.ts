import { prisma } from "../../config/prisma";
import { realtimeEventBus } from "../events/event.bus";

const semesterInclude = {
  select: {
    id: true,
    name: true,
    startDate: true,
    endDate: true,
    isCurrent: true,
    costPerCredit: true,
  },
} as const;

export async function getCourses(semesterId?: number) {
  return prisma.course.findMany({
    where: semesterId ? { semesterId } : undefined,
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      semesterRecord: semesterInclude,
      _count: {
        select: {
          enrollments: {
            where: { status: "ACTIVE" },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getCourseById(id: number) {
  return prisma.course.findUnique({
    where: { id },
    include: {
      semesterRecord: semesterInclude,
      teacher: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      assignments: {
        where: { status: "ACTIVE" },
        orderBy: { dueDate: "asc" },
      },
    },
  });
}

export async function createCourse(data: {
  code: string;
  name: string;
  department: string;
  semesterId: number;
  teacherId: number;
  description?: string;
  credits?: number;
  syllabus?: string;
}) {
  if (
    data.credits !== undefined &&
    (!Number.isFinite(data.credits) || data.credits <= 0 || data.credits > 30)
  )
    throw new Error("Credits must be greater than 0 and at most 30");
  const teacher = await prisma.user.findFirst({
    where: {
      id: data.teacherId,
      role: "TEACHER",
      status: "ACTIVE",
    },
  });

  if (!teacher) {
    throw new Error("Active teacher not found");
  }
  const semester = await prisma.semester.findUnique({
    where: { id: data.semesterId },
  });
  if (!semester) throw new Error("Semester not found");

  const course = await prisma.course.create({
    data: {
      code: data.code,
      name: data.name,
      department: data.department,
      semester: semester.name,
      semesterId: data.semesterId,
      teacherId: data.teacherId,
      description: data.description,
      credits: data.credits ?? 3.0,
      syllabus: data.syllabus,
    },
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      semesterRecord: semesterInclude,
    },
  });

  realtimeEventBus.emitBroadcast("COURSE_CATALOG_UPDATED", {
    courseId: course.id,
    action: "CREATED",
  });

  return course;
}

export async function updateCourse(
  id: number,
  data: {
    code?: string;
    name?: string;
    department?: string;
    semesterId?: number;
    teacherId?: number;
    status?: "ACTIVE" | "INACTIVE";
    description?: string;
    credits?: number;
    syllabus?: string;
  },
) {
  if (
    data.credits !== undefined &&
    (!Number.isFinite(data.credits) || data.credits <= 0 || data.credits > 30)
  )
    throw new Error("Credits must be greater than 0 and at most 30");
  if (data.teacherId !== undefined) {
    const teacher = await prisma.user.findFirst({
      where: {
        id: data.teacherId,
        role: "TEACHER",
        status: "ACTIVE",
      },
    });

    if (!teacher) {
      throw new Error("Active teacher not found");
    }
  }
  let semesterName: string | undefined;
  if (data.semesterId !== undefined) {
    const semester = await prisma.semester.findUnique({
      where: { id: data.semesterId },
    });
    if (!semester) throw new Error("Semester not found");
    semesterName = semester.name;
  }

  const updatedCourse = await prisma.course.update({
    where: { id },
    data: { ...data, ...(semesterName ? { semester: semesterName } : {}) },
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      semesterRecord: semesterInclude,
    },
  });

  if (data.credits !== undefined || data.semesterId !== undefined) {
    const fees = await prisma.fee.findMany({
      where: { courseId: updatedCourse.id },
      include: { payments: { where: { status: "PAID" } } },
    });
    const amount =
      Math.round(
        updatedCourse.credits *
          updatedCourse.semesterRecord.costPerCredit *
          100,
      ) / 100;
    for (const fee of fees) {
      const paid = fee.payments.reduce(
        (sum, payment) => sum + payment.amount,
        0,
      );
      await prisma.fee.update({
        where: { id: fee.id },
        data: {
          semesterId: updatedCourse.semesterId,
          amount,
          feeType: `${updatedCourse.code} Tuition (${updatedCourse.credits} credits)`,
          status:
            paid >= amount
              ? "PAID"
              : paid > 0
                ? "PARTIAL"
                : fee.dueDate < new Date()
                  ? "OVERDUE"
                  : "UNPAID",
        },
      });
    }
  }

  realtimeEventBus.emitBroadcast("COURSE_CATALOG_UPDATED", {
    courseId: updatedCourse.id,
    action: "UPDATED",
  });

  return updatedCourse;
}
export async function getTeacherCourses(userId: number, semesterId?: number) {
  return prisma.course.findMany({
    where: {
      teacherId: userId,
      ...(semesterId ? { semesterId } : {}),
    },
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      semesterRecord: semesterInclude,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}
export async function getAvailableCourses(semesterId?: number) {
  return prisma.course.findMany({
    where: {
      status: "ACTIVE",
      ...(semesterId ? { semesterId } : {}),
    },
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      credits: true,
      syllabus: true,
      department: true,
      semester: true,
      semesterId: true,
      semesterRecord: semesterInclude,
      status: true,
      teacher: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      code: "asc",
    },
  });
}
