"use client";

import { useEffect, useMemo, useState } from "react";

import AdminStudentTable from "@/components/admins/AdminStudentTable";
import TeacherMetricCard from "@/components/teachers/TeacherMetricCard";
import { apiFetch } from "@/lib/api";

type BackendStudent = {
  id: number;
  name: string;
  username?: string;
  email: string;
  role?: string;
  status: "ACTIVE" | "INACTIVE";
  studentProfile?: {
    studentId?: string;
    department?: string;
    year?: string;
  } | null;
};

type StudentsResponse = {
  success: boolean;
  data?: BackendStudent[];
  students?: BackendStudent[];
};

type Student = {
  id: number;
  name: string;
  studentId: string;
  email: string;
  department: string;
  year: string;
  courses: number;
  status: "Active" | "Inactive";
};

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("scm_token");

        if (!token) {
          throw new Error("Authentication token not found.");
        }

        const response = await apiFetch<StudentsResponse>("/students", {
          token,
        });

        const backendStudents = response.data ?? response.students ?? [];

        const formattedStudents: Student[] = backendStudents.map((student) => ({
          id: student.id,
          name: student.name,
          studentId:
            student.studentProfile?.studentId ||
            student.username ||
            `STU-${String(student.id).padStart(3, "0")}`,
          email: student.email,
          department: student.studentProfile?.department || "Not assigned",
          year: student.studentProfile?.year || "Not assigned",
          courses: 0,
          status: student.status === "ACTIVE" ? "Active" : "Inactive",
        }));

        setStudents(formattedStudents);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load students.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const departments = useMemo(() => {
    return [
      "All",
      ...Array.from(
        new Set(
          students
            .map((student) => student.department)
            .filter((department) => department !== "Not assigned"),
        ),
      ),
    ];
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const term = search.toLowerCase().trim();

      const matchesSearch =
        student.name.toLowerCase().includes(term) ||
        student.studentId.toLowerCase().includes(term) ||
        student.email.toLowerCase().includes(term);

      const matchesDepartment =
        department === "All" || student.department === department;

      return matchesSearch && matchesDepartment;
    });
  }, [students, search, department]);

  const activeStudents = students.filter(
    (student) => student.status === "Active",
  ).length;

  const inactiveStudents = students.filter(
    (student) => student.status === "Inactive",
  ).length;

  const handleToggleStatus = async (id: number) => {
    const student = students.find((currentStudent) => currentStudent.id === id);

    if (!student) return;

    try {
      setError("");

      const token = localStorage.getItem("scm_token");

      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const newStatus = student.status === "Active" ? "INACTIVE" : "ACTIVE";

      await apiFetch(`/students/${id}`, {
        method: "PUT",
        token,
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      setStudents((current) =>
        current.map((currentStudent) =>
          currentStudent.id === id
            ? {
                ...currentStudent,
                status: newStatus === "ACTIVE" ? "Active" : "Inactive",
              }
            : currentStudent,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update student status.",
      );
    }
  };

  return (
    <main className="min-h-screen bg-[#EAE6DC] px-4 py-6 sm:p-8">
      <div className="mb-8">
        <p className="font-serif text-sm text-[#B45A2A]">SCM Administration</p>

        <h1 className="mt-1 font-serif text-3xl font-bold text-[#333333]">
          Students
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          View registered students and manage their account status.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <TeacherMetricCard
          label="Total Students"
          value={loading ? "..." : students.length}
          icon="students"
          description="Registered students"
        />

        <TeacherMetricCard
          label="Active Students"
          value={loading ? "..." : activeStudents}
          icon="active"
          valueClassName="text-green-600"
          description="Currently active"
        />

        <TeacherMetricCard
          label="Inactive Students"
          value={loading ? "..." : inactiveStudents}
          icon="absent"
          valueClassName="text-slate-500"
          description="Currently inactive"
        />
      </div>

      <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students..."
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#B45A2A] focus:ring-2 focus:ring-[#B45A2A]/10"
            />
          </div>

          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 outline-none focus:border-[#B45A2A] lg:w-auto"
          >
            {departments.map((item) => (
              <option key={item} value={item}>
                {item === "All" ? "All Departments" : item}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-4">
          <h2 className="font-serif text-xl font-bold text-[#333333]">
            Student List
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            {loading
              ? "Loading students..."
              : `Showing ${filteredStudents.length} of ${students.length} students`}
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          {loading ? (
            <div className="flex min-h-[180px] items-center justify-center px-4 text-center text-sm text-slate-400">
              Loading students...
            </div>
          ) : (
            <AdminStudentTable
              students={filteredStudents}
              onToggleStatus={handleToggleStatus}
            />
          )}
        </div>
      </section>
    </main>
  );
}
