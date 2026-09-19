import { prisma } from "../../config/prisma";
import { realtimeEventBus } from "../events/event.bus";

export async function getStudents() {
  return prisma.user.findMany({
    where: {
      role: "STUDENT",
    },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      status: true,
      createdAt: true,
      studentProfile: {
        select: {
          id: true,
          studentId: true,
          department: true,
          year: true,
          enrollments: {
            where: {
              status: "ACTIVE",
            },
            select: {
              course: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getStudentById(id: number) {
  return prisma.user.findFirst({
    where: {
      id,
      role: "STUDENT",
    },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      studentProfile: {
        select: {
          id: true,
          studentId: true,
          department: true,
          year: true,
          enrollments: {
            where: {
              status: "ACTIVE",
            },
            select: {
              id: true,
              enrolledAt: true,
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
          },
        },
      },
    },
  });
}

export async function updateStudentStatus(
  id: number,
  status: "ACTIVE" | "INACTIVE",
) {
  const student = await prisma.user.findFirst({
    where: {
      id,
      role: "STUDENT",
    },
  });

  if (!student) {
    throw new Error("Student not found");
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
      email: true,
      role: true,
      status: true,
      studentProfile: {
        select: {
          id: true,
          studentId: true,
          department: true,
          year: true,
        },
      },
    },
  });
}
export async function getMyStudentProfile(userId: number) {
  return prisma.user.findFirst({
    where: {
      id: userId,
      role: "STUDENT",
    },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      status: true,
      createdAt: true,

      studentProfile: {
        select: {
          id: true,
          studentId: true,
          department: true,
          year: true,
          phone: true,
          address: true,

          enrollments: {
            where: {
              status: "ACTIVE",
            },
            select: {
              id: true,
              enrolledAt: true,

              course: {
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
                },
              },
            },
          },
        },
      },
    },
  });
}
export async function updateMyStudentProfile(
  userId: number,
  data: {
    name?: string;
    email?: string;
    department?: string;
    year?: string;
    phone?: string;
    address?: string;
  },
) {
  if (
    data.phone !== undefined &&
    (typeof data.phone !== "string" ||
      data.phone.length > 32 ||
      (data.phone && !/^[+\d ()-]+$/.test(data.phone)))
  )
    throw new Error("Enter a valid phone number (up to 32 characters)");
  if (
    data.address !== undefined &&
    (typeof data.address !== "string" || data.address.length > 2000)
  )
    throw new Error("Address must be at most 2000 characters");
  if (
    data.name !== undefined &&
    (typeof data.name !== "string" ||
      !data.name.trim() ||
      data.name.length > 150)
  )
    throw new Error("Enter a valid name");
  const student = await prisma.user.findFirst({
    where: {
      id: userId,
      role: "STUDENT",
    },
    include: {
      studentProfile: true,
    },
  });

  if (!student || !student.studentProfile) {
    throw new Error("Student profile not found");
  }

  if (data.email) {
    const existingUser = await prisma.user.findFirst({
      where: {
        email: data.email,
        NOT: {
          id: userId,
        },
      },
    });

    if (existingUser) {
      throw new Error("Email already in use");
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: {
        id: userId,
      },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        status: true,
      },
    });

    const updatedProfile = await tx.studentProfile.update({
      where: {
        userId,
      },
      data: {
        ...(data.department !== undefined && {
          department: data.department,
        }),
        ...(data.year !== undefined && {
          year: data.year,
        }),
        ...(data.phone !== undefined && {
          phone: data.phone,
        }),
        ...(data.address !== undefined && {
          address: data.address,
        }),
      },
      select: {
        id: true,
        studentId: true,
        department: true,
        year: true,
        phone: true,
        address: true,
      },
    });

    return {
      ...updatedUser,
      studentProfile: updatedProfile,
    };
  });

  realtimeEventBus.emitToUser(userId, "PROFILE_UPDATED", { userId });

  return result;
}
export async function getMyStudentActivity(userId: number) {
  const student = await prisma.studentProfile.findUnique({
    where: { userId },
  });

  if (!student) {
    throw new Error("Student profile not found");
  }

  const [submissions, grades, attendance, payments] = await Promise.all([
    prisma.submission.findMany({
      where: {
        studentId: student.id,
      },
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            course: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 10,
    }),

    prisma.grade.findMany({
      where: {
        studentId: student.id,
      },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 10,
    }),

    prisma.attendance.findMany({
      where: {
        studentId: student.id,
      },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 10,
    }),

    prisma.payment.findMany({
      where: {
        studentId: student.id,
      },
      include: {
        fee: {
          select: {
            id: true,
            feeType: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 10,
    }),
  ]);

  const activities = [
    ...submissions.map((submission) => ({
      id: submission.id,
      type: "ASSIGNMENT",
      title:
        submission.status === "GRADED"
          ? "Assignment graded"
          : "Assignment submitted",
      description: `${submission.assignment.title} • ${submission.assignment.course.name}`,
      date: submission.updatedAt,
    })),

    ...grades.map((grade) => ({
      id: grade.id,
      type: "GRADE",
      title: "Grade updated",
      description: grade.course.name,
      date: grade.updatedAt,
    })),

    ...attendance.map((record) => ({
      id: record.id,
      type: "ATTENDANCE",
      title: "Attendance recorded",
      description: `${record.course.name} • ${record.status}`,
      date: record.updatedAt,
    })),

    ...payments.map((payment) => ({
      id: payment.id,
      type: "PAYMENT",
      title: "Payment updated",
      description: `${payment.fee?.feeType || payment.feeType} • ${payment.status}`,
      date: payment.updatedAt,
    })),
  ];

  return activities
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);
}
