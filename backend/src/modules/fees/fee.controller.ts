import { Request, Response } from "express";
import { createStudentFee, getStudentFees } from "./fee.service";

export const getMyFees = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const fees = await getStudentFees(userId);

    return res.json({
      success: true,
      data: fees,
    });
  } catch (error) {
    console.error("Get my fees error:", error);

    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to get fees",
    });
  }
};

export const createNewStudentFee = async (req: Request, res: Response) => {
  try {
    const { studentId, feeType, amount, dueDate } = req.body;

    if (!studentId || !feeType || amount === undefined || !dueDate) {
      return res.status(400).json({
        success: false,
        message: "studentId, feeType, amount and dueDate are required",
      });
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0",
      });
    }

    const fee = await createStudentFee({
      studentId: Number(studentId),
      feeType,
      amount: Number(amount),
      dueDate: new Date(dueDate),
    });

    return res.status(201).json({
      success: true,
      message: "Fee created successfully",
      data: fee,
    });
  } catch (error) {
    console.error("Create fee error:", error);

    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to create fee",
    });
  }
};
