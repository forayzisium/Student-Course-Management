import { randomUUID } from "node:crypto";
import type { Response } from "express";
import { prisma } from "../../config/prisma";

export type TeacherActivity = {
  id: string;
  type: string;
  title: string;
  description: string;
  courseCode?: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  createdAt: string;
};

type ActivityInput = Omit<TeacherActivity, "id" | "createdAt"> & {
  id?: string;
  createdAt?: Date | string;
};

const activityHistory = new Map<number, TeacherActivity[]>();
const activityStreams = new Map<number, Set<Response>>();

function toActivity(input: ActivityInput): TeacherActivity {
  return {
    ...input,
    id: input.id ?? randomUUID(),
    createdAt: input.createdAt
      ? new Date(input.createdAt).toISOString()
      : new Date().toISOString(),
  };
}

export function publishTeacherActivity(
  teacherId: number,
  input: ActivityInput,
) {
  const activity = toActivity(input);
  const existing = activityHistory.get(teacherId) ?? [];
  const history = [
    activity,
    ...existing.filter((item) => item.id !== activity.id),
  ].slice(0, 50);

  activityHistory.set(teacherId, history);

  const frame = `event: activity\ndata: ${JSON.stringify(activity)}\n\n`;
  for (const stream of activityStreams.get(teacherId) ?? []) {
    stream.write(frame);
  }

  return activity;
}

export function subscribeToTeacherActivities(
  teacherId: number,
  response: Response,
) {
  response.status(200);
  response.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  response.flushHeaders();
  response.write("event: connected\ndata: {}\n\n");

  const streams = activityStreams.get(teacherId) ?? new Set<Response>();
  streams.add(response);
  activityStreams.set(teacherId, streams);

  const heartbeat = setInterval(() => {
    response.write(": heartbeat\n\n");
  }, 15000);

  response.on("close", () => {
    clearInterval(heartbeat);
    streams.delete(response);
    if (streams.size === 0) activityStreams.delete(teacherId);
  });
}

export async function getRecentTeacherActivities(
  teacherId: number,
  limit: number,
) {
  const queryLimit = Math.max(limit, 10);
  const [assignments, grades, enrollments, submissions] = await Promise.all([
    prisma.assignment.findMany({
      where: { course: { teacherId } },
      orderBy: { updatedAt: "desc" },
      take: queryLimit,
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        course: { select: { code: true } },
      },
    }),
    prisma.grade.findMany({
      where: { course: { teacherId } },
      orderBy: { updatedAt: "desc" },
      take: queryLimit,
      select: {
        id: true,
        total: true,
        createdAt: true,
        updatedAt: true,
        course: { select: { code: true } },
        student: { select: { user: { select: { name: true } } } },
      },
    }),
    prisma.enrollment.findMany({
      where: { course: { teacherId } },
      orderBy: { enrolledAt: "desc" },
      take: queryLimit,
      select: {
        id: true,
        enrolledAt: true,
        course: { select: { code: true } },
        student: { select: { user: { select: { name: true } } } },
      },
    }),
    prisma.submission.findMany({
      where: { assignment: { course: { teacherId } } },
      orderBy: { submittedAt: "desc" },
      take: queryLimit,
      select: {
        id: true,
        submittedAt: true,
        student: { select: { user: { select: { name: true } } } },
        assignment: {
          select: {
            title: true,
            course: { select: { code: true } },
          },
        },
      },
    }),
  ]);

  const persisted: TeacherActivity[] = [
    ...assignments.map((assignment) => {
      const updated =
        assignment.updatedAt.getTime() - assignment.createdAt.getTime() > 1000;
      return {
        id: `assignment-${assignment.id}-${assignment.updatedAt.toISOString()}`,
        type: updated ? "ASSIGNMENT_UPDATED" : "ASSIGNMENT_CREATED",
        title: updated ? "Assignment updated" : "Assignment created",
        description: `“${assignment.title}” ${updated ? "was updated" : "is now available"}.`,
        courseCode: assignment.course.code,
        priority: "LOW" as const,
        createdAt: assignment.updatedAt.toISOString(),
      };
    }),
    ...grades.map((grade) => {
      const updated =
        grade.updatedAt.getTime() - grade.createdAt.getTime() > 1000;
      return {
        id: `grade-${grade.id}-${grade.updatedAt.toISOString()}`,
        type: updated ? "GRADE_UPDATED" : "GRADE_CREATED",
        title: updated ? "Grade updated" : "Grade published",
        description: `${grade.student.user.name}'s course grade is now ${grade.total}.`,
        courseCode: grade.course.code,
        priority: "MEDIUM" as const,
        createdAt: grade.updatedAt.toISOString(),
      };
    }),
    ...enrollments.map((enrollment) => ({
      id: `enrollment-${enrollment.id}-${enrollment.enrolledAt.toISOString()}`,
      type: "ENROLLMENT_CREATED",
      title: "New enrollment",
      description: `${enrollment.student.user.name} joined the course.`,
      courseCode: enrollment.course.code,
      priority: "LOW" as const,
      createdAt: enrollment.enrolledAt.toISOString(),
    })),
    ...submissions.map((submission) => ({
      id: `submission-${submission.id}-${submission.submittedAt.toISOString()}`,
      type: "SUBMISSION_CREATED",
      title: "Assignment submitted",
      description: `${submission.student.user.name} submitted “${submission.assignment.title}”.`,
      courseCode: submission.assignment.course.code,
      priority: "MEDIUM" as const,
      createdAt: submission.submittedAt.toISOString(),
    })),
  ];

  const activities = new Map<string, TeacherActivity>();
  for (const activity of [
    ...(activityHistory.get(teacherId) ?? []),
    ...persisted,
  ]) {
    activities.set(activity.id, activity);
  }

  return [...activities.values()]
    .sort(
      (first, second) =>
        new Date(second.createdAt).getTime() -
        new Date(first.createdAt).getTime(),
    )
    .slice(0, limit);
}

export function resetActivityStateForTests() {
  activityHistory.clear();
  activityStreams.clear();
}
