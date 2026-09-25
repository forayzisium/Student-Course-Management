import { Router } from "express";
import {
  chatWithAI,
  getAiUsage,
  getStudentAIOverview,
  testGemini,
} from "../controllers/ai.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

if (process.env.NODE_ENV === "development") {
  router.post("/test", requireAuth, requireRole("ADMIN"), testGemini);
}

router.post("/chat", requireAuth, requireRole("STUDENT"), chatWithAI);

router.get(
  "/overview",
  requireAuth,
  requireRole("STUDENT"),
  getStudentAIOverview,
);

router.get("/usage", requireAuth, requireRole("STUDENT"), getAiUsage);

export default router;
