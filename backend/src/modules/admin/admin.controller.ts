import { Request, Response } from "express";
import { reportRange } from "./report-range";
import {
  getTeacherRequests,
  approveTeacher,
  rejectTeacher,
  getAdminDashboard,
  getAdminReports,
  getMyAdminProfile,
  updateMyAdminProfile,
} from "./admin.service";

export async function teacherRequests(_req: Request, res: Response) {
  try {
    const teachers = await getTeacherRequests();

    return res.json({
      success: true,
      teachers,
    });
  } catch (error) {
    console.error("Failed to get teacher requests:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get teacher requests",
    });
  }
}

export async function approveTeacherRequest(req: Request, res: Response) {
  try {
    const userId = Number(req.params.id);

    if (Number.isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid teacher ID",
      });
    }

    const teacher = await approveTeacher(userId);

    return res.json({
      success: true,
      message: "Teacher approved successfully",
      teacher,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to approve teacher";

    return res.status(400).json({
      success: false,
      message,
    });
  }
}

export async function rejectTeacherRequest(req: Request, res: Response) {
  try {
    const userId = Number(req.params.id);

    if (Number.isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid teacher ID",
      });
    }

    const teacher = await rejectTeacher(userId);

    return res.json({
      success: true,
      message: "Teacher rejected successfully",
      teacher,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to reject teacher";

    return res.status(400).json({
      success: false,
      message,
    });
  }
}
export async function getDashboard(_req: Request, res: Response) {
  try {
    const dashboard = await getAdminDashboard();

    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    console.error("Get admin dashboard error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch admin dashboard",
    });
  }
}
export async function getReports(req: Request, res: Response) {
  try {
    let range;
    try {
      range = reportRange(req.query.start, req.query.end);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Invalid date range.",
      });
    }
    const reports = await getAdminReports(range);

    res.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch reports",
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

    const admin = await getMyAdminProfile(userId);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin profile not found",
      });
    }

    res.json({
      success: true,
      data: admin,
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

    const { name, email, username } = req.body ?? {};

    const admin = await updateMyAdminProfile(userId, {
      name,
      email,
      username,
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: admin,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update profile";

    const statusCode =
      message === "Admin profile not found"
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
