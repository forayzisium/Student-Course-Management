import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import {
  getAllTeachers,
  getSingleTeacher,
  getMyProfile,
  getMyStudents,
  updateTeacher,
  updateMyProfile,
} from "./teacher.controller";

const router = Router();

router.get("/me", requireAuth, requireRole("TEACHER"), getMyProfile);
router.get("/me/students", requireAuth, requireRole("TEACHER"), getMyStudents);
router.put("/me", requireAuth, requireRole("TEACHER"), updateMyProfile);

router.use(requireAuth, requireRole("ADMIN"));

router.get("/", getAllTeachers);
router.get("/:id", getSingleTeacher);
router.put("/:id", updateTeacher);

export default router;
