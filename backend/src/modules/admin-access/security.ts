import { createHash, randomBytes } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

export class AccessError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function gmail(value: unknown) {
  if (typeof value !== "string")
    throw new AccessError(400, "Enter a Gmail address.");
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[a-z0-9][a-z0-9.+_-]*@gmail\.com$/.test(email)) {
    throw new AccessError(400, "Enter a valid Gmail address.");
  }
  return email;
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function invitationToken() {
  const token = randomBytes(32).toString("hex");
  return { token, tokenHash: hashToken(token) };
}

// Bounded per-process protection. Use an upstream shared limiter for multiple replicas.
export function rateLimit(limit: number, windowMs: number) {
  const attempts = new Map<string, { count: number; until: number }>();
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    for (const [key, value] of attempts)
      if (value.until <= now) attempts.delete(key);
    const key = String(req.user?.userId ?? req.ip ?? "unknown");
    const entry = attempts.get(key) ?? { count: 0, until: now + windowMs };
    if (
      entry.count >= limit ||
      (!attempts.has(key) && attempts.size >= 10000)
    ) {
      res.setHeader("Retry-After", Math.ceil((entry.until - now) / 1000));
      return res.status(429).json({
        success: false,
        message: "Too many attempts. Please try again later.",
      });
    }
    entry.count++;
    attempts.set(key, entry);
    next();
  };
}
