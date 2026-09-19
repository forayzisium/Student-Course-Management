import type { Request, Response } from "express";
import {
  getRecentTeacherActivities,
  subscribeToTeacherActivities,
} from "./activity.service";

export async function getRecentActivities(req: Request, res: Response) {
  try {
    const requestedLimit = Number(req.query.limit ?? 20);
    const limit = Number.isInteger(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 50)
      : 20;
    const activities = await getRecentTeacherActivities(
      req.user!.userId,
      limit,
    );

    return res.json({ success: true, data: activities });
  } catch (error) {
    console.error("Get teacher activities error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load recent activity",
    });
  }
}

export function streamActivities(req: Request, res: Response) {
  subscribeToTeacherActivities(req.user!.userId, res);
}
