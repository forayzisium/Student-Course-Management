import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import {
  getStudents,
  getStudentById,
  updateStudentStatus,
  getMyStudentProfile,
  updateMyStudentProfile,
  getMyStudentActivity,
} from "./student.service";

export async function getAllStudents(_req: Request, res: Response) {
  try {
    const students = await getStudents();

    res.json({
      success: true,
      data: students,
    });
  } catch (error) {
    console.error("Get students error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch students",
    });
  }
}

export async function getSingleStudent(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
    }

    const student = await getStudentById(id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error("Get student error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch student",
    });
  }
}

export async function updateStudent(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const { status } = req.body ?? {};

    if (Number.isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
    }

    if (status !== "ACTIVE" && status !== "INACTIVE") {
      return res.status(400).json({
        success: false,
        message: "Status must be ACTIVE or INACTIVE",
      });
    }

    const student = await updateStudentStatus(id, status);

    res.json({
      success: true,
      message: "Student status updated successfully",
      data: student,
    });
  } catch (error) {
    console.error("Update student error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to update student";

    res.status(400).json({
      success: false,
      message,
    });
  }
}
export async function getMyProfile(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const student = await getMyStudentProfile(userId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    res.json({
      success: true,
      data: student,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
}
export async function updateMyProfile(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { name, email, department, year, phone, address } = req.body ?? {};

    const student = await updateMyStudentProfile(userId, {
      name,
      email,
      department,
      year,
      phone,
      address,
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: student,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update profile";

    const statusCode =
      message === "Student profile not found"
        ? 404
        : message === "Email already in use"
          ? 409
          : 400;

    res.status(statusCode).json({
      success: false,
      message,
    });
  }
}
export async function getMyActivity(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const activities = await getMyStudentActivity(userId);

    res.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    console.error("Get student activity error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch student activity";

    const statusCode = message === "Student profile not found" ? 404 : 500;

    res.status(statusCode).json({
      success: false,
      message,
    });
  }
}
export const getMyNotificationSettings = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user!.userId;

    const student = await prisma.studentProfile.findUnique({
      where: { userId },
      select: {
        assignmentNotifications: true,
        gradeNotifications: true,
        feeNotifications: true,
      },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error("Get notification settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get notification settings",
    });
  }
};

export const updateMyNotificationSettings = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user!.userId;

    const { assignmentNotifications, gradeNotifications, feeNotifications } =
      req.body;

    const student = await prisma.studentProfile.findUnique({
      where: { userId },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    const updatedStudent = await prisma.studentProfile.update({
      where: { userId },
      data: {
        ...(typeof assignmentNotifications === "boolean" && {
          assignmentNotifications,
        }),

        ...(typeof gradeNotifications === "boolean" && {
          gradeNotifications,
        }),

        ...(typeof feeNotifications === "boolean" && {
          feeNotifications,
        }),
      },
      select: {
        assignmentNotifications: true,
        gradeNotifications: true,
        feeNotifications: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Notification settings updated successfully",
      data: updatedStudent,
    });
  } catch (error) {
    console.error("Update notification settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update notification settings",
    });
  }
};
