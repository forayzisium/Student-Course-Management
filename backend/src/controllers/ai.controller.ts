import { getMyStudentEnrollments } from "../modules/enrollments/enrollment.service";
import { Request, Response } from "express";
import { askGemini } from "../services/gemini.service";
import { checkAiUsage, incrementAiUsage } from "../services/ai-usage.service";
import { getStudentAIContext } from "../services/ai-context.service";

export async function testGemini(req: Request, res: Response) {
  try {
    const message = req.body?.message;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const reply = await askGemini(message);

    return res.json({
      success: true,
      data: {
        reply,
      },
    });
  } catch (error) {
    console.error("Gemini test error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get response from Gemini",
    });
  }
}

export async function getAiUsage(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const usage = await checkAiUsage(userId);

    return res.json({
      success: true,
      data: usage,
    });
  } catch (error) {
    console.error("Get AI usage error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load AI usage",
    });
  }
}

export async function getStudentAIOverview(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const context = await getStudentAIContext(userId);
    const enrollments = await getMyStudentEnrollments(userId);

    const subjects = (context.courses || []).map((course: any) => {
      const grade = (context.academicInsights.grades || []).find((g: any) =>
        g.course?.startsWith(course.code + " - "),
      );

      const attendance = (
        context.academicInsights.attendance.byCourse || []
      ).find((a: any) => a.course?.startsWith(course.code + " - "));

      const progress =
        enrollments.find((e) => e.course.code === course.code)?.course
          .progress ?? 0;
      const attendancePercentage = attendance?.attendancePercentage ?? null;

      const total = grade?.total ?? 0;
      const letterGrade =
        total >= 80
          ? "A+"
          : total >= 75
            ? "A"
            : total >= 70
              ? "A-"
              : total >= 65
                ? "B+"
                : total >= 60
                  ? "B"
                  : total >= 55
                    ? "B-"
                    : total >= 50
                      ? "C+"
                      : total >= 45
                        ? "C"
                        : total >= 40
                          ? "D"
                          : "F";

      const status =
        progress >= 75 && total >= 70
          ? "Strong"
          : progress < 75 || total < 50
            ? "Weak"
            : "Needs Focus";

      return {
        code: course.code,
        name: course.name,
        progress,
        academicProgress: progress,
        attendancePercentage,
        grade: grade ? letterGrade : "Not graded",
        status: grade ? status : "Not graded",
      };
    });

    const suggestions = [];

    const weakest = context.academicInsights.weakestSubject;
    if (weakest) {
      suggestions.push({
        title: `Focus on ${weakest.course.split(" - ")[1] || weakest.course}`,
        description: `Your current performance in this subject is ${weakest.total}%. Review core concepts and practice past problems to improve.`,
        priority: "High Priority",
        type: "Weak Subject",
      });
    }

    const attendanceWarnings =
      context.academicInsights.attendance.warnings || [];
    if (attendanceWarnings.length > 0) {
      const courseName =
        attendanceWarnings[0].course.split(" - ")[1] ||
        attendanceWarnings[0].course;
      suggestions.push({
        title: `Improve attendance in ${courseName}`,
        description: `Your attendance is at ${attendanceWarnings[0].attendancePercentage}%. Attend upcoming classes regularly to avoid academic penalties.`,
        priority: "High Priority",
        type: "Attendance Warning",
      });
    }

    const pending = context.academicInsights.assignments.pending || [];
    if (pending.length > 0) {
      suggestions.push({
        title: "Complete pending assignments",
        description: `You have ${pending.length} pending assignment(s). Prioritize upcoming deadlines to avoid late submissions.`,
        priority: "Medium Priority",
        type: "Pending Work",
      });
    }

    const upcoming = context.academicInsights.assignments.upcoming || [];
    if (upcoming.length > 0) {
      suggestions.push({
        title: "Prepare for upcoming deadlines",
        description: `You have ${upcoming.length} upcoming assignment(s) due soon. Allocate specific study time for these.`,
        priority: "Medium Priority",
        type: "Upcoming Deadlines",
      });
    }

    if (suggestions.length === 0) {
      suggestions.push({
        title: "Keep up the good work",
        description:
          "Your academic performance looks solid. Continue consistent study habits and review weak areas periodically.",
        priority: "Low Priority",
        type: "Maintain",
      });
    }

    return res.json({
      success: true,
      data: {
        subjects,
        suggestions,
        academicInsights: context.academicInsights,
      },
    });
  } catch (error) {
    console.error("Get AI overview error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load AI overview",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function chatWithAI(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;

    const message = req.body?.message;

    const history = Array.isArray(req.body?.history) ? req.body.history : [];

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }
    const studentContext = await getStudentAIContext(userId);
    const usage = await checkAiUsage(userId);

    if (!usage.allowed) {
      return res.status(429).json({
        success: false,
        message: "You've reached today's AI Study limit.",
        data: {
          plan: usage.plan,
          used: usage.used,
          limit: usage.limit,
          remaining: 0,
        },
      });
    }

    // Keep only valid text messages.
    // so the conversation doesn't grow unnecessarily large.
    const cleanHistory = history
      .filter(
        (item: any) =>
          (item?.role === "user" || item?.role === "assistant") &&
          typeof item?.content === "string" &&
          item.content.trim().length > 0,
      )
      .slice(-20);

    const reply = await askGemini(message, cleanHistory, studentContext);

    await incrementAiUsage(userId);

    return res.json({
      success: true,
      data: {
        reply,
        plan: usage.plan,
        used: usage.used + 1,
        limit: usage.limit,
        remaining: usage.remaining - 1,
      },
    });
  } catch (error: any) {
    console.error("❌ AI chat error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get AI response",
      error:
        error?.message ||
        error?.response?.data?.error?.message ||
        "Unknown Gemini API error",
    });
  }
}
