import { Router } from "express";
import {
  adminTest,
  getMe,
  login,
  register,
  registerTeacherController,
  changeUserPassword,
} from "./auth.controller";

import { requireAuth, requireRole } from "../../middleware/auth.middleware";

const router = Router();

router.post("/login", login);

router.post("/register", register);

router.post("/register/teacher", registerTeacherController);

router.get("/me", requireAuth, getMe);

if (process.env.NODE_ENV === "development") {
  router.get("/admin-test", requireAuth, requireRole("ADMIN"), adminTest);
}

router.put("/change-password", requireAuth, changeUserPassword);

router.post("/create-admin", requireAuth, (_req, res) =>
  res.status(410).json({
    success: false,
    message: "Use Admin Access invitations to add admins.",
  }),
);

export default router;
