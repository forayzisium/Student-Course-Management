import { Request, Response } from "express";
import { publishTeacherActivity } from "../activities/activity.service";
import {
  createAssignment,
  createTeacherAssignment,
  deleteAssignment,
  deleteTeacherAssignment,
  getAssignmentById,
  getAssignments,
  getStudentAssignments,
  getTeacherAssignments,
  updateAssignment,
  updateTeacherAssignment,
} from "./assignment.service";

export async function getAllAssignments(_req: Request, res: Response) {
  try {
    const assignments = await getAssignments();

    res.json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    console.error("Get assignments error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch assignments",
    });
  }
}

export async function getSingleAssignment(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid assignment ID",
      });
    }

    const assignment = await getAssignmentById(id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    res.json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    console.error("Get assignment error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch assignment",
    });
  }
}

export async function createNewAssignment(req: Request, res: Response) {
  try {
    const { courseId, title, description, dueDate, maxMarks } = req.body;

    if (courseId === undefined || !title || !description || !dueDate) {
      return res.status(400).json({
        success: false,
        message: "courseId, title, description and dueDate are required",
      });
    }

    const parsedCourseId = Number(courseId);
    const parsedDueDate = new Date(dueDate);

    if (Number.isNaN(parsedCourseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    if (Number.isNaN(parsedDueDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid due date",
      });
    }

    const assignment = await createAssignment({
      courseId: parsedCourseId,
      title: String(title),
      description: String(description),
      dueDate: parsedDueDate,
      maxMarks: maxMarks === undefined ? undefined : Number(maxMarks),
    });

    res.status(201).json({
      success: true,
      message: "Assignment created successfully",
      data: assignment,
    });
  } catch (error) {
    console.error("Create assignment error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to create assignment";

    res.status(400).json({
      success: false,
      message,
    });
  }
}

export async function updateExistingAssignment(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid assignment ID",
      });
    }

    const { courseId, title, description, dueDate, status, maxMarks } =
      req.body;

    const data: {
      courseId?: number;
      title?: string;
      description?: string;
      dueDate?: Date;
      status?: "ACTIVE" | "INACTIVE";
      maxMarks?: number;
    } = {};

    if (courseId !== undefined) {
      const parsedCourseId = Number(courseId);

      if (Number.isNaN(parsedCourseId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid course ID",
        });
      }

      data.courseId = parsedCourseId;
    }

    if (title !== undefined) {
      data.title = String(title);
    }

    if (description !== undefined) {
      data.description = String(description);
    }

    if (dueDate !== undefined) {
      const parsedDueDate = new Date(dueDate);

      if (Number.isNaN(parsedDueDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid due date",
        });
      }

      data.dueDate = parsedDueDate;
    }

    if (status !== undefined) {
      if (status !== "ACTIVE" && status !== "INACTIVE") {
        return res.status(400).json({
          success: false,
          message: "Invalid assignment status",
        });
      }

      data.status = status;
    }

    if (maxMarks !== undefined) data.maxMarks = Number(maxMarks);

    const assignment = await updateAssignment(id, data);

    res.json({
      success: true,
      message: "Assignment updated successfully",
      data: assignment,
    });
  } catch (error) {
    console.error("Update assignment error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to update assignment";

    res.status(400).json({
      success: false,
      message,
    });
  }
}

export async function deleteExistingAssignment(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid assignment ID",
      });
    }

    await deleteAssignment(id);

    res.json({
      success: true,
      message: "Assignment deleted successfully",
    });
  } catch (error) {
    console.error("Delete assignment error:", error);

    res.status(404).json({
      success: false,
      message: "Assignment not found",
    });
  }
}

export async function getMyTeacherAssignments(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;

    const assignments = await getTeacherAssignments(userId);

    res.json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    console.error("Get teacher assignments error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch teacher assignments",
    });
  }
}

export async function getMyStudentAssignments(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;

    const assignments = await getStudentAssignments(userId);

    res.json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    console.error("Get student assignments error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch student assignments";

    res.status(400).json({
      success: false,
      message,
    });
  }
}
export async function createTeacherNewAssignment(req: Request, res: Response) {
  try {
    const teacherId = req.user!.userId;

    const { courseId, title, description, dueDate, maxMarks } = req.body;

    if (courseId === undefined || !title || !description || !dueDate) {
      return res.status(400).json({
        success: false,
        message: "courseId, title, description and dueDate are required",
      });
    }

    const parsedCourseId = Number(courseId);
    const parsedDueDate = new Date(dueDate);

    if (Number.isNaN(parsedCourseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    if (Number.isNaN(parsedDueDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid due date",
      });
    }

    const assignment = await createTeacherAssignment(teacherId, {
      courseId: parsedCourseId,
      title: String(title),
      description: String(description),
      dueDate: parsedDueDate,
      maxMarks: maxMarks === undefined ? undefined : Number(maxMarks),
    });

    publishTeacherActivity(teacherId, {
      id: `assignment-${assignment.id}-${assignment.updatedAt.toISOString()}`,
      type: "ASSIGNMENT_CREATED",
      title: "Assignment created",
      description: `“${assignment.title}” is now available.`,
      courseCode: assignment.course.code,
      priority: "LOW",
      createdAt: assignment.updatedAt,
    });

    res.status(201).json({
      success: true,
      message: "Assignment created successfully",
      data: assignment,
    });
  } catch (error) {
    console.error("Create teacher assignment error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to create assignment";

    res.status(403).json({
      success: false,
      message,
    });
  }
}
export async function updateTeacherExistingAssignment(
  req: Request,
  res: Response,
) {
  try {
    const teacherId = req.user!.userId;
    const assignmentId = Number(req.params.id);

    if (Number.isNaN(assignmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid assignment ID",
      });
    }

    const { title, description, dueDate, status, maxMarks } = req.body;

    const data: {
      title?: string;
      description?: string;
      dueDate?: Date;
      status?: "ACTIVE" | "INACTIVE";
      maxMarks?: number;
    } = {};

    if (title !== undefined) {
      data.title = String(title);
    }

    if (description !== undefined) {
      data.description = String(description);
    }

    if (dueDate !== undefined) {
      const parsedDueDate = new Date(dueDate);

      if (Number.isNaN(parsedDueDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid due date",
        });
      }

      data.dueDate = parsedDueDate;
    }

    if (status !== undefined) {
      if (status !== "ACTIVE" && status !== "INACTIVE") {
        return res.status(400).json({
          success: false,
          message: "Invalid assignment status",
        });
      }

      data.status = status;
    }

    if (maxMarks !== undefined) data.maxMarks = Number(maxMarks);

    const assignment = await updateTeacherAssignment(
      teacherId,
      assignmentId,
      data,
    );

    publishTeacherActivity(teacherId, {
      id: `assignment-${assignment.id}-${assignment.updatedAt.toISOString()}`,
      type: "ASSIGNMENT_UPDATED",
      title: "Assignment updated",
      description: `“${assignment.title}” was updated.`,
      courseCode: assignment.course.code,
      priority: "LOW",
      createdAt: assignment.updatedAt,
    });

    res.json({
      success: true,
      message: "Assignment updated successfully",
      data: assignment,
    });
  } catch (error) {
    console.error("Update teacher assignment error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to update assignment";

    res.status(403).json({
      success: false,
      message,
    });
  }
}
export async function deleteTeacherExistingAssignment(
  req: Request,
  res: Response,
) {
  try {
    const teacherId = req.user!.userId;
    const assignmentId = Number(req.params.id);

    if (Number.isNaN(assignmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid assignment ID",
      });
    }

    await deleteTeacherAssignment(teacherId, assignmentId);

    res.json({
      success: true,
      message: "Assignment deleted successfully",
    });
  } catch (error) {
    console.error("Delete teacher assignment error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to delete assignment";

    res.status(403).json({
      success: false,
      message,
    });
  }
}
