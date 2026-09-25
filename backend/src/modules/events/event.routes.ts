import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { prisma } from "../../config/prisma";
import { realtimeEventBus, RealtimeEventPayload } from "./event.bus";
const router = Router();
router.get(
  "/student-stream",
  requireAuth,
  requireRole("STUDENT"),
  async (req, res) => {
    const student = await prisma.studentProfile.findUnique({
      where: { userId: req.user!.userId },
      select: { id: true },
    });
    if (!student) {
      res.status(404).json({ message: "Student profile not found" });
      return;
    }
    res.set({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.flushHeaders();
    const send = (type: string) => {
      if (!res.destroyed)
        res.write("data: " + JSON.stringify({ type }) + "\n\n");
    };
    send("CONNECTED");
    const onEvent = async (event: RealtimeEventPayload) => {
      try {
        if (event.userId !== undefined && event.userId !== req.user!.userId)
          return;
        if (event.studentId !== undefined && event.studentId !== student.id)
          return;
        if (
          event.courseId !== undefined &&
          event.userId === undefined &&
          event.studentId === undefined
        ) {
          const enrollment = await prisma.enrollment.findFirst({
            where: {
              studentId: student.id,
              courseId: event.courseId,
              status: "ACTIVE",
            },
            select: { id: true },
          });
          if (!enrollment) return;
        }
        send(event.type);
      } catch {
        res.end();
      }
    };
    realtimeEventBus.on("realtime-event", onEvent);
    const heartbeat = setInterval(() => {
      if (!res.destroyed) res.write(": heartbeat\n\n");
    }, 30000);
    // Reconnect through normal auth periodically so revoked sessions cannot linger.
    const expiry = setTimeout(() => res.end(), 120000);
    res.on("close", () => {
      clearInterval(heartbeat);
      clearTimeout(expiry);
      realtimeEventBus.off("realtime-event", onEvent);
    });
  },
);
export default router;
