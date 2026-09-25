import { Router } from "express";

import {
  getMyAssignmentSubmissions,
  gradeMySubmission,
  downloadSubmissionFile,
} from "./submission.controller";

import { requireAuth, requireRole } from "../../middleware/auth.middleware";

const router = Router();

router.get(
  "/teacher/assignment/:assignmentId",
  requireAuth,
  requireRole("TEACHER"),
  getMyAssignmentSubmissions,
);

router.get(
  "/teacher/:submissionId/file",
  requireAuth,
  requireRole("TEACHER"),
  downloadSubmissionFile,
);

router.put(
  "/teacher/:submissionId/grade",
  requireAuth,
  requireRole("TEACHER"),
  gradeMySubmission,
);

export default router;
