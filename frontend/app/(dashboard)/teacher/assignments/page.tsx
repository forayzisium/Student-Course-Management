"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AssignmentCard from "@/components/teachers/AssignmentCard";
import SubmissionTable from "@/components/teachers/SubmissionTable";
import ConfirmModal from "@/components/ui/ConfirmModal";
import TeacherMetricCard from "@/components/teachers/TeacherMetricCard";
import { apiFetch } from "@/lib/api";

type ApiAssignment = {
  id: number;
  title: string;
  description?: string | null;
  dueDate: string;
  submissionCount: number;
  totalStudents: number;
  pendingSubmissions: number;
  pendingGrading: number;
  gradedSubmissions: number;
  maxMarks: number;
  course?: {
    id: number;
    code: string;
    name: string;
    teacherId: number;
  };
};

type Assignment = {
  id: number;
  title: string;
  description: string;
  course: string;
  dueDate: string;
  rawDueDate: string;
  submissions: number;
  totalStudents: number;
  pendingSubmissions: number;
  pendingGrading: number;
  maxMarks: number;
  status: "Active" | "Closed" | "Grading";
};

type TeacherCourse = {
  id: number;
  code: string;
  name: string;
  department: string;
  semester: string;
  status: "ACTIVE" | "INACTIVE";
};

type AssignmentForm = {
  courseId: string;
  title: string;
  description: string;
  dueDate: string;
  maxMarks: string;
};

type EditForm = {
  title: string;
  description: string;
  dueDate: string;
  maxMarks: string;
};

type Submission = {
  id: number;
  submittedAt: string;
  status: "SUBMITTED" | "GRADED";
  marks: number | null;
  feedback: string | null;
  fileName: string | null;
  fileUrl: string | null;
  student: {
    id: number;
    studentId: string;
    user: {
      id: number;
      name: string;
      email: string;
    };
  };
};

type SubmissionResponse = {
  success: boolean;
  data?: {
    assignment: {
      id: number;
      title: string;
      description: string | null;
      dueDate: string;
      maxMarks: number;
      course: {
        id: number;
        code: string;
        name: string;
      };
    };
    submissions: Submission[];
  };
  message?: string;
};

export default function TeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const [courses, setCourses] = useState<TeacherCourse[]>([]);

  const [search, setSearch] = useState("");

  const [filter, setFilter] = useState<"All" | "Active" | "Grading" | "Closed">(
    "All",
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  const [showCreateModal, setShowCreateModal] = useState(false);

  const [coursesLoading, setCoursesLoading] = useState(false);

  const [creating, setCreating] = useState(false);

  const [formError, setFormError] = useState("");

  const [form, setForm] = useState<AssignmentForm>({
    courseId: "",
    title: "",
    description: "",
    dueDate: "",
    maxMarks: "20",
  });


  const [showEditModal, setShowEditModal] = useState(false);

  const [editing, setEditing] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);

  const [editFormError, setEditFormError] = useState("");

  const [editForm, setEditForm] = useState<EditForm>({
    title: "",
    description: "",
    dueDate: "",
    maxMarks: "20",
  });


  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Assignment | null>(null);


  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);

  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);

  const [submissions, setSubmissions] = useState<Submission[]>([]);

  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  const [submissionsError, setSubmissionsError] = useState("");


  const loadAssignments = useCallback(async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("scm_token");

      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const response = await apiFetch<{
        success: boolean;
        data: ApiAssignment[];
        message?: string;
      }>("/assignments/my-assignments", {
        token,
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to load assignments.");
      }

      const now = new Date();

      const formattedAssignments: Assignment[] = (response.data || []).map(
        (assignment) => {
          const dueDate = new Date(assignment.dueDate);

          let status: Assignment["status"] = "Active";

          if (dueDate < now) {
            status = "Closed";
          } else if (assignment.pendingGrading > 0) {
            status = "Grading";
          }

          return {
            id: assignment.id,

            title: assignment.title,

            description: assignment.description || "",

            course: assignment.course
              ? `${assignment.course.code} · ${assignment.course.name}`
              : "Unknown Course",

            dueDate: dueDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),

            rawDueDate: assignment.dueDate,

            submissions: assignment.submissionCount,

            totalStudents: assignment.totalStudents,

            pendingSubmissions: assignment.pendingSubmissions,
            pendingGrading: assignment.pendingGrading,
            maxMarks: assignment.maxMarks,

            status,
          };
        },
      );

      setAssignments(formattedAssignments);

      setError("");
    } catch (err) {
      console.error("Failed to load teacher assignments:", err);

      setError(
        err instanceof Error ? err.message : "Failed to load assignments.",
      );
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAssignments();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadAssignments]);


  const loadCourses = useCallback(async () => {
    try {
      setCoursesLoading(true);
      setFormError("");

      const token = localStorage.getItem("scm_token");

      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const response = await apiFetch<{
        success: boolean;
        data: TeacherCourse[];
        message?: string;
      }>("/enrollments/teacher/course-stats", {
        token,
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to load courses.");
      }

      setCourses(response.data || []);
    } catch (err) {
      console.error("Failed to load teacher courses:", err);

      setFormError(
        err instanceof Error ? err.message : "Failed to load courses.",
      );
    } finally {
      setCoursesLoading(false);
    }
  }, []);


  const handleOpenCreateModal = () => {
    setForm({
      courseId: "",
      title: "",
      description: "",
      dueDate: "",
      maxMarks: "20",
    });

    setFormError("");

    setShowCreateModal(true);

    void loadCourses();
  };


  const handleCloseCreateModal = () => {
    if (creating) {
      return;
    }

    setShowCreateModal(false);

    setFormError("");

    setForm({
      courseId: "",
      title: "",
      description: "",
      dueDate: "",
      maxMarks: "20",
    });
  };


  const handleCreateAssignment = async () => {
    setFormError("");

    if (!form.courseId) {
      setFormError("Please select a course.");
      return;
    }

    if (!form.title.trim()) {
      setFormError("Please enter an assignment title.");
      return;
    }

    if (!form.description.trim()) {
      setFormError("Please enter an assignment description.");
      return;
    }

    if (!form.dueDate) {
      setFormError("Please select a due date.");
      return;
    }

    const maxMarks = Number(form.maxMarks);
    if (!Number.isFinite(maxMarks) || maxMarks <= 0 || maxMarks > 1000) {
      setFormError("Maximum marks must be between 1 and 1000.");
      return;
    }

    const dueDate = new Date(form.dueDate);

    if (Number.isNaN(dueDate.getTime())) {
      setFormError("Please select a valid due date.");
      return;
    }

    try {
      setCreating(true);

      const token = localStorage.getItem("scm_token");

      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const response = await apiFetch<{
        success: boolean;
        data?: ApiAssignment;
        message?: string;
      }>("/assignments/teacher", {
        method: "POST",
        token,
        body: JSON.stringify({
          courseId: Number(form.courseId),

          title: form.title.trim(),

          description: form.description.trim(),

          dueDate: dueDate.toISOString(),
          maxMarks,
        }),
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to create assignment.");
      }

      setShowCreateModal(false);

      setForm({
        courseId: "",
        title: "",
        description: "",
        dueDate: "",
        maxMarks: "20",
      });

      setFormError("");

      await loadAssignments();
    } catch (err) {
      console.error("Create assignment error:", err);

      setFormError(
        err instanceof Error ? err.message : "Failed to create assignment.",
      );
    } finally {
      setCreating(false);
    }
  };


  const toDateTimeLocal = (dateString: string) => {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const pad = (value: number) => String(value).padStart(2, "0");

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
      date.getHours(),
    )}:${pad(date.getMinutes())}`;
  };


  const handleEditAssignment = (id: number) => {
    const assignment = assignments.find((item) => item.id === id);

    if (!assignment) {
      setError("Assignment not found.");
      return;
    }

    setEditingId(id);

    setEditForm({
      title: assignment.title,

      description: assignment.description,

      dueDate: toDateTimeLocal(assignment.rawDueDate),
      maxMarks: String(assignment.maxMarks),
    });

    setEditFormError("");

    setShowEditModal(true);
  };


  const handleCloseEditModal = () => {
    if (editing) {
      return;
    }

    setShowEditModal(false);

    setEditingId(null);

    setEditFormError("");

    setEditForm({
      title: "",
      description: "",
      dueDate: "",
      maxMarks: "20",
    });
  };


  const handleUpdateAssignment = async () => {
    setEditFormError("");

    if (editingId === null) {
      setEditFormError("Assignment not found.");
      return;
    }

    if (!editForm.title.trim()) {
      setEditFormError("Please enter an assignment title.");
      return;
    }

    if (!editForm.description.trim()) {
      setEditFormError("Please enter an assignment description.");
      return;
    }

    if (!editForm.dueDate) {
      setEditFormError("Please select a due date.");
      return;
    }

    const maxMarks = Number(editForm.maxMarks);
    if (!Number.isFinite(maxMarks) || maxMarks <= 0 || maxMarks > 1000) {
      setEditFormError("Maximum marks must be between 1 and 1000.");
      return;
    }

    const dueDate = new Date(editForm.dueDate);

    if (Number.isNaN(dueDate.getTime())) {
      setEditFormError("Please select a valid due date.");
      return;
    }

    try {
      setEditing(true);

      const token = localStorage.getItem("scm_token");

      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const response = await apiFetch<{
        success: boolean;
        data?: ApiAssignment;
        message?: string;
      }>(`/assignments/teacher/${editingId}`, {
        method: "PUT",
        token,
        body: JSON.stringify({
          title: editForm.title.trim(),

          description: editForm.description.trim(),

          dueDate: dueDate.toISOString(),
          maxMarks,
        }),
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to update assignment.");
      }

      setShowEditModal(false);

      setEditingId(null);

      setEditFormError("");

      setEditForm({
        title: "",
        description: "",
        dueDate: "",
        maxMarks: "20",
      });

      await loadAssignments();
    } catch (err) {
      console.error("Update assignment error:", err);

      setEditFormError(
        err instanceof Error ? err.message : "Failed to update assignment.",
      );
    } finally {
      setEditing(false);
    }
  };


  const handleDeleteAssignment = async (id: number) => {
    const assignment = assignments.find((item) => item.id === id);

    if (!assignment) {
      setError("Assignment not found.");
      return;
    }

    setPendingDelete(assignment);
  };

  const confirmDeleteAssignment = async () => {
    if (!pendingDelete) return;

    const id = pendingDelete.id;

    try {
      setDeletingId(id);
      setError("");

      const token = localStorage.getItem("scm_token");

      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const response = await apiFetch<{
        success: boolean;
        message?: string;
      }>(`/assignments/teacher/${id}`, {
        method: "DELETE",
        token,
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to delete assignment.");
      }

      await loadAssignments();
      setPendingDelete(null);
    } catch (err) {
      console.error("Delete assignment error:", err);

      setError(
        err instanceof Error ? err.message : "Failed to delete assignment.",
      );
    } finally {
      setDeletingId(null);
    }
  };


  const handleViewSubmissions = async (assignment: Assignment) => {
    try {
      setSelectedAssignment(assignment);

      setShowSubmissionsModal(true);

      setSubmissionsLoading(true);

      setSubmissionsError("");

      setSubmissions([]);

      const token = localStorage.getItem("scm_token");

      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const response = await apiFetch<SubmissionResponse>(
        `/submissions/teacher/assignment/${assignment.id}`,
        {
          token,
        },
      );

      if (!response.success) {
        throw new Error(response.message || "Failed to load submissions.");
      }

      setSubmissions(response.data?.submissions || []);
    } catch (err) {
      console.error("Failed to load submissions:", err);

      setSubmissionsError(
        err instanceof Error ? err.message : "Failed to load submissions.",
      );
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const handleCloseSubmissionsModal = () => {
    if (submissionsLoading) {
      return;
    }

    setShowSubmissionsModal(false);

    setSelectedAssignment(null);

    setSubmissions([]);

    setSubmissionsError("");
  };


  const handleGradeSubmission = async (
    submissionId: number,
    marks: number,
    feedback: string,
  ) => {
    const token = localStorage.getItem("scm_token");

    if (!token) {
      throw new Error("Authentication token not found.");
    }

    const response = await apiFetch<{
      success: boolean;
      data?: Submission;
      message?: string;
    }>(`/submissions/teacher/${submissionId}/grade`, {
      method: "PUT",
      token,
      body: JSON.stringify({
        marks,
        feedback,
      }),
    });

    if (!response.success) {
      throw new Error(response.message || "Failed to grade submission.");
    }

    setSubmissions((current) =>
      current.map((submission) =>
        submission.id === submissionId
          ? {
              ...submission,
              marks: response.data?.marks ?? marks,
              feedback: response.data?.feedback ?? (feedback.trim() || null),
              status: "GRADED",
            }
          : submission,
      ),
    );

    await loadAssignments();
  };


  const filteredAssignments = useMemo(() => {
    const searchTerm = search.toLowerCase().trim();

    return assignments.filter((assignment) => {
      const matchesSearch =
        assignment.title.toLowerCase().includes(searchTerm) ||
        assignment.course.toLowerCase().includes(searchTerm);

      const matchesFilter = filter === "All" || assignment.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [assignments, search, filter]);


  const activeCount = assignments.filter(
    (assignment) => assignment.status === "Active",
  ).length;

  const pendingGrading = assignments.reduce(
    (total, assignment) => total + assignment.pendingSubmissions,
    0,
  );

  const totalSubmissions = assignments.reduce(
    (total, assignment) => total + assignment.submissions,
    0,
  );


  return (
    <main className="min-h-screen bg-[#EAE6DC] p-5 sm:p-8">

      <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="font-serif text-sm text-[#B45A2A]">Teacher Portal</p>

          <h1 className="mt-1 font-serif text-3xl font-bold text-[#333333]">
            Assignments
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Create, manage and review assignments across your courses.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#B45A2A] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#9f4d24]"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" d="M12 5v14M5 12h14" />
          </svg>
          Create Assignment
        </button>
      </div>


      {error && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            className="ml-4 font-semibold"
          >
            ×
          </button>
        </div>
      )}


      <div className="grid gap-4 lg:grid-cols-3">
        <TeacherMetricCard
          label="Total Assignments"
          value={loading ? "..." : assignments.length}
          icon="assignments"
        />
        <TeacherMetricCard
          label="Active"
          value={loading ? "..." : activeCount}
          icon="active"
        />
        <TeacherMetricCard
          label="Pending Grading"
          value={loading ? "..." : pendingGrading}
          icon="pending"
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
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assignments..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#B45A2A] focus:ring-2 focus:ring-[#B45A2A]/10"
            />
          </div>

          <div className="flex flex-wrap rounded-xl bg-[#F0EDE4] p-1">
            {(["All", "Active", "Grading", "Closed"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                  filter === item
                    ? "bg-white text-[#B45A2A] shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>


      <section className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl font-bold text-[#333333]">
              Your Assignments
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              {loading
                ? "Loading assignments..."
                : `${filteredAssignments.length} assignment${
                    filteredAssignments.length !== 1 ? "s" : ""
                  } found`}
            </p>
          </div>

          <p className="hidden text-xs text-slate-400 sm:block">
            {totalSubmissions} total submissions
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
            <p className="text-sm text-slate-400">
              Loading your assignments...
            </p>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
            <h3 className="font-semibold text-slate-700">
              No assignments found
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              Try changing your search or filter.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {filteredAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className={
                  deletingId === assignment.id
                    ? "pointer-events-none opacity-60"
                    : ""
                }
              >
                <AssignmentCard
                  id={assignment.id}
                  title={assignment.title}
                  course={assignment.course}
                  dueDate={assignment.dueDate}
                  submissions={assignment.submissions}
                  totalStudents={assignment.totalStudents}
                  status={assignment.status}
                  onEdit={handleEditAssignment}
                  onDelete={handleDeleteAssignment}
                />

                <button
                  type="button"
                  onClick={() => void handleViewSubmissions(assignment)}
                  disabled={deletingId === assignment.id}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#D8D2C5] bg-white px-4 py-3 text-sm font-semibold text-[#6F4E37] shadow-sm transition hover:bg-[#F0EDE4] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 12s3.75-6 9.75-6 9.75 6 9.75 6-3.75 6-9.75 6-9.75-6-9.75-6Z"
                    />

                    <circle cx="12" cy="12" r="2.5" />
                  </svg>
                  Review Submissions
                </button>
              </div>
            ))}
          </div>
        )}
      </section>


      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#333333]">
                  Create Assignment
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Create a new assignment for one of your courses.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseCreateModal}
                disabled={creating}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <div className="space-y-5 px-6 py-6">
              {formError && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {formError}
                </div>
              )}

              <div>
                <label
                  htmlFor="create-course"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Course
                </label>

                <select
                  id="create-course"
                  value={form.courseId}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      courseId: e.target.value,
                    }))
                  }
                  disabled={coursesLoading || creating}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#B45A2A] focus:ring-2 focus:ring-[#B45A2A]/10 disabled:bg-slate-50"
                >
                  <option value="">
                    {coursesLoading ? "Loading courses..." : "Select a course"}
                  </option>

                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code} · {course.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="create-title"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Assignment Title
                </label>

                <input
                  id="create-title"
                  type="text"
                  value={form.title}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  placeholder="e.g. Database Design Project"
                  disabled={creating}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#B45A2A] focus:ring-2 focus:ring-[#B45A2A]/10 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label
                  htmlFor="create-description"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Description
                </label>

                <textarea
                  id="create-description"
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={4}
                  placeholder="Describe the assignment requirements..."
                  disabled={creating}
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#B45A2A] focus:ring-2 focus:ring-[#B45A2A]/10 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label
                  htmlFor="create-due-date"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Due Date
                </label>

                <input
                  id="create-due-date"
                  type="datetime-local"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      dueDate: e.target.value,
                    }))
                  }
                  disabled={creating}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#B45A2A] focus:ring-2 focus:ring-[#B45A2A]/10 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label
                  htmlFor="create-max-marks"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Maximum Marks
                </label>
                <input
                  id="create-max-marks"
                  type="number"
                  min="1"
                  max="1000"
                  value={form.maxMarks}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, maxMarks: e.target.value }))
                  }
                  disabled={creating}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#B45A2A] focus:ring-2 focus:ring-[#B45A2A]/10 disabled:bg-slate-50"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-5">
              <button
                type="button"
                onClick={handleCloseCreateModal}
                disabled={creating}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleCreateAssignment}
                disabled={creating}
                className="rounded-xl bg-[#B45A2A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#9f4d24] disabled:opacity-60"
              >
                {creating ? "Creating..." : "Create Assignment"}
              </button>
            </div>
          </div>
        </div>
      )}


      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#333333]">
                  Edit Assignment
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Update the assignment details.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseEditModal}
                disabled={editing}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <div className="space-y-5 px-6 py-6">
              {editFormError && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {editFormError}
                </div>
              )}

              <div>
                <label
                  htmlFor="edit-title"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Assignment Title
                </label>

                <input
                  id="edit-title"
                  type="text"
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  disabled={editing}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#B45A2A] focus:ring-2 focus:ring-[#B45A2A]/10 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-description"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Description
                </label>

                <textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={5}
                  disabled={editing}
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#B45A2A] focus:ring-2 focus:ring-[#B45A2A]/10 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-due-date"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Due Date
                </label>

                <input
                  id="edit-due-date"
                  type="datetime-local"
                  value={editForm.dueDate}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      dueDate: e.target.value,
                    }))
                  }
                  disabled={editing}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#B45A2A] focus:ring-2 focus:ring-[#B45A2A]/10 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-max-marks"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Maximum Marks
                </label>
                <input
                  id="edit-max-marks"
                  type="number"
                  min="1"
                  max="1000"
                  value={editForm.maxMarks}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      maxMarks: e.target.value,
                    }))
                  }
                  disabled={editing}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#B45A2A] focus:ring-2 focus:ring-[#B45A2A]/10 disabled:bg-slate-50"
                />
              </div>

              <div className="rounded-xl bg-[#F0EDE4] px-4 py-3">
                <p className="text-xs font-semibold text-slate-400">Course</p>

                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {assignments.find((item) => item.id === editingId)?.course ||
                    "Unknown Course"}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Course cannot be changed after creation.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-5">
              <button
                type="button"
                onClick={handleCloseEditModal}
                disabled={editing}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleUpdateAssignment}
                disabled={editing}
                className="rounded-xl bg-[#B45A2A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#9f4d24] disabled:opacity-60"
              >
                {editing ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}


      {showSubmissionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[92vh] w-full max-w-7xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <p className="font-serif text-sm text-[#B45A2A]">
                  Assignment Review
                </p>

                <h2 className="mt-1 font-serif text-xl font-bold text-[#333333]">
                  {selectedAssignment?.title || "Submissions"}
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  {selectedAssignment?.course || "Loading assignment..."}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseSubmissionsModal}
                disabled={submissionsLoading}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {submissionsError && (
                <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {submissionsError}
                </div>
              )}

              {submissionsLoading ? (
                <div className="rounded-xl border border-[#D8D2C5] bg-[#F7F4EC] p-10 text-center">
                  <p className="text-sm text-[#6F4E37]">
                    Loading submissions...
                  </p>
                </div>
              ) : (
                <SubmissionTable
                  submissions={submissions}
                  maxMarks={selectedAssignment?.maxMarks ?? 20}
                  onGrade={handleGradeSubmission}
                />
              )}
            </div>

            <div className="flex justify-end border-t border-slate-100 px-6 py-5">
              <button
                type="button"
                onClick={handleCloseSubmissionsModal}
                disabled={submissionsLoading}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={pendingDelete !== null}
        title="Delete assignment?"
        description={`“${pendingDelete?.title ?? "This assignment"}” and its related submission data will be permanently deleted. This action cannot be undone.`}
        busy={deletingId !== null}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDeleteAssignment}
      />
    </main>
  );
}
