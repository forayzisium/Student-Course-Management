import { Request, Response } from "express";
import {
  enrollStudent,
  getStudentEnrollments,
  getMyStudentEnrollments,
  getTeacherCourseStats,
  getTeacherCourseStudents,
  getMyEnrollmentHistory as getMyEnrollmentHistoryService,
} from "./enrollment.service";

export async function createEnrollment(req: Request, res: Response) {
  try {
    const { studentId, courseId } = req.body;

    if (studentId === undefined || courseId === undefined) {
      return res.status(400).json({
        success: false,
        message: "studentId and courseId are required",
      });
    }

    const enrollment = await enrollStudent(Number(studentId), Number(courseId));

    return res.status(201).json({
      success: true,
      message: "Student enrolled successfully",
      enrollment,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Enrollment failed";

    return res.status(400).json({
      success: false,
      message,
    });
  }
}

export async function getStudentCourses(req: Request, res: Response) {
  try {
    const studentId = Number(req.params.studentId);

    if (Number.isNaN(studentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
    }

    const enrollments = await getStudentEnrollments(studentId);

    return res.json({
      success: true,
      enrollments,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get student courses";

    return res.status(400).json({
      success: false,
      message,
    });
  }
}
export async function getMyCourses(req: Request, res: Response) {
  try {
    const enrollments = await getMyStudentEnrollments(req.user!.userId);

    return res.json({
      success: true,
      enrollments,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get my courses";

    return res.status(400).json({
      success: false,
      message,
    });
  }
}
export async function getMyTeacherCourseStats(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;

    const courses = await getTeacherCourseStats(userId);

    return res.json({
      success: true,
      data: courses,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to get teacher course statistics";

    return res.status(400).json({
      success: false,
      message,
    });
  }
}
export async function getMyTeacherCourseStudents(req: Request, res: Response) {
  try {
    const teacherId = req.user!.userId;
    const courseId = Number(req.params.courseId);

    if (!Number.isInteger(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    const students = await getTeacherCourseStudents(teacherId, courseId);

    return res.json({
      success: true,
      data: students,
    });
  } catch (error) {
    console.error("Get teacher course students error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch course students";

    return res.status(403).json({
      success: false,
      message,
    });
  }
}
export async function getMyEnrollmentHistory(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;

    const enrollments = await getMyEnrollmentHistoryService(userId);

    return res.json({
      success: true,
      enrollments,
    });
  } catch (error) {
    console.error("Get enrollment history error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to get enrollment history";

    return res.status(400).json({
      success: false,
      message,
    });
  }
}
