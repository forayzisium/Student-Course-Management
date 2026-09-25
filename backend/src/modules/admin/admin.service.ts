import { prisma } from "../../config/prisma";
import { reportRange } from "./report-range";


export const getAdminDashboard = async () => {
  const [
    totalStudents,
    totalTeachers,
    pendingTeacherRequests,
    approvedTeacherRequests,
    rejectedTeacherRequests,
    totalCourses,
    totalAssignments,
    totalPayments,
    paidPayments,
    pendingPayments,

    activeStudents,
    activeTeachers,

    totalActiveEnrollments,
    totalGrades,

    recentUsers,
    recentCourses,
    recentAssignments,
    recentPayments,
  ] = await Promise.all([

    prisma.user.count({
      where: {
        role: "STUDENT",
      },
    }),

    prisma.user.count({
      where: {
        role: "TEACHER",
      },
    }),

    prisma.user.count({
      where: {
        role: "TEACHER",
        status: "PENDING",
      },
    }),

    prisma.user.count({
      where: {
        role: "TEACHER",
        status: "ACTIVE",
      },
    }),

    prisma.user.count({
      where: {
        role: "TEACHER",
        status: "REJECTED",
      },
    }),

    prisma.course.count(),

    prisma.assignment.count(),

    prisma.payment.count(),

    prisma.payment.count({
      where: {
        status: "PAID",
      },
    }),

    prisma.payment.count({
      where: {
        status: "PENDING",
      },
    }),


    prisma.user.count({
      where: {
        role: "STUDENT",
        status: "ACTIVE",
      },
    }),

    prisma.user.count({
      where: {
        role: "TEACHER",
        status: "ACTIVE",
      },
    }),


    prisma.enrollment.count({
      where: {
        status: "ACTIVE",
      },
    }),

    prisma.grade.count(),


    prisma.user.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        name: true,
        role: true,
        createdAt: true,
      },
    }),

    prisma.course.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        name: true,
        code: true,
        createdAt: true,
      },
    }),

    prisma.assignment.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        title: true,
        createdAt: true,
      },
    }),

    prisma.payment.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        amount: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);


  const activeStudentPercentage =
    totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0;

  const activeTeacherPercentage =
    totalTeachers > 0 ? Math.round((activeTeachers / totalTeachers) * 100) : 0;

  /*
   * Course Completion
   *
   * The current Enrollment model does not have a COMPLETED
   * status, so grades are being used as the available
   * completion indicator.
   */

  const courseCompletion =
    totalActiveEnrollments > 0
      ? Math.min(100, Math.round((totalGrades / totalActiveEnrollments) * 100))
      : 0;


  return {
    students: {
      total: totalStudents,
    },

    teachers: {
      total: totalTeachers,
    },

    teacherRequests: {
      pending: pendingTeacherRequests,
      approved: approvedTeacherRequests,
      rejected: rejectedTeacherRequests,
    },

    courses: {
      total: totalCourses,
    },

    assignments: {
      total: totalAssignments,
    },

    payments: {
      total: totalPayments,
      paid: paidPayments,
      pending: pendingPayments,
    },

    activity: {
      activeStudents: activeStudentPercentage,
      activeTeachers: activeTeacherPercentage,
      courseCompletion,
    },

    recentActivity: {
      users: recentUsers,
      courses: recentCourses,
      assignments: recentAssignments,
      payments: recentPayments,
    },
  };
};


export const getTeacherRequests = async () => {
  return prisma.user.findMany({
    where: {
      role: "TEACHER",
      status: {
        in: ["PENDING", "ACTIVE", "REJECTED"],
      },
    },

    orderBy: {
      createdAt: "desc",
    },

    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      status: true,
      createdAt: true,

      teacherProfile: {
        select: {
          department: true,
          qualification: true,
          experience: true,
        },
      },
    },
  });
};
export const getMyAdminProfile = async (userId: number) => {
  return prisma.user.findFirst({
    where: {
      id: userId,
      role: "ADMIN",
    },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};
export const updateMyAdminProfile = async (
  userId: number,
  data: {
    name?: string;
    email?: string;
    username?: string;
  },
) => {
  if (data.username !== undefined) {
    if (
      typeof data.username !== "string" ||
      !/^[a-zA-Z0-9_]{3,40}$/.test(data.username.trim())
    )
      throw new Error(
        "Username must contain 3–40 letters, numbers or underscores.",
      );
    data.username = data.username.trim();
    const duplicate = await prisma.user.findFirst({
      where: { username: data.username, id: { not: userId } },
    });
    if (duplicate) throw new Error("Username already in use");
  }
  const admin = await prisma.user.findFirst({
    where: {
      id: userId,
      role: "ADMIN",
    },
  });

  if (!admin) {
    throw new Error("Admin profile not found");
  }

  if (data.email) {
    const exists = await prisma.user.findFirst({
      where: {
        email: data.email,
        NOT: {
          id: userId,
        },
      },
    });

    if (exists) {
      throw new Error("Email already in use");
    }
  }

  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.username !== undefined && { username: data.username }),
    },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      status: true,
    },
  });
};

export const getAdminReports = async (
  range = reportRange(undefined, undefined),
) => {
  const created = range.filter ? { createdAt: range.filter } : {};
  const enrolled = range.filter ? { enrolledAt: range.filter } : {};
  const attended = range.filter ? { date: range.filter } : {};
  const graded = range.filter ? { updatedAt: range.filter } : {};
  const paid = range.filter ? { paymentDate: range.filter } : {};
  const [
    totalStudents,
    activeStudents,
    totalTeachers,
    activeTeachers,
    totalCourses,
    activeCourses,
    totalAssignments,
    activeAssignments,
    totalEnrollments,
    activeEnrollments,

    totalAttendance,
    presentAttendance,
    absentAttendance,
    lateAttendance,

    totalGrades,

    totalPayments,
    paidPayments,
    pendingPayments,
  ] = await Promise.all([

    prisma.user.count({ where: { ...created, role: "STUDENT" } }),

    prisma.user.count({
      where: { ...created, role: "STUDENT", status: "ACTIVE" },
    }),

    prisma.user.count({ where: { ...created, role: "TEACHER" } }),

    prisma.user.count({
      where: { ...created, role: "TEACHER", status: "ACTIVE" },
    }),

    prisma.course.count({ where: created }),

    prisma.course.count({ where: { ...created, status: "ACTIVE" } }),

    prisma.assignment.count({ where: created }),

    prisma.assignment.count({ where: { ...created, status: "ACTIVE" } }),

    prisma.enrollment.count({ where: enrolled }),

    prisma.enrollment.count({ where: { ...enrolled, status: "ACTIVE" } }),


    prisma.attendance.count({ where: attended }),

    prisma.attendance.count({ where: { ...attended, status: "PRESENT" } }),

    prisma.attendance.count({ where: { ...attended, status: "ABSENT" } }),

    prisma.attendance.count({ where: { ...attended, status: "LATE" } }),


    prisma.grade.count({ where: graded }),


    prisma.payment.count({ where: paid }),

    prisma.payment.count({ where: { ...paid, status: "PAID" } }),

    prisma.payment.count({ where: { ...paid, status: "PENDING" } }),
  ]);


  return {
    range: { start: range.start, end: range.end, timezone: "UTC" },
    students: {
      total: totalStudents,
      active: activeStudents,
    },

    teachers: {
      total: totalTeachers,
      active: activeTeachers,
    },

    courses: {
      total: totalCourses,
      active: activeCourses,
    },

    assignments: {
      total: totalAssignments,
      active: activeAssignments,
    },

    enrollments: {
      total: totalEnrollments,
      active: activeEnrollments,
    },

    attendance: {
      total: totalAttendance,
      present: presentAttendance,
      absent: absentAttendance,
      late: lateAttendance,
    },

    grades: {
      total: totalGrades,
    },

    payments: {
      total: totalPayments,
      paid: paidPayments,
      pending: pendingPayments,
    },
  };
};

export const approveTeacher = async (userId: number) => {
  const teacher = await prisma.user.findFirst({
    where: {
      id: userId,
      role: "TEACHER",
      status: "PENDING",
    },
  });

  if (!teacher) {
    throw new Error("Teacher request not found");
  }

  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });
};


export const rejectTeacher = async (userId: number) => {
  const teacher = await prisma.user.findFirst({
    where: {
      id: userId,
      role: "TEACHER",
      status: "PENDING",
    },
  });

  if (!teacher) {
    throw new Error("Teacher request not found");
  }

  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      status: "REJECTED",
    },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });
};
