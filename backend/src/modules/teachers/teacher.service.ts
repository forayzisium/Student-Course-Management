import { prisma } from "../../config/prisma";

export async function getTeachers() {
  return prisma.user.findMany({
    where: {
      role: "TEACHER",
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
          id: true,
          department: true,
          qualification: true,
          experience: true,
          phone: true,
        },
      },

      courses: {
        select: {
          id: true,
          code: true,
          name: true,
          department: true,
          semester: true,
          status: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getTeacherById(id: number) {
  return prisma.user.findFirst({
    where: {
      id,
      role: "TEACHER",
    },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      status: true,
      createdAt: true,
      updatedAt: true,

      teacherProfile: {
        select: {
          id: true,
          department: true,
          qualification: true,
          experience: true,
          phone: true,
        },
      },

      courses: {
        select: {
          id: true,
          code: true,
          name: true,
          department: true,
          semester: true,
          status: true,
        },
      },
    },
  });
}

export async function updateTeacherStatus(
  id: number,
  status: "ACTIVE" | "INACTIVE",
) {
  const teacher = await prisma.user.findFirst({
    where: {
      id,
      role: "TEACHER",
    },
  });

  if (!teacher) {
    throw new Error("Teacher not found");
  }

  if (teacher.status !== "ACTIVE" && teacher.status !== "INACTIVE") {
    throw new Error("Only approved teachers can be activated or deactivated");
  }

  return prisma.user.update({
    where: {
      id,
    },
    data: {
      status,
    },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      status: true,

      teacherProfile: {
        select: {
          id: true,
          department: true,
          qualification: true,
          experience: true,
          phone: true,
        },
      },
    },
  });
}
export async function getMyTeacherProfile(userId: number) {
  return prisma.user.findFirst({
    where: {
      id: userId,
      role: "TEACHER",
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
          id: true,
          department: true,
          qualification: true,
          experience: true,
          phone: true,
        },
      },

      courses: {
        select: {
          id: true,
          code: true,
          name: true,
          department: true,
          semester: true,
          status: true,
        },
      },
    },
  });
}
export async function getMyTeacherStudents(userId: number) {
  const teacher = await prisma.user.findFirst({
    where: {
      id: userId,
      role: "TEACHER",
    },
    select: {
      courses: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!teacher) {
    throw new Error("Teacher not found");
  }

  const courseIds = teacher.courses.map((course) => course.id);

  if (courseIds.length === 0) {
    return [];
  }

  const enrollments = await prisma.enrollment.findMany({
    where: {
      courseId: {
        in: courseIds,
      },
      status: "ACTIVE",
    },
    include: {
      student: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
              status: true,
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

  const studentMap = new Map<
    number,
    {
      id: number;
      name: string;
      email: string;
      studentId: string;
      department: string;
      year: string;
      status: string;
      courses: {
        courseId: number;
        courseCode: string;
        courseName: string;
      }[];
    }
  >();

  for (const enrollment of enrollments) {
    const student = enrollment.student;
    const existing = studentMap.get(student.id);

    if (!existing) {
      studentMap.set(student.id, {
        id: student.id,
        name: student.user.name,
        email: student.user.email,
        studentId: student.studentId,
        department: student.department,
        year: student.year,
        status: student.user.status,
        courses: [
          {
            courseId: enrollment.course.id,
            courseCode: enrollment.course.code,
            courseName: enrollment.course.name,
          },
        ],
      });

      continue;
    }

    existing.courses.push({
      courseId: enrollment.course.id,
      courseCode: enrollment.course.code,
      courseName: enrollment.course.name,
    });
  }

  const students = Array.from(studentMap.values());

  if (students.length === 0) {
    return [];
  }

  const studentIds = students.map((s) => s.id);

  const [attendanceRecords, gradeRecords, assignmentRecords] =
    await Promise.all([
      prisma.attendance.findMany({
        where: {
          studentId: {
            in: studentIds,
          },
          courseId: {
            in: courseIds,
          },
        },
        select: {
          studentId: true,
          status: true,
        },
      }),
      prisma.grade.findMany({
        where: {
          studentId: {
            in: studentIds,
          },
          courseId: {
            in: courseIds,
          },
        },
        select: {
          studentId: true,
          total: true,
        },
      }),
      prisma.assignment.findMany({
        where: {
          courseId: {
            in: courseIds,
          },
          status: "ACTIVE",
        },
        select: {
          id: true,
          courseId: true,
          submissions: {
            where: {
              studentId: {
                in: studentIds,
              },
            },
            select: {
              studentId: true,
              status: true,
            },
          },
        },
      }),
    ]);

  const attendanceMap = new Map<number, { total: number; present: number }>();
  const gradeMap = new Map<number, number[]>();
  const submissionMap = new Map<number, Set<number>>();

  for (const record of attendanceRecords) {
    const current = attendanceMap.get(record.studentId) || {
      total: 0,
      present: 0,
    };

    current.total += 1;

    if (record.status === "PRESENT" || record.status === "LATE") {
      current.present += 1;
    }

    attendanceMap.set(record.studentId, current);
  }

  for (const grade of gradeRecords) {
    const totals = gradeMap.get(grade.studentId) || [];

    if (typeof grade.total === "number") {
      totals.push(grade.total);
    }

    gradeMap.set(grade.studentId, totals);
  }

  for (const assignment of assignmentRecords) {
    for (const submission of assignment.submissions) {
      const submitted = submissionMap.get(submission.studentId) || new Set();

      if (submission.status === "SUBMITTED" || submission.status === "GRADED") {
        submitted.add(assignment.id);
      }

      submissionMap.set(submission.studentId, submitted);
    }
  }

  return students.map((student) => {
    const attendance = attendanceMap.get(student.id);

    const attendancePercentage =
      attendance && attendance.total > 0
        ? Math.round((attendance.present / attendance.total) * 100)
        : null;

    const totals = gradeMap.get(student.id) || [];

    const averageGrade =
      totals.length > 0
        ? Math.round(
            totals.reduce((sum, value) => sum + value, 0) / totals.length,
          )
        : null;

    const submittedAssignments = submissionMap.get(student.id) || new Set();

    const totalAssignments = assignmentRecords.filter((a) =>
      student.courses.some((c) => c.courseId === a.courseId),
    ).length;

    const progress =
      totalAssignments > 0
        ? Math.round((submittedAssignments.size / totalAssignments) * 100)
        : null;

    let grade = "N/A";

    if (averageGrade !== null) {
      if (averageGrade >= 80) grade = "A+";
      else if (averageGrade >= 75) grade = "A";
      else if (averageGrade >= 70) grade = "A-";
      else if (averageGrade >= 65) grade = "B+";
      else if (averageGrade >= 60) grade = "B";
      else if (averageGrade >= 55) grade = "B-";
      else if (averageGrade >= 50) grade = "C+";
      else if (averageGrade >= 45) grade = "C";
      else if (averageGrade >= 40) grade = "D";
      else grade = "F";
    }

    return {
      ...student,
      progress: progress ?? 0,
      grade,
      attendance: attendancePercentage ?? 0,
    };
  });
}

export async function updateMyTeacherProfile(
  userId: number,
  data: {
    name?: string;
    username?: string;
    email?: string;
    department?: string;
    qualification?: string;
    experience?: string;
    phone?: string;
  },
) {
  if (
    data.username !== undefined &&
    !/^[A-Za-z0-9._-]{3,50}$/.test(data.username)
  ) {
    throw new Error(
      "Username must be 3-50 letters, numbers, dots, hyphens or underscores",
    );
  }

  if (
    data.phone !== undefined &&
    data.phone !== "" &&
    !/^[+\d ()-]{7,32}$/.test(data.phone)
  ) {
    throw new Error("Enter a valid phone number");
  }
  const teacher = await prisma.user.findFirst({
    where: {
      id: userId,
      role: "TEACHER",
    },
    include: {
      teacherProfile: true,
    },
  });

  if (!teacher || !teacher.teacherProfile) {
    throw new Error("Teacher profile not found");
  }

  if (data.email || data.username) {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          ...(data.email ? [{ email: data.email }] : []),
          ...(data.username ? [{ username: data.username }] : []),
        ],
        NOT: {
          id: userId,
        },
      },
    });

    if (existingUser) {
      throw new Error(
        existingUser.email === data.email
          ? "Email already in use"
          : "Username already in use",
      );
    }
  }

  return prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: {
        id: userId,
      },
      data: {
        ...(data.name !== undefined && {
          name: data.name,
        }),
        ...(data.email !== undefined && {
          email: data.email,
        }),
        ...(data.username !== undefined && { username: data.username }),
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        status: true,
      },
    });

    const updatedProfile = await tx.teacherProfile.update({
      where: {
        userId,
      },
      data: {
        ...(data.department !== undefined && {
          department: data.department,
        }),
        ...(data.qualification !== undefined && {
          qualification: data.qualification,
        }),
        ...(data.experience !== undefined && {
          experience: data.experience,
        }),
        ...(data.phone !== undefined && { phone: data.phone || null }),
      },
      select: {
        id: true,
        department: true,
        qualification: true,
        experience: true,
        phone: true,
      },
    });

    return {
      ...updatedUser,
      teacherProfile: updatedProfile,
    };
  });
}
