import { prisma } from "../../config/prisma";
import { realtimeEventBus } from "../events/event.bus";

type PaymentInput = {
  feeId: number;
  amount: number;
  method: "CASH" | "CARD" | "BANK_TRANSFER" | "MOBILE_BANKING";
  channel?: string;
  transactionId?: string;
};

export async function createStudentPayment(userId: number, data: PaymentInput) {
  if (!Number.isFinite(data.amount) || data.amount <= 0)
    throw new Error("Amount must be greater than 0");
  if (!Number.isSafeInteger(data.feeId) || data.feeId <= 0)
    throw new Error("Invalid fee ID");
  const reference = data.transactionId?.trim();
  if (!reference || !/^[A-Za-z0-9_-]{4,100}$/.test(reference))
    throw new Error(
      "Provide the actual transaction reference (4-100 letters, digits, hyphens or underscores)",
    );
  if (
    data.channel !== undefined &&
    (typeof data.channel !== "string" || data.channel.length > 50)
  )
    throw new Error("Invalid payment channel");
  const student = await prisma.studentProfile.findUnique({ where: { userId } });
  if (!student) throw new Error("Student profile not found");
  const payment = await prisma.$transaction(async (tx) => {
    // Serialize claims for a fee, including two different references submitted at once.
    await tx.$queryRaw`SELECT id FROM fees WHERE id = ${data.feeId} AND studentId = ${student.id} FOR UPDATE`;
    const fee = await tx.fee.findFirst({
      where: { id: data.feeId, studentId: student.id },
    });
    if (!fee) throw new Error("Fee not found");
    const previous = await tx.payment.findUnique({
      where: { transactionId: reference },
    });
    if (previous) {
      if (
        previous.studentId === student.id &&
        previous.feeId === fee.id &&
        previous.amount === data.amount &&
        previous.method === data.method
      )
        return previous;
      throw new Error("Transaction reference is already in use");
    }
    const allocated = await tx.payment.aggregate({
      where: { feeId: fee.id, status: { in: ["PAID", "PENDING"] } },
      _sum: { amount: true },
    });
    const available = Math.max(0, fee.amount - (allocated._sum.amount || 0));
    if (fee.status === "PAID" || data.amount > available)
      throw new Error(
        "Amount exceeds the balance available after paid and pending payments",
      );
    return tx.payment.create({
      data: {
        studentId: student.id,
        feeId: fee.id,
        feeType: fee.feeType,
        amount: data.amount,
        method: data.method,
        channel: data.channel || data.method,
        transactionId: reference,
        status: "PENDING",
      },
    });
  });
  realtimeEventBus.emitToStudent(student.id, "PAYMENT_UPDATED");
  return payment;
}

export async function getStudentPayments(userId: number) {
  const student = await prisma.studentProfile.findUnique({
    where: {
      userId,
    },
  });

  if (!student) {
    throw new Error("Student profile not found");
  }

  return prisma.payment.findMany({
    where: {
      studentId: student.id,
    },
    orderBy: {
      paymentDate: "desc",
    },
  });
}

export async function getAllPayments() {
  return prisma.payment.findMany({
    include: {
      student: {
        select: {
          id: true,
          studentId: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      paymentDate: "desc",
    },
  });
}

export async function updatePaymentStatus(
  paymentId: number,
  status: "PENDING" | "PAID" | "FAILED" | "CANCELLED",
) {
  const payment = await prisma.payment.findUnique({
    where: {
      id: paymentId,
    },
  });

  if (!payment) {
    throw new Error("Payment not found");
  }

  const updatedPayment = await prisma.$transaction(async (tx) => {
    if (payment.feeId) {
      await tx.$queryRaw`SELECT id FROM fees WHERE id = ${payment.feeId} FOR UPDATE`;
      if (status === "PAID") {
        const fee = await tx.fee.findUnique({ where: { id: payment.feeId } });
        const settled = await tx.payment.aggregate({
          where: {
            feeId: payment.feeId,
            status: "PAID",
            NOT: { id: paymentId },
          },
          _sum: { amount: true },
        });
        if (fee && (settled._sum.amount || 0) + payment.amount > fee.amount)
          throw new Error("Approving this payment would exceed the fee amount");
      }
    }
    const updated = await tx.payment.update({
      where: {
        id: paymentId,
      },
      data: {
        status,
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        fee: true,
      },
    });

    // If this payment is linked to a fee, recalculate the fee's payment status.
    if (payment.feeId) {
      const fee = await tx.fee.findUnique({
        where: {
          id: payment.feeId,
        },
      });

      if (fee) {
        const paidPayments = await tx.payment.aggregate({
          where: {
            feeId: payment.feeId,
            status: "PAID",
          },
          _sum: {
            amount: true,
          },
        });

        const paidAmount = paidPayments._sum.amount || 0;

        let feeStatus: "UNPAID" | "PARTIAL" | "PAID" | "OVERDUE";

        if (paidAmount >= fee.amount) {
          feeStatus = "PAID";
        } else if (paidAmount > 0) {
          feeStatus = "PARTIAL";
        } else if (new Date(fee.dueDate) < new Date()) {
          feeStatus = "OVERDUE";
        } else {
          feeStatus = "UNPAID";
        }

        await tx.fee.update({
          where: {
            id: fee.id,
          },
          data: {
            status: feeStatus,
          },
        });
      }
    }

    return updated;
  });

  return updatedPayment;
}
export async function createAdminPayment(data: {
  studentId: number;
  feeType: string;
  amount: number;
  method: "CASH" | "CARD" | "BANK_TRANSFER" | "MOBILE_BANKING";
  status: "PENDING" | "PAID" | "FAILED" | "CANCELLED";
}) {
  const student = await prisma.studentProfile.findUnique({
    where: {
      id: data.studentId,
    },
  });

  if (!student) {
    throw new Error("Student profile not found");
  }

  return prisma.payment.create({
    data: {
      studentId: data.studentId,
      feeType: data.feeType,
      amount: data.amount,
      method: data.method,
      status: data.status,
    },
    include: {
      student: {
        select: {
          id: true,
          studentId: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });
}
