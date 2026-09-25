import { Router } from "express";
import {
  createNewAssignment,
  createTeacherNewAssignment,
  deleteExistingAssignment,
  deleteTeacherExistingAssignment,
  getAllAssignments,
  getMyStudentAssignments,
  getMyTeacherAssignments,
  getSingleAssignment,
  updateExistingAssignment,
  updateTeacherExistingAssignment,
} from "./assignment.controller";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";

const router = Router();

router.get(
  "/my-assignments",
  requireAuth,
  requireRole("TEACHER"),
  getMyTeacherAssignments,
);

router.post(
  "/teacher",
  requireAuth,
  requireRole("TEACHER"),
  createTeacherNewAssignment,
);

router.put(
  "/teacher/:id",
  requireAuth,
  requireRole("TEACHER"),
  updateTeacherExistingAssignment,
);

router.delete(
  "/teacher/:id",
  requireAuth,
  requireRole("TEACHER"),
  deleteTeacherExistingAssignment,
);

router.get(
  "/student-assignments",
  requireAuth,
  requireRole("STUDENT"),
  getMyStudentAssignments,
);

router.get("/", requireAuth, requireRole("ADMIN"), getAllAssignments);

router.get("/:id", requireAuth, requireRole("ADMIN"), getSingleAssignment);

router.post("/", requireAuth, requireRole("ADMIN"), createNewAssignment);

router.put("/:id", requireAuth, requireRole("ADMIN"), updateExistingAssignment);

router.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  deleteExistingAssignment,
);

export default router;
