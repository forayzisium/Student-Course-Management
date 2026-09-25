import { Router } from "express";
import {
  approveTeacherRequest,
  getDashboard,
  rejectTeacherRequest,
  teacherRequests,
  getReports,
  getMyProfile,
  updateMyProfile,
} from "./admin.controller";

import { requireAuth, requireRole } from "../../middleware/auth.middleware";

const router = Router();

router.use(requireAuth, requireRole("ADMIN"));
router.get("/me", getMyProfile);
router.put("/me", updateMyProfile);
router.get("/dashboard", getDashboard);
router.get("/reports", getReports);

router.get("/teacher-requests", teacherRequests);

router.patch("/teacher-requests/:id/approve", approveTeacherRequest);

router.patch("/teacher-requests/:id/reject", rejectTeacherRequest);

router.post("/create", (_req, res) =>
  res.status(410).json({
    success: false,
    message: "Use Admin Access invitations to add admins.",
  }),
);

export default router;
