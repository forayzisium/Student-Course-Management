import { Request, Response } from "express";
import {
  createCourse,
  getCourseById,
  getCourses,
  getTeacherCourses,
  updateCourse,
  getAvailableCourses,
} from "./course.service";

export async function getAllCourses(req: Request, res: Response) {
  try {
    const semesterId = req.query.semesterId
      ? Number(req.query.semesterId)
      : undefined;
    const courses = await getCourses(semesterId);

    return res.json({
      success: true,
      courses,
    });
  } catch (error) {
    console.error("Failed to get courses:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get courses",
    });
  }
}

export async function getSingleCourse(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    const course = await getCourseById(id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    return res.json({
      success: true,
      course,
    });
  } catch (error) {
    console.error("Failed to get course:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get course",
    });
  }
}

export async function createNewCourse(req: Request, res: Response) {
  try {
    const {
      code,
      name,
      department,
      semesterId,
      teacherId,
      description,
      credits,
      syllabus,
    } = req.body;

    if (
      !code ||
      !name ||
      !department ||
      !Number.isSafeInteger(Number(semesterId)) ||
      teacherId === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const course = await createCourse({
      description,
      credits,
      syllabus,
      code,
      name,
      department,
      semesterId: Number(semesterId),
      teacherId: Number(teacherId),
    });

    return res.status(201).json({
      success: true,
      message: "Course created successfully",
      course,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create course";

    return res.status(400).json({
      success: false,
      message,
    });
  }
}

export async function updateExistingCourse(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    const {
      code,
      name,
      department,
      semesterId,
      teacherId,
      status,
      description,
      credits,
      syllabus,
    } = req.body;

    const course = await updateCourse(id, {
      description,
      credits,
      syllabus,
      code,
      name,
      department,
      semesterId: semesterId !== undefined ? Number(semesterId) : undefined,
      teacherId: teacherId !== undefined ? Number(teacherId) : undefined,
      status,
    });

    return res.json({
      success: true,
      message: "Course updated successfully",
      course,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update course";

    return res.status(400).json({
      success: false,
      message,
    });
  }
}

export async function getMyCourses(req: Request, res: Response) {
  try {
    const semesterId = req.query.semesterId
      ? Number(req.query.semesterId)
      : undefined;
    const courses = await getTeacherCourses(req.user!.userId, semesterId);

    return res.json({
      success: true,
      courses,
    });
  } catch (error) {
    console.error("Failed to get teacher courses:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get teacher courses",
    });
  }
}
export async function getAvailableCoursesForStudent(
  req: Request,
  res: Response,
) {
  try {
    const semesterId = req.query.semesterId
      ? Number(req.query.semesterId)
      : undefined;
    const courses = await getAvailableCourses(semesterId);

    return res.json({
      success: true,
      courses,
    });
  } catch (error) {
    console.error("Failed to get available courses:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get available courses",
    });
  }
}
