import { Router } from "express";
import {
  createNewCourse,
  getAllCourses,
  getMyCourses,
  getSingleCourse,
  updateExistingCourse,
  getAvailableCoursesForStudent,
} from "./course.controller";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";

import { prisma } from "../../config/prisma";
const router = Router();
router.get(
  "/student/:id",
  requireAuth,
  requireRole("STUDENT"),
  async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
      res.status(400).json({ message: "Invalid course ID" });
      return;
    }
    const student = await prisma.studentProfile.findUnique({
      where: { userId: req.user!.userId },
      select: { id: true },
    });
    if (!student) {
      res.status(404).json({ message: "Student profile not found" });
      return;
    }
    const enrollment = await prisma.enrollment.findFirst({
      where: { studentId: student.id, courseId: id, status: "ACTIVE" },
      include: {
        course: {
          include: {
            teacher: { select: { name: true, email: true } },
            assignments: {
              where: { status: "ACTIVE" },
              orderBy: { dueDate: "asc" },
              include: { submissions: { where: { studentId: student.id } } },
            },
            attendance: { where: { studentId: student.id } },
            grades: { where: { studentId: student.id } },
          },
        },
      },
    });
    if (!enrollment) {
      res.status(404).json({ message: "Active enrollment not found" });
      return;
    }
    res.json({ success: true, data: enrollment.course });
  },
);

router.get("/my-courses", requireAuth, requireRole("TEACHER"), getMyCourses);

router.get("/", requireAuth, requireRole("ADMIN"), getAllCourses);
router.get(
  "/available",
  requireAuth,
  requireRole("STUDENT"),
  getAvailableCoursesForStudent,
);

router.get("/:id", requireAuth, requireRole("ADMIN"), getSingleCourse);

router.post("/", requireAuth, requireRole("ADMIN"), createNewCourse);

router.put("/:id", requireAuth, requireRole("ADMIN"), updateExistingCourse);

export default router;
