import { prisma } from "../../config/prisma";

export async function getTeacherAssignmentSubmissions(
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
    select: {
      id: true,
      title: true,
      description: true,
      dueDate: true,
      maxMarks: true,
      course: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    },
  });

  if (!assignment) {
    throw new Error("Assignment not found or access denied");
  }

  const submissions = await prisma.submission.findMany({
    where: {
      assignmentId,
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
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      submittedAt: "desc",
    },
  });

  return {
    assignment,
    submissions,
  };
}

export async function gradeSubmission(
  teacherId: number,
  submissionId: number,
  marks: number,
  feedback?: string,
) {
  const submission = await prisma.submission.findFirst({
    where: {
      id: submissionId,
      assignment: {
        course: {
          teacherId,
        },
      },
    },
    select: {
      id: true,
      assignmentId: true,
      assignment: {
        select: {
          courseId: true,
          maxMarks: true,
        },
      },
      studentId: true,
    },
  });

  if (!submission) {
    throw new Error("Submission not found or access denied");
  }

  if (
    typeof marks !== "number" ||
    !Number.isFinite(marks) ||
    marks < 0 ||
    marks > submission.assignment.maxMarks
  ) {
    throw new Error(
      `Marks must be between 0 and ${submission.assignment.maxMarks}`,
    );
  }

  return prisma.$transaction(async (tx) => {
    const updatedSubmission = await tx.submission.update({
      where: { id: submissionId },
      data: {
        marks,
        feedback: feedback?.trim() || null,
        status: "GRADED",
      },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    const gradedSubmissions = await tx.submission.findMany({
      where: {
        studentId: submission.studentId,
        status: "GRADED",
        marks: { not: null },
        assignment: {
          courseId: submission.assignment.courseId,
          status: "ACTIVE",
        },
      },
      select: {
        marks: true,
        assignment: { select: { maxMarks: true } },
      },
    });

    const earnedMarks = gradedSubmissions.reduce(
      (sum, item) => sum + (item.marks ?? 0),
      0,
    );
    const possibleMarks = gradedSubmissions.reduce(
      (sum, item) => sum + item.assignment.maxMarks,
      0,
    );
    // The Grade.assignment component is worth 20 points in the current model.
    const assignmentComponent =
      possibleMarks > 0
        ? Number(((earnedMarks / possibleMarks) * 20).toFixed(2))
        : 0;

    const existingGrade = await tx.grade.findUnique({
      where: {
        studentId_courseId: {
          studentId: submission.studentId,
          courseId: submission.assignment.courseId,
        },
      },
    });
    const total =
      assignmentComponent +
      (existingGrade?.midterm ?? 0) +
      (existingGrade?.final ?? 0);

    await tx.grade.upsert({
      where: {
        studentId_courseId: {
          studentId: submission.studentId,
          courseId: submission.assignment.courseId,
        },
      },
      create: {
        studentId: submission.studentId,
        courseId: submission.assignment.courseId,
        assignment: assignmentComponent,
        total,
      },
      update: { assignment: assignmentComponent, total },
    });

    return updatedSubmission;
  });
}

export async function getStudentAssignmentSubmission(
  userId: number,
  assignmentId: number,
) {
  const student = await prisma.studentProfile.findUnique({
    where: {
      userId,
    },
  });

  if (!student) {
    throw new Error("Student profile not found");
  }

  const assignment = await prisma.assignment.findUnique({
    where: {
      id: assignmentId,
    },
    select: {
      id: true,
      title: true,
      description: true,
      dueDate: true,
      course: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    },
  });

  if (!assignment) {
    throw new Error("Assignment not found");
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      studentId: student.id,
      courseId: assignment.course.id,
      status: "ACTIVE",
    },
  });

  if (!enrollment) {
    throw new Error("You are not enrolled in this course");
  }

  const submission = await prisma.submission.findUnique({
    where: {
      assignmentId_studentId: {
        assignmentId,
        studentId: student.id,
      },
    },
  });

  return {
    id: assignment.id,
    title: assignment.title,
    description: assignment.description,
    dueDate: assignment.dueDate,
    course: assignment.course,
    submissions: submission ? [submission] : [],
  };
}

export async function submitStudentAssignment(
  userId: number,
  assignmentId: number,
  fileName: string,
  fileUrl: string,
) {
  const student = await prisma.studentProfile.findUnique({
    where: {
      userId,
    },
  });

  if (!student) {
    throw new Error("Student profile not found");
  }

  const assignment = await prisma.assignment.findUnique({
    where: {
      id: assignmentId,
    },
    select: {
      id: true,
      dueDate: true,
      courseId: true,
    },
  });

  if (!assignment) {
    throw new Error("Assignment not found");
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      studentId: student.id,
      courseId: assignment.courseId,
      status: "ACTIVE",
    },
  });

  if (!enrollment) {
    throw new Error("You are not enrolled in this course");
  }

  const existingSubmission = await prisma.submission.findUnique({
    where: {
      assignmentId_studentId: {
        assignmentId,
        studentId: student.id,
      },
    },
  });

  if (existingSubmission?.status === "GRADED") {
    throw new Error("This assignment has already been graded");
  }

  const submission = existingSubmission
    ? await prisma.submission.update({
        where: {
          id: existingSubmission.id,
        },
        data: {
          fileName,
          fileUrl,
          submittedAt: new Date(),
          status: "SUBMITTED",
          marks: null,
          feedback: null,
        },
      })
    : await prisma.submission.create({
        data: {
          assignmentId,
          studentId: student.id,
          fileName,
          fileUrl,
          status: "SUBMITTED",
        },
      });

  return submission;
}
