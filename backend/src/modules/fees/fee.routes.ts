import { Router } from "express";
import { getMyFees, createNewStudentFee } from "./fee.controller";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";

const router = Router();

router.get("/my", requireAuth, requireRole("STUDENT", "ADMIN"), getMyFees);

router.post("/admin", requireAuth, requireRole("ADMIN"), createNewStudentFee);

export default router;
