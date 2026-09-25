import "dotenv/config";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";

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
    const [counts] = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE email LIKE 'demo.%@scm.com') users,
        (SELECT COUNT(*) FROM courses WHERE code IN ('DM101','DM202','DM303')) courses,
        (SELECT COUNT(*) FROM enrollments e JOIN courses c ON c.id=e.courseId WHERE c.code IN ('DM101','DM202','DM303') AND e.status='ACTIVE') enrollments,
        (SELECT COUNT(*) FROM grades g JOIN courses c ON c.id=g.courseId WHERE c.code IN ('DM101','DM202','DM303')) grades,
        (SELECT COUNT(*) FROM attendance a JOIN courses c ON c.id=a.courseId WHERE c.code IN ('DM101','DM202','DM303')) attendance,
        (SELECT COUNT(*) FROM fees f JOIN courses c ON c.id=f.courseId WHERE c.code IN ('DM101','DM202','DM303')) fees,
        (SELECT COUNT(*) FROM payments WHERE transactionId LIKE 'DEMO-%') payments
    `);
    const result = (counts as Record<string, number>[])[0];
    assert.deepEqual(
      Object.fromEntries(
        Object.entries(result).map(([key, value]) => [key, Number(value)]),
      ),
      {
        users: 6,
        courses: 3,
        enrollments: 7,
        grades: 7,
        attendance: 21,
        fees: 7,
        payments: 5,
      },
    );

    const [accounts] = await db.query(`
      SELECT u.email,
        SUM(f.amount) charges,
        COALESCE(SUM((SELECT SUM(p.amount) FROM payments p WHERE p.feeId=f.id AND p.status='PAID')), 0) paid,
        COALESCE(SUM((SELECT SUM(p.amount) FROM payments p WHERE p.feeId=f.id AND p.status='PENDING')), 0) pending
      FROM fees f
      JOIN student_profiles sp ON sp.id=f.studentId
      JOIN users u ON u.id=sp.userId
      JOIN courses c ON c.id=f.courseId
      WHERE c.code IN ('DM101','DM202','DM303')
      GROUP BY u.email ORDER BY u.email
    `);

    const normalized = (accounts as Record<string, string | number>[]).map(
      (row) => ({
        email: String(row.email),
        charges: Number(row.charges),
        paid: Number(row.paid),
        pending: Number(row.pending),
        outstanding: Number(row.charges) - Number(row.paid),
      }),
    );
    assert.deepEqual(normalized, [
      {
        email: "demo.alex@scm.com",
        charges: 16800,
        paid: 3000,
        pending: 0,
        outstanding: 13800,
      },
      {
        email: "demo.john@scm.com",
        charges: 24000,
        paid: 11200,
        pending: 2000,
        outstanding: 12800,
      },
      {
        email: "demo.sara@scm.com",
        charges: 16800,
        paid: 7200,
        pending: 0,
        outstanding: 9600,
      },
    ]);

    const credentials = [
      ["demo.admin@scm.com", "Admin@12345"],
      ["demo.jane@scm.com", "Teacher@12345"],
      ["demo.michael@scm.com", "Teacher@12345"],
      ["demo.john@scm.com", "Student@12345"],
      ["demo.sara@scm.com", "Student@12345"],
      ["demo.alex@scm.com", "Student@12345"],
    ] as const;
    for (const [email, password] of credentials) {
      const [rows] = await db.query(
        "SELECT password, status FROM users WHERE email = ?",
        [email],
      );
      const user = (rows as { password: string; status: string }[])[0];
      assert.equal(user.status, "ACTIVE");
      assert.equal(await bcrypt.compare(password, user.password), true);
    }

    console.log("Demo verification passed.");
    console.table(normalized);
    console.table(result);
  } finally {
    await db.end();
  }
}

main().catch((error) => {
  console.error("Demo verification failed:", error);
  process.exit(1);
});
