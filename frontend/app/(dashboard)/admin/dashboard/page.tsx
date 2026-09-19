"use client";

import AdminStatCard from "@/components/admins/AdminStatCard";
import AdminAccessSection from "@/components/admins/AdminAccessSection";
import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";

type DashboardData = {
  students: {
    total: number;
  };
  teachers: {
    total: number;
  };
  teacherRequests: {
    pending: number;
    approved: number;
    rejected: number;
  };
  courses: {
    total: number;
  };
  assignments: {
    total: number;
  };
  payments: {
    total: number;
    paid: number;
    pending: number;
  };
  activity: {
    activeStudents: number;
    activeTeachers: number;
    courseCompletion: number;
  };
  recentActivity: {
    users: {
      id: number;
      name: string;
      role: "STUDENT" | "TEACHER" | "ADMIN";
      createdAt: string;
    }[];
    courses: {
      id: number;
      name: string;
      code: string;
      createdAt: string;
    }[];
    assignments: {
      id: number;
      title: string;
      createdAt: string;
    }[];
    payments: {
      id: number;
      amount: number;
      status: string;
      createdAt: string;
    }[];
  };
};

type TeacherRequestStatus = "PENDING" | "ACTIVE" | "REJECTED";

type TeacherRequest = {
  id: number;
  name: string;
  username: string;
  email: string;
  status: TeacherRequestStatus;
  createdAt: string;
  teacherProfile: {
    department: string;
    qualification: string;
    experience: string;
  } | null;
};

type RecentActivityItem = {
  id: string;
  type: "user" | "course" | "assignment" | "payment";
  title: string;
  description: string;
  createdAt: string;
};

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  const [teacherRequests, setTeacherRequests] = useState<TeacherRequest[]>([]);

  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const token = localStorage.getItem("scm_token");

        if (!token) {
          setError("Authentication required.");
          return;
        }

        const [dashboardResponse, requestsResponse] = await Promise.all([
          apiFetch<{
            success: boolean;
            data: DashboardData;
          }>("/admin/dashboard", {
            token,
          }),

          apiFetch<{
            success: boolean;
            teachers: TeacherRequest[];
          }>("/admin/teacher-requests", {
            token,
          }),
        ]);

        setDashboard(dashboardResponse.data);

        setTeacherRequests(requestsResponse.teachers);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to load dashboard",
        );
      }
    }

    loadDashboard();
  }, []);

  const handleTeacherRequest = async (
    userId: number,
    action: "approve" | "reject",
  ) => {
    try {
      setError("");
      setProcessingId(userId);

      const token = localStorage.getItem("scm_token");

      if (!token) {
        setError("Authentication required.");
        return;
      }

      await apiFetch(`/admin/teacher-requests/${userId}/${action}`, {
        method: "PATCH",
        token,
      });

      // Refresh dashboard statistics and the complete application list.
      const [dashboardResponse, requestsResponse] = await Promise.all([
        apiFetch<{
          success: boolean;
          data: DashboardData;
        }>("/admin/dashboard", {
          token,
        }),
        apiFetch<{
          success: boolean;
          teachers: TeacherRequest[];
        }>("/admin/teacher-requests", {
          token,
        }),
      ]);

      setDashboard(dashboardResponse.data);
      setTeacherRequests(requestsResponse.teachers);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : `Failed to ${action} teacher request`,
      );
    } finally {
      setProcessingId(null);
    }
  };

  const formatTime = (date: string) => {
    const createdAt = new Date(date);
    const now = new Date();

    const difference = now.getTime() - createdAt.getTime();

    const minutes = Math.floor(difference / (1000 * 60));

    const hours = Math.floor(difference / (1000 * 60 * 60));

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "Just now";

    if (minutes < 60) {
      return `${minutes} min ago`;
    }

    if (hours < 24) {
      return `${hours} hr ago`;
    }

    if (days < 7) {
      return `${days} day${days > 1 ? "s" : ""} ago`;
    }

    return createdAt.toLocaleDateString();
  };

  const recentActivities: RecentActivityItem[] = dashboard
    ? [
        ...dashboard.recentActivity.users.map((user) => ({
          id: `user-${user.id}`,
          type: "user" as const,

          title:
            user.role === "STUDENT"
              ? "New student registered"
              : user.role === "TEACHER"
                ? "New teacher registered"
                : "New admin registered",

          description: user.name,
          createdAt: user.createdAt,
        })),

        ...dashboard.recentActivity.courses.map((course) => ({
          id: `course-${course.id}`,
          type: "course" as const,
          title: "New course created",
          description: `${course.code} · ${course.name}`,
          createdAt: course.createdAt,
        })),

        ...dashboard.recentActivity.assignments.map((assignment) => ({
          id: `assignment-${assignment.id}`,
          type: "assignment" as const,
          title: "New assignment created",
          description: assignment.title,
          createdAt: assignment.createdAt,
        })),

        ...dashboard.recentActivity.payments.map((payment) => ({
          id: `payment-${payment.id}`,
          type: "payment" as const,
          title: `Payment ${payment.status.toLowerCase()}`,
          description: `৳${payment.amount}`,
          createdAt: payment.createdAt,
        })),
      ]
    : [];

  const sortedRecentActivities = [...recentActivities]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 8);

  const pendingTeacherRequests = teacherRequests.filter(
    (teacher) => teacher.status === "PENDING",
  );

  return (
    <div className="flex min-h-screen bg-[#EAE6DC]">
      <main className="min-w-0 flex-1 p-4 sm:p-5 xl:p-8">
        <div className="mb-8">
          <p className="font-serif text-sm text-[#B45A2A]">
            SCM Administration
          </p>

          <h1 className="mt-1 font-serif text-3xl font-bold text-[#333333]">
            Admin Dashboard
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage students, teachers, courses and the overall student
            management system.
          </p>
        </div>

        <AdminAccessSection />

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <AdminStatCard
            title="Total Students"
            value={
              dashboard ? dashboard.students.total.toLocaleString() : "..."
            }
            description="Currently registered students"
            icon={
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
                />

                <circle cx="9" cy="7" r="4" />

                <path strokeLinecap="round" d="M17 11a4 4 0 1 0 0-8" />
              </svg>
            }
          />

          <AdminStatCard
            title="Total Teachers"
            value={
              dashboard ? dashboard.teachers.total.toLocaleString() : "..."
            }
            description="Registered teacher accounts"
            icon={
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="8" r="4" />

                <path
                  strokeLinecap="round"
                  d="M5 21c.8-4 3.2-6 7-6s6.2 2 7 6"
                />
              </svg>
            }
          />

          <AdminStatCard
            title="Pending Requests"
            value={
              dashboard
                ? dashboard.teacherRequests.pending.toLocaleString()
                : "..."
            }
            description="Teacher approvals needed"
            icon={
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="9" />

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 7v5l3 2"
                />
              </svg>
            }
          />

          <AdminStatCard
            title="Approved Requests"
            value={
              dashboard
                ? dashboard.teacherRequests.approved.toLocaleString()
                : "..."
            }
            description="Teachers added to the platform"
            icon={
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="9" />

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m8.5 12.2 2.3 2.3 4.7-4.8"
                />
              </svg>
            }
          />

          <AdminStatCard
            title="Rejected Requests"
            value={
              dashboard
                ? dashboard.teacherRequests.rejected.toLocaleString()
                : "..."
            }
            description="Applications declined"
            icon={
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="9" />

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m9 9 6 6M15 9l-6 6"
                />
              </svg>
            }
          />

          <AdminStatCard
            title="Total Courses"
            value={dashboard ? dashboard.courses.total.toLocaleString() : "..."}
            description="Across all departments"
            icon={
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m12 3 9 5-9 5-9-5 9-5Z"
                />

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m3 12 9 5 9-5"
                />
              </svg>
            }
          />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-3">
          <section className="min-w-0 rounded-2xl bg-white p-6 shadow-sm xl:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-serif text-xl font-bold text-[#333333]">
                  Pending Teacher Requests
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Review teachers waiting for approval.
                </p>
              </div>

              <a
                href="/admin/teacher-requests"
                className="text-sm font-semibold text-[#B45A2A] hover:underline"
              >
                View all
              </a>
            </div>

            <div className="mt-6 divide-y divide-slate-100">
              {pendingTeacherRequests.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">
                  No pending teacher requests.
                </div>
              ) : (
                pendingTeacherRequests.map((teacher) => (
                  <div
                    key={teacher.id}
                    className="flex min-w-0 flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#B45A2A] text-sm font-semibold text-white">
                        {teacher.name
                          .split(" ")
                          .map((word) => word[0])
                          .slice(0, 2)
                          .join("")}
                      </div>

                      <div className="min-w-0">
                        <p className="break-words text-sm font-semibold text-slate-700">
                          {teacher.name}
                        </p>

                        <p className="mt-1 break-all text-xs text-slate-400">
                          {teacher.email}
                        </p>

                        <p className="mt-1 break-words text-xs text-slate-400">
                          {teacher.teacherProfile?.department ??
                            "Department not specified"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={processingId === teacher.id}
                        onClick={() =>
                          handleTeacherRequest(teacher.id, "reject")
                        }
                        className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {processingId === teacher.id
                          ? "Processing..."
                          : "Reject"}
                      </button>

                      <button
                        type="button"
                        disabled={processingId === teacher.id}
                        onClick={() =>
                          handleTeacherRequest(teacher.id, "approve")
                        }
                        className="rounded-lg bg-[#B45A2A] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#9f4d24] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {processingId === teacher.id
                          ? "Processing..."
                          : "Approve"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="min-w-0 rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="font-serif text-xl font-bold text-[#333333]">
              Quick Overview
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Current system activity.
            </p>

            <div className="mt-6 space-y-5">
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Active Students</span>

                  <span className="font-semibold text-slate-700">
                    {dashboard?.activity.activeStudents ?? 0}%
                  </span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Active Teachers</span>

                  <span className="font-semibold text-slate-700">
                    {dashboard?.activity.activeTeachers ?? 0}%
                  </span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Course Completion</span>

                  <span className="font-semibold text-slate-700">
                    {dashboard?.activity.courseCompletion ?? 0}%
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="font-serif text-xl font-bold text-[#333333]">
              Recent Activity
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Latest activity across the SCM.
            </p>
          </div>

          {sortedRecentActivities.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">
              No recent activity.
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-3">
              {sortedRecentActivities.slice(0, 6).map((activity) => (
                <div
                  key={activity.id}
                  className="min-w-0 rounded-xl bg-[#F7F5EF] p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm">
                      {activity.type === "user" && "👤"}

                      {activity.type === "course" && "📚"}

                      {activity.type === "assignment" && "📝"}

                      {activity.type === "payment" && "💳"}
                    </div>

                    <p className="text-xs text-[#B45A2A]">
                      {formatTime(activity.createdAt)}
                    </p>
                  </div>

                  <p className="mt-4 break-words text-sm font-semibold text-slate-700">
                    {activity.title}
                  </p>

                  <p className="mt-1 break-words text-xs text-slate-400">
                    {activity.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
