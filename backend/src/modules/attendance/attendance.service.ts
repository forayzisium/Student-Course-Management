import { prisma } from "../../config/prisma";
import { realtimeEventBus } from "../events/event.bus";

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE";

type AttendanceEntry = {
  studentId: number;
  status: AttendanceStatus;
};

function normalizeAttendanceDate(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

async function requireTeacherCourse(teacherId: number, courseId: number) {
  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      teacherId,
      status: "ACTIVE",
    },
    select: {
      id: true,
    },
  });

  if (!course) {
    throw new Error("Course not found or access denied");
  }
}

async function requireActiveEnrollments(
  courseId: number,
  studentIds: number[],
) {
  const enrollments = await prisma.enrollment.findMany({
    where: {
      courseId,
      studentId: {
        in: studentIds,
      },
      status: "ACTIVE",
    },
    select: {
      studentId: true,
    },
  });

  const enrolledStudentIds = new Set(
    enrollments.map((enrollment) => enrollment.studentId),
  );
  const invalidStudentId = studentIds.find(
    (studentId) => !enrolledStudentIds.has(studentId),
  );

  if (invalidStudentId !== undefined) {
    throw new Error("Every student must be actively enrolled in this course");
  }
}

export async function markAttendance(
  teacherId: number,
  data: {
    studentId: number;
    courseId: number;
    date: Date;
    status: AttendanceStatus;
  },
) {
  const attendance = await saveCourseAttendance(
    teacherId,
    data.courseId,
    data.date,
    [
      {
        studentId: data.studentId,
        status: data.status,
      },
    ],
  );

  return attendance[0];
}

export async function saveCourseAttendance(
  teacherId: number,
  courseId: number,
  date: Date,
  entries: AttendanceEntry[],
) {
  await requireTeacherCourse(teacherId, courseId);
  await requireActiveEnrollments(
    courseId,
    entries.map((entry) => entry.studentId),
  );

  const attendanceDate = normalizeAttendanceDate(date);

  const results = await prisma.$transaction(
    entries.map((entry) =>
      prisma.attendance.upsert({
        where: {
          studentId_courseId_date: {
            studentId: entry.studentId,
            courseId,
            date: attendanceDate,
          },
        },
        create: {
          studentId: entry.studentId,
          courseId,
          date: attendanceDate,
          status: entry.status,
        },
        update: {
          status: entry.status,
        },
        include: {
          student: {
            select: {
              id: true,
              studentId: true,
              department: true,
              year: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          course: {
            select: {
              id: true,
              code: true,
              name: true,
              teacherId: true,
            },
          },
        },
      }),
    ),
  );

  for (const entry of entries) {
    realtimeEventBus.emitToStudent(entry.studentId, "ATTENDANCE_RECORDED", {
      courseId,
      date: attendanceDate.toISOString(),
      status: entry.status,
    });
  }

  return results;
}

export async function getCourseAttendance(courseId: number) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new Error("Course not found");
  }

  return prisma.attendance.findMany({
    where: {
      courseId,
    },
    include: {
      student: {
        select: {
          id: true,
          studentId: true,
          department: true,
          year: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: [
      {
        date: "desc",
      },
      {
        studentId: "asc",
      },
    ],
  });
}

export async function getStudentAttendance(userId: number) {
  const student = await prisma.studentProfile.findUnique({
    where: { userId },
  });

  if (!student) {
    throw new Error("Student profile not found");
  }

  return prisma.attendance.findMany({
    where: {
      studentId: student.id,
    },
    include: {
      course: {
        select: {
          id: true,
          code: true,
          name: true,
          semester: true,
        },
      },
    },
    orderBy: {
      date: "desc",
    },
  });
}

export async function getTeacherCourseAttendance(
  teacherId: number,
  courseId: number,
) {
  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      teacherId,
    },
  });

  if (!course) {
    throw new Error("You can only view attendance for your own courses");
  }

  return getCourseAttendance(courseId);
}

export async function updateAttendance(
  teacherId: number,
  attendanceId: number,
  status: "PRESENT" | "ABSENT" | "LATE",
) {
  const attendance = await prisma.attendance.findFirst({
    where: {
      id: attendanceId,
      course: {
        teacherId,
      },
    },
  });

  if (!attendance) {
    throw new Error("You can only update attendance for your own courses");
  }

  return prisma.attendance.update({
    where: {
      id: attendanceId,
    },
    data: {
      status,
    },
    include: {
      student: {
        select: {
          id: true,
          studentId: true,
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      course: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    },
  });
}
