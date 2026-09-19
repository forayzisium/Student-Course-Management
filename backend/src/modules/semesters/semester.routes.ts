import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import {
  addSemester,
  editSemester,
  listSemesters,
  readSemester,
  removeSemester,
} from "./semester.controller";

const router = Router();
router.get("/", requireAuth, listSemesters);
router.get("/:id", requireAuth, readSemester);
router.post("/", requireAuth, requireRole("ADMIN"), addSemester);
router.put("/:id", requireAuth, requireRole("ADMIN"), editSemester);
router.delete("/:id", requireAuth, requireRole("ADMIN"), removeSemester);
export default router;
