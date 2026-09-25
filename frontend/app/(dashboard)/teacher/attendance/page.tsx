"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import TeacherMetricCard from "@/components/teachers/TeacherMetricCard";

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE";

type Course = {
  id: number;
  code: string;
  name: string;
  semester: string;
  _count?: {
    enrollments: number;
  };
};

type Student = {
  id: number;
  studentId: string;
  department?: string;
  year?: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
};

type AttendanceRecord = {
  id: number;
  studentId: number;
  courseId: number;
  date: string;
  status: AttendanceStatus;
};

const attendanceStatuses: {
  value: AttendanceStatus;
  label: string;
  activeClass: string;
}[] = [
  {
    value: "PRESENT",
    label: "Present",
    activeClass: "border-emerald-600 bg-emerald-600 text-white",
  },
  {
    value: "ABSENT",
    label: "Absent",
    activeClass: "border-red-500 bg-red-500 text-white",
  },
  {
    value: "LATE",
    label: "Late",
    activeClass: "border-amber-500 bg-amber-500 text-white",
  },
];

function getTodayInputValue() {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);

  return localDate.toISOString().slice(0, 10);
}

export default function TeacherAttendancePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedDate, setSelectedDate] = useState(getTodayInputValue);
  const [students, setStudents] = useState<Student[]>([]);
  const [statuses, setStatuses] = useState<Record<number, AttendanceStatus>>(
    {},
  );
  const [existingRecordCount, setExistingRecordCount] = useState(0);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingRegister, setLoadingRegister] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadCourses() {
      try {
        setLoadingCourses(true);
        setError("");

        const token = localStorage.getItem("scm_token");

        if (!token) {
          throw new Error("Authentication required");
        }

        const response = await apiFetch<{
          success: boolean;
          data: Course[];
        }>("/enrollments/teacher/course-stats", {
          token,
        });

        if (cancelled) return;

        const teacherCourses = response.data || [];
        setCourses(teacherCourses);
        setSelectedCourseId(
          (current) => current || String(teacherCourses[0]?.id || ""),
        );
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load courses",
          );
        }
      } finally {
        if (!cancelled) setLoadingCourses(false);
      }
    }

    loadCourses();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedCourseId || !selectedDate) {
      return;
    }

    let cancelled = false;

    async function loadRegister() {
      try {
        setLoadingRegister(true);
        setError("");
        setSuccessMessage("");

        const token = localStorage.getItem("scm_token");

        if (!token) {
          throw new Error("Authentication required");
        }

        const [studentResponse, attendanceResponse] = await Promise.all([
          apiFetch<{
            success: boolean;
            data: { student: Student }[];
          }>(`/enrollments/teacher/course/${selectedCourseId}/students`, {
            token,
          }),
          apiFetch<{
            success: boolean;
            data: AttendanceRecord[];
          }>(`/attendance/course/${selectedCourseId}`, {
            token,
          }),
        ]);

        if (cancelled) return;

        const enrolledStudents = (studentResponse.data || []).map(
          (enrollment) => enrollment.student,
        );
        const dayRecords = (attendanceResponse.data || []).filter(
          (record) => record.date.slice(0, 10) === selectedDate,
        );
        const savedStatuses = new Map(
          dayRecords.map((record) => [record.studentId, record.status]),
        );
        const nextStatuses: Record<number, AttendanceStatus> = {};

        for (const student of enrolledStudents) {
          nextStatuses[student.id] = savedStatuses.get(student.id) || "PRESENT";
        }

        setStudents(enrolledStudents);
        setStatuses(nextStatuses);
        setExistingRecordCount(dayRecords.length);
      } catch (loadError) {
        if (!cancelled) {
          setStudents([]);
          setStatuses({});
          setExistingRecordCount(0);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load the attendance register",
          );
        }
      } finally {
        if (!cancelled) setLoadingRegister(false);
      }
    }

    loadRegister();

    return () => {
      cancelled = true;
    };
  }, [selectedCourseId, selectedDate]);

  const selectedCourse = courses.find(
    (course) => String(course.id) === selectedCourseId,
  );
  const presentCount = students.filter(
    (student) => statuses[student.id] === "PRESENT",
  ).length;
  const absentCount = students.filter(
    (student) => statuses[student.id] === "ABSENT",
  ).length;
  const lateCount = students.filter(
    (student) => statuses[student.id] === "LATE",
  ).length;

  function updateStatus(studentId: number, status: AttendanceStatus) {
    setStatuses((current) => ({
      ...current,
      [studentId]: status,
    }));
    setSuccessMessage("");
  }

  function markAllPresent() {
    const nextStatuses: Record<number, AttendanceStatus> = {};

    for (const student of students) {
      nextStatuses[student.id] = "PRESENT";
    }

    setStatuses(nextStatuses);
    setSuccessMessage("");
  }

  async function saveAttendance() {
    if (!selectedCourseId || !selectedDate || students.length === 0) return;

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      const token = localStorage.getItem("scm_token");

      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await apiFetch<{
        success: boolean;
        message: string;
        data: AttendanceRecord[];
      }>(`/attendance/course/${selectedCourseId}`, {
        method: "PUT",
        token,
        body: JSON.stringify({
          date: selectedDate,
          records: students.map((student) => ({
            studentId: student.id,
            status: statuses[student.id] || "PRESENT",
          })),
        }),
      });

      setExistingRecordCount(response.data.length);
      setSuccessMessage(response.message || "Attendance saved successfully");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save attendance",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#EAE6DC] px-5 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="font-serif text-sm text-[#B45A2A]">Teacher Portal</p>
            <h1 className="mt-1 font-serif text-3xl font-bold text-[#333333]">
              Attendance Register
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Record daily attendance for students enrolled in your courses.
            </p>
          </div>

          <button
            type="button"
            onClick={markAllPresent}
            disabled={loadingRegister || students.length === 0}
            className="rounded-xl border border-[#B45A2A] bg-white px-4 py-2.5 text-sm font-semibold text-[#B45A2A] transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Mark all present
          </button>
        </div>

        <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Course
              </span>
              <select
                value={selectedCourseId}
                onChange={(event) => setSelectedCourseId(event.target.value)}
                disabled={loadingCourses || courses.length === 0}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#B45A2A] focus:ring-2 focus:ring-orange-100 disabled:bg-slate-50"
              >
                {courses.length === 0 ? (
                  <option value="">No assigned courses</option>
                ) : (
                  courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code} - {course.name}
                    </option>
                  ))
                )}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Attendance date
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#B45A2A] focus:ring-2 focus:ring-orange-100"
              />
            </label>
          </div>

          {selectedCourse && (
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">
                {selectedCourse.semester}
              </span>
              <span>
                {selectedCourse._count?.enrollments ?? students.length} students
              </span>
              <span>
                {existingRecordCount > 0
                  ? `${existingRecordCount} saved records loaded`
                  : "New register: students default to Present"}
              </span>
            </div>
          )}
        </section>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
            {successMessage}
          </div>
        )}

        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <TeacherMetricCard
            label="Total students"
            value={students.length}
            icon="students"
          />
          <TeacherMetricCard
            label="Present"
            value={presentCount}
            icon="present"
            valueClassName="text-emerald-600"
          />
          <TeacherMetricCard
            label="Absent"
            value={absentCount}
            icon="absent"
            valueClassName="text-red-500"
          />
          <TeacherMetricCard
            label="Late"
            value={lateCount}
            icon="late"
            valueClassName="text-amber-500"
          />
        </div>

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
            <div>
              <h2 className="font-serif text-lg font-bold text-[#333333]">
                Student Register
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Select one attendance status for every student.
              </p>
            </div>

            <button
              type="button"
              onClick={saveAttendance}
              disabled={loadingRegister || saving || students.length === 0}
              className="w-full rounded-xl bg-[#111827] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {saving ? "Saving..." : "Save attendance"}
            </button>
          </div>

          {loadingCourses || loadingRegister ? (
            <div className="px-6 py-14 text-center text-sm text-slate-400">
              Loading attendance register...
            </div>
          ) : courses.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <p className="font-medium text-slate-700">No courses assigned</p>
              <p className="mt-1 text-sm text-slate-400">
                An administrator must assign a course before attendance can be
                marked.
              </p>
            </div>
          ) : students.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <p className="font-medium text-slate-700">No enrolled students</p>
              <p className="mt-1 text-sm text-slate-400">
                This course does not have any active student enrollments.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[760px] text-left">
                  <thead className="bg-[#F8F6F1] text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Student</th>
                      <th className="px-6 py-4 font-semibold">Student ID</th>
                      <th className="px-6 py-4 font-semibold">Department</th>
                      <th className="px-6 py-4 text-center font-semibold">
                        Attendance status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((student) => (
                      <tr
                        key={student.id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="px-6 py-4 align-middle">
                          <p className="text-sm font-semibold text-slate-800">
                            {student.user.name}
                          </p>
                          <p className="mt-0.5 break-all text-xs text-slate-400">
                            {student.user.email}
                          </p>
                        </td>
                        <td className="px-6 py-4 align-middle text-sm text-slate-600">
                          {student.studentId}
                        </td>
                        <td className="px-6 py-4 align-middle text-sm text-slate-600">
                          {student.department || "Not specified"}
                        </td>
                        <td className="px-6 py-4 align-middle">
                          <div
                            className="flex justify-center gap-2"
                            role="group"
                            aria-label={`Attendance for ${student.user.name}`}
                          >
                            {attendanceStatuses.map((status) => {
                              const active =
                                statuses[student.id] === status.value;

                              return (
                                <button
                                  key={status.value}
                                  type="button"
                                  aria-pressed={active}
                                  onClick={() =>
                                    updateStatus(student.id, status.value)
                                  }
                                  className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                                    active
                                      ? status.activeClass
                                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                                  }`}
                                >
                                  {status.label}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 p-3 sm:p-4 lg:hidden">
                {students.map((student) => (
                  <article
                    key={student.id}
                    className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
                  >
                    <div className="min-w-0 border-b border-slate-100 pb-3">
                      <p className="break-words text-sm font-semibold text-slate-800">
                        {student.user.name}
                      </p>
                      <p className="mt-1 break-all text-xs leading-5 text-slate-400">
                        {student.user.email}
                      </p>
                    </div>

                    <dl className="grid grid-cols-2 gap-3 py-3">
                      <div className="min-w-0">
                        <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          Student ID
                        </dt>
                        <dd className="mt-1 break-words text-sm font-medium text-slate-700">
                          {student.studentId}
                        </dd>
                      </div>
                      <div className="min-w-0 text-right">
                        <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          Department
                        </dt>
                        <dd className="mt-1 break-words text-sm font-medium text-slate-700">
                          {student.department || "Not specified"}
                        </dd>
                      </div>
                    </dl>

                    <div>
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Attendance status
                      </p>
                      <div
                        className="grid grid-cols-3 gap-2"
                        role="group"
                        aria-label={`Attendance for ${student.user.name}`}
                      >
                        {attendanceStatuses.map((status) => {
                          const active = statuses[student.id] === status.value;

                          return (
                            <button
                              key={status.value}
                              type="button"
                              aria-pressed={active}
                              onClick={() =>
                                updateStatus(student.id, status.value)
                              }
                              className={`flex min-h-10 items-center justify-center rounded-lg border px-2 py-2 text-[11px] font-semibold transition sm:text-xs ${
                                active
                                  ? status.activeClass
                                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                              }`}
                            >
                              {status.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
