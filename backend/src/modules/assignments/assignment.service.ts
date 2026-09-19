import { prisma } from "../../config/prisma";

function validateMaxMarks(maxMarks: number | undefined) {
  if (
    maxMarks !== undefined &&
    (!Number.isFinite(maxMarks) || maxMarks <= 0 || maxMarks > 1000)
  ) {
    throw new Error("Maximum marks must be greater than 0 and at most 1000");
  }
}

export async function getAssignments() {
  return prisma.assignment.findMany({
    include: {
      course: {
        select: {
          id: true,
          code: true,
          name: true,
          teacherId: true,
          teacher: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              enrollments: {
                where: { status: "ACTIVE" },
              },
            },
          },
        },
      },
      _count: {
        select: {
          submissions: true,
        },
      },
    },
    orderBy: {
      dueDate: "asc",
    },
  });
}

export async function getAssignmentById(id: number) {
  return prisma.assignment.findUnique({
    where: { id },
    include: {
      course: {
        select: {
          id: true,
          code: true,
          name: true,
          teacherId: true,
        },
      },
    },
  });
}

export async function createAssignment(data: {
  courseId: number;
  title: string;
  description: string;
  dueDate: Date;
  maxMarks?: number;
}) {
  validateMaxMarks(data.maxMarks);
  const course = await prisma.course.findFirst({
    where: {
      id: data.courseId,
      status: "ACTIVE",
    },
  });

  if (!course) {
    throw new Error("Active course not found");
  }

  return prisma.assignment.create({
    data: {
      courseId: data.courseId,
      title: data.title,
      description: data.description,
      dueDate: data.dueDate,
      maxMarks: data.maxMarks ?? 20,
    },
    include: {
      course: {
        select: {
          id: true,
          code: true,
          name: true,
          teacherId: true,
        },
      },
    },
  });
}

export async function updateAssignment(
  id: number,
  data: {
    courseId?: number;
    title?: string;
    description?: string;
    dueDate?: Date;
    maxMarks?: number;
    status?: "ACTIVE" | "INACTIVE";
  },
) {
  validateMaxMarks(data.maxMarks);
  if (data.courseId !== undefined) {
    const course = await prisma.course.findFirst({
      where: {
        id: data.courseId,
        status: "ACTIVE",
      },
    });

    if (!course) {
      throw new Error("Active course not found");
    }
  }

  return prisma.assignment.update({
    where: { id },
    data,
    include: {
      course: {
        select: {
          id: true,
          code: true,
          name: true,
          teacherId: true,
        },
      },
    },
  });
}

export async function deleteAssignment(id: number) {
  return prisma.assignment.delete({
    where: { id },
  });
}

export async function getTeacherAssignments(userId: number) {
  const assignments = await prisma.assignment.findMany({
    where: {
      course: {
        teacherId: userId,
      },
    },
    include: {
      course: {
        select: {
          id: true,
          code: true,
          name: true,
          teacherId: true,
          _count: {
            select: {
              enrollments: { where: { status: "ACTIVE" } },
            },
          },
        },
      },
      submissions: {
        select: { status: true },
      },
    },
    orderBy: {
      dueDate: "asc",
    },
  });

  return assignments.map((assignment) => {
    const totalStudents = assignment.course._count.enrollments;
    const submissionCount = assignment.submissions.length;
    const pendingGrading = assignment.submissions.filter(
      (submission) => submission.status === "SUBMITTED",
    ).length;
    const gradedSubmissions = assignment.submissions.filter(
      (submission) => submission.status === "GRADED",
    ).length;

    return {
      ...assignment,
      submissionCount,
      totalStudents,
      pendingSubmissions: Math.max(totalStudents - submissionCount, 0),
      pendingGrading,
      gradedSubmissions,
      submissions: undefined,
    };
  });
}

export async function getStudentAssignments(userId: number) {
  const student = await prisma.studentProfile.findUnique({
    where: { userId },
    include: {
      enrollments: {
        where: {
          status: "ACTIVE",
        },
        select: {
          courseId: true,
        },
      },
    },
  });

  if (!student) {
    throw new Error("Student profile not found");
  }

  const courseIds = student.enrollments.map(
    (enrollment) => enrollment.courseId,
  );

  return prisma.assignment.findMany({
    where: {
      courseId: {
        in: courseIds,
      },
      status: "ACTIVE",
    },
    include: {
      course: {
        select: {
          id: true,
          code: true,
          name: true,
          teacher: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },

      submissions: {
        where: {
          studentId: student.id,
        },
        select: {
          id: true,
          status: true,
          submittedAt: true,
          marks: true,
          feedback: true,
          fileName: true,
          fileUrl: true,
        },
      },
    },
    orderBy: {
      dueDate: "asc",
    },
  });
}

export async function createTeacherAssignment(
  teacherId: number,
  data: {
    courseId: number;
    title: string;
    description: string;
    dueDate: Date;
    maxMarks?: number;
  },
) {
  validateMaxMarks(data.maxMarks);
  const course = await prisma.course.findFirst({
    where: {
      id: data.courseId,
      teacherId,
      status: "ACTIVE",
    },
  });

  if (!course) {
    throw new Error("You can only create assignments for your own courses");
  }

  return prisma.assignment.create({
    data: {
      courseId: data.courseId,
      title: data.title,
      description: data.description,
      dueDate: data.dueDate,
      maxMarks: data.maxMarks ?? 20,
    },
    include: {
      course: {
        select: {
          id: true,
          code: true,
          name: true,
          teacherId: true,
        },
      },
    },
  });
}

export async function updateTeacherAssignment(
  teacherId: number,
  assignmentId: number,
  data: {
    title?: string;
    description?: string;
    dueDate?: Date;
    maxMarks?: number;
    status?: "ACTIVE" | "INACTIVE";
  },
) {
  validateMaxMarks(data.maxMarks);
  const assignment = await prisma.assignment.findFirst({
    where: {
      id: assignmentId,
      course: {
        teacherId,
      },
    },
  });

  if (!assignment) {
    throw new Error("You can only update assignments for your own courses");
  }

  return prisma.assignment.update({
    where: {
      id: assignmentId,
    },
    data,
    include: {
      course: {
        select: {
          id: true,
          code: true,
          name: true,
          teacherId: true,
        },
      },
    },
  });
}

export async function deleteTeacherAssignment(
  teacherId: number,
  assignmentId: number,
) {
  const assignment = await prisma.assignment.findFirst({
    where: {
      id: assignmentId,
      course: {
        teacherId,
      },
    },
  });

  if (!assignment) {
    throw new Error("You can only delete assignments for your own courses");
  }

  return prisma.assignment.delete({
    where: {
      id: assignmentId,
    },
  });
}
