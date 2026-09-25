import { Router } from "express";
import {
  getMyAssignment,
  submitMyAssignment,
  getMySubmissionsController,
} from "./student-submission.controller";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { submissionUpload } from "../../middleware/upload.middleware";

const router = Router();

router.get(
  "/student/assignment/:assignmentId",
  requireAuth,
  requireRole("STUDENT"),
  getMyAssignment,
);

router.post(
  "/student/assignment/:assignmentId",
  requireAuth,
  requireRole("STUDENT"),
  submissionUpload.single("file"),
  submitMyAssignment,
);

router.get(
  "/student/my-submissions",
  requireAuth,
  requireRole("STUDENT"),
  getMySubmissionsController,
);

export default router;
