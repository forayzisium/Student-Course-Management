import { prisma } from "../../config/prisma";
import { publishTeacherActivity } from "../activities/activity.service";

async function requireStudentProfile(userId: number) {
  const student = await prisma.studentProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!student) {
    throw new Error("Student profile not found");
  }

  return student;
}

export async function getStudentAssignment(
  userId: number,
  assignmentId: number,
) {
  const student = await requireStudentProfile(userId);
  const assignment = await prisma.assignment.findFirst({
    where: {
      id: assignmentId,
      course: {
        enrollments: {
          some: {
            studentId: student.id,
          },
        },
      },
      status: "ACTIVE",
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
          submittedAt: true,
          status: true,
          marks: true,
          feedback: true,
          fileName: true,
          fileUrl: true,
        },
      },
    },
  });

  if (!assignment) {
    throw new Error(
      "Assignment not found or you are not enrolled in this course",
    );
  }

  return assignment;
}

export async function submitAssignment(
  userId: number,
  assignmentId: number,
  file?: Express.Multer.File,
) {
  const student = await requireStudentProfile(userId);
  const assignment = await prisma.assignment.findFirst({
    where: {
      id: assignmentId,
      course: {
        enrollments: {
          some: {
            studentId: student.id,
          },
        },
      },
      status: "ACTIVE",
    },
    select: {
      id: true,
      title: true,
      dueDate: true,
      course: {
        select: {
          code: true,
          teacherId: true,
        },
      },
    },
  });

  if (!assignment) {
    throw new Error(
      "Assignment not found or you are not enrolled in this course",
    );
  }

  if (new Date() > assignment.dueDate) {
    throw new Error("The assignment deadline has passed");
  }

  const existingSubmission = await prisma.submission.findUnique({
    where: {
      assignmentId_studentId: {
        assignmentId,
        studentId: student.id,
      },
    },
  });

  if (existingSubmission) {
    throw new Error("You have already submitted this assignment");
  }

  if (!file) {
    throw new Error("Please upload an assignment file");
  }

  const submission = await prisma.submission.create({
    data: {
      assignmentId,
      studentId: student.id,
      status: "SUBMITTED",
      fileName: file.originalname,
      // Keep the disk path here because the teacher download endpoint
      // resolves this value on the server.
      fileUrl: file.path,
    },
    select: {
      id: true,
      assignmentId: true,
      studentId: true,
      submittedAt: true,
      status: true,
      marks: true,
      feedback: true,
      fileName: true,
      fileUrl: true,
    },
  });

  publishTeacherActivity(assignment.course.teacherId, {
    id: `submission-${submission.id}-${submission.submittedAt.toISOString()}`,
    type: "SUBMISSION_CREATED",
    title: "Assignment submitted",
    description: `${student.user.name} submitted “${assignment.title}”.`,
    courseCode: assignment.course.code,
    priority: "MEDIUM",
    createdAt: submission.submittedAt,
  });

  return submission;
}

export async function getMySubmissions(userId: number) {
  const student = await requireStudentProfile(userId);
  return prisma.submission.findMany({
    where: {
      studentId: student.id,
    },
    select: {
      id: true,
      assignmentId: true,
      studentId: true,
      submittedAt: true,
      status: true,
      marks: true,
      feedback: true,
      fileName: true,
      fileUrl: true,
      assignment: {
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
      },
    },
    orderBy: {
      submittedAt: "desc",
    },
  });
}
