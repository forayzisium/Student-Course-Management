import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../../config/prisma";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import {
  AccessError,
  gmail,
  hashToken,
  invitationToken,
  rateLimit,
} from "./security";
import { mailConfiguration, sendInvitation } from "./mail";

const safeUser = {
  id: true,
  name: true,
  email: true,
  status: true,
  isSuperAdmin: true,
} as const;
const inviteFields = {
  id: true,
  email: true,
  status: true,
  expiresAt: true,
  createdAt: true,
} as const;
const wrap =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  async (req: Request, res: Response) => {
    try {
      await fn(req, res);
    } catch (error) {
      res.status(error instanceof AccessError ? error.status : 500).json({
        success: false,
        message:
          error instanceof AccessError
            ? error.message
            : "Unable to complete this request. Please try again.",
      });
    }
  };

async function superAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
    });
    if (
      !user?.isSuperAdmin ||
      user.role !== "ADMIN" ||
      user.status !== "ACTIVE"
    ) {
      return res.status(403).json({
        success: false,
        message: "Only the superadmin can manage admin access.",
      });
    }
    next();
  } catch {
    res
      .status(503)
      .json({ success: false, message: "Unable to verify permissions." });
  }
}

async function confirmPassword(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const password = req.body?.currentPassword;
    const owner = await prisma.user.findUnique({
      where: { id: req.user!.userId },
    });
    if (
      !owner?.isSuperAdmin ||
      owner.status !== "ACTIVE" ||
      owner.role !== "ADMIN" ||
      typeof password !== "string" ||
      password.length > 256 ||
      !(await bcrypt.compare(password, owner.password))
    ) {
      return res.status(403).json({
        success: false,
        message: "Confirm your superadmin password to continue.",
      });
    }
    next();
  } catch {
    res
      .status(503)
      .json({ success: false, message: "Unable to verify your password." });
  }
}

export const adminAccessRoutes = Router();
adminAccessRoutes.use(requireAuth, requireRole("ADMIN"));
adminAccessRoutes.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
adminAccessRoutes.get(
  "/capabilities",
  wrap(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { isSuperAdmin: true },
    });
    res.json({ success: true, canManage: user?.isSuperAdmin === true });
  }),
);
adminAccessRoutes.use(superAdmin);
adminAccessRoutes.get(
  "/",
  wrap(async (_req, res) => {
    const [admins, invitations, audit] = await Promise.all([
      prisma.user.findMany({
        where: { role: "ADMIN" },
        select: safeUser,
        orderBy: { createdAt: "asc" },
      }),
      prisma.adminInvitation.findMany({
        select: inviteFields,
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.adminAccessAudit.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);
    res.json({
      success: true,
      admins,
      invitations: invitations.map((i) => ({
        ...i,
        status:
          i.status === "PENDING" && i.expiresAt <= new Date()
            ? "EXPIRED"
            : i.status,
      })),
      audit,
      emailConfigured: !!mailConfiguration(),
    });
  }),
);
adminAccessRoutes.use(rateLimit(10, 15 * 60 * 1000), confirmPassword);

adminAccessRoutes.post(
  "/invitations",
  wrap(async (req, res) => {
    const email = gmail(req.body?.email);
    if (!mailConfiguration())
      throw new AccessError(
        503,
        "Email delivery is not configured on the server.",
      );
    const target = await prisma.user.findUnique({ where: { email } });
    if (
      target?.isSuperAdmin ||
      (target?.role === "ADMIN" && target.status === "ACTIVE")
    ) {
      throw new AccessError(409, "This account already has admin access.");
    }
    if (target && target.status !== "ACTIVE")
      throw new AccessError(
        409,
        "Only active accounts can be invited. This account is inactive or awaiting approval.",
      );
    const { token, tokenHash } = invitationToken();
    const invite = await prisma.$transaction(async (tx) => {
      // Serialize invitations by owner, including repeated requests for the same email.
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${req.user!.userId} FOR UPDATE`;
      const existing = await tx.adminInvitation.findFirst({
        where: { email, status: "PENDING", expiresAt: { gt: new Date() } },
      });
      if (existing)
        throw new AccessError(
          409,
          "A pending invitation already exists. Revoke it before sending a replacement.",
        );
      const created = await tx.adminInvitation.create({
        data: {
          email,
          tokenHash,
          invitedBy: req.user!.userId,
          targetUserId: target?.id,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
      await tx.adminAccessAudit.create({
        data: {
          actorId: req.user!.userId,
          email,
          action: "INVITATION_CREATED",
        },
      });
      return created;
    });
    try {
      await sendInvitation(email, token, invite.id);
    } catch (error) {
      await prisma.$transaction(async (tx) => {
        await tx.adminInvitation.updateMany({
          where: { id: invite.id, status: "PENDING" },
          data: { status: "DELIVERY_FAILED" },
        });
        await tx.adminAccessAudit.create({
          data: {
            actorId: req.user!.userId,
            email,
            action: "INVITATION_DELIVERY_FAILED",
          },
        });
      });
      throw error;
    }
    res.status(201).json({
      success: true,
      message: "Invitation sent. It expires in 24 hours.",
    });
  }),
);

adminAccessRoutes.post(
  "/invitations/:id/revoke",
  wrap(async (req, res) => {
    await prisma.$transaction(async (tx) => {
      const invite = await tx.adminInvitation.findUnique({
        where: { id: String(req.params.id) },
      });
      if (!invite) throw new AccessError(404, "Invitation not found.");
      const changed = await tx.adminInvitation.updateMany({
        where: { id: invite.id, status: "PENDING" },
        data: { status: "REVOKED" },
      });
      if (!changed.count)
        throw new AccessError(409, "This invitation is no longer pending.");
      await tx.adminAccessAudit.create({
        data: {
          actorId: req.user!.userId,
          email: invite.email,
          action: "INVITATION_REVOKED",
        },
      });
    });
    res.json({ success: true, message: "Invitation revoked." });
  }),
);

adminAccessRoutes.post(
  "/admins/:id/revoke",
  wrap(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0)
      throw new AccessError(400, "Invalid admin ID.");
    await prisma.$transaction(async (tx) => {
      const target = await tx.user.findUnique({ where: { id } });
      if (!target || target.role !== "ADMIN")
        throw new AccessError(404, "Admin not found.");
      if (target.isSuperAdmin || id === req.user!.userId)
        throw new AccessError(403, "Superadmin access cannot be revoked here.");
      const changed = await tx.user.updateMany({
        where: { id, role: "ADMIN", isSuperAdmin: false, status: "ACTIVE" },
        data: { status: "INACTIVE", sessionVersion: { increment: 1 } },
      });
      if (!changed.count)
        throw new AccessError(409, "Admin access is already revoked.");
      await tx.adminInvitation.updateMany({
        where: { email: target.email, status: "PENDING" },
        data: { status: "REVOKED" },
      });
      await tx.adminAccessAudit.create({
        data: {
          actorId: req.user!.userId,
          email: target.email,
          action: "ADMIN_ACCESS_REVOKED",
        },
      });
    });
    res.json({
      success: true,
      message: "Admin access revoked. Existing sessions are invalid.",
    });
  }),
);

export const acceptAdminInvitationRoutes = Router();
acceptAdminInvitationRoutes.use(rateLimit(20, 15 * 60 * 1000));
acceptAdminInvitationRoutes.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
acceptAdminInvitationRoutes.post(
  "/",
  wrap(async (req, res) => {
    const { token, password, name, username } = req.body ?? {};
    if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token))
      throw new AccessError(400, "Invalid invitation.");
    if (
      typeof password !== "string" ||
      !password.length ||
      Buffer.byteLength(password) > 72
    )
      throw new AccessError(400, "Enter a password of at most 72 bytes.");
    const invite = await prisma.adminInvitation.findUnique({
      where: { tokenHash: hashToken(token) },
    });
    if (
      !invite ||
      invite.status !== "PENDING" ||
      invite.expiresAt <= new Date()
    )
      throw new AccessError(
        400,
        "This invitation is invalid, expired or already used.",
      );
    const existing = await prisma.user.findUnique({
      where: { email: invite.email },
    });
    if (invite.targetUserId && existing?.id !== invite.targetUserId)
      throw new AccessError(
        409,
        "The invited account has changed. Request a new invitation.",
      );
    if (existing) {
      if (
        existing.isSuperAdmin ||
        existing.role === "ADMIN" ||
        existing.status !== "ACTIVE"
      )
        throw new AccessError(
          409,
          "This account cannot accept this invitation.",
        );
      if (!(await bcrypt.compare(password, existing.password)))
        throw new AccessError(403, "Enter your existing SCM account password.");
    } else {
      if (password.length < 12)
        throw new AccessError(
          400,
          "Use a password with at least 12 characters.",
        );
      if (
        typeof name !== "string" ||
        !name.trim() ||
        name.length > 100 ||
        typeof username !== "string" ||
        !/^[a-zA-Z0-9_]{3,40}$/.test(username)
      ) {
        throw new AccessError(
          400,
          "Enter your name and a username with 3–40 letters, numbers or underscores.",
        );
      }
    }
    const passwordHash = existing
      ? existing.password
      : await bcrypt.hash(password, 12);
    await prisma.$transaction(async (tx) => {
      const owner = await tx.user.findUnique({
        where: { id: invite.invitedBy },
      });
      if (
        !owner?.isSuperAdmin ||
        owner.role !== "ADMIN" ||
        owner.status !== "ACTIVE"
      )
        throw new AccessError(
          403,
          "The invitation issuer no longer has access.",
        );
      const claimed = await tx.adminInvitation.updateMany({
        where: {
          id: invite.id,
          status: "PENDING",
          expiresAt: { gt: new Date() },
        },
        data: { status: "ACCEPTED", acceptedAt: new Date() },
      });
      if (!claimed.count)
        throw new AccessError(409, "This invitation is no longer available.");
      let userId: number;
      if (existing) {
        const updated = await tx.user.updateMany({
          where: {
            id: existing.id,
            email: invite.email,
            password: existing.password,
            role: existing.role,
            status: "ACTIVE",
            isSuperAdmin: false,
          },
          data: { role: "ADMIN", sessionVersion: { increment: 1 } },
        });
        if (!updated.count)
          throw new AccessError(
            409,
            "Your account changed. Request a new invitation.",
          );
        userId = existing.id;
      } else {
        const duplicate = await tx.user.findFirst({
          where: { OR: [{ email: invite.email }, { username }] },
        });
        if (duplicate)
          throw new AccessError(
            409,
            "Email or username is already registered. Existing users must enter their current password.",
          );
        const created = await tx.user.create({
          data: {
            name: name.trim(),
            username,
            email: invite.email,
            password: passwordHash,
            role: "ADMIN",
            status: "ACTIVE",
          },
        });
        userId = created.id;
      }
      await tx.adminAccessAudit.create({
        data: {
          actorId: userId,
          email: invite.email,
          action: "INVITATION_ACCEPTED",
        },
      });
    });
    res.json({
      success: true,
      message:
        "Admin access activated. Sign in with your invited Gmail address and password.",
    });
  }),
);
