"use client";

import { useEffect, useMemo, useState } from "react";
import StudentTable from "@/components/teachers/StudentTable";
import TeacherMetricCard from "@/components/teachers/TeacherMetricCard";
import { apiFetch } from "@/lib/api";

type ApiStudent = {
  id: number;
  name: string;
  email: string;
  studentId: string;
  department: string;
  year: string;
  progress: number;
  grade: string;
  attendance: number;
  status: string;
  courses: {
    courseId: number;
    courseCode: string;
    courseName: string;
  }[];
};

type Student = {
  id: number;
  name: string;
  studentId: string;
  email: string;
  course: string;
  courseCodes: string[];
  year: string;
  status: "Active" | "Inactive";
  progress: number;
  grade: string;
  attendance: number;
};

type StudentsResponse = {
  success: boolean;
  data: ApiStudent[];
};

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("scm_token");

        if (!token) {
          throw new Error("Authentication required");
        }

        const response = await apiFetch<StudentsResponse>(
          "/teachers/me/students",
          {
            token,
          },
        );

        const apiStudents = response.data || [];

        const mappedStudents: Student[] = apiStudents.map((student) => {
          const courseCodes = student.courses
            .map((c) => c.courseCode)
            .join(", ");

          return {
            id: student.id,
            name: student.name,
            studentId: student.studentId,
            email: student.email,
            course: courseCodes || "Not assigned",
            year: student.year || "N/A",
            courseCodes: student.courses.map((course) => course.courseCode),
            status: student.status === "ACTIVE" ? "Active" : "Inactive",
            progress: student.progress ?? 0,
            grade: student.grade ?? "N/A",
            attendance: student.attendance ?? 0,
          };
        });

        setStudents(mappedStudents);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load students",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const courses = [
    "All",
    ...Array.from(new Set(students.flatMap((student) => student.courseCodes))),
  ];

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const searchTerm = search.toLowerCase().trim();

      const matchesSearch =
        student.name.toLowerCase().includes(searchTerm) ||
        student.studentId.toLowerCase().includes(searchTerm) ||
        student.email.toLowerCase().includes(searchTerm);

      const matchesCourse =
        courseFilter === "All" || student.courseCodes.includes(courseFilter);

      const matchesStatus =
        statusFilter === "All" || student.status === statusFilter;

      return matchesSearch && matchesCourse && matchesStatus;
    });
  }, [students, search, courseFilter, statusFilter]);

  const activeStudents = students.filter(
    (student) => student.status === "Active",
  ).length;

  const averageProgress = students.length
    ? Math.round(
        students.reduce((total, student) => total + student.progress, 0) /
          students.length,
      )
    : 0;

  const averageGradeStudents = students.filter(
    (student) =>
      student.grade === "A+" || student.grade === "A" || student.grade === "A-",
  ).length;

  return (
    <main className="min-h-screen bg-[#EAE6DC] p-5 sm:p-8">
      <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="font-serif text-sm text-[#B45A2A]">Teacher Portal</p>

          <h1 className="mt-1 font-serif text-3xl font-bold text-[#333333]">
            Students
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            View your students, monitor their progress and manage their academic
            information.
          </p>
        </div>

        <div className="rounded-xl w-40 bg-slate-900 px-4 py-3 shadow-sm">
          <p className="text-xs text-slate-300">Total Students</p>

          <p className="mt-1 text-sm font-semibold text-white">
            {students.length}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <TeacherMetricCard
          label="Active Students"
          value={activeStudents}
          icon="students"
        />
        <TeacherMetricCard
          label="Average Progress"
          value={`${averageProgress}%`}
          icon="progress"
        />
        <TeacherMetricCard
          label="A Grade Students"
          value={averageGradeStudents}
          icon="excellent"
        />
      </div>

      <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-md">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path strokeLinecap="round" d="m20 20-4-4" />
            </svg>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students..."
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#B45A2A] focus:ring-2 focus:ring-[#B45A2A]/10"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 outline-none focus:border-[#B45A2A]"
            >
              {courses.map((course) => (
                <option key={course} value={course}>
                  {course === "All" ? "All Courses" : course}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 outline-none focus:border-[#B45A2A]"
            >
              <option value="All">All Status</option>

              <option value="Active">Active</option>

              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-4">
          <h2 className="font-serif text-xl font-bold text-[#333333]">
            Student List
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Showing {filteredStudents.length} of {students.length} students
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-slate-500">Loading students...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-red-50 p-6 text-center text-sm text-red-600 shadow-sm">
            {error}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <StudentTable students={filteredStudents} />
          </div>
        )}
      </section>
    </main>
  );
}
