import { Request, Response } from "express";
import {
  getTeachers,
  getTeacherById,
  getMyTeacherProfile,
  getMyTeacherStudents,
  updateMyTeacherProfile,
  updateTeacherStatus,
} from "./teacher.service";

export async function getAllTeachers(_req: Request, res: Response) {
  try {
    const teachers = await getTeachers();

    res.json({
      success: true,
      data: teachers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch teachers",
    });
  }
}

export async function getSingleTeacher(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid teacher ID",
      });
    }

    const teacher = await getTeacherById(id);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    res.json({
      success: true,
      data: teacher,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch teacher",
    });
  }
}

export async function updateTeacher(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const { status } = req.body ?? {};

    if (Number.isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid teacher ID",
      });
    }

    if (status !== "ACTIVE" && status !== "INACTIVE") {
      return res.status(400).json({
        success: false,
        message: "Status must be ACTIVE or INACTIVE",
      });
    }

    const teacher = await updateTeacherStatus(id, status);

    res.json({
      success: true,
      message: `Teacher ${status.toLowerCase()} successfully`,
      data: teacher,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update teacher";

    const statusCode = message === "Teacher not found" ? 404 : 400;

    res.status(statusCode).json({
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

    const teacher = await getMyTeacherProfile(userId);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher profile not found",
      });
    }

    res.json({
      success: true,
      data: teacher,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
}

export async function getMyStudents(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const students = await getMyTeacherStudents(userId);

    res.json({
      success: true,
      data: students,
    });
  } catch (error) {
    console.error("Get my students error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch students",
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

    const {
      name,
      username,
      email,
      department,
      qualification,
      experience,
      phone,
    } = req.body ?? {};

    const teacher = await updateMyTeacherProfile(userId, {
      name,
      username,
      email,
      department,
      qualification,
      experience,
      phone,
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: teacher,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update profile";

    const statusCode =
      message === "Teacher profile not found"
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
