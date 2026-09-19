import "dotenv/config";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST!,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
    connectTimeout: 30000,
  });

  console.log("Connected to database!");

  const semesters = [
    ["Spring 2024", "2024-01-01", "2024-05-31", false],
    ["Fall 2024", "2024-08-01", "2024-12-31", true],
    ["Spring 2025", "2025-01-01", "2025-05-31", false],
  ] as const;

  for (const [name, startDate, endDate, isCurrent] of semesters) {
    await connection.query(
      "INSERT INTO semesters (name, startDate, endDate, isCurrent, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW()) ON DUPLICATE KEY UPDATE startDate = VALUES(startDate), endDate = VALUES(endDate), updatedAt = NOW()",
      [name, startDate, endDate, isCurrent],
    );
  }
  await connection.query(
    "UPDATE semesters SET isCurrent = (name = 'Fall 2024'), updatedAt = NOW()",
  );
  console.log("Semesters ready");

  const hashedAdminPassword = await bcrypt.hash("admin123", 10);
  const hashedStudentPassword = await bcrypt.hash("student123", 10);
  const hashedTeacherPassword = await bcrypt.hash("teacher123", 10);

  await connection.query(
    "INSERT INTO users (name, username, email, password, role, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW()) ON DUPLICATE KEY UPDATE name = VALUES(name), password = VALUES(password), status = VALUES(status)",
    [
      "SCM Administrator",
      "admin",
      "admin@scm.com",
      hashedAdminPassword,
      "ADMIN",
      "ACTIVE",
    ],
  );
  console.log("Admin account ready:", {
    email: "admin@scm.com",
    password: "admin123",
  });

  const [studentResult]: any = await connection.query(
    "INSERT INTO users (name, username, email, password, role, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW()) ON DUPLICATE KEY UPDATE name = VALUES(name), password = VALUES(password), status = VALUES(status)",
    [
      "John Doe",
      "johndoe",
      "john@scm.com",
      hashedStudentPassword,
      "STUDENT",
      "ACTIVE",
    ],
  );

  const studentId =
    studentResult.insertId ||
    (
      await connection.query(
        "SELECT id FROM users WHERE email = 'john@scm.com'",
      )
    )[0][0].id;

  await connection.query(
    "INSERT INTO student_profiles (userId, studentId, department, year, createdAt, updatedAt, assignmentNotifications, feeNotifications, gradeNotifications, aiPlan, aiMessagesUsed, aiUsageResetAt) VALUES (?, ?, ?, ?, NOW(), NOW(), ?, ?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE department = VALUES(department), year = VALUES(year)",
    [studentId, "STU001", "CSE", "3rd Year", true, true, true, "FREE", 0],
  );
  console.log("Student account ready:", {
    email: "john@scm.com",
    password: "student123",
  });

  const [teacherResult]: any = await connection.query(
    "INSERT INTO users (name, username, email, password, role, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW()) ON DUPLICATE KEY UPDATE name = VALUES(name), password = VALUES(password), status = VALUES(status)",
    [
      "Jane Smith",
      "janesmith",
      "jane@scm.com",
      hashedTeacherPassword,
      "TEACHER",
      "ACTIVE",
    ],
  );

  const teacherUserId =
    teacherResult.insertId ||
    (
      await connection.query(
        "SELECT id FROM users WHERE email = 'jane@scm.com'",
      )
    )[0][0].id;

  await connection.query(
    "INSERT INTO teacher_profiles (userId, department, qualification, experience, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW()) ON DUPLICATE KEY UPDATE department = VALUES(department)",
    [teacherUserId, "CSE", "MSc in Computer Science", "5 years"],
  );
  console.log("Teacher account ready:", {
    email: "jane@scm.com",
    password: "teacher123",
  });

  await connection.end();
  console.log("Seed completed successfully!");
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
