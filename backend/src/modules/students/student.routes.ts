import { Router } from "express";
import {
  getAllStudents,
  getSingleStudent,
  updateStudent,
  getMyProfile,
  updateMyProfile,
  getMyActivity,
  getMyNotificationSettings,
  updateMyNotificationSettings,
} from "./student.controller";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";

const router = Router();

router.get("/me", requireAuth, requireRole("STUDENT"), getMyProfile);
router.get("/me/activity", requireAuth, requireRole("STUDENT"), getMyActivity);

router.put("/me", requireAuth, requireRole("STUDENT"), updateMyProfile);

router.get(
  "/me/notification-settings",
  requireAuth,
  requireRole("STUDENT"),
  getMyNotificationSettings,
);

router.put(
  "/me/notification-settings",
  requireAuth,
  requireRole("STUDENT"),
  updateMyNotificationSettings,
);

router.get("/", requireAuth, requireRole("ADMIN"), getAllStudents);

router.get("/:id", requireAuth, requireRole("ADMIN"), getSingleStudent);

router.put("/:id", requireAuth, requireRole("ADMIN"), updateStudent);

export default router;
