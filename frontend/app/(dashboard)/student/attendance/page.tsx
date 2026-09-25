"use client";

import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useRealtimeRefresh } from "@/lib/hooks/useRealtimeSync";
import TeacherMetricCard from "@/components/teachers/TeacherMetricCard";

type ApiAttendance = {
  id: number;
  studentId: number;
  courseId: number;
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE";
  createdAt: string;
  updatedAt: string;
  course: {
    id: number;
    code: string;
    name: string;
    semester: string;
  };
};

type CourseStats = {
  courseId: number;
  courseCode: string;
  courseName: string;
  semester: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  percentage: number;
};

type AttendanceRecord = {
  id: number;
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE";
  courseCode: string;
  courseName: string;
};

function computeCourseStats(records: ApiAttendance[]): CourseStats[] {
  const map = new Map<
    number,
    {
      courseCode: string;
      courseName: string;
      semester: string;
      total: number;
      present: number;
      absent: number;
      late: number;
    }
  >();

  for (const record of records) {
    const existing = map.get(record.courseId);

    if (!existing) {
      map.set(record.courseId, {
        courseCode: record.course.code,
        courseName: record.course.name,
        semester: record.course.semester,
        total: 1,
        present: record.status === "PRESENT" ? 1 : 0,
        absent: record.status === "ABSENT" ? 1 : 0,
        late: record.status === "LATE" ? 1 : 0,
      });

      continue;
    }

    existing.total += 1;

    if (record.status === "PRESENT") {
      existing.present += 1;
    } else if (record.status === "ABSENT") {
      existing.absent += 1;
    } else if (record.status === "LATE") {
      existing.late += 1;
    }
  }

  return Array.from(map.entries()).map(([courseId, stats]) => ({
    courseId,
    courseCode: stats.courseCode,
    courseName: stats.courseName,
    semester: stats.semester,
    total: stats.total,
    present: stats.present,
    absent: stats.absent,
    late: stats.late,
    percentage:
      stats.total > 0
        ? Math.round(((stats.present + stats.late) / stats.total) * 100)
        : 0,
  }));
}

function computeOverallStats(stats: CourseStats[]) {
  const total = stats.reduce((sum, course) => sum + course.total, 0);
  const present = stats.reduce((sum, course) => sum + course.present, 0);
  const absent = stats.reduce((sum, course) => sum + course.absent, 0);
  const late = stats.reduce((sum, course) => sum + course.late, 0);
  const percentage =
    total > 0 ? Math.round(((present + late) / total) * 100) : 0;

  return {
    total,
    present,
    absent,
    late,
    percentage,
  };
}

export default function StudentAttendancePage() {
  const [records, setRecords] = useState<ApiAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [courseFilter, setCourseFilter] = useState("All");
  const [search, setSearch] = useState("");

  const fetchAttendance = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError("");

      const token = localStorage.getItem("scm_token");

      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await apiFetch<{
        success: boolean;
        data: ApiAttendance[];
      }>("/attendance/my-attendance", {
        token,
      });

      setRecords(response.data || []);
    } catch (error) {
      console.error("Failed to fetch attendance:", error);

      setError(
        error instanceof Error ? error.message : "Failed to load attendance",
      );
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useRealtimeRefresh(async () => {
    await fetchAttendance(false);
  });

  const loadInitialAttendance = useEffectEvent(() => {
    void fetchAttendance();
  });

  useEffect(() => {
    const timer = setTimeout(loadInitialAttendance, 0);
    return () => clearTimeout(timer);
  }, []);

  const courseStats = useMemo(() => computeCourseStats(records), [records]);

  const overallStats = useMemo(
    () => computeOverallStats(courseStats),
    [courseStats],
  );

  const filteredRecords = useMemo(() => {
    let result: AttendanceRecord[] = records.map((record) => ({
      id: record.id,
      date: new Date(record.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      status: record.status,
      courseCode: record.course.code,
      courseName: record.course.name,
    }));

    if (courseFilter !== "All") {
      const courseId = Number(courseFilter);
      result = result.filter((record) => {
        const original = records.find((r) => r.id === record.id);
        return original?.courseId === courseId;
      });
    }

    if (search.trim()) {
      const term = search.toLowerCase().trim();

      result = result.filter((record) => {
        return (
          record.courseCode.toLowerCase().includes(term) ||
          record.courseName.toLowerCase().includes(term) ||
          record.date.toLowerCase().includes(term) ||
          record.status.toLowerCase().includes(term)
        );
      });
    }

    return result;
  }, [records, courseFilter, search]);

  const getStatusBadge = (status: "PRESENT" | "ABSENT" | "LATE") => {
    const styles: Record<"PRESENT" | "ABSENT" | "LATE", string> = {
      PRESENT: "bg-green-50 text-green-600",
      ABSENT: "bg-red-50 text-red-600",
      LATE: "bg-amber-50 text-amber-600",
    };

    const labels: Record<"PRESENT" | "ABSENT" | "LATE", string> = {
      PRESENT: "Present",
      ABSENT: "Absent",
      LATE: "Late",
    };

    return (
      <span
        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${styles[status]}`}
      >
        {labels[status]}
      </span>
    );
  };

  return (
    <main className="min-h-screen bg-[#EAE6DC] p-5 sm:p-8">
      <p className="mb-6 rounded-xl border border-[#B45A2A]/15 bg-[#F0EDE4] px-5 py-4 text-sm leading-6 text-slate-600">
        Overall attendance counts Present and Late. On-time rate counts Present
        only:{" "}
        {overallStats.total
          ? Math.round((overallStats.present / overallStats.total) * 100)
          : 0}
        %. Late arrivals remain listed separately.
      </p>
      <div className="mb-8">
        <p className="font-serif text-sm text-[#B45A2A]">Student Portal</p>

        <h1 className="mt-1 font-serif text-3xl font-bold text-[#333333]">
          Attendance
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Track your attendance across all enrolled courses.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <section className="mb-8">
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-5">
          <TeacherMetricCard
            label="Total Classes"
            value={overallStats.total}
            icon="courses"
          />
          <TeacherMetricCard
            label="Present"
            value={overallStats.present}
            icon="present"
            valueClassName="text-green-600"
          />
          <TeacherMetricCard
            label="Absent"
            value={overallStats.absent}
            icon="absent"
            valueClassName="text-red-600"
          />
          <TeacherMetricCard
            label="Late"
            value={overallStats.late}
            icon="late"
            valueClassName="text-amber-600"
          />
          <TeacherMetricCard
            label="Attendance %"
            value={`${overallStats.percentage}%`}
            icon="progress"
          />
        </div>
      </section>

      <section className="mb-8 rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="font-serif text-lg font-bold text-[#333333]">
            Course-wise Attendance
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Breakdown by enrolled course.
          </p>
        </div>

        {courseStats.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">
            No attendance records yet.
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {courseStats.map((course) => (
              <div
                key={course.courseId}
                className="rounded-xl border border-slate-100 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-700">
                      {course.courseCode}
                    </p>

                    <p className="mt-1 break-words text-xs leading-5 text-slate-400">
                      {course.courseName}
                    </p>

                    <p className="text-xs text-slate-400">
                      Semester {course.semester}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p
                      className={`text-2xl font-bold ${
                        course.percentage >= 75
                          ? "text-green-600"
                          : course.percentage >= 50
                            ? "text-amber-600"
                            : "text-red-600"
                      }`}
                    >
                      {course.percentage}%
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
                  <div>
                    <p className="text-xs text-slate-400">Total</p>

                    <p className="text-sm font-semibold text-slate-700">
                      {course.total}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-green-500">Present</p>

                    <p className="text-sm font-semibold text-green-600">
                      {course.present}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-red-500">Absent</p>

                    <p className="text-sm font-semibold text-red-600">
                      {course.absent}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-amber-500">Late</p>

                    <p className="text-sm font-semibold text-amber-600">
                      {course.late}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-serif text-lg font-bold text-[#333333]">
              Attendance Records
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Your daily attendance history.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center">
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 outline-none focus:border-[#B45A2A] lg:w-auto"
            >
              <option value="All">All Courses</option>

              {courseStats.map((course) => (
                <option key={course.courseId} value={course.courseId}>
                  {course.courseCode}
                </option>
              ))}
            </select>

            <div className="relative w-full lg:w-64">
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
                placeholder="Search records..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#B45A2A] focus:ring-2 focus:ring-[#B45A2A]/10"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-slate-400">
            Loading attendance records...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">
            No attendance records found.
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full table-fixed text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="w-36 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Date
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Course
                    </th>

                    <th className="w-32 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRecords.map((record) => (
                    <tr
                      key={record.id}
                      className="border-b border-slate-50 transition hover:bg-[#F8F6F0]"
                    >
                      <td className="whitespace-nowrap px-4 py-3 align-middle text-sm font-medium text-slate-700">
                        {record.date}
                      </td>

                      <td className="px-4 py-3 align-middle">
                        <p className="text-sm font-medium text-slate-700">
                          {record.courseCode}
                        </p>
                        <p className="mt-0.5 break-words text-xs text-slate-400">
                          {record.courseName}
                        </p>
                      </td>

                      <td className="px-4 py-3 text-center align-middle">
                        {getStatusBadge(record.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 lg:hidden">
              {filteredRecords.map((record) => (
                <article
                  key={record.id}
                  className="rounded-xl border border-slate-100 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-semibold text-slate-800">
                        {record.courseCode}
                      </p>
                      <p className="mt-1 break-words text-xs leading-5 text-slate-400">
                        {record.courseName}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {getStatusBadge(record.status)}
                    </div>
                  </div>

                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Date
                    </p>
                    <time className="mt-1 block text-sm font-medium text-slate-700">
                      {record.date}
                    </time>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
