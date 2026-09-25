import bcrypt from "bcryptjs";
import { prisma } from "../../config/prisma";
import { generateToken } from "../../utils/jwt";

export type LoginRole = "STUDENT" | "TEACHER" | "ADMIN";

export async function loginUser(
  email: string,
  password: string,
  selectedRole: LoginRole,
) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    throw new Error("Invalid email or password");
  }

  if (user.status !== "ACTIVE") {
    throw new Error("Your account is not active");
  }

  if (user.role !== selectedRole) {
    const accountRole = user.role.charAt(0) + user.role.slice(1).toLowerCase();

    throw new Error(
      `This account is registered as ${accountRole}. Select ${accountRole} to continue.`,
    );
  }

  const token = generateToken({
    userId: user.id,
    role: user.role,
    sessionVersion: user.sessionVersion,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      isSuperAdmin: user.isSuperAdmin,
    },
  };
}
export async function registerStudent(data: {
  name: string;
  username: string;
  email: string;
  password: string;
  studentId: string;
  department: string;
  year: string;
}) {
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: data.email }, { username: data.username }],
    },
  });

  if (existingUser) {
    throw new Error("Email or username already exists");
  }
  if (!data.email.trim().toLowerCase().endsWith("@gmail.com")) {
    throw new Error("Only Gmail addresses are allowed for registration");
  }

  const existingStudent = await prisma.studentProfile.findUnique({
    where: {
      studentId: data.studentId,
    },
  });

  if (existingStudent) {
    throw new Error("Student ID already exists");
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const student = await prisma.user.create({
    data: {
      name: data.name,
      username: data.username,
      email: data.email,
      password: hashedPassword,
      role: "STUDENT",
      status: "ACTIVE",

      studentProfile: {
        create: {
          studentId: data.studentId,
          department: data.department,
          year: data.year,
        },
      },
    },

    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      status: true,
      studentProfile: {
        select: {
          studentId: true,
          department: true,
          year: true,
        },
      },
    },
  });

  return student;
}
export async function registerTeacher(data: {
  name: string;
  username: string;
  email: string;
  password: string;
  department: string;
  qualification: string;
  experience: string;
}) {
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: data.email }, { username: data.username }],
    },
  });

  if (existingUser) {
    throw new Error("Email or username already exists");
  }
  if (!data.email.trim().toLowerCase().endsWith("@gmail.com")) {
    throw new Error("Only Gmail addresses are allowed for registration");
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const teacher = await prisma.user.create({
    data: {
      name: data.name,
      username: data.username,
      email: data.email,
      password: hashedPassword,
      role: "TEACHER",
      status: "PENDING",

      teacherProfile: {
        create: {
          department: data.department,
          qualification: data.qualification,
          experience: data.experience,
        },
      },
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
          department: true,
          qualification: true,
          experience: true,
        },
      },
    },
  });

  return teacher;
}
export async function changePassword(
  userId: number,
  currentPassword: string,
  newPassword: string,
) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const passwordMatches = await bcrypt.compare(currentPassword, user.password);

  if (!passwordMatches) {
    throw new Error("Current password is incorrect");
  }

  if (newPassword.length < 8) {
    throw new Error("New password must be at least 6 characters");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      password: hashedPassword,
    },
  });

  return {
    message: "Password changed successfully",
  };
}
