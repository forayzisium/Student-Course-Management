"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import StatCard from "@/components/students/StatCard";
import { apiFetch } from "@/lib/api";
import { useRealtimeRefresh } from "@/lib/hooks/useRealtimeSync";
type Course = {
  id: number;
  name: string;
  code: string;
  semester: string;
  credits: number;
  description: string | null;
  syllabus: string | null;
  teacher: { name: string; email: string };
  assignments: {
    id: number;
    title: string;
    description: string;
    dueDate: string;
    submissions: { status: string; marks: number | null }[];
  }[];
  attendance: { status: string }[];
  grades: { id: number; total: number }[];
};
export default function CourseHub({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [course, setCourse] = useState<Course | null>(null);
  const [error, setError] = useState("");
  const load = async () => {
    try {
      const result = await apiFetch<{ data: Course }>(
        "/courses/student/" + id,
        { token: localStorage.getItem("scm_token") || "", cache: "no-store" },
      );
      setCourse(result.data);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load course");
    }
  };
  useRealtimeRefresh(load);
  useEffect(() => {
    let active = true;
    apiFetch<{ data: Course }>("/courses/student/" + id, {
      token: localStorage.getItem("scm_token") || "",
      cache: "no-store",
    })
      .then((r) => {
        if (active) setCourse(r.data);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [id]);
  if (!course)
    return (
      <main className="min-h-screen bg-[#EAE6DC] p-5 sm:p-8">
        <Link
          href="/student/courses"
          className="text-sm font-semibold text-[#B45A2A] hover:text-[#984A22]"
        >
          Back to courses
        </Link>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            {!error && (
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#B45A2A]/20 border-t-[#B45A2A]" />
            )}
            <p
              role={error ? "alert" : "status"}
              className="text-sm text-slate-500"
            >
              {error || "Loading your course..."}
            </p>
            {error && (
              <button
                onClick={() => void load()}
                className="mt-5 rounded-xl bg-[#B45A2A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#984A22]"
              >
                Try again
              </button>
            )}
          </div>
        </div>
      </main>
    );
  const submitted = course.assignments.filter(
    (a) => a.submissions.length > 0,
  ).length;
  const attended = course.attendance.filter(
    (a) => a.status !== "ABSENT",
  ).length;
  const progress = course.assignments.length
    ? Math.round((submitted / course.assignments.length) * 100)
    : 0;
  const icon = (
    <svg
      aria-hidden="true"
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 5h16v15H4zM8 9h8M8 13h5M8 17h3"
      />
    </svg>
  );
  return (
    <main className="min-h-screen bg-[#EAE6DC] p-5 sm:p-8">
      <Link
        href="/student/courses"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#B45A2A]"
      >
        <span aria-hidden="true">&larr;</span> Back to my courses
      </Link>
      <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-serif text-sm text-[#B45A2A]">
            Student Portal / My Courses
          </p>
          <h1 className="mt-1 break-words font-serif text-2xl font-bold tracking-tight text-[#333333] sm:text-3xl">
            {course.name}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {course.code} <span aria-hidden="true">&middot;</span>{" "}
            {course.credits} credits <span aria-hidden="true">&middot;</span>{" "}
            {course.teacher.name}
          </p>
        </div>
        <span className="w-fit shrink-0 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-md">
          {course.semester}
        </span>
      </header>
      {error && (
        <p
          role="alert"
          className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
        >
          {error}
        </p>
      )}
      <section
        aria-label="Course statistics"
        className="mb-8 grid gap-4 sm:grid-cols-3"
      >
        <StatCard
          title="Assignment Progress"
          value={progress + "%"}
          description={
            submitted + " of " + course.assignments.length + " submitted"
          }
          icon={icon}
        />
        <StatCard
          title="Attendance"
          value={
            course.attendance.length
              ? Math.round((attended / course.attendance.length) * 100) + "%"
              : "N/A"
          }
          description={
            course.attendance.length
              ? "Present and late classes"
              : "No attendance recorded"
          }
          icon={
            <svg
              aria-hidden="true"
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 12l4 4L19 6"
              />
            </svg>
          }
        />
        <StatCard
          title="Course Result"
          value={course.grades[0] ? String(course.grades[0].total) : "N/A"}
          description={
            course.grades[0] ? "Recorded total marks" : "Not yet graded"
          }
          icon={
            <svg
              aria-hidden="true"
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                strokeLinecap="round"
                d="M5 20V4M5 20h15M10 16v-4M15 16V8M20 16V5"
              />
            </svg>
          }
        />
      </section>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-slate-900">
              Course Overview
            </h2>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-500">
              {course.description || "No description published yet."}
            </p>
            <div className="mt-6 border-t border-slate-100 pt-5">
              <h2 className="text-lg font-bold text-slate-900">Syllabus</h2>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-500">
                {course.syllabus || "No syllabus published yet."}
              </p>
            </div>
          </section>
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-5 sm:p-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Course Assignments
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Deadlines and your submission status.
                </p>
              </div>
              <span className="rounded-full bg-[#F0EDE4] px-3 py-1 text-sm font-semibold text-[#B45A2A]">
                {course.assignments.length}
              </span>
            </div>
            {course.assignments.length === 0 && (
              <p className="p-8 text-center text-sm text-slate-500">
                No assignments published yet.
              </p>
            )}
            <div className="divide-y divide-slate-100">
              {course.assignments.map((a) => (
                <article key={a.id} className="p-5 sm:p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <h3 className="font-semibold text-slate-900">{a.title}</h3>
                    <span
                      className={
                        "w-fit shrink-0 rounded-full px-3 py-1 text-xs font-semibold " +
                        (a.submissions.length
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700")
                      }
                    >
                      {a.submissions[0]?.status === "GRADED"
                        ? "Graded"
                        : a.submissions.length
                          ? "Submitted"
                          : "Pending"}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-500">
                    {a.description}
                  </p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-slate-400">
                      Due: {new Date(a.dueDate).toLocaleString()}
                    </p>
                    <Link
                      className="text-sm font-semibold text-[#B45A2A] transition hover:text-[#984A22]"
                      href={"/student/assignments?course=" + course.id}
                    >
                      View assignment <span aria-hidden="true">&rarr;</span>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Your Instructor
            </h2>
            <div className="mt-4 flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F0EDE4] font-semibold text-[#B45A2A]"
              >
                {course.teacher.name.slice(0, 1)}
              </span>
              <div className="min-w-0">
                <p className="break-words text-sm font-semibold text-slate-800">
                  {course.teacher.name}
                </p>
                <p className="mt-1 break-all text-xs text-slate-500">
                  {course.teacher.email}
                </p>
              </div>
            </div>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Quick Actions</h2>
            <Link
              href={"/student/assignments?course=" + course.id}
              className="mt-4 flex justify-center rounded-xl bg-[#B45A2A] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#984A22] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B45A2A]"
            >
              View Assignments
            </Link>
            <Link
              href="/student/results"
              className="mt-3 flex justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              View Grades
            </Link>
          </section>
        </aside>
      </div>
    </main>
  );
}
