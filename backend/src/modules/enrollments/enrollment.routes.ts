import { Router } from "express";
import {
  createEnrollment,
  getMyCourses,
  getStudentCourses,
  getMyTeacherCourseStats,
  getMyTeacherCourseStudents,
  getMyEnrollmentHistory,
} from "./enrollment.controller";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";

const router = Router();

router.post(
  "/",
  requireAuth,
  requireRole("ADMIN", "STUDENT"),
  createEnrollment,
);
router.get("/my-courses", requireAuth, requireRole("STUDENT"), getMyCourses);
router.get(
  "/my-history",
  requireAuth,
  requireRole("STUDENT"),
  getMyEnrollmentHistory,
);

router.get(
  "/student/:studentId",
  requireAuth,
  requireRole("ADMIN", "STUDENT"),
  getStudentCourses,
);
router.get(
  "/teacher/course-stats",
  requireAuth,
  requireRole("TEACHER"),
  getMyTeacherCourseStats,
);
router.get(
  "/teacher/course/:courseId/students",
  requireAuth,
  requireRole("TEACHER"),
  getMyTeacherCourseStudents,
);

export default router;
