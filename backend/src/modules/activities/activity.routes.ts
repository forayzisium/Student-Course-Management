import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { getRecentActivities, streamActivities } from "./activity.controller";

const router = Router();

router.get(
  "/teacher/recent",
  requireAuth,
  requireRole("TEACHER"),
  getRecentActivities,
);
router.get(
  "/teacher/stream",
  requireAuth,
  requireRole("TEACHER"),
  streamActivities,
);

export default router;
