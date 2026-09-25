"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Course = {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  department: string;
  semester: string;
  progress: number;
  attendance: number | null;
  pendingGrading: number;
  _count: { enrollments: number; assignments: number };
};
type Student = {
  student: {
    id: number;
    studentId: string;
    department: string;
    year: number;
    user: { name: string; email: string };
  };
};
type Assignment = {
  id: number;
  title: string;
  dueDate: string;
  submissionCount: number;
  pendingGrading: number;
  course?: { id: number };
};

export default function TeacherCourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const courseId = Number(id);
  const [course, setCourse] = useState<Course | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const token = localStorage.getItem("scm_token") || "";
        const [courseResponse, studentResponse, assignmentResponse] =
          await Promise.all([
            apiFetch<{ data: Course[] }>("/enrollments/teacher/course-stats", {
              token,
            }),
            apiFetch<{ data: Student[] }>(
              `/enrollments/teacher/course/${courseId}/students`,
              { token },
            ),
            apiFetch<{ data: Assignment[] }>("/assignments/my-assignments", {
              token,
            }),
          ]);
        const found =
          courseResponse.data.find((item) => item.id === courseId) || null;
        if (!found) throw new Error("Course not found or access denied.");
        setCourse(found);
        setStudents(studentResponse.data || []);
        setAssignments(
          (assignmentResponse.data || []).filter(
            (item) => item.course?.id === courseId,
          ),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load course.");
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId]);

  return (
    <main className="min-h-screen bg-[#EAE6DC] p-5 sm:p-8">
      <Link
        href="/teacher/courses"
        className="text-sm font-semibold text-[#B45A2A]"
      >
        ← My Courses
      </Link>
      {loading ? (
        <div className="mt-6 rounded-2xl bg-white p-10 text-center text-slate-500">
          Loading course...
        </div>
      ) : error || !course ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          {error || "Course not found."}
        </div>
      ) : (
        <>
          <section className="mt-5 rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-[#B45A2A]">
              {course.code} · {course.semester}
            </p>
            <h1 className="mt-2 font-serif text-3xl font-bold text-[#333333]">
              {course.name}
            </h1>
            <p className="mt-3 text-sm text-slate-500">
              {course.description || `${course.department} course`}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
              {[
                ["Students", course._count.enrollments],
                ["Assignments", course._count.assignments],
                ["Progress", `${course.progress}%`],
                [
                  "Attendance",
                  course.attendance === null
                    ? "No records"
                    : `${course.attendance}%`,
                ],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="min-w-0 rounded-xl bg-[#F0EDE4] p-4"
                >
                  <p className="break-words text-xs text-slate-400">{label}</p>
                  <p className="mt-1 break-words text-lg font-bold text-slate-700">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </section>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="font-serif text-xl font-bold text-[#333333]">
                Students
              </h2>
              <div className="mt-4 space-y-3">
                {students.length ? (
                  students.map(({ student }) => (
                    <div
                      key={student.id}
                      className="rounded-xl border border-[#E5E0D6] p-4"
                    >
                      <p className="font-semibold text-slate-700">
                        {student.user.name}
                      </p>
                      <p className="text-sm text-slate-400">
                        {student.studentId} · {student.user.email}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No active students.</p>
                )}
              </div>
            </section>
            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="font-serif text-xl font-bold text-[#333333]">
                Assignments
              </h2>
              <div className="mt-4 space-y-3">
                {assignments.length ? (
                  assignments.map((assignment) => (
                    <Link
                      key={assignment.id}
                      href={`/teacher/assignments/${assignment.id}`}
                      className="block rounded-xl border border-[#E5E0D6] p-4 transition hover:border-[#B45A2A]"
                    >
                      <p className="font-semibold text-slate-700">
                        {assignment.title}
                      </p>
                      <p className="text-sm text-slate-400">
                        {assignment.submissionCount} submissions ·{" "}
                        {assignment.pendingGrading} awaiting grading
                      </p>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">
                    No active assignments.
                  </p>
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </main>
  );
}
