import "dotenv/config";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";

type Db = mysql.Connection;

async function idFor(db: Db, sql: string, values: unknown[], label: string) {
  const [rows] = await db.query(sql, values);
  const id = (rows as { id: number }[])[0]?.id;
  if (!id) throw new Error(`${label} was not found after upsert`);
  return id;
}

async function upsertUser(
  db: Db,
  input: {
    name: string;
    username: string;
    email: string;
    passwordHash: string;
    role: "ADMIN" | "TEACHER" | "STUDENT";
  },
) {
  await db.query(
    `INSERT INTO users
      (name, username, email, password, role, status, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, 'ACTIVE', NOW(), NOW())
     ON DUPLICATE KEY UPDATE
      name = VALUES(name), password = VALUES(password), role = VALUES(role),
      status = 'ACTIVE', updatedAt = NOW()`,
    [input.name, input.username, input.email, input.passwordHash, input.role],
  );
  return idFor(
    db,
    "SELECT id FROM users WHERE email = ?",
    [input.email],
    input.email,
  );
}

async function main() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST!,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
    connectTimeout: 30000,
  });

  try {
    const adminPassword = "Admin@12345";
    const teacherPassword = "Teacher@12345";
    const studentPassword = "Student@12345";
    const [adminHash, teacherHash, studentHash] = await Promise.all([
      bcrypt.hash(adminPassword, 10),
      bcrypt.hash(teacherPassword, 10),
      bcrypt.hash(studentPassword, 10),
    ]);

    await upsertUser(db, {
      name: "Demo Administrator",
      username: "demo.admin",
      email: "demo.admin@scm.com",
      passwordHash: adminHash,
      role: "ADMIN",
    });

    const teachers = [
      {
        name: "Jane Smith",
        username: "demo.jane",
        email: "demo.jane@scm.com",
        department: "CSE",
        qualification: "MSc in Computer Science",
        experience: "6 years",
      },
      {
        name: "Michael Rahman",
        username: "demo.michael",
        email: "demo.michael@scm.com",
        department: "CSE",
        qualification: "MSc in Software Engineering",
        experience: "8 years",
      },
    ];
    const teacherIds: number[] = [];
    const teacherProfileIds: number[] = [];
    for (const teacher of teachers) {
      const userId = await upsertUser(db, {
        ...teacher,
        passwordHash: teacherHash,
        role: "TEACHER",
      });
      await db.query(
        `INSERT INTO teacher_profiles
          (userId, department, qualification, experience, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE department = VALUES(department),
          qualification = VALUES(qualification), experience = VALUES(experience), updatedAt = NOW()`,
        [userId, teacher.department, teacher.qualification, teacher.experience],
      );
      teacherIds.push(userId);
      teacherProfileIds.push(
        await idFor(
          db,
          "SELECT id FROM teacher_profiles WHERE userId = ?",
          [userId],
          teacher.email,
        ),
      );
    }

    const students = [
      {
        name: "John Doe",
        username: "demo.john",
        email: "demo.john@scm.com",
        studentId: "DEMO-STU001",
      },
      {
        name: "Sara Ahmed",
        username: "demo.sara",
        email: "demo.sara@scm.com",
        studentId: "DEMO-STU002",
      },
      {
        name: "Alex Morgan",
        username: "demo.alex",
        email: "demo.alex@scm.com",
        studentId: "DEMO-STU003",
      },
    ];
    const studentProfileIds: number[] = [];
    for (const student of students) {
      const userId = await upsertUser(db, {
        ...student,
        passwordHash: studentHash,
        role: "STUDENT",
      });
      await db.query(
        `INSERT INTO student_profiles
          (userId, studentId, department, year, createdAt, updatedAt,
           assignmentNotifications, feeNotifications, gradeNotifications,
           aiPlan, aiMessagesUsed, aiUsageResetAt)
         VALUES (?, ?, 'CSE', '3rd Year', NOW(), NOW(), 1, 1, 1, 'FREE', 0, NOW())
         ON DUPLICATE KEY UPDATE studentId = VALUES(studentId), department = 'CSE',
          year = '3rd Year', updatedAt = NOW()`,
        [userId, student.studentId],
      );
      studentProfileIds.push(
        await idFor(
          db,
          "SELECT id FROM student_profiles WHERE userId = ?",
          [userId],
          student.email,
        ),
      );
    }

    await db.query("UPDATE semesters SET isCurrent = 0, updatedAt = NOW()");
    await db.query(
      `INSERT INTO semesters
        (name, startDate, endDate, isCurrent, costPerCredit, createdAt, updatedAt)
       VALUES ('Demo Fall 2026', '2026-09-01', '2026-12-31', 1, 2400, NOW(), NOW())
       ON DUPLICATE KEY UPDATE startDate = VALUES(startDate), endDate = VALUES(endDate),
        isCurrent = 1, costPerCredit = 2400, updatedAt = NOW()`,
    );
    const semesterId = await idFor(
      db,
      "SELECT id FROM semesters WHERE name = 'Demo Fall 2026'",
      [],
      "Demo semester",
    );

    const courses = [
      {
        code: "DM101",
        name: "Data Structures Lab",
        credits: 3,
        teacher: 0,
        description: "Practical data structures and algorithm implementation.",
      },
      {
        code: "DM202",
        name: "Database Systems",
        credits: 4,
        teacher: 0,
        description:
          "Relational modeling, SQL, normalization, and transactions.",
      },
      {
        code: "DM303",
        name: "Web Application Engineering",
        credits: 3,
        teacher: 1,
        description: "Full-stack web application architecture and development.",
      },
    ];
    const courseIds: number[] = [];
    for (const course of courses) {
      await db.query(
        `INSERT INTO courses
          (code, name, description, credits, syllabus, department, semester,
           semesterId, status, teacherId, teacherProfileId, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, 'CSE', 'Demo Fall 2026', ?, 'ACTIVE', ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description),
          credits = VALUES(credits), semester = VALUES(semester), semesterId = VALUES(semesterId),
          status = 'ACTIVE', teacherId = VALUES(teacherId), teacherProfileId = VALUES(teacherProfileId),
          updatedAt = NOW()`,
        [
          course.code,
          course.name,
          course.description,
          course.credits,
          "1. Fundamentals\n2. Applied exercises\n3. Semester project",
          semesterId,
          teacherIds[course.teacher],
          teacherProfileIds[course.teacher],
        ],
      );
      courseIds.push(
        await idFor(
          db,
          "SELECT id FROM courses WHERE code = ?",
          [course.code],
          course.code,
        ),
      );
    }

    const enrollmentPlan = [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 0],
      [1, 1],
      [2, 1],
      [2, 2],
    ];
    const enrollmentIds = new Map<string, number>();
    for (const [studentIndex, courseIndex] of enrollmentPlan) {
      const studentId = studentProfileIds[studentIndex];
      const courseId = courseIds[courseIndex];
      await db.query(
        `INSERT INTO enrollments (studentId, courseId, status, enrolledAt)
         VALUES (?, ?, 'ACTIVE', '2026-09-05 09:00:00')
         ON DUPLICATE KEY UPDATE status = 'ACTIVE'`,
        [studentId, courseId],
      );
      const enrollmentId = await idFor(
        db,
        "SELECT id FROM enrollments WHERE studentId = ? AND courseId = ?",
        [studentId, courseId],
        "Enrollment",
      );
      enrollmentIds.set(`${studentIndex}-${courseIndex}`, enrollmentId);
      const amount = courses[courseIndex].credits * 2400;
      await db.query(
        `INSERT INTO fees
          (studentId, courseId, semesterId, enrollmentId, amount, dueDate, status, feeType, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, '2026-10-15', 'UNPAID', ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE amount = VALUES(amount), dueDate = VALUES(dueDate),
          feeType = VALUES(feeType), courseId = VALUES(courseId), semesterId = VALUES(semesterId), updatedAt = NOW()`,
        [
          studentId,
          courseId,
          semesterId,
          enrollmentId,
          amount,
          `${courses[courseIndex].code} Tuition (${courses[courseIndex].credits} credits)`,
        ],
      );
    }

    const assignmentIds: number[] = [];
    for (let index = 0; index < courses.length; index += 1) {
      const title = `${courses[index].code} Demo Project`;
      const [existing] = await db.query(
        "SELECT id FROM assignments WHERE courseId = ? AND title = ? LIMIT 1",
        [courseIds[index], title],
      );
      let assignmentId = (existing as { id: number }[])[0]?.id;
      if (!assignmentId) {
        const [result] = await db.query(
          `INSERT INTO assignments
            (courseId, title, description, dueDate, maxMarks, status, createdAt, updatedAt)
           VALUES (?, ?, 'Complete and submit the semester project.', '2026-11-15', 20, 'ACTIVE', NOW(), NOW())`,
          [courseIds[index], title],
        );
        assignmentId = (result as mysql.ResultSetHeader).insertId;
      }
      assignmentIds.push(assignmentId);
    }

    const grades = [
      [0, 0, 18, 26, 45],
      [0, 1, 17, 25, 42],
      [0, 2, 19, 27, 46],
      [1, 0, 16, 23, 40],
      [1, 1, 18, 26, 44],
      [2, 1, 15, 22, 38],
      [2, 2, 17, 24, 43],
    ];
    for (const [
      studentIndex,
      courseIndex,
      assignment,
      midterm,
      final,
    ] of grades) {
      const studentId = studentProfileIds[studentIndex];
      const courseId = courseIds[courseIndex];
      await db.query(
        `INSERT INTO grades
          (studentId, courseId, assignment, midterm, final, total, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE assignment = VALUES(assignment), midterm = VALUES(midterm),
          final = VALUES(final), total = VALUES(total), updatedAt = NOW()`,
        [
          studentId,
          courseId,
          assignment,
          midterm,
          final,
          assignment + midterm + final,
        ],
      );
      await db.query(
        `INSERT INTO submissions
          (assignmentId, studentId, submittedAt, status, marks, feedback, createdAt, updatedAt)
         VALUES (?, ?, '2026-09-16 10:00:00', 'GRADED', ?, 'Good work. Demo submission reviewed.', NOW(), NOW())
         ON DUPLICATE KEY UPDATE status = 'GRADED', marks = VALUES(marks),
          feedback = VALUES(feedback), updatedAt = NOW()`,
        [assignmentIds[courseIndex], studentId, assignment],
      );
      const attendanceStates = [
        "PRESENT",
        "PRESENT",
        studentIndex === 2 ? "ABSENT" : "LATE",
      ];
      const dates = ["2026-09-10", "2026-09-12", "2026-09-15"];
      for (let dateIndex = 0; dateIndex < dates.length; dateIndex += 1) {
        await db.query(
          `INSERT INTO attendance
            (studentId, courseId, date, status, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, NOW(), NOW())
           ON DUPLICATE KEY UPDATE status = VALUES(status), updatedAt = NOW()`,
          [studentId, courseId, dates[dateIndex], attendanceStates[dateIndex]],
        );
      }
    }

    const paymentPlan = [
      {
        student: 0,
        course: 0,
        amount: 7200,
        status: "PAID",
        reference: "DEMO-JOHN-PAID-01",
      },
      {
        student: 0,
        course: 1,
        amount: 4000,
        status: "PAID",
        reference: "DEMO-JOHN-PARTIAL-01",
      },
      {
        student: 0,
        course: 2,
        amount: 2000,
        status: "PENDING",
        reference: "DEMO-JOHN-PENDING-01",
      },
      {
        student: 1,
        course: 0,
        amount: 7200,
        status: "PAID",
        reference: "DEMO-SARA-PAID-01",
      },
      {
        student: 2,
        course: 1,
        amount: 3000,
        status: "PAID",
        reference: "DEMO-ALEX-PARTIAL-01",
      },
    ];
    for (const payment of paymentPlan) {
      const enrollmentId = enrollmentIds.get(
        `${payment.student}-${payment.course}`,
      )!;
      const feeId = await idFor(
        db,
        "SELECT id FROM fees WHERE enrollmentId = ?",
        [enrollmentId],
        "Enrollment fee",
      );
      const feeType = `${courses[payment.course].code} Tuition (${courses[payment.course].credits} credits)`;
      await db.query(
        `INSERT INTO payments
          (studentId, feeId, feeType, amount, method, transactionId, channel,
           paymentDate, status, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, 'MOBILE_BANKING', ?, 'bKash', '2026-09-18 14:00:00', ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE feeId = VALUES(feeId), amount = VALUES(amount),
          status = VALUES(status), updatedAt = NOW()`,
        [
          studentProfileIds[payment.student],
          feeId,
          feeType,
          payment.amount,
          payment.reference,
          payment.status,
        ],
      );
    }

    await db.query(
      `UPDATE fees f
       LEFT JOIN (
         SELECT feeId, SUM(amount) paid
         FROM payments WHERE status = 'PAID' AND feeId IS NOT NULL GROUP BY feeId
       ) p ON p.feeId = f.id
       SET f.status = CASE
         WHEN COALESCE(p.paid, 0) >= f.amount THEN 'PAID'
         WHEN COALESCE(p.paid, 0) > 0 THEN 'PARTIAL'
         WHEN f.dueDate < NOW() THEN 'OVERDUE'
         ELSE 'UNPAID'
       END,
       f.updatedAt = NOW()
       WHERE f.semesterId = ?`,
      [semesterId],
    );

    console.log("Demo academic and payment data is ready.");
    console.table([
      { role: "ADMIN", email: "demo.admin@scm.com", password: adminPassword },
      {
        role: "TEACHER",
        email: "demo.jane@scm.com",
        password: teacherPassword,
      },
      {
        role: "TEACHER",
        email: "demo.michael@scm.com",
        password: teacherPassword,
      },
      {
        role: "STUDENT",
        email: "demo.john@scm.com",
        password: studentPassword,
      },
      {
        role: "STUDENT",
        email: "demo.sara@scm.com",
        password: studentPassword,
      },
      {
        role: "STUDENT",
        email: "demo.alex@scm.com",
        password: studentPassword,
      },
    ]);
  } finally {
    await db.end();
  }
}

main().catch((error) => {
  console.error("Demo seed failed:", error);
  process.exit(1);
});
