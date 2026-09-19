import { Request, Response } from "express";
import {
  createGrade,
  deleteGrade as removeGrade,
  getAllGrades,
  getStudentGrades,
  getTeacherCourseGrades,
  updateGrade,
} from "./grade.service";
import { prisma } from "../../config/prisma";
import { publishTeacherActivity } from "../activities/activity.service";

function parseMark(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const number = Number(value);

  if (Number.isNaN(number) || number < 0) {
    throw new Error("Marks must be a valid non-negative number");
  }

  return number;
}

export async function createNewGrade(req: Request, res: Response) {
  try {
    const teacherId = req.user!.userId;

    const { studentId, courseId } = req.body;

    if (studentId === undefined || courseId === undefined) {
      return res.status(400).json({
        success: false,
        message: "studentId and courseId are required",
      });
    }

    const parsedStudentId = Number(studentId);
    const parsedCourseId = Number(courseId);

    if (Number.isNaN(parsedStudentId) || Number.isNaN(parsedCourseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID or course ID",
      });
    }

    const assignment = parseMark(req.body.assignment);
    const midterm = parseMark(req.body.midterm);
    const final = parseMark(req.body.final);

    const grade = await createGrade(teacherId, {
      studentId: parsedStudentId,
      courseId: parsedCourseId,
      assignment,
      midterm,
      final,
    });

    publishTeacherActivity(teacherId, {
      id: `grade-${grade.id}-${grade.updatedAt.toISOString()}`,
      type: "GRADE_CREATED",
      title: "Grade published",
      description: `${grade.student.user.name}'s course grade is now ${grade.total}.`,
      courseCode: grade.course.code,
      priority: "MEDIUM",
      createdAt: grade.updatedAt,
    });

    res.status(201).json({
      success: true,
      message: "Grade created successfully",
      data: grade,
    });
  } catch (error) {
    console.error("Create grade error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to create grade";

    res.status(400).json({
      success: false,
      message,
    });
  }
}

export async function updateExistingGrade(req: Request, res: Response) {
  try {
    const teacherId = req.user!.userId;
    const gradeId = Number(req.params.id);

    if (Number.isNaN(gradeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid grade ID",
      });
    }
    const gradeExists = await prisma.grade.findUnique({
      where: { id: gradeId },
      select: { id: true },
    });

    if (!gradeExists) {
      return res.status(404).json({
        success: false,
        message: "Grade record not found",
      });
    }
    const data: {
      assignment?: number;
      midterm?: number;
      final?: number;
    } = {};

    if (req.body.assignment !== undefined) {
      data.assignment = parseMark(req.body.assignment);
    }

    if (req.body.midterm !== undefined) {
      data.midterm = parseMark(req.body.midterm);
    }

    if (req.body.final !== undefined) {
      data.final = parseMark(req.body.final);
    }

    const grade = await updateGrade(teacherId, gradeId, data);

    publishTeacherActivity(teacherId, {
      id: `grade-${grade.id}-${grade.updatedAt.toISOString()}`,
      type: "GRADE_UPDATED",
      title: "Grade updated",
      description: `${grade.student.user.name}'s course grade is now ${grade.total}.`,
      courseCode: grade.course.code,
      priority: "MEDIUM",
      createdAt: grade.updatedAt,
    });

    res.json({
      success: true,
      message: "Grade updated successfully",
      data: grade,
    });
  } catch (error) {
    console.error("Update grade error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to update grade";

    res.status(403).json({
      success: false,
      message,
    });
  }
}

export async function getMyGrades(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;

    const grades = await getStudentGrades(userId);

    res.json({
      success: true,
      data: grades,
    });
  } catch (error) {
    console.error("Get student grades error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to fetch grades";

    res.status(400).json({
      success: false,
      message,
    });
  }
}

export async function getTeacherGrades(req: Request, res: Response) {
  try {
    const teacherId = req.user!.userId;
    const courseId = Number(req.params.courseId);

    if (Number.isNaN(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    const grades = await getTeacherCourseGrades(teacherId, courseId);

    res.json({
      success: true,
      data: grades,
    });
  } catch (error) {
    console.error("Get teacher grades error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to fetch grades";

    res.status(403).json({
      success: false,
      message,
    });
  }
}

export async function getGradesForAdmin(_req: Request, res: Response) {
  try {
    const grades = await getAllGrades();

    res.json({
      success: true,
      data: grades,
    });
  } catch (error) {
    console.error("Get all grades error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch grades",
    });
  }
}

export async function deleteExistingGrade(req: Request, res: Response) {
  try {
    const teacherId = req.user!.userId;
    const gradeId = Number(req.params.id);

    if (Number.isNaN(gradeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid grade ID",
      });
    }

    await removeGrade(teacherId, gradeId);

    res.json({
      success: true,
      message: "Grade deleted successfully",
    });
  } catch (error) {
    console.error("Delete grade error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to delete grade";

    res.status(403).json({
      success: false,
      message,
    });
  }
}
