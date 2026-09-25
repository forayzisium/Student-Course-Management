import { getStudentFees } from "../modules/fees/fee.service";
import { prisma } from "../config/prisma";

function getGrade(marks: number) {
  if (marks >= 80) return "A+";
  if (marks >= 75) return "A";
  if (marks >= 70) return "A-";
  if (marks >= 65) return "B+";
  if (marks >= 60) return "B";
  if (marks >= 55) return "B-";
  if (marks >= 50) return "C+";
  if (marks >= 45) return "C";
  if (marks >= 40) return "D";
  return "F";
}

function getGradePoint(grade: string) {
  switch (grade) {
    case "A+":
      return 4.0;
    case "A":
      return 3.75;
    case "A-":
      return 3.5;
    case "B+":
      return 3.25;
    case "B":
      return 3.0;
    case "B-":
      return 2.75;
    case "C+":
      return 2.5;
    case "C":
      return 2.25;
    case "D":
      return 2.0;
    default:
      return 0;
  }
}

export async function getStudentAIContext(userId: number) {
  const student = await prisma.studentProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },

      enrollments: {
        where: {
          status: "ACTIVE",
        },
        include: {
          course: {
            select: {
              id: true,
              credits: true,
              code: true,
              name: true,
              semester: true,
              teacher: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },

      grades: {
        include: {
          course: {
            select: {
              credits: true,
              code: true,
              name: true,
            },
          },
        },
      },

      attendance: {
        include: {
          course: {
            select: {
              credits: true,
              code: true,
              name: true,
            },
          },
        },
      },

      submissions: {
        include: {
          assignment: {
            select: {
              id: true,
            },
          },
        },
      },

      fees: {
        select: {
          feeType: true,
          amount: true,
          dueDate: true,
          status: true,
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


  const assignments = await prisma.assignment.findMany({
    where: {
      courseId: {
        in: courseIds,
      },
      status: "ACTIVE",
    },
    include: {
      course: {
        select: {
          code: true,
          name: true,
        },
      },
    },
    orderBy: {
      dueDate: "asc",
    },
  });

  const now = new Date();

  const assignmentInsights = assignments.map((assignment) => {
    const submission = student.submissions.find(
      (item) => item.assignmentId === assignment.id,
    );

    const dueDate = new Date(assignment.dueDate);

    const daysUntilDue = Math.ceil(
      (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      id: assignment.id,
      course: `${assignment.course.code} - ${assignment.course.name}`,
      title: assignment.title,
      dueDate: assignment.dueDate,
      daysUntilDue,
      submissionStatus: submission?.status || "NOT_SUBMITTED",
      marks: submission?.marks ?? null,
      feedback: submission?.feedback ?? null,
    };
  });


  const upcomingAssignments = assignmentInsights
    .filter(
      (assignment) =>
        assignment.submissionStatus !== "GRADED" &&
        assignment.daysUntilDue >= 0 &&
        assignment.daysUntilDue <= 7,
    )
    .slice(0, 10)
    .map((assignment) => ({
      course: assignment.course,
      title: assignment.title,
      dueDate: assignment.dueDate,
      daysUntilDue: assignment.daysUntilDue,
      submissionStatus: assignment.submissionStatus,
    }));


  const pendingAssignments = assignmentInsights
    .filter((assignment) => assignment.submissionStatus === "NOT_SUBMITTED")
    .slice(0, 10)
    .map((assignment) => ({
      course: assignment.course,
      title: assignment.title,
      dueDate: assignment.dueDate,
      daysUntilDue: assignment.daysUntilDue,
    }));


  const attendanceByCourse = new Map<
    number,
    {
      course: string;
      total: number;
      present: number;
      absent: number;
      late: number;
    }
  >();

  for (const record of student.attendance) {
    const courseName = `${record.course.code} - ${record.course.name}`;

    const existing = attendanceByCourse.get(record.courseId);

    if (existing) {
      existing.total += 1;

      if (record.status === "PRESENT") {
        existing.present += 1;
      }

      if (record.status === "ABSENT") {
        existing.absent += 1;
      }

      if (record.status === "LATE") {
        existing.late += 1;
      }
    } else {
      attendanceByCourse.set(record.courseId, {
        course: courseName,
        total: 1,
        present: record.status === "PRESENT" ? 1 : 0,
        absent: record.status === "ABSENT" ? 1 : 0,
        late: record.status === "LATE" ? 1 : 0,
      });
    }
  }

  const attendanceSummary = Array.from(attendanceByCourse.values()).map(
    (course) => {
      const percentage =
        course.total > 0
          ? Math.round(((course.present + course.late) / course.total) * 100)
          : 0;

      return {
        course: course.course,
        attendancePercentage: percentage,
        totalClasses: course.total,
        present: course.present,
        absent: course.absent,
        late: course.late,
      };
    },
  );


  const totalClasses = student.attendance.length;

  const totalPresent = student.attendance.filter(
    (record) => record.status === "PRESENT" || record.status === "LATE",
  ).length;

  const overallAttendance =
    totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;


  const gradeSummary = student.grades.map((grade) => {
    const total = grade.total ?? 0;
    const letterGrade = getGrade(total);
    const gradePoint = getGradePoint(letterGrade);

    return {
      course: `${grade.course.code} - ${grade.course.name}`,
      assignment: grade.assignment,
      midterm: grade.midterm,
      final: grade.final,
      total,
      grade: letterGrade,
      gradePoint,
      credits: grade.course.credits,
    };
  });


  const gradesWithValues = student.grades.filter(
    (grade) => typeof grade.total === "number",
  );

  const overallAverage =
    gradesWithValues.length > 0
      ? Number(
          (
            gradesWithValues.reduce((sum, grade) => sum + grade.total, 0) /
            gradesWithValues.length
          ).toFixed(2),
        )
      : 0;


  const totalGradePoints = gradeSummary.reduce(
    (sum, grade) => sum + grade.gradePoint * grade.credits,
    0,
  );

  const totalCredits = gradeSummary.reduce(
    (sum, grade) => sum + grade.credits,
    0,
  );
  const gpa =
    totalCredits > 0 ? Number((totalGradePoints / totalCredits).toFixed(2)) : 0;


  const strongestSubject =
    gradeSummary.length > 0
      ? gradeSummary.reduce((best, current) =>
          current.total > best.total ? current : best,
        )
      : null;


  const weakestSubject =
    gradeSummary.length > 0
      ? gradeSummary.reduce((worst, current) =>
          current.total < worst.total ? current : worst,
        )
      : null;


  const attendanceWarnings = attendanceSummary
    .filter((course) => course.attendancePercentage < 75)
    .map((course) => ({
      course: course.course,
      attendancePercentage: course.attendancePercentage,
    }));


  const fees = await getStudentFees(userId);
  const unpaidFees = fees
    .filter(
      (fee) =>
        fee.status === "UNPAID" ||
        fee.status === "PARTIAL" ||
        fee.status === "OVERDUE",
    )
    .map((fee) => ({
      type: fee.feeType,
      amount: fee.outstandingAmount,
      dueDate: fee.dueDate,
      status: fee.status,
    }));


  const academicPriorities: string[] = [];

  if (weakestSubject && weakestSubject.total < 75) {
    academicPriorities.push(
      `Focus on ${weakestSubject.course} because the current total is ${weakestSubject.total} (${weakestSubject.grade}).`,
    );
  }

  for (const course of attendanceWarnings) {
    academicPriorities.push(
      `Improve attendance in ${course.course}; current attendance is ${course.attendancePercentage}%.`,
    );
  }

  if (upcomingAssignments.length > 0) {
    academicPriorities.push(
      "Complete upcoming assignments before their due dates.",
    );
  }

  if (overallAverage > 0 && overallAverage < 75) {
    academicPriorities.push(
      `Improve overall academic performance; current average is ${overallAverage}%.`,
    );
  }

  if (gpa > 0 && gpa < 3.0) {
    academicPriorities.push(`Work on improving GPA; current GPA is ${gpa}.`);
  }

  if (academicPriorities.length === 0) {
    academicPriorities.push(
      "Maintain current academic performance and continue consistent study habits.",
    );
  }


  return {
    student: {
      name: student.user.name,
      studentId: student.studentId,
      department: student.department,
      year: student.year,
    },

    courses: student.enrollments.map((enrollment) => ({
      code: enrollment.course.code,
      name: enrollment.course.name,
      semester: enrollment.course.semester,
      teacher: enrollment.course.teacher.name,
    })),

    academicInsights: {
      overallAverage,

      gpa,

      totalGradePoints,

      strongestSubject: strongestSubject
        ? {
            course: strongestSubject.course,
            total: strongestSubject.total,
            grade: strongestSubject.grade,
            gradePoint: strongestSubject.gradePoint,
          }
        : null,

      weakestSubject: weakestSubject
        ? {
            course: weakestSubject.course,
            total: weakestSubject.total,
            grade: weakestSubject.grade,
            gradePoint: weakestSubject.gradePoint,
          }
        : null,

      attendance: {
        overall: overallAttendance,
        byCourse: attendanceSummary,
        warnings: attendanceWarnings,
      },

      grades: gradeSummary,

      assignments: {
        upcoming: upcomingAssignments,
        pending: pendingAssignments,
      },

      fees: {
        unpaid: unpaidFees,
      },

      academicPriorities,
    },
  };
}
