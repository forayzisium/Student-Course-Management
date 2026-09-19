import express from "express";
import {
  adminAccessRoutes,
  acceptAdminInvitationRoutes,
} from "./modules/admin-access/routes";
import cors from "cors";
import aiRoutes from "./routes/ai.routes";
import { prisma } from "./config/prisma";
import authRoutes from "./modules/auth/auth.routes";
import adminRoutes from "./modules/admin/admin.routes";
import courseRoutes from "./modules/courses/course.routes";
import enrollmentRoutes from "./modules/enrollments/enrollment.routes";
import assignmentRoutes from "./modules/assignments/assignment.routes";
import attendanceRoutes from "./modules/attendance/attendance.routes";
import gradeRoutes from "./modules/grades/grade.routes";
import paymentRoutes from "./modules/payments/payment.routes";
import studentRoutes from "./modules/students/student.routes";
import teacherRoutes from "./modules/teachers/teacher.routes";
import submissionRoutes from "./modules/submission/submission.routes";
import studentSubmissionRoutes from "./modules/submission/student-submission.routes";
import feeRoutes from "./modules/fees/fee.routes";
import activityRoutes from "./modules/activities/activity.routes";
import eventRoutes from "./modules/events/event.routes";
import semesterRoutes from "./modules/semesters/semester.routes";

import {
  realtimeEventBus,
  RealtimeEventType,
} from "./modules/events/event.bus";
const app = express();

const configuredFrontendOrigin = process.env.FRONTEND_URL?.replace(/\/$/, "");
const allowedOrigins = new Set(
  [
    configuredFrontendOrigin,
    ...(process.env.NODE_ENV === "production"
      ? []
      : ["http://localhost:3000", "http://127.0.0.1:3000"]),
  ].filter((origin): origin is string => Boolean(origin)),
);
// Publish invalidations only after a successful HTTP mutation has committed.
app.use((req, res, next) => {
  const domains: Record<string, RealtimeEventType> = {
    assignments: "ASSIGNMENT_CREATED",
    submissions: "ASSIGNMENT_GRADED",
    attendance: "ATTENDANCE_RECORDED",
    grades: "GRADE_UPDATED",
    fees: "PAYMENT_UPDATED",
    payments: "PAYMENT_UPDATED",
    courses: "COURSE_CATALOG_UPDATED",
    semesters: "COURSE_CATALOG_UPDATED",
    enrollments: "ENROLLMENT_UPDATED",
  };
  const type = domains[req.path.split("/")[2]];
  if (type && ["POST", "PUT", "PATCH", "DELETE"].includes(req.method))
    res.on("finish", () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        if (req.user?.role === "STUDENT")
          realtimeEventBus.emitToUser(req.user.userId, type);
        else if (
          Number.isSafeInteger(Number(req.body?.studentId)) &&
          Number(req.body.studentId) > 0
        )
          realtimeEventBus.emitToStudent(Number(req.body.studentId), type);
        else if (
          Number.isSafeInteger(Number(req.body?.courseId)) &&
          Number(req.body.courseId) > 0
        )
          realtimeEventBus.emitEvent({
            type,
            courseId: Number(req.body.courseId),
          });
        else realtimeEventBus.emitBroadcast(type);
      }
    });
  next();
});

app.use(
  cors({
    origin(origin, callback) {
      // Requests without an Origin header include server-to-server calls and
      // health checks. Browser origins must be explicitly allowed.
      if (!origin || allowedOrigins.has(origin.replace(/\/$/, ""))) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin is not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use("/api/admin-access", adminAccessRoutes);
app.use("/api/admin-invitations/accept", acceptAdminInvitationRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/semesters", semesterRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/submissions", studentSubmissionRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/grades", gradeRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/fees", feeRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/events", eventRoutes);
// Retired duplicate recommendations API. The student UI uses /api/ai/overview.
app.use("/api/ai-study", (_req, res) =>
  res.status(410).json({
    success: false,
    message: "Use /api/ai/overview for study recommendations.",
  }),
);

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "SCM Backend API is running",
  });
});

app.get("/api/health/db", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      success: true,
      message: "Database connection is working",
    });
  } catch (error) {
    console.error("Database connection failed:", error);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

app.use("/api/auth", authRoutes);

export default app;
