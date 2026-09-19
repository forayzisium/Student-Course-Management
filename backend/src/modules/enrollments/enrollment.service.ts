import { prisma } from "../../config/prisma";
import { publishTeacherActivity } from "../activities/activity.service";
import { realtimeEventBus } from "../events/event.bus";

export async function enrollStudent(studentId: number, courseId: number) {
  const student = await prisma.studentProfile.findUnique({
    where: {
      id: studentId,
    },
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!student) {
    throw new Error("Student not found");
  }

  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      status: "ACTIVE",
    },
    include: { semesterRecord: true },
  });

  if (!course) {
    throw new Error("Active course not found");
  }

  const existingEnrollment = await prisma.enrollment.findUnique({
    where: {
      studentId_courseId: {
        studentId,
        courseId,
      },
    },
  });

  if (existingEnrollment) {
    throw new Error("Student is already enrolled in this course");
  }

  const enrollment = await prisma.$transaction(async (tx) => {
    const created = await tx.enrollment.create({
      data: {
        studentId,
        courseId,
      },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            department: true,
            semester: true,
            status: true,
          },
        },
        student: {
          select: {
            id: true,
            studentId: true,
            department: true,
            year: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const amount =
      Math.round(course.credits * course.semesterRecord.costPerCredit * 100) /
      100;
    const now = new Date();
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const dueDate = new Date(
      Math.min(
        Math.max(
          course.semesterRecord.startDate.getTime(),
          thirtyDaysFromNow.getTime(),
        ),
        course.semesterRecord.endDate.getTime(),
      ),
    );

    await tx.fee.create({
      data: {
        studentId,
        courseId: course.id,
        semesterId: course.semesterId,
        enrollmentId: created.id,
        feeType: `${course.code} Tuition (${course.credits} credits)`,
        amount,
        dueDate,
        status: amount === 0 ? "PAID" : "UNPAID",
      },
    });

    return created;
  });

  publishTeacherActivity(course.teacherId, {
    id: `enrollment-${enrollment.id}-${enrollment.enrolledAt.toISOString()}`,
    type: "ENROLLMENT_CREATED",
    title: "New enrollment",
    description: `${student.user.name} joined the course.`,
    courseCode: course.code,
    priority: "LOW",
    createdAt: enrollment.enrolledAt,
  });

  realtimeEventBus.emitToStudent(studentId, "ENROLLMENT_UPDATED", {
    courseId,
    action: "ENROLLED",
  });

  return enrollment;
}

export async function getStudentEnrollments(studentId: number) {
  const student = await prisma.studentProfile.findUnique({
    where: {
      id: studentId,
    },
  });

  if (!student) {
    throw new Error("Student not found");
  }

  return prisma.enrollment.findMany({
    where: {
      studentId,
      status: "ACTIVE",
    },
    include: {
      course: {
        select: {
          id: true,
          code: true,
          name: true,
          department: true,
          semester: true,
          status: true,
          teacher: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      enrolledAt: "desc",
    },
  });
}
export async function getMyStudentEnrollments(userId: number) {
  const student = await prisma.studentProfile.findUnique({
    where: {
      userId,
    },
  });

  if (!student) {
    throw new Error("Student profile not found");
  }

  const enrollments = await prisma.enrollment.findMany({
    where: {
      studentId: student.id,
      status: "ACTIVE",
    },
    include: {
      course: {
        select: {
          assignments: {
            where: { status: "ACTIVE" },
            select: {
              id: true,
              submissions: {
                where: { studentId: student.id },
                select: { id: true },
              },
            },
          },
          id: true,
          code: true,
          name: true,
          description: true,
          credits: true,
          syllabus: true,
          department: true,
          semester: true,
          status: true,
          teacher: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      enrolledAt: "desc",
    },
  });
  return enrollments.map((enrollment) => {
    const { assignments = [], ...course } = enrollment.course;
    const submitted = assignments.filter(
      (a) => a.submissions.length > 0,
    ).length;
    return {
      ...enrollment,
      course: {
        ...course,
        progress: assignments.length
          ? Math.round((submitted / assignments.length) * 100)
          : 0,
      },
    };
  });
}
export async function getTeacherCourseStats(userId: number) {
  const courses = await prisma.course.findMany({
    where: {
      teacherId: userId,
      status: "ACTIVE",
    },
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      credits: true,
      syllabus: true,
      department: true,
      semester: true,
      status: true,
      _count: {
        select: {
          enrollments: { where: { status: "ACTIVE" } },
          assignments: { where: { status: "ACTIVE" } },
        },
      },
      assignments: {
        where: { status: "ACTIVE" },
        select: {
          courseId: true,
          submissions: {
            select: {
              status: true,
              student: {
                select: {
                  enrollments: {
                    where: { status: "ACTIVE" },
                    select: { courseId: true },
                  },
                },
              },
            },
          },
        },
      },
      attendance: { select: { status: true } },
    },
    orderBy: {
      code: "asc",
    },
  });

  return courses.map(({ assignments, attendance, ...course }) => {
    const activeAssignments = assignments.map((assignment) => ({
      ...assignment,
      submissions: assignment.submissions.filter((submission) =>
        submission.student.enrollments.some(
          (enrollment) => enrollment.courseId === assignment.courseId,
        ),
      ),
    }));
    const expectedSubmissions =
      course._count.enrollments * course._count.assignments;
    const submitted = activeAssignments.reduce(
      (sum, assignment) => sum + assignment.submissions.length,
      0,
    );
    const pendingGrading = activeAssignments.reduce(
      (sum, assignment) =>
        sum +
        assignment.submissions.filter((item) => item.status === "SUBMITTED")
          .length,
      0,
    );
    const gradedSubmissions = activeAssignments.reduce(
      (sum, assignment) =>
        sum +
        assignment.submissions.filter((item) => item.status === "GRADED")
          .length,
      0,
    );
    const attended = attendance.filter(
      (record) => record.status === "PRESENT" || record.status === "LATE",
    ).length;

    return {
      ...course,
      progress:
        expectedSubmissions > 0
          ? Math.round((submitted / expectedSubmissions) * 100)
          : 0,
      attendance:
        attendance.length > 0
          ? Math.round((attended / attendance.length) * 100)
          : null,
      pendingGrading,
      gradedSubmissions,
    };
  });
}
export async function getTeacherCourseStudents(
  teacherId: number,
  courseId: number,
) {
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

  return prisma.enrollment.findMany({
    where: {
      courseId,
      status: "ACTIVE",
    },
    select: {
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
    orderBy: {
      student: {
        studentId: "asc",
      },
    },
  });
}
export async function getMyEnrollmentHistory(userId: number) {
  const student = await prisma.studentProfile.findUnique({
    where: {
      userId,
    },
  });

  if (!student) {
    throw new Error("Student profile not found");
  }

  return prisma.enrollment.findMany({
    where: {
      studentId: student.id,
    },
    include: {
      course: {
        select: {
          id: true,
          code: true,
          name: true,
          department: true,
          semester: true,
          status: true,
          teacher: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      enrolledAt: "desc",
    },
  });
}
