"use client";

import { useEffect, useState } from "react";
import TeacherCourseCard from "@/components/teachers/TeacherCourseCard";
import { apiFetch } from "@/lib/api";

type BackendCourse = {
  id: number;
  code: string;
  name: string;
  department: string;
  semester: string;
  description?: string | null;
  status: "ACTIVE" | "INACTIVE";
  progress: number;
  attendance: number | null;
  _count: { enrollments: number; assignments: number };
};

type TeacherCourse = {
  id: number;
  code: string;
  title: string;
  description: string;
  semester: string;
  attendance: number | null;
  students: number;
  assignments: number;
  progress: number;
  status?: "Active" | "Completed";
};

export default function TeacherCoursesPage() {
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getToken = () => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("scm_token") || "";
  };

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError("");

        const token = getToken();

        if (!token) {
          throw new Error("Authentication token not found");
        }

        const response = await apiFetch<{
          success: boolean;
          data: BackendCourse[];
        }>("/enrollments/teacher/course-stats", {
          token,
        });

        const backendCourses = response.data || [];

        const mappedCourses: TeacherCourse[] = backendCourses.map((course) => ({
          id: course.id,
          code: course.code,
          title: course.name,
          description:
            course.description ||
            `${course.department} course offered in ${course.semester}.`,
          semester: course.semester,
          attendance: course.attendance,
          students: course._count.enrollments,
          assignments: course._count.assignments,
          progress: course.progress,
          status: course.status === "ACTIVE" ? "Active" : "Completed",
        }));

        setCourses(mappedCourses);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load your courses",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  return (
    <div className="flex min-h-screen bg-[#EAE6DC]">
      <main className="min-w-0 flex-1 p-5 sm:p-8">
        <div className="mb-8">
          <p className="font-serif text-sm text-[#B45A2A]">Teacher Portal</p>

          <h1 className="mt-1 font-serif text-2xl font-bold tracking-tight text-[#333333] sm:text-3xl">
            My Courses
          </h1>

          <p className="mt-2 font-serif text-sm text-slate-500">
            Manage your courses, track student progress, and organize your
            teaching materials.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-slate-500">Loading your courses...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="rounded-xl bg-white p-10 text-center shadow-sm">
            <p className="font-medium text-slate-700">
              No courses assigned yet
            </p>

            <p className="mt-1 text-sm text-slate-500">
              You don&apos;t have any courses assigned to you yet. Please
              contact the administrator.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {courses.map((course) => (
              <TeacherCourseCard
                key={course.id}
                id={course.id}
                code={course.code}
                title={course.title}
                description={course.description}
                students={course.students}
                assignments={course.assignments}
                progress={course.progress}
                semester={course.semester}
                attendance={course.attendance}
                status={course.status}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
