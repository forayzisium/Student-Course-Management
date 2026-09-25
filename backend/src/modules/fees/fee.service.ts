import { prisma } from "../../config/prisma";

export const getStudentFees = async (userId: number) => {
  const student = await prisma.studentProfile.findUnique({
    where: {
      userId,
    },
  });

  if (!student) {
    throw new Error("Student profile not found");
  }

  const fees = await prisma.fee.findMany({
    where: {
      studentId: student.id,
    },
    include: {
      payments: {
        where: { status: { in: ["PAID", "PENDING"] } },
        select: { amount: true, status: true, paymentDate: true },
      },
      course: { select: { id: true, code: true, name: true, credits: true } },
      semester: { select: { id: true, name: true, costPerCredit: true } },
    },
    orderBy: {
      dueDate: "asc",
    },
  });
  return fees.map(({ payments, ...fee }) => ({
    paidAmount: payments
      .filter((p) => p.status === "PAID")
      .reduce((sum, p) => sum + p.amount, 0),
    pendingAmount: payments
      .filter((p) => p.status === "PENDING")
      .reduce((sum, p) => sum + p.amount, 0),
    payableAmount:
      fee.status === "PAID"
        ? 0
        : Math.max(
            0,
            fee.amount - payments.reduce((sum, p) => sum + p.amount, 0),
          ),
    ...fee,
    outstandingAmount:
      fee.status === "PAID"
        ? 0
        : Math.max(
            0,
            fee.amount -
              payments
                .filter((p) => p.status === "PAID")
                .reduce((sum, payment) => sum + payment.amount, 0),
          ),
  }));
};

export const createStudentFee = async (data: {
  studentId: number;
  feeType: string;
  amount: number;
  dueDate: Date;
}) => {
  return prisma.fee.create({
    data: {
      studentId: data.studentId,
      feeType: data.feeType,
      amount: data.amount,
      dueDate: data.dueDate,
      status: "UNPAID",
    },
  });
};
