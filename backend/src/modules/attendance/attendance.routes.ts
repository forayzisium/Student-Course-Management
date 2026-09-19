import { Router } from "express";
import {
  getCourseAttendanceList,
  getMyAttendance,
  getTeacherCourseAttendanceList,
  markNewAttendance,
  saveAttendanceSheet,
  updateExistingAttendance,
} from "./attendance.controller";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";

const router = Router();

router.get(
  "/my-attendance",
  requireAuth,
  requireRole("STUDENT"),
  getMyAttendance,
);

router.get(
  "/course/:courseId",
  requireAuth,
  requireRole("TEACHER"),
  getTeacherCourseAttendanceList,
);

router.post("/", requireAuth, requireRole("TEACHER"), markNewAttendance);

router.put(
  "/course/:courseId",
  requireAuth,
  requireRole("TEACHER"),
  saveAttendanceSheet,
);

router.put(
  "/:id",
  requireAuth,
  requireRole("TEACHER"),
  updateExistingAttendance,
);

router.get(
  "/admin/course/:courseId",
  requireAuth,
  requireRole("ADMIN"),
  getCourseAttendanceList,
);

export default router;
