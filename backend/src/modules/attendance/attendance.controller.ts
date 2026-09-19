import { Request, Response } from "express";
import {
  getCourseAttendance,
  getStudentAttendance,
  getTeacherCourseAttendance,
  markAttendance,
  saveCourseAttendance,
  updateAttendance,
} from "./attendance.service";
import { publishTeacherActivity } from "../activities/activity.service";

export async function markNewAttendance(req: Request, res: Response) {
  try {
    const teacherId = req.user!.userId;
    const { studentId, courseId, date, status } = req.body;

    if (studentId === undefined || courseId === undefined || !date || !status) {
      return res.status(400).json({
        success: false,
        message: "studentId, courseId, date and status are required",
      });
    }

    const parsedStudentId = Number(studentId);
    const parsedCourseId = Number(courseId);
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedStudentId) || Number.isNaN(parsedCourseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID or course ID",
      });
    }

    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date",
      });
    }

    if (status !== "PRESENT" && status !== "ABSENT" && status !== "LATE") {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance status",
      });
    }

    const attendance = await markAttendance(teacherId, {
      studentId: parsedStudentId,
      courseId: parsedCourseId,
      date: parsedDate,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Attendance marked successfully",
      data: attendance,
    });
  } catch (error) {
    console.error("Mark attendance error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to mark attendance";

    res.status(400).json({
      success: false,
      message,
    });
  }
}

export async function saveAttendanceSheet(req: Request, res: Response) {
  try {
    const teacherId = req.user!.userId;
    const courseId = Number(req.params.courseId);
    const { date, records } = req.body ?? {};

    if (!Number.isInteger(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    const parsedDate = new Date(date);

    if (!date || Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "A valid attendance date is required",
      });
    }

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one attendance record is required",
      });
    }

    const parsedRecords = records.map((record: unknown) => {
      if (!record || typeof record !== "object") {
        return null;
      }

      const value = record as { studentId?: unknown; status?: unknown };
      const studentId = Number(value.studentId);

      if (
        !Number.isInteger(studentId) ||
        (value.status !== "PRESENT" &&
          value.status !== "ABSENT" &&
          value.status !== "LATE")
      ) {
        return null;
      }

      return {
        studentId,
        status: value.status,
      };
    });

    if (parsedRecords.some((record) => record === null)) {
      return res.status(400).json({
        success: false,
        message: "Each record requires a valid studentId and attendance status",
      });
    }

    const studentIds = parsedRecords.map((record) => record!.studentId);

    if (new Set(studentIds).size !== studentIds.length) {
      return res.status(400).json({
        success: false,
        message: "Each student can only appear once in an attendance sheet",
      });
    }

    const attendance = await saveCourseAttendance(
      teacherId,
      courseId,
      parsedDate,
      parsedRecords as {
        studentId: number;
        status: "PRESENT" | "ABSENT" | "LATE";
      }[],
    );

    const course = attendance[0]?.course;
    if (course) {
      publishTeacherActivity(teacherId, {
        type: "ATTENDANCE_SAVED",
        title: "Attendance saved",
        description: `Attendance was recorded for ${attendance.length} student${attendance.length === 1 ? "" : "s"}.`,
        courseCode: course.code,
        priority: "MEDIUM",
      });
    }

    return res.json({
      success: true,
      message: "Attendance saved successfully",
      data: attendance,
    });
  } catch (error) {
    console.error("Save attendance sheet error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to save attendance";

    return res.status(400).json({
      success: false,
      message,
    });
  }
}

export async function getCourseAttendanceList(req: Request, res: Response) {
  try {
    const courseId = Number(req.params.courseId);

    if (Number.isNaN(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    const attendance = await getCourseAttendance(courseId);

    res.json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    console.error("Get course attendance error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to fetch attendance";

    res.status(404).json({
      success: false,
      message,
    });
  }
}

export async function getMyAttendance(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;

    const attendance = await getStudentAttendance(userId);

    res.json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    console.error("Get student attendance error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to fetch attendance";

    res.status(400).json({
      success: false,
      message,
    });
  }
}

export async function getTeacherCourseAttendanceList(
  req: Request,
  res: Response,
) {
  try {
    const teacherId = req.user!.userId;
    const courseId = Number(req.params.courseId);

    if (Number.isNaN(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    const attendance = await getTeacherCourseAttendance(teacherId, courseId);

    res.json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    console.error("Get teacher course attendance error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to fetch attendance";

    res.status(403).json({
      success: false,
      message,
    });
  }
}

export async function updateExistingAttendance(req: Request, res: Response) {
  try {
    const teacherId = req.user!.userId;
    const attendanceId = Number(req.params.id);
    const { status } = req.body ?? {};

    if (Number.isNaN(attendanceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance ID",
      });
    }

    if (status !== "PRESENT" && status !== "ABSENT" && status !== "LATE") {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance status",
      });
    }

    const attendance = await updateAttendance(teacherId, attendanceId, status);

    res.json({
      success: true,
      message: "Attendance updated successfully",
      data: attendance,
    });
  } catch (error) {
    console.error("Update attendance error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to update attendance";

    res.status(403).json({
      success: false,
      message,
    });
  }
}
