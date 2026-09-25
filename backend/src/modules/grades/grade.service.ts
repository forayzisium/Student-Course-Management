import { prisma } from "../../config/prisma";
import { realtimeEventBus } from "../events/event.bus";

type GradeInput = {
  assignment?: number;
  midterm?: number;
  final?: number;
};

function calculateTotal(data: GradeInput) {
  return (data.assignment ?? 0) + (data.midterm ?? 0) + (data.final ?? 0);
}

export async function createGrade(
  teacherId: number,
  data: {
    studentId: number;
    courseId: number;
    assignment?: number;
    midterm?: number;
    final?: number;
  },
) {
  const course = await prisma.course.findFirst({
    where: {
      id: data.courseId,
      teacherId,
      status: "ACTIVE",
    },
  });

  if (!course) {
    throw new Error("You can only enter grades for your own courses");
  }

  const student = await prisma.studentProfile.findUnique({
    where: {
      id: data.studentId,
    },
  });

  if (!student) {
    throw new Error("Student not found");
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      studentId_courseId: {
        studentId: data.studentId,
        courseId: data.courseId,
      },
    },
  });

  if (!enrollment || enrollment.status !== "ACTIVE") {
    throw new Error("Student is not enrolled in this course");
  }

  const existingGrade = await prisma.grade.findUnique({
    where: {
      studentId_courseId: {
        studentId: data.studentId,
        courseId: data.courseId,
      },
    },
  });

  if (existingGrade) {
    throw new Error("Grade already exists for this student and course");
  }

  const total = calculateTotal(data);

  const grade = await prisma.grade.create({
    data: {
      studentId: data.studentId,
      courseId: data.courseId,
      assignment: data.assignment,
      midterm: data.midterm,
      final: data.final,
      total,
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

  realtimeEventBus.emitToStudent(grade.studentId, "GRADE_UPDATED", {
    courseId: grade.courseId,
    gradeId: grade.id,
  });

  return grade;
}

export async function updateGrade(
  teacherId: number,
  gradeId: number,
  data: GradeInput,
) {
  const grade = await prisma.grade.findFirst({
    where: {
      id: gradeId,
      course: {
        teacherId,
      },
    },
  });

  if (!grade) {
    throw new Error("You can only update grades for your own courses");
  }

  const total = calculateTotal({
    assignment:
      data.assignment !== undefined
        ? data.assignment
        : (grade.assignment ?? undefined),
    midterm:
      data.midterm !== undefined ? data.midterm : (grade.midterm ?? undefined),
    final: data.final !== undefined ? data.final : (grade.final ?? undefined),
  });

  const updatedGrade = await prisma.grade.update({
    where: {
      id: gradeId,
    },
    data: {
      assignment: data.assignment,
      midterm: data.midterm,
      final: data.final,
      total,
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

  realtimeEventBus.emitToStudent(updatedGrade.studentId, "GRADE_UPDATED", {
    courseId: updatedGrade.courseId,
    gradeId: updatedGrade.id,
  });

  return updatedGrade;
}

export async function getStudentGrades(userId: number) {
  const student = await prisma.studentProfile.findUnique({
    where: {
      userId,
    },
  });

  if (!student) {
    throw new Error("Student profile not found");
  }

  return prisma.grade.findMany({
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
          credits: true,
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
      updatedAt: "desc",
    },
  });
}

export async function getTeacherCourseGrades(
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
    throw new Error("You can only view grades for your own courses");
  }

  return prisma.grade.findMany({
    where: {
      courseId,
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
      studentId: "asc",
    },
  });
}

export async function getAllGrades() {
  return prisma.grade.findMany({
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
      course: {
        select: {
          id: true,
          code: true,
          name: true,
          teacherId: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}

export async function deleteGrade(teacherId: number, gradeId: number) {
  const grade = await prisma.grade.findFirst({
    where: {
      id: gradeId,
      course: {
        teacherId,
      },
    },
  });

  if (!grade) {
    throw new Error("You can only delete grades for your own courses");
  }

  return prisma.grade.delete({
    where: {
      id: gradeId,
    },
  });
}
