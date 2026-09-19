import { prisma } from "../config/prisma";

const FREE_DAILY_LIMIT = 50;
const PREMIUM_DAILY_LIMIT = 200;

export async function checkAiUsage(userId: number) {
  const student = await prisma.studentProfile.findUnique({
    where: {
      userId,
    },
    select: {
      id: true,
      aiPlan: true,
      aiMessagesUsed: true,
      aiUsageResetAt: true,
    },
  });

  if (!student) {
    throw new Error("Student profile not found");
  }

  const now = new Date();
  const resetAt = new Date(student.aiUsageResetAt);

  const isNewDay =
    now.getFullYear() !== resetAt.getFullYear() ||
    now.getMonth() !== resetAt.getMonth() ||
    now.getDate() !== resetAt.getDate();

  if (isNewDay) {
    await prisma.studentProfile.update({
      where: {
        id: student.id,
      },
      data: {
        aiMessagesUsed: 0,
        aiUsageResetAt: now,
      },
    });

    const limit =
      student.aiPlan === "PREMIUM" ? PREMIUM_DAILY_LIMIT : FREE_DAILY_LIMIT;

    return {
      allowed: true,
      plan: student.aiPlan,
      used: 0,
      limit,
      remaining: limit,
    };
  }

  const limit =
    student.aiPlan === "PREMIUM" ? PREMIUM_DAILY_LIMIT : FREE_DAILY_LIMIT;

  const remaining = Math.max(0, limit - student.aiMessagesUsed);

  return {
    allowed: student.aiMessagesUsed < limit,
    plan: student.aiPlan,
    used: student.aiMessagesUsed,
    limit,
    remaining,
  };
}

export async function incrementAiUsage(userId: number) {
  const student = await prisma.studentProfile.findUnique({
    where: {
      userId,
    },
    select: {
      id: true,
    },
  });

  if (!student) {
    throw new Error("Student profile not found");
  }

  await prisma.studentProfile.update({
    where: {
      id: student.id,
    },
    data: {
      aiMessagesUsed: {
        increment: 1,
      },
    },
  });
}
