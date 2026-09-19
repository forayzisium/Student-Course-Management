"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import LiveActivityFeed from "@/components/teachers/LiveActivityFeed";

type TeacherCourse = {
  id: number;
  code: string;
  name: string;
  department: string;
  semester: string;
  status: string;
  progress: number;
  pendingGrading: number;
  _count?: {
    enrollments: number;
    assignments: number;
  };
};

type TeacherAssignment = {
  id: number;
  title: string;
  description?: string | null;
  dueDate: string;
  pendingGrading: number;
  course?: {
    id: number;
    code: string;
    name: string;
    teacherId: number;
  };
};

export default function TeacherDashboardPage() {
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);

  const [coursesLoading, setCoursesLoading] = useState(true);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);

  useEffect(() => {
    const loadCourses = async () => {
      const token = localStorage.getItem("scm_token");

      if (!token) {
        setCoursesLoading(false);
        return;
      }

      try {
        const response = await apiFetch<{
          success: boolean;
          data: TeacherCourse[];
        }>("/enrollments/teacher/course-stats", {
          token,
        });

        setCourses(response.data || []);
      } catch (error) {
        console.error("Failed to load teacher course statistics:", error);
      } finally {
        setCoursesLoading(false);
      }
    };

    loadCourses();
  }, []);

  useEffect(() => {
    const loadAssignments = async () => {
      const token = localStorage.getItem("scm_token");

      if (!token) {
        setAssignmentsLoading(false);
        return;
      }

      try {
        const response = await apiFetch<{
          success: boolean;
          data: TeacherAssignment[];
        }>("/assignments/my-assignments", {
          token,
        });

        setAssignments(response.data || []);
      } catch (error) {
        console.error("Failed to load teacher assignments:", error);
      } finally {
        setAssignmentsLoading(false);
      }
    };

    loadAssignments();
  }, []);

  const totalStudents = courses.reduce(
    (total, course) => total + (course._count?.enrollments ?? 0),
    0,
  );

  const totalAssignments = courses.reduce(
    (total, course) => total + (course._count?.assignments ?? 0),
    0,
  );

  const pendingReviews = courses.reduce(
    (total, course) => total + course.pendingGrading,
    0,
  );

  const semesters = Array.from(
    new Set(courses.map((course) => course.semester)),
  );

  const recentAssignments = [...assignments]
    .sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    )
    .slice(0, 5);

  const getAssignmentStatus = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();

    return due < now ? "Closed" : "Active";
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="flex min-h-screen bg-[#EAE6DC]">
      <main className="min-w-0 flex-1 p-5 sm:p-8">
        <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="font-serif text-sm text-[#B45A2A]">Teacher Portal</p>

            <h1 className="mt-1 font-serif text-3xl font-bold text-[#333333]">
              Teacher Dashboard
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Here&apos;s an overview of your teaching activities.
            </p>
          </div>

          <div className="w-40 rounded-xl bg-slate-900 px-4 py-3 shadow-sm">
            <p className="text-xs text-slate-300">Current Semester</p>

            <p className="mt-1 truncate text-sm font-semibold text-white">
              {semesters.length ? semesters[0] : "No active term"}
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#111827] text-white">
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
                    d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Z"
                  />
                  <path strokeLinecap="round" d="M8 7h8M8 11h8M8 15h5" />
                </svg>
              </div>

              <span className="text-xs font-medium text-green-600">Active</span>
            </div>

            <p className="mt-5 text-sm text-slate-400">My Courses</p>

            <p className="mt-1 text-3xl font-bold text-slate-800">
              {coursesLoading ? "..." : courses.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#111827] text-white">
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="9" cy="8" r="3" />
                  <circle cx="17" cy="9" r="2.5" />
                  <path
                    strokeLinecap="round"
                    d="M3.5 19c.7-3.1 2.7-5 5.5-5s4.8 1.9 5.5 5"
                  />
                  <path strokeLinecap="round" d="M14 15c2.5-.2 4.8 1.2 5.5 4" />
                </svg>
              </div>

              <span className="text-xs font-medium text-green-600">Active</span>
            </div>

            <p className="mt-5 text-sm text-slate-400">Total Students</p>

            <p className="mt-1 text-3xl font-bold text-slate-800">
              {coursesLoading ? "..." : totalStudents}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#111827] text-white">
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
                    d="M9 5h6M9 3h6a1 1 0 0 1 1 1v1h1a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h1V4a1 1 0 0 1 1-1Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m9 13 2 2 4-4"
                  />
                </svg>
              </div>

              <span className="text-xs font-medium text-amber-600">
                Assignments
              </span>
            </div>

            <p className="mt-5 text-sm text-slate-400">Assignments</p>

            <p className="mt-1 text-3xl font-bold text-slate-800">
              {coursesLoading ? "..." : totalAssignments}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#111827] text-white">
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path strokeLinecap="round" d="M12 7v5l3 2" />
                </svg>
              </div>

              <span className="text-xs font-medium text-[#B45A2A]">
                Needs attention
              </span>
            </div>

            <p className="mt-5 text-sm text-slate-400">Pending Reviews</p>

            <p className="mt-1 text-3xl font-bold text-slate-800">
              {coursesLoading ? "..." : pendingReviews}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
          <section className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-slate-900">My Courses</h2>

                <p className="mt-1 text-sm text-slate-500">
                  Courses you&apos;re teaching this semester.
                </p>
              </div>

              <Link
                href="/teacher/courses"
                className="shrink-0 text-sm font-semibold text-[#B45A2A] hover:underline"
              >
                View All
              </Link>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {coursesLoading ? (
                <div className="col-span-full rounded-xl border border-slate-100 p-6 text-center text-sm text-slate-400">
                  Loading courses...
                </div>
              ) : courses.length === 0 ? (
                <div className="col-span-full rounded-xl border border-slate-100 p-6 text-center text-sm text-slate-400">
                  No courses assigned to you yet.
                </div>
              ) : (
                courses.map((course) => (
                  <div
                    key={course.id}
                    className="rounded-xl border border-slate-100 p-5 transition hover:border-[#B45A2A]/30 hover:shadow-sm"
                  >
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#B45A2A]">
                          {course.code}
                        </p>

                        <h3 className="mt-1 break-words font-semibold text-slate-800">
                          {course.name}
                        </h3>
                      </div>

                      <span className="shrink-0 rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-semibold text-green-600">
                        {course.status}
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-[#F0EDE4] p-3">
                        <p className="text-xs text-slate-400">Students</p>

                        <p className="mt-1 text-lg font-bold text-slate-700">
                          {course._count?.enrollments ?? 0}
                        </p>
                      </div>

                      <div className="rounded-lg bg-[#F0EDE4] p-3">
                        <p className="text-xs text-slate-400">Assignments</p>

                        <p className="mt-1 text-lg font-bold text-slate-700">
                          {course._count?.assignments ?? 0}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Course Progress</span>

                        <span className="font-bold text-slate-600">
                          {course.progress}%
                        </span>
                      </div>

                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[#B45A2A]"
                          style={{
                            width: `${course.progress}%`,
                          }}
                        />
                      </div>
                    </div>

                    <Link
                      href={`/teacher/courses/${course.id}`}
                      className="mt-5 block rounded-lg border border-slate-200 py-2.5 text-center text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      Manage Course
                    </Link>
                  </div>
                ))
              )}
            </div>
          </section>

          <LiveActivityFeed />
        </div>

        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Recent Assignments
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your latest assignments and upcoming deadlines.
              </p>
            </div>

            <Link
              href="/teacher/assignments"
              className="w-fit rounded-xl bg-[#111827] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Manage Assignments
            </Link>
          </div>

          <div className="mt-6">
            {assignmentsLoading ? (
              <div className="rounded-xl border border-slate-100 p-6 text-center text-sm text-slate-400">
                Loading assignments...
              </div>
            ) : recentAssignments.length === 0 ? (
              <div className="rounded-xl border border-slate-100 p-6 text-center text-sm text-slate-400">
                No assignments found.
              </div>
            ) : (
              <>
                <div className="space-y-3 lg:hidden">
                  {recentAssignments.map((assignment) => {
                    const status = getAssignmentStatus(assignment.dueDate);

                    return (
                      <article
                        key={assignment.id}
                        className="rounded-xl border border-slate-100 p-4"
                      >
                        <div className="flex min-w-0 items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="break-words text-sm font-semibold text-slate-800">
                              {assignment.title}
                            </h3>
                            <p className="mt-1 break-words text-sm text-slate-500">
                              {assignment.course
                                ? `${assignment.course.code} · ${assignment.course.name}`
                                : "Unknown Course"}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${status === "Active" ? "bg-green-50 text-green-600" : "bg-slate-100 text-slate-500"}`}
                          >
                            {status}
                          </span>
                        </div>
                        <p className="mt-3 text-xs text-slate-400">
                          Due {formatDate(assignment.dueDate)}
                        </p>
                      </article>
                    );
                  })}
                </div>
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full min-w-[600px] table-fixed">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wider text-slate-400">
                        <th className="w-[30%] pb-4 pr-4 font-semibold">
                          Assignment
                        </th>

                        <th className="w-[35%] pb-4 pr-4 font-semibold">
                          Course
                        </th>

                        <th className="w-[22%] pb-4 pr-4 font-semibold">
                          Due Date
                        </th>

                        <th className="w-[13%] pb-4 text-right font-semibold">
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {recentAssignments.map((assignment) => {
                        const status = getAssignmentStatus(assignment.dueDate);

                        return (
                          <tr
                            key={assignment.id}
                            className="border-b border-slate-50 last:border-0"
                          >
                            <td className="break-words py-5 pr-4 text-sm font-semibold text-slate-800">
                              {assignment.title}
                            </td>

                            <td className="break-words py-5 pr-4 text-sm text-slate-500">
                              {assignment.course
                                ? `${assignment.course.code} · ${assignment.course.name}`
                                : "Unknown Course"}
                            </td>

                            <td className="py-5 pr-4 text-sm text-slate-500">
                              {formatDate(assignment.dueDate)}
                            </td>

                            <td className="py-5 text-right">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${status === "Active"
                                    ? "bg-green-50 text-green-600"
                                    : "bg-slate-100 text-slate-500"
                                  }`}
                              >
                                {status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
