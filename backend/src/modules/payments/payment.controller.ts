import { Request, Response } from "express";
import {
  createAdminPayment,
  createStudentPayment,
  getAllPayments,
  getStudentPayments,
  updatePaymentStatus,
} from "./payment.service";

const validMethods = [
  "CASH",
  "CARD",
  "BANK_TRANSFER",
  "MOBILE_BANKING",
] as const;

const validStatuses = ["PENDING", "PAID", "FAILED", "CANCELLED"] as const;

export async function createNewPayment(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;

    const { feeId, amount, method, transactionId, channel } = req.body;

    if (!feeId || amount === undefined || !method) {
      return res.status(400).json({
        success: false,
        message: "feeId, amount and method are required",
      });
    }

    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0",
      });
    }

    const allowedMethods = ["CASH", "CARD", "BANK_TRANSFER", "MOBILE_BANKING"];

    if (!allowedMethods.includes(method)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    const payment = await createStudentPayment(userId, {
      transactionId,
      channel,
      feeId: Number(feeId),
      amount: Number(amount),
      method,
    });

    return res.status(201).json({
      success: true,
      message: "Payment created successfully",
      data: payment,
    });
  } catch (error) {
    console.error("Create student payment error:", error);

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create payment",
    });
  }
}

export async function getMyPayments(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;

    const payments = await getStudentPayments(userId);

    res.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    console.error("Get student payments error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to fetch payments";

    res.status(400).json({
      success: false,
      message,
    });
  }
}

export async function getPaymentsForAdmin(_req: Request, res: Response) {
  try {
    const payments = await getAllPayments();

    res.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    console.error("Get all payments error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch payments",
    });
  }
}

export async function updateExistingPaymentStatus(req: Request, res: Response) {
  try {
    const paymentId = Number(req.params.id);
    const { status } = req.body ?? {};

    if (Number.isNaN(paymentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment ID",
      });
    }

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status",
      });
    }

    const payment = await updatePaymentStatus(paymentId, status);

    res.json({
      success: true,
      message: "Payment status updated successfully",
      data: payment,
    });
  } catch (error) {
    console.error("Update payment status error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to update payment status";

    res.status(404).json({
      success: false,
      message,
    });
  }
}
export async function createAdminNewPayment(req: Request, res: Response) {
  try {
    const { studentId, feeType, amount, method, status } = req.body ?? {};

    if (
      studentId === undefined ||
      !feeType ||
      amount === undefined ||
      !method
    ) {
      return res.status(400).json({
        success: false,
        message: "studentId, feeType, amount and method are required",
      });
    }

    const parsedStudentId = Number(studentId);
    const parsedAmount = Number(amount);

    if (Number.isNaN(parsedStudentId) || parsedStudentId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
    }

    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a valid positive number",
      });
    }

    if (!validMethods.includes(method)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    const paymentStatus = status === undefined ? "PAID" : status;

    if (!validStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status",
      });
    }

    const payment = await createAdminPayment({
      studentId: parsedStudentId,
      feeType: String(feeType),
      amount: parsedAmount,
      method,
      status: paymentStatus,
    });

    return res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      data: payment,
    });
  } catch (error) {
    console.error("Admin create payment error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to record payment";

    return res.status(400).json({
      success: false,
      message,
    });
  }
}
