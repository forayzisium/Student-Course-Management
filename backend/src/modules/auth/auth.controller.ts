import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import {
  loginUser,
  registerStudent,
  registerTeacher,
  changePassword,
  type LoginRole,
} from "./auth.service";

function isLoginRole(value: unknown): value is LoginRole {
  return value === "STUDENT" || value === "TEACHER" || value === "ADMIN";
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password, role } = req.body ?? {};

    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    if (!isLoginRole(role)) {
      return res.status(400).json({
        success: false,
        message: "A valid login role is required",
      });
    }

    const user = await loginUser(email.trim().toLowerCase(), password, role);

    return res.json({
      success: true,
      message: "Login successful",
      token: user.token,
      user: user.user,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";

    return res.status(401).json({
      success: false,
      message,
    });
  }
}
export async function getMe(req: Request, res: Response) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user!.userId,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        status: true,
        isSuperAdmin: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get current user failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get user information",
    });
  }
}
export async function adminTest(req: Request, res: Response) {
  return res.json({
    success: true,
    message: "Admin access granted",
    user: req.user,
  });
}
export async function register(req: Request, res: Response) {
  try {
    const isGmail = (email: string) =>
      email.trim().toLowerCase().endsWith("@gmail.com");
    const { name, username, email, password, studentId, department, year } =
      req.body;

    if (
      !name ||
      !username ||
      !email ||
      !password ||
      !studentId ||
      !department ||
      !year
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (!isGmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please use a Gmail address ending with @gmail.com",
      });
    }

    const student = await registerStudent({
      name,
      username,
      email,
      password,
      studentId,
      department,
      year,
    });

    return res.status(201).json({
      success: true,
      message: "Student registration successful",
      student,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Registration failed";

    return res.status(400).json({
      success: false,
      message,
    });
  }
}
export async function registerTeacherController(req: Request, res: Response) {
  try {
    const {
      name,
      username,
      email,
      password,
      department,
      qualification,
      experience,
    } = req.body;

    if (
      !name ||
      !username ||
      !email ||
      !password ||
      !department ||
      !qualification ||
      !experience
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }
    const isGmail = (email: string) =>
      email.trim().toLowerCase().endsWith("@gmail.com");

    if (!isGmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Only Gmail addresses are allowed for registration",
      });
    }

    const teacher = await registerTeacher({
      name,
      username,
      email,
      password,
      department,
      qualification,
      experience,
    });

    return res.status(201).json({
      success: true,
      message: "Teacher registration submitted for approval",
      teacher,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Teacher registration failed";

    return res.status(400).json({
      success: false,
      message,
    });
  }
}
export async function changeUserPassword(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { currentPassword, newPassword } = req.body ?? {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    const result = await changePassword(userId, currentPassword, newPassword);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to change password";

    const statusCode =
      message === "User not found"
        ? 404
        : message === "Current password is incorrect"
          ? 401
          : 400;

    res.status(statusCode).json({
      success: false,
      message,
    });
  }
}
