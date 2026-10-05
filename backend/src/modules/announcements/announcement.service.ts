import { AnnouncementType } from "../../generated/prisma/client";
import { prisma } from "../../config/prisma";

export class AnnouncementServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

const announcementInclude = {
  course: { select: { id: true, code: true, name: true } },
  teacher: { select: { id: true, name: true } },
} as const;

async function requireOwnedActiveCourse(teacherId: number, courseId: number) {
  const course = await prisma.course.findFirst({
    where: { id: courseId, teacherId, status: "ACTIVE" },
    select: { id: true },
  });
  if (!course) {
    throw new AnnouncementServiceError(
      "You can only publish announcements for your own active courses",
      403,
    );
  }
}

export async function createTeacherAnnouncement(
  teacherId: number,
  data: {
    courseId: number;
    title: string;
    message: string;
    type: AnnouncementType;
    rescheduledAt: Date | null;
  },
) {
  await requireOwnedActiveCourse(teacherId, data.courseId);
  return prisma.courseAnnouncement.create({
    data: { ...data, teacherId },
    include: announcementInclude,
  });
}

export function getTeacherAnnouncements(teacherId: number) {
  return prisma.courseAnnouncement.findMany({
    where: { teacherId, course: { teacherId } },
    include: announcementInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function updateTeacherAnnouncement(
  teacherId: number,
  announcementId: number,
  data: {
    courseId?: number;
    title?: string;
    message?: string;
    type?: AnnouncementType;
    rescheduledAt?: Date | null;
  },
) {
  const existing = await prisma.courseAnnouncement.findFirst({
    where: { id: announcementId, teacherId, course: { teacherId } },
    select: { id: true, courseId: true },
  });
  if (!existing) {
    throw new AnnouncementServiceError(
      "Announcement not found or access denied",
      403,
    );
  }
  if (data.courseId !== undefined) {
    await requireOwnedActiveCourse(teacherId, data.courseId);
  }
  return prisma.courseAnnouncement.update({
    where: { id: existing.id },
    data,
    include: announcementInclude,
  });
}

export async function deleteTeacherAnnouncement(
  teacherId: number,
  announcementId: number,
) {
  const existing = await prisma.courseAnnouncement.findFirst({
    where: { id: announcementId, teacherId, course: { teacherId } },
    select: { id: true, courseId: true },
  });
  if (!existing) {
    throw new AnnouncementServiceError(
      "Announcement not found or access denied",
      403,
    );
  }
  await prisma.courseAnnouncement.delete({ where: { id: existing.id } });
  return existing;
}

async function getStudentProfileId(userId: number) {
  const student = await prisma.studentProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!student) {
    throw new AnnouncementServiceError("Student profile not found", 404);
  }
  return student.id;
}

export async function getStudentAnnouncements(userId: number) {
  const studentId = await getStudentProfileId(userId);
  return prisma.courseAnnouncement.findMany({
    where: {
      course: { enrollments: { some: { studentId, status: "ACTIVE" } } },
    },
    include: announcementInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function getStudentAnnouncement(userId: number, id: number) {
  const studentId = await getStudentProfileId(userId);
  const announcement = await prisma.courseAnnouncement.findFirst({
    where: {
      id,
      course: { enrollments: { some: { studentId, status: "ACTIVE" } } },
    },
    include: announcementInclude,
  });
  if (!announcement) {
    throw new AnnouncementServiceError(
      "Announcement not found or access denied",
      403,
    );
  }
  return announcement;
}
