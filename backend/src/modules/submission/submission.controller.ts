import { Request, Response } from "express";
import path from "path";
import fs from "fs";

import {
  getTeacherAssignmentSubmissions,
  gradeSubmission,
  getStudentAssignmentSubmission,
  submitStudentAssignment,
} from "./submission.service";

import { prisma } from "../../config/prisma";

export async function getMyAssignmentSubmissions(req: Request, res: Response) {
  try {
    const teacherId = req.user!.userId;
    const assignmentId = Number(req.params.assignmentId);

    if (Number.isNaN(assignmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid assignment ID",
      });
    }

    const result = await getTeacherAssignmentSubmissions(
      teacherId,
      assignmentId,
    );

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get teacher assignment submissions error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to get submissions";

    return res.status(400).json({
      success: false,
      message,
    });
  }
}

export async function gradeMySubmission(req: Request, res: Response) {
  try {
    const teacherId = req.user!.userId;
    const submissionId = Number(req.params.submissionId);

    const marks = Number(req.body.marks);
    const feedback =
      typeof req.body.feedback === "string" ? req.body.feedback : undefined;

    if (Number.isNaN(submissionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid submission ID",
      });
    }

    if (Number.isNaN(marks)) {
      return res.status(400).json({
        success: false,
        message: "Marks must be a valid number",
      });
    }

    const submission = await gradeSubmission(
      teacherId,
      submissionId,
      marks,
      feedback,
    );

    return res.json({
      success: true,
      message: "Submission graded successfully",
      data: submission,
    });
  } catch (error) {
    console.error("Grade submission error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to grade submission";

    return res.status(400).json({
      success: false,
      message,
    });
  }
}

export async function downloadSubmissionFile(req: Request, res: Response) {
  try {
    const teacherId = req.user!.userId;
    const submissionId = Number(req.params.submissionId);

    if (Number.isNaN(submissionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid submission ID",
      });
    }

    const submission = await prisma.submission.findFirst({
      where: {
        id: submissionId,
        assignment: {
          course: {
            teacherId,
          },
        },
      },
      select: {
        fileUrl: true,
        fileName: true,
      },
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found or access denied",
      });
    }

    if (!submission.fileUrl) {
      return res.status(404).json({
        success: false,
        message: "No file attached to this submission",
      });
    }

    const filePath = path.resolve(submission.fileUrl);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "Submission file not found",
      });
    }

    return res.download(filePath, submission.fileName || "submission");
  } catch (error) {
    console.error("Download submission file error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to download submission file",
    });
  }
}

export async function getMyStudentSubmission(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const assignmentId = Number(req.params.assignmentId);

    if (Number.isNaN(assignmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid assignment ID",
      });
    }

    const result = await getStudentAssignmentSubmission(userId, assignmentId);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get student submission error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to get submission";

    return res.status(400).json({
      success: false,
      message,
    });
  }
}

export async function submitMyAssignment(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const assignmentId = Number(req.params.assignmentId);

    if (Number.isNaN(assignmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid assignment ID",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a file",
      });
    }

    const fileName = req.file.originalname;
    const fileUrl = req.file.path;

    const submission = await submitStudentAssignment(
      userId,
      assignmentId,
      fileName,
      fileUrl,
    );

    return res.status(201).json({
      success: true,
      message: "Assignment submitted successfully",
      data: submission,
    });
  } catch (error) {
    console.error("Submit assignment error:", error);

    // If database validation fails after upload, remove the uploaded file.
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (deleteError) {
        console.error("Failed to remove uploaded file:", deleteError);
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
