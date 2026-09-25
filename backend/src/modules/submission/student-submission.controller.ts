import { Request, Response } from "express";
import fs from "fs";
import {
  getStudentAssignment,
  submitAssignment,
  getMySubmissions,
} from "./student-submission.service";

export async function getMyAssignment(req: Request, res: Response) {
  try {
    const studentId = req.user!.userId;
    const assignmentId = Number(req.params.assignmentId);

    if (Number.isNaN(assignmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid assignment ID",
      });
    }

    const assignment = await getStudentAssignment(studentId, assignmentId);

    return res.json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    console.error("Get student assignment error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to fetch assignment";

    return res.status(400).json({
      success: false,
      message,
    });
  }
}

export async function submitMyAssignment(req: Request, res: Response) {
  try {
    const studentId = req.user!.userId;
    const assignmentId = Number(req.params.assignmentId);

    if (!Number.isInteger(assignmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid assignment ID",
      });
    }

    const file = req.file;

    const submission = await submitAssignment(studentId, assignmentId, file);

    return res.status(201).json({
      success: true,
      message: "Assignment submitted successfully",
      data: submission,
    });
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error("Failed to remove rejected upload:", cleanupError);
      }
    }

    const message =
      error instanceof Error ? error.message : "Failed to submit assignment";

    return res.status(400).json({
      success: false,
      message,
    });
  }
}

export async function getMySubmissionsController(req: Request, res: Response) {
  try {
    const studentId = req.user!.userId;

    const submissions = await getMySubmissions(studentId);

    return res.json({
      success: true,
      data: submissions,
    });
  } catch (error) {
    console.error("Get student submissions error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to fetch submissions";

    return res.status(400).json({
      success: false,
      message,
    });
  }
}
