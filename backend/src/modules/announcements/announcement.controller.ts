import { AnnouncementType } from "../../generated/prisma/client";
import { Request, Response } from "express";
import {
  AnnouncementServiceError,
  createTeacherAnnouncement,
  deleteTeacherAnnouncement,
  getStudentAnnouncement,
  getStudentAnnouncements,
  getTeacherAnnouncements,
  updateTeacherAnnouncement,
} from "./announcement.service";
import { realtimeEventBus } from "../events/event.bus";

const TYPES = new Set<AnnouncementType>([
  "GENERAL",
  "CLASS_CANCELLED",
  "CLASS_RESCHEDULED",
  "ROOM_CHANGE",
  "REMINDER",
]);

function fail(res: Response, error: unknown, fallback: string) {
  if (error instanceof AnnouncementServiceError) {
    return res
      .status(error.status)
      .json({ success: false, message: error.message });
  }
  console.error(fallback, error);
  return res.status(500).json({ success: false, message: fallback });
}

function positiveId(value: unknown, label: string) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new AnnouncementServiceError(`Invalid ${label}`, 400);
  }
  return id;
}

function text(value: unknown, label: string, max: number) {
  if (typeof value !== "string" || !value.trim()) {
    throw new AnnouncementServiceError(`${label} is required`, 400);
  }
  const result = value.trim();
  if (result.length > max) {
    throw new AnnouncementServiceError(
      `${label} must be at most ${max} characters`,
      400,
    );
  }
  return result;
}

function type(value: unknown): AnnouncementType {
  const result = value === undefined ? "GENERAL" : String(value);
  if (!TYPES.has(result as AnnouncementType)) {
    throw new AnnouncementServiceError("Invalid announcement type", 400);
  }
  return result as AnnouncementType;
}

function date(value: unknown): Date | null {
  if (value === undefined || value === null || value === "") return null;
  const result = new Date(String(value));
  if (Number.isNaN(result.getTime())) {
    throw new AnnouncementServiceError("Invalid rescheduled date/time", 400);
  }
  return result;
}

export async function create(req: Request, res: Response) {
  try {
    const announcementType = type(req.body.type);
    const rescheduledAt = date(req.body.rescheduledAt);
    if (announcementType === "CLASS_RESCHEDULED" && !rescheduledAt) {
      throw new AnnouncementServiceError(
        "Rescheduled date/time is required for a rescheduled class",
        400,
      );
    }
    const item = await createTeacherAnnouncement(req.user!.userId, {
      courseId: positiveId(req.body.courseId, "course ID"),
      title: text(req.body.title, "Title", 160),
      message: text(req.body.message, "Message", 5000),
      type: announcementType,
      rescheduledAt,
    });
    realtimeEventBus.emitEvent({
      type: "ANNOUNCEMENT_UPDATED",
      courseId: item.courseId,
    });
    res
      .status(201)
      .json({
        success: true,
        message: "Announcement published successfully",
        data: item,
      });
  } catch (error) {
    fail(res, error, "Failed to publish announcement");
  }
}

export async function teacherList(req: Request, res: Response) {
  try {
    res.json({
      success: true,
      data: await getTeacherAnnouncements(req.user!.userId),
    });
  } catch (error) {
    fail(res, error, "Failed to fetch announcements");
  }
}

export async function update(req: Request, res: Response) {
  try {
    const data: Parameters<typeof updateTeacherAnnouncement>[2] = {};
    if (req.body.courseId !== undefined)
      data.courseId = positiveId(req.body.courseId, "course ID");
    if (req.body.title !== undefined)
      data.title = text(req.body.title, "Title", 160);
    if (req.body.message !== undefined)
      data.message = text(req.body.message, "Message", 5000);
    if (req.body.type !== undefined) data.type = type(req.body.type);
    if (req.body.rescheduledAt !== undefined)
      data.rescheduledAt = date(req.body.rescheduledAt);
    if (Object.keys(data).length === 0) {
      throw new AnnouncementServiceError("At least one field is required", 400);
    }
    if (data.type === "CLASS_RESCHEDULED" && !data.rescheduledAt) {
      throw new AnnouncementServiceError(
        "Rescheduled date/time is required for a rescheduled class",
        400,
      );
    }
    const item = await updateTeacherAnnouncement(
      req.user!.userId,
      positiveId(req.params.id, "announcement ID"),
      data,
    );
    realtimeEventBus.emitEvent({
      type: "ANNOUNCEMENT_UPDATED",
      courseId: item.courseId,
    });
    res.json({
      success: true,
      message: "Announcement updated successfully",
      data: item,
    });
  } catch (error) {
    fail(res, error, "Failed to update announcement");
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const deleted = await deleteTeacherAnnouncement(
      req.user!.userId,
      positiveId(req.params.id, "announcement ID"),
    );
    realtimeEventBus.emitEvent({
      type: "ANNOUNCEMENT_UPDATED",
      courseId: deleted.courseId,
    });
    res.json({ success: true, message: "Announcement deleted successfully" });
  } catch (error) {
    fail(res, error, "Failed to delete announcement");
  }
}

export async function studentList(req: Request, res: Response) {
  try {
    res.json({
      success: true,
      data: await getStudentAnnouncements(req.user!.userId),
    });
  } catch (error) {
    fail(res, error, "Failed to fetch announcements");
  }
}

export async function studentGet(req: Request, res: Response) {
  try {
    res.json({
      success: true,
      data: await getStudentAnnouncement(
        req.user!.userId,
        positiveId(req.params.id, "announcement ID"),
      ),
    });
  } catch (error) {
    fail(res, error, "Failed to fetch announcement");
  }
}
