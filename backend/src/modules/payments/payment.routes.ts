import { Router } from "express";
import {
  createAdminNewPayment,
  createNewPayment,
  getMyPayments,
  getPaymentsForAdmin,
  updateExistingPaymentStatus,
} from "./payment.controller";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";

const router = Router();

router.post("/", requireAuth, requireRole("STUDENT"), createNewPayment);

router.post("/admin", requireAuth, requireRole("ADMIN"), createAdminNewPayment);

router.get("/my-payments", requireAuth, requireRole("STUDENT"), getMyPayments);

router.get("/", requireAuth, requireRole("ADMIN"), getPaymentsForAdmin);

router.patch(
  "/:id/status",
  requireAuth,
  requireRole("ADMIN"),
  updateExistingPaymentStatus,
);

export default router;
