import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import {
  create,
  remove,
  studentGet,
  studentList,
  teacherList,
  update,
} from "./announcement.controller";

const router = Router();

router.get("/teacher", requireAuth, requireRole("TEACHER"), teacherList);
router.post("/", requireAuth, requireRole("TEACHER"), create);
router.put("/:id", requireAuth, requireRole("TEACHER"), update);
router.delete("/:id", requireAuth, requireRole("TEACHER"), remove);
router.get("/my", requireAuth, requireRole("STUDENT"), studentList);
router.get("/my/:id", requireAuth, requireRole("STUDENT"), studentGet);

export default router;
