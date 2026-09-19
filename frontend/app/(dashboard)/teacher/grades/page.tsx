"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import ConfirmModal from "@/components/ui/ConfirmModal";
import TeacherMetricCard from "@/components/teachers/TeacherMetricCard";

type ApiGrade = {
  id: number;
  studentId: number;
  courseId: number;
  assignment: number | null;
  midterm: number | null;
  final: number | null;
  total: number;

  student: {
    id: number;
    studentId: string;
    user: {
      id: number;
      name: string;
      email: string;
    };
  };

  course: {
    id: number;
    code: string;
    name: string;
    semester: string;
  };
};

type Course = {
  id: number;
  code: string;
  name: string;
  department?: string;
  semester: string;
  status?: string;
};

type CourseStudent = {
  student: {
    id: number;
    studentId: string;
    department?: string;
    year?: number;
    user: {
      id: number;
      name: string;
      email: string;
    };
  };
};

type GradeRecord = {
  id: number;
  studentName: string;
  studentId: string;
  course: string;
  courseId: number;
  assignment: number;
  midterm: number;
  final: number;
  total: number;
  grade: string;
};

function getGrade(total: number) {
  if (total >= 80) return "A+";
  if (total >= 75) return "A";
  if (total >= 70) return "A-";
  if (total >= 65) return "B+";
  if (total >= 60) return "B";
  if (total >= 55) return "B-";
  if (total >= 50) return "C+";
  if (total >= 45) return "C";
  if (total >= 40) return "D";
  return "F";
}

function mapGrade(grade: ApiGrade): GradeRecord {
  return {
    id: grade.id,
    studentName: grade.student?.user?.name || "Unknown Student",
    studentId: grade.student?.studentId || "Unknown",
    course: grade.course?.code || "Unknown Course",
    courseId: grade.courseId,
    assignment: grade.assignment ?? 0,
    midterm: grade.midterm ?? 0,
    final: grade.final ?? 0,
    total: grade.total ?? 0,
    grade: getGrade(grade.total ?? 0),
  };
}

export default function TeacherGradesPage() {
  const [courses, setCourses] = useState<Course[]>([]);

  const [grades, setGrades] = useState<GradeRecord[]>([]);

  const [courseFilter, setCourseFilter] = useState("All");

  const [search, setSearch] = useState("");

  const [loadingCourses, setLoadingCourses] = useState(true);

  const [loadingGrades, setLoadingGrades] = useState(false);

  const [loadingStudents, setLoadingStudents] = useState(false);

  const [error, setError] = useState("");

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<GradeRecord | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);

  const [editingGrade, setEditingGrade] = useState<GradeRecord | null>(null);

  const [students, setStudents] = useState<CourseStudent[]>([]);

  const [selectedStudent, setSelectedStudent] = useState("");

  const [assignmentMark, setAssignmentMark] = useState("");

  const [midtermMark, setMidtermMark] = useState("");

  const [finalMark, setFinalMark] = useState("");

  const [savingGrade, setSavingGrade] = useState(false);

  const [modalError, setModalError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoadingCourses(true);
        setError("");

        const scm_token = localStorage.getItem("scm_token");

        if (!scm_token) {
          throw new Error("Authentication required");
        }

        const response = await apiFetch<{
          success: boolean;
          data: Course[];
        }>("/enrollments/teacher/course-stats", {
          token: scm_token,
        });

        setCourses(response.data || []);
      } catch (error) {
        console.error("Failed to fetch teacher courses:", error);

        setError(
          error instanceof Error ? error.message : "Failed to load courses",
        );
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchCourses();
  }, []);

  useEffect(() => {
    const fetchGrades = async () => {
      if (courseFilter === "All") {
        setGrades([]);
        return;
      }

      try {
        setLoadingGrades(true);
        setError("");

        const scm_token = localStorage.getItem("scm_token");

        if (!scm_token) {
          throw new Error("Authentication required");
        }

        const response = await apiFetch<{
          success: boolean;
          data: ApiGrade[];
        }>(`/grades/course/${courseFilter}`, {
          token: scm_token,
        });

        setGrades((response.data || []).map(mapGrade));
      } catch (error) {
        console.error("Failed to fetch grades:", error);

        setGrades([]);

        setError(
          error instanceof Error ? error.message : "Failed to load grades",
        );
      } finally {
        setLoadingGrades(false);
      }
    };

    fetchGrades();
  }, [courseFilter]);

  useEffect(() => {
    if (!showAddModal) {
      return;
    }

    if (courseFilter === "All") {
      return;
    }

    const fetchStudents = async () => {
      try {
        setLoadingStudents(true);
        setModalError("");

        const scm_token = localStorage.getItem("scm_token");

        if (!scm_token) {
          throw new Error("Authentication required");
        }

        const response = await apiFetch<{
          success: boolean;
          data: CourseStudent[];
        }>(`/enrollments/teacher/course/${courseFilter}/students`, {
          token: scm_token,
        });

        setStudents(response.data || []);
      } catch (error) {
        console.error("Failed to fetch students:", error);

        setStudents([]);

        setModalError(
          error instanceof Error ? error.message : "Failed to load students",
        );
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchStudents();
  }, [showAddModal, courseFilter]);

  const selectedCourse = useMemo(() => {
    if (courseFilter === "All") {
      return null;
    }

    return courses.find((course) => String(course.id) === courseFilter) || null;
  }, [courses, courseFilter]);

  const filteredGrades = useMemo(() => {
    const term = search.toLowerCase().trim();

    return grades.filter((student) => {
      if (!term) {
        return true;
      }

      return (
        student.studentName.toLowerCase().includes(term) ||
        student.studentId.toLowerCase().includes(term)
      );
    });
  }, [grades, search]);

  const averageScore =
    grades.length > 0
      ? Math.round(
          grades.reduce((sum, student) => sum + student.total, 0) /
            grades.length,
        )
      : 0;

  const excellentStudents = grades.filter(
    (student) => student.grade === "A+" || student.grade === "A",
  ).length;

  const passedStudents = grades.filter((student) => student.total >= 40).length;

  const openAddModal = () => {
    if (courseFilter === "All") {
      setError("Please select a course before adding a grade.");
      return;
    }

    setSelectedStudent("");
    setAssignmentMark("");
    setMidtermMark("");
    setFinalMark("");
    setModalError("");
    setSuccessMessage("");
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    if (savingGrade) {
      return;
    }

    setShowAddModal(false);
    setSelectedStudent("");
    setAssignmentMark("");
    setMidtermMark("");
    setFinalMark("");
    setModalError("");
  };

  const openEditModal = (student: GradeRecord) => {
    setEditingGrade(student);

    setAssignmentMark(String(student.assignment));

    setMidtermMark(String(student.midterm));

    setFinalMark(String(student.final));

    setModalError("");
    setSuccessMessage("");
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    if (savingGrade) {
      return;
    }

    setShowEditModal(false);
    setEditingGrade(null);

    setAssignmentMark("");
    setMidtermMark("");
    setFinalMark("");

    setModalError("");
  };

  const assignmentValue = Number(assignmentMark) || 0;

  const midtermValue = Number(midtermMark) || 0;

  const finalValue = Number(finalMark) || 0;

  const previewTotal = assignmentValue + midtermValue + finalValue;

  const validateMarks = () => {
    const assignment = assignmentMark === "" ? 0 : Number(assignmentMark);

    const midterm = midtermMark === "" ? 0 : Number(midtermMark);

    const final = finalMark === "" ? 0 : Number(finalMark);

    if (
      Number.isNaN(assignment) ||
      Number.isNaN(midterm) ||
      Number.isNaN(final)
    ) {
      throw new Error("Please enter valid marks.");
    }

    if (assignment < 0 || assignment > 20) {
      throw new Error("Assignment marks must be between 0 and 20.");
    }

    if (midterm < 0 || midterm > 30) {
      throw new Error("Midterm marks must be between 0 and 30.");
    }

    if (final < 0 || final > 50) {
      throw new Error("Final marks must be between 0 and 50.");
    }

    return {
      assignment,
      midterm,
      final,
    };
  };

  const refreshGrades = async (token: string) => {
    if (courseFilter === "All") {
      return;
    }

    const response = await apiFetch<{
      success: boolean;
      data: ApiGrade[];
    }>(`/grades/course/${courseFilter}`, {
      token,
    });

    setGrades((response.data || []).map(mapGrade));
  };

  const handleAddGrade = async () => {
    try {
      setModalError("");

      if (courseFilter === "All") {
        throw new Error("Please select a course.");
      }

      if (!selectedStudent) {
        throw new Error("Please select a student.");
      }

      const { assignment, midterm, final } = validateMarks();

      const scm_token = localStorage.getItem("scm_token");

      if (!scm_token) {
        throw new Error("Authentication required");
      }

      setSavingGrade(true);

      await apiFetch<{
        success: boolean;
        data: ApiGrade;
      }>("/grades", {
        method: "POST",
        token: scm_token,
        body: JSON.stringify({
          studentId: Number(selectedStudent),
          courseId: Number(courseFilter),
          assignment,
          midterm,
          final,
        }),
      });

      await refreshGrades(scm_token);

      setShowAddModal(false);

      setSelectedStudent("");
      setAssignmentMark("");
      setMidtermMark("");
      setFinalMark("");

      setSuccessMessage("Grade added successfully.");

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("Failed to add grade:", error);

      setModalError(
        error instanceof Error ? error.message : "Failed to add grade",
      );
    } finally {
      setSavingGrade(false);
    }
  };

  const handleUpdateGrade = async () => {
    try {
      setModalError("");

      if (!editingGrade) {
        throw new Error("No grade selected.");
      }

      const { assignment, midterm, final } = validateMarks();

      const scm_token = localStorage.getItem("scm_token");

      if (!scm_token) {
        throw new Error("Authentication required");
      }

      setSavingGrade(true);

      await apiFetch<{
        success: boolean;
        data: ApiGrade;
      }>(`/grades/${editingGrade.id}`, {
        method: "PUT",
        token: scm_token,
        body: JSON.stringify({
          assignment,
          midterm,
          final,
        }),
      });

      await refreshGrades(scm_token);

      setShowEditModal(false);
      setEditingGrade(null);

      setAssignmentMark("");
      setMidtermMark("");
      setFinalMark("");

      setSuccessMessage("Grade updated successfully.");

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("Failed to update grade:", error);

      setModalError(
        error instanceof Error ? error.message : "Failed to update grade",
      );
    } finally {
      setSavingGrade(false);
    }
  };

  const handleDeleteGrade = async (gradeId: number) => {
    const grade = grades.find((item) => item.id === gradeId);
    if (grade) setPendingDelete(grade);
  };

  const confirmDeleteGrade = async () => {
    if (!pendingDelete) return;

    const gradeId = pendingDelete.id;

    try {
      setDeletingId(gradeId);
      setError("");

      const scm_token = localStorage.getItem("scm_token");

      if (!scm_token) {
        throw new Error("Authentication required");
      }

      await apiFetch<{
        success: boolean;
        message: string;
      }>(`/grades/${gradeId}`, {
        method: "DELETE",
        token: scm_token,
      });

      await refreshGrades(scm_token);

      setSuccessMessage("Grade deleted successfully.");
      setPendingDelete(null);

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("Failed to delete grade:", error);

      setError(
        error instanceof Error ? error.message : "Failed to delete grade",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#EAE6DC] p-5 sm:p-8">
      <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="font-serif text-sm text-[#B45A2A]">Teacher Portal</p>

          <h1 className="mt-1 font-serif text-3xl font-bold text-[#333333]">
            Grades & Results
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Review student performance and manage academic grades.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="rounded-xl bg-[#B45A2A] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#9f4d24]"
        >
          Add Grade
        </button>
      </div>

      {successMessage && (
        <div className="mb-6 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm font-medium text-green-600">
          {successMessage}
        </div>
      )}

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3">
          <label className="text-sm font-semibold text-slate-700">
            Select Course
          </label>

          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            disabled={loadingCourses}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 outline-none focus:border-[#B45A2A] md:max-w-md"
          >
            <option value="All">Select a course</option>

            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code} — {course.name}
              </option>
            ))}
          </select>

          {selectedCourse && (
            <p className="text-xs text-slate-400">
              {selectedCourse.code} · {selectedCourse.name} · Semester{" "}
              {selectedCourse.semester}
            </p>
          )}
        </div>
      </section>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <TeacherMetricCard
          label="Average Score"
          value={`${averageScore}%`}
          icon="progress"
        />
        <TeacherMetricCard
          label="A Grade Students"
          value={excellentStudents}
          icon="excellent"
        />
        <TeacherMetricCard
          label="Passed"
          value={passedStudents}
          icon="passed"
          valueClassName="text-green-600"
        />
      </div>

      <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
        <div className="relative w-full md:max-w-md">
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
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={courseFilter === "All"}
            className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#B45A2A] focus:ring-2 focus:ring-[#B45A2A]/10 disabled:bg-slate-50"
          />
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-4">
          <h2 className="font-serif text-xl font-bold text-[#333333]">
            Student Grades
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            {courseFilter === "All"
              ? "Select a course to view student grades."
              : `Showing ${filteredGrades.length} of ${grades.length} students`}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-3 shadow-sm sm:p-5">
          {loadingGrades ? (
            <div className="py-12 text-center text-sm text-slate-400">
              Loading student grades...
            </div>
          ) : courseFilter === "All" ? (
            <div className="py-12 text-center text-sm text-slate-400">
              Select a course to view grades.
            </div>
          ) : filteredGrades.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              No grades found for this course.
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto xl:block">
                <table className="w-full min-w-[1000px] table-fixed text-left">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="px-3 py-4 text-xs font-semibold uppercase tracking-wide text-slate-400 sm:px-6">
                        Student
                      </th>

                      <th className="px-3 py-4 text-xs font-semibold uppercase tracking-wide text-slate-400 sm:px-6">
                        Course
                      </th>

                      <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Assignment
                      </th>

                      <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Midterm
                      </th>

                      <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Final
                      </th>

                      <th className="px-3 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-400 sm:px-5">
                        Total
                      </th>

                      <th className="px-3 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-400 sm:px-5">
                        Grade
                      </th>

                      <th className="px-3 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-400 sm:px-5">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredGrades.map((student) => (
                      <tr
                        key={student.id}
                        className="border-b border-slate-50 transition hover:bg-[#F8F6F0]"
                      >
                        <td className="px-3 py-4 align-middle sm:px-6">
                          <p className="break-words text-sm font-semibold text-slate-700">
                            {student.studentName}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {student.studentId}
                          </p>
                        </td>

                        <td className="px-3 py-4 align-middle text-sm font-medium text-slate-600 sm:px-6">
                          {student.course}
                        </td>

                        <td className="px-4 py-4 text-center align-middle text-sm text-slate-500">
                          {student.assignment}
                          /20
                        </td>

                        <td className="px-4 py-4 text-center align-middle text-sm text-slate-500">
                          {student.midterm}
                          /30
                        </td>

                        <td className="px-4 py-4 text-center align-middle text-sm text-slate-500">
                          {student.final}
                          /50
                        </td>

                        <td className="whitespace-nowrap px-3 py-4 text-center align-middle text-sm font-bold text-slate-700 sm:px-5">
                          {student.total}
                          /100
                        </td>

                        <td className="px-3 py-4 text-center align-middle sm:px-5">
                          <GradeBadge grade={student.grade} />
                        </td>

                        <td className="px-3 py-4 align-middle sm:px-5">
                          <div className="flex flex-wrap justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(student)}
                              className="rounded-lg border border-[#B45A2A]/30 px-3 py-2 text-xs font-semibold text-[#B45A2A] transition hover:bg-[#B45A2A] hover:text-white"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteGrade(student.id)}
                              disabled={deletingId === student.id}
                              className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {deletingId === student.id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 xl:hidden">
                {filteredGrades.map((student) => (
                  <article
                    key={student.id}
                    className="rounded-xl border border-slate-100 p-4 transition hover:bg-[#F8F6F0] sm:p-5"
                  >
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                      <div className="min-w-0">
                        <p className="break-words text-sm font-semibold text-slate-800">
                          {student.studentName}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-slate-500">
                          <span className="rounded-md bg-slate-100 px-2 py-1">
                            ID: {student.studentId}
                          </span>
                          <span className="break-words rounded-md bg-[#F0EDE4] px-2 py-1 font-medium text-[#6F4E37]">
                            {student.course}
                          </span>
                        </div>
                      </div>

                      <GradeBadge grade={student.grade} />
                    </div>

                    <dl className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
                      <div className="rounded-lg bg-slate-50 p-3">
                        <dt className="break-all text-[10px] uppercase tracking-wide text-slate-400 sm:break-normal sm:text-xs">
                          Assignment
                        </dt>

                        <dd className="mt-1 text-sm font-medium text-slate-700">
                          {student.assignment}
                          /20
                        </dd>
                      </div>

                      <div className="rounded-lg bg-slate-50 p-3 text-right sm:text-left">
                        <dt className="text-xs uppercase tracking-wide text-slate-400">
                          Midterm
                        </dt>

                        <dd className="mt-1 text-sm font-medium text-slate-700">
                          {student.midterm}
                          /30
                        </dd>
                      </div>

                      <div className="rounded-lg bg-slate-50 p-3">
                        <dt className="text-xs uppercase tracking-wide text-slate-400">
                          Final
                        </dt>

                        <dd className="mt-1 text-sm font-medium text-slate-700">
                          {student.final}
                          /50
                        </dd>
                      </div>

                      <div className="rounded-lg bg-slate-50 p-3 text-right sm:text-left">
                        <dt className="text-xs uppercase tracking-wide text-slate-400">
                          Total
                        </dt>

                        <dd className="mt-1 text-sm font-bold text-slate-800">
                          {student.total}
                          /100
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(student)}
                        className="min-h-11 rounded-xl border border-[#B45A2A]/30 px-3 py-2.5 text-sm font-semibold text-[#B45A2A] transition hover:bg-[#B45A2A] hover:text-white"
                      >
                        Edit Grade
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteGrade(student.id)}
                        disabled={deletingId === student.id}
                        className="min-h-11 rounded-xl border border-red-200 px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingId === student.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#333333]">
                  Add Grade
                </h2>

                {selectedCourse && (
                  <p className="mt-1 text-xs text-slate-400">
                    {selectedCourse.code} · {selectedCourse.name}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={closeAddModal}
                disabled={savingGrade}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-5 px-6 py-6">
              {modalError && (
                <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">
                  {modalError}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Student
                </label>

                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  disabled={loadingStudents || savingGrade}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 outline-none focus:border-[#B45A2A]"
                >
                  <option value="">
                    {loadingStudents
                      ? "Loading students..."
                      : "Select a student"}
                  </option>

                  {students.map(({ student }) => (
                    <option key={student.id} value={student.id}>
                      {student.user.name} — {student.studentId}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <MarkInput
                  label="Assignment"
                  max="20"
                  value={assignmentMark}
                  onChange={setAssignmentMark}
                  disabled={savingGrade}
                />

                <MarkInput
                  label="Midterm"
                  max="30"
                  value={midtermMark}
                  onChange={setMidtermMark}
                  disabled={savingGrade}
                />

                <MarkInput
                  label="Final"
                  max="50"
                  value={finalMark}
                  onChange={setFinalMark}
                  disabled={savingGrade}
                />
              </div>

              <GradePreview total={previewTotal} />
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 px-6 py-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeAddModal}
                disabled={savingGrade}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleAddGrade}
                disabled={savingGrade || loadingStudents}
                className="rounded-xl bg-[#B45A2A] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#9f4d24] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingGrade ? "Saving..." : "Save Grade"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingGrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#333333]">
                  Edit Grade
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  {editingGrade.studentName} · {editingGrade.studentId}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {editingGrade.course}
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditModal}
                disabled={savingGrade}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-5 px-6 py-6">
              {modalError && (
                <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">
                  {modalError}
                </div>
              )}

              <div className="rounded-xl bg-[#F8F6F0] p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Student
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {editingGrade.studentName}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {editingGrade.studentId}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <MarkInput
                  label="Assignment"
                  max="20"
                  value={assignmentMark}
                  onChange={setAssignmentMark}
                  disabled={savingGrade}
                />

                <MarkInput
                  label="Midterm"
                  max="30"
                  value={midtermMark}
                  onChange={setMidtermMark}
                  disabled={savingGrade}
                />

                <MarkInput
                  label="Final"
                  max="50"
                  value={finalMark}
                  onChange={setFinalMark}
                  disabled={savingGrade}
                />
              </div>

              <GradePreview total={previewTotal} />
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 px-6 py-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeEditModal}
                disabled={savingGrade}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleUpdateGrade}
                disabled={savingGrade}
                className="rounded-xl bg-[#B45A2A] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#9f4d24] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingGrade ? "Updating..." : "Update Grade"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={pendingDelete !== null}
        title="Delete grade?"
        description={`The grade for ${pendingDelete?.studentName ?? "this student"} in ${pendingDelete?.course ?? "this course"} will be permanently deleted. This action cannot be undone.`}
        busy={deletingId !== null}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDeleteGrade}
      />
    </main>
  );
}

function MarkInput({
  label,
  max,
  value,
  onChange,
  disabled,
}: {
  label: string;
  max: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}

        <span className="ml-1 text-xs font-normal text-slate-400">/{max}</span>
      </label>

      <input
        type="number"
        min="0"
        max={max}
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="0"
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#B45A2A] focus:ring-2 focus:ring-[#B45A2A]/10"
      />
    </div>
  );
}

function GradePreview({ total }: { total: number }) {
  return (
    <div className="rounded-xl bg-[#F8F6F0] p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">Total Score</span>

        <span className="text-2xl font-bold text-[#333333]">
          {total}

          <span className="ml-1 text-sm font-medium text-slate-400">/100</span>
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-slate-400">Grade</span>

        <GradeBadge grade={getGrade(total)} />
      </div>
    </div>
  );
}

function GradeBadge({ grade }: { grade: string }) {
  const className =
    grade === "A+" || grade === "A"
      ? "bg-green-50 text-green-600"
      : grade === "A-"
        ? "bg-blue-50 text-blue-600"
        : grade === "B+" || grade === "B"
          ? "bg-amber-50 text-amber-600"
          : "bg-red-50 text-red-500";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${className}`}
    >
      {grade}
    </span>
  );
}
