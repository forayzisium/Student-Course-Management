import { Router } from "express";

import {
  createNewGrade,
  deleteExistingGrade,
  getGradesForAdmin,
  getMyGrades,
  getTeacherGrades,
  updateExistingGrade,
} from "./grade.controller";

import { requireAuth, requireRole } from "../../middleware/auth.middleware";

const router = Router();


router.get("/my", requireAuth, requireRole("STUDENT", "ADMIN"), getMyGrades);

router.get(
  "/my-grades",
  requireAuth,
  requireRole("STUDENT", "ADMIN"),
  getMyGrades,
);


router.get(
  "/course/:courseId",
  requireAuth,
  requireRole("TEACHER"),
  getTeacherGrades,
);


router.post("/", requireAuth, requireRole("TEACHER"), createNewGrade);


router.put("/:id", requireAuth, requireRole("TEACHER"), updateExistingGrade);


router.delete("/:id", requireAuth, requireRole("TEACHER"), deleteExistingGrade);


router.get("/admin", requireAuth, requireRole("ADMIN"), getGradesForAdmin);

export default router;
