"use client";

import { useEffect, useMemo, useState } from "react";
import TeacherTable from "@/components/admins/TeacherTable";
import { apiFetch } from "@/lib/api";
import TeacherMetricCard from "@/components/teachers/TeacherMetricCard";

type BackendTeacher = {
  id: number;
  name: string;
  username: string;
  email: string;
  role: "TEACHER";
  status: "ACTIVE" | "PENDING" | "REJECTED" | "INACTIVE";
  teacherProfile: {
    department: string;
    qualification: string;
    experience: string;
  } | null;
};

type Teacher = {
  id: number;
  name: string;
  email: string;
  department: string;
  courses: number;
  students: number;
  status: "Active" | "Inactive";
};

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All");

  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTeachers() {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("scm_token");

        if (!token) {
          setError("Authentication required.");
          return;
        }

        const response = await apiFetch<{
          success: boolean;
          data: BackendTeacher[];
        }>("/teachers", {
          token,
        });

        const formattedTeachers: Teacher[] = response.data
          .filter(
            (teacher) =>
              teacher.status === "ACTIVE" || teacher.status === "INACTIVE",
          )
          .map((teacher) => ({
            id: teacher.id,
            name: teacher.name,
            email: teacher.email,
            department: teacher.teacherProfile?.department ?? "Not specified",
            courses: 0,
            students: 0,
            status: teacher.status === "ACTIVE" ? "Active" : "Inactive",
          }));

        setTeachers(formattedTeachers);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to load teachers.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadTeachers();
  }, []);

  const departments = useMemo(() => {
    return [
      "All",
      ...Array.from(new Set(teachers.map((teacher) => teacher.department))),
    ];
  }, [teachers]);

  const filteredTeachers = useMemo(() => {
    return teachers.filter((teacher) => {
      const term = search.toLowerCase().trim();

      const matchesSearch =
        teacher.name.toLowerCase().includes(term) ||
        teacher.email.toLowerCase().includes(term) ||
        teacher.department.toLowerCase().includes(term);

      const matchesDepartment =
        department === "All" || teacher.department === department;

      return matchesSearch && matchesDepartment;
    });
  }, [teachers, search, department]);

  const activeTeachers = teachers.filter(
    (teacher) => teacher.status === "Active",
  ).length;

  const inactiveTeachers = teachers.filter(
    (teacher) => teacher.status === "Inactive",
  ).length;

  const handleToggleStatus = async (id: number) => {
    try {
      setError("");
      setProcessingId(id);

      const token = localStorage.getItem("scm_token");

      if (!token) {
        setError("Authentication required.");
        return;
      }

      const teacher = teachers.find((item) => item.id === id);

      if (!teacher) {
        setError("Teacher not found.");
        return;
      }

      const newStatus = teacher.status === "Active" ? "INACTIVE" : "ACTIVE";

      await apiFetch(`/teachers/${id}`, {
        method: "PUT",
        token,
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      setTeachers((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                status: newStatus === "ACTIVE" ? "Active" : "Inactive",
              }
            : item,
        ),
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update teacher status.",
      );
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#EAE6DC] px-4 py-6 sm:p-8">
      <div className="mb-8">
        <p className="font-serif text-sm text-[#B45A2A]">SCM Administration</p>

        <h1 className="mt-1 font-serif text-3xl font-bold text-[#333333]">
          Teachers
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Manage approved teachers and monitor their teaching activity.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <TeacherMetricCard
          label="Total Teachers"
          value={loading ? "..." : teachers.length}
          icon="students"
          description="Approved teachers"
        />

        <TeacherMetricCard
          label="Active Teachers"
          value={loading ? "..." : activeTeachers}
          icon="active"
          valueClassName="text-green-600"
          description="Currently active"
        />

        <TeacherMetricCard
          label="Inactive Teachers"
          value={loading ? "..." : inactiveTeachers}
          icon="absent"
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
              placeholder="Search teachers..."
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
            Teacher List
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            {loading
              ? "Loading teachers..."
              : `Showing ${filteredTeachers.length} of ${teachers.length} teachers`}
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white px-4 py-10 text-center text-sm text-slate-400 shadow-sm sm:p-10">
            Loading teachers...
          </div>
        ) : teachers.length === 0 ? (
          <div className="rounded-2xl bg-white px-4 py-10 text-center text-sm text-slate-400 shadow-sm sm:p-10">
            No approved teachers found.
          </div>
        ) : (
          <TeacherTable
            teachers={filteredTeachers}
            onToggleStatus={handleToggleStatus}
          />
        )}
      </section>

      {processingId !== null && (
        <div className="fixed bottom-4 left-4 right-4 rounded-xl bg-[#333333] px-4 py-3 text-center text-sm font-medium text-white shadow-lg sm:bottom-5 sm:left-auto sm:right-5">
          Updating teacher status...
        </div>
      )}
    </main>
  );
}
