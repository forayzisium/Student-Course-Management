"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import AdminAssignmentTable, {
  AdminAssignment,
} from "@/components/admins/AdminAssignmentTable";
import { apiFetch } from "@/lib/api";
import TeacherMetricCard from "@/components/teachers/TeacherMetricCard";

type BackendAssignment = {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  status: "ACTIVE" | "INACTIVE";
  course: {
    id: number;
    code: string;
    name: string;
    teacherId: number;
    teacher: {
      id: number;
      name: string;
      email: string;
    } | null;
    _count: {
      enrollments: number;
    };
  };
  _count: {
    submissions: number;
  };
};

type AssignmentsResponse = {
  success: boolean;
  data: BackendAssignment[];
};

type BackendCourse = {
  id: number;
  code: string;
  name: string;
  department: string;
  semester: string;
  status: "ACTIVE" | "INACTIVE";
  teacher: {
    id: number;
    name: string;
    email: string;
  } | null;
};

type CoursesResponse = {
  success: boolean;
  courses: BackendCourse[];
};

export default function AdminAssignmentsPage() {
  const [assignments, setAssignments] = useState<AdminAssignment[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [course, setCourse] = useState("All");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [creatingAssignment, setCreatingAssignment] = useState(false);

  const [availableCourses, setAvailableCourses] = useState<BackendCourse[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  const [assignmentForm, setAssignmentForm] = useState({
    courseId: "",
    title: "",
    description: "",
    dueDate: "",
  });

  const formatAssignments = (data: BackendAssignment[]): AdminAssignment[] => {
    return data.map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      course: assignment.course?.name || "Unknown Course",
      courseCode: assignment.course?.code || "N/A",
      teacher: assignment.course?.teacher?.name || "Unassigned",
      dueDate: new Date(assignment.dueDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      submissions: assignment._count?.submissions ?? 0,
      totalStudents: assignment.course?._count?.enrollments ?? 0,
      status: assignment.status === "ACTIVE" ? "Published" : "Closed",
    }));
  };

  const fetchAssignments = async () => {
    try {
      const token = localStorage.getItem("scm_token");

      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const response = await apiFetch<AssignmentsResponse>("/assignments", {
        token,
      });

      setAssignments(formatAssignments(response.data));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load assignments.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadAssignments = async () => {
      try {
        const token = localStorage.getItem("scm_token");

        if (!token) {
          throw new Error("Authentication token not found.");
        }

        const response = await apiFetch<AssignmentsResponse>("/assignments", {
          token,
        });

        if (!cancelled) {
          setAssignments(formatAssignments(response.data));
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load assignments.",
          );
          setLoading(false);
        }
      }
    };

    loadAssignments();

    return () => {
      cancelled = true;
    };
  }, []);

  const fetchCourses = async () => {
    try {
      setLoadingCourses(true);
      setError("");

      const token = localStorage.getItem("scm_token");

      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const response = await apiFetch<CoursesResponse>("/courses", {
        token,
      });

      setAvailableCourses(
        response.courses.filter((item) => item.status === "ACTIVE"),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load courses.");
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleOpenCreateAssignment = () => {
    setError("");
    setShowCreateAssignment(true);
    fetchCourses();
  };

  const handleCreateAssignment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");

    if (!assignmentForm.courseId) {
      setError("Please select a course.");
      return;
    }

    if (!assignmentForm.title.trim()) {
      setError("Assignment title is required.");
      return;
    }

    if (!assignmentForm.description.trim()) {
      setError("Assignment description is required.");
      return;
    }

    if (!assignmentForm.dueDate) {
      setError("Due date is required.");
      return;
    }

    try {
      setCreatingAssignment(true);

      const token = localStorage.getItem("scm_token");

      if (!token) {
        throw new Error("Authentication token not found.");
      }

      await apiFetch("/assignments", {
        method: "POST",
        token,
        body: JSON.stringify({
          courseId: Number(assignmentForm.courseId),
          title: assignmentForm.title.trim(),
          description: assignmentForm.description.trim(),
          dueDate: new Date(assignmentForm.dueDate).toISOString(),
        }),
      });

      setAssignmentForm({
        courseId: "",
        title: "",
        description: "",
        dueDate: "",
      });

      setShowCreateAssignment(false);

      await fetchAssignments();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create assignment.",
      );
    } finally {
      setCreatingAssignment(false);
    }
  };

  const courses = useMemo(() => {
    return [
      "All",
      ...Array.from(
        new Set(assignments.map((assignment) => assignment.course)),
      ),
    ];
  }, [assignments]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      const searchValue = search.toLowerCase().trim();

      const matchesSearch =
        assignment.title.toLowerCase().includes(searchValue) ||
        assignment.course.toLowerCase().includes(searchValue) ||
        assignment.courseCode.toLowerCase().includes(searchValue) ||
        assignment.teacher.toLowerCase().includes(searchValue);

      const matchesStatus = status === "All" || assignment.status === status;

      const matchesCourse = course === "All" || assignment.course === course;

      return matchesSearch && matchesStatus && matchesCourse;
    });
  }, [assignments, search, status, course]);

  const publishedCount = assignments.filter(
    (assignment) => assignment.status === "Published",
  ).length;

  const draftCount = assignments.filter(
    (assignment) => assignment.status === "Draft",
  ).length;

  const closedCount = assignments.filter(
    (assignment) => assignment.status === "Closed",
  ).length;

  const handleStatusChange = async (
    id: number,
    newStatus: AdminAssignment["status"],
  ) => {
    const assignment = assignments.find((current) => current.id === id);

    if (!assignment) return;

    try {
      setError("");

      const token = localStorage.getItem("scm_token");

      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const backendStatus = newStatus === "Published" ? "ACTIVE" : "INACTIVE";

      await apiFetch(`/assignments/${id}`, {
        method: "PUT",
        token,
        body: JSON.stringify({
          status: backendStatus,
        }),
      });

      setAssignments((current) =>
        current.map((currentAssignment) =>
          currentAssignment.id === id
            ? {
                ...currentAssignment,
                status: newStatus,
              }
            : currentAssignment,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update assignment status.",
      );
    }
  };

  return (
    <main className="min-h-screen bg-[#EAE6DC] p-4 font-inter sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="min-w-0">
          <p className="mb-1 text-sm font-medium text-[#B45A2A]">
            Assignment Management
          </p>

          <h1 className="font-serif text-3xl font-bold text-[#333333]">
            Assignments
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            Monitor assignments created by teachers.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateAssignment}
          className="w-full rounded-lg bg-[#B45A2A] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#984A22] sm:w-auto"
        >
          + Create Assignment
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="mb-8 grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
        <div className="hidden">
          <p className="text-sm text-gray-500">Total Assignments</p>

          <h2 className="mt-2 text-2xl font-bold text-[#333333]">
            {loading ? "..." : assignments.length}
          </h2>
        </div>

        <div className="hidden">
          <p className="text-sm text-gray-500">Published</p>

          <h2 className="mt-2 text-2xl font-bold text-[#333333]">
            {loading ? "..." : publishedCount}
          </h2>
        </div>

        <div className="hidden">
          <p className="text-sm text-gray-500">Drafts</p>

          <h2 className="mt-2 text-2xl font-bold text-[#333333]">
            {loading ? "..." : draftCount}
          </h2>

          <p className="mt-1 text-xs text-gray-400">
            Draft status is not currently supported by the backend.
          </p>
        </div>

        <div className="hidden">
          <p className="text-sm text-gray-500">Closed</p>

          <h2 className="mt-2 text-2xl font-bold text-[#333333]">
            {loading ? "..." : closedCount}
          </h2>
        </div>
        <TeacherMetricCard
          label="Total Assignments"
          value={loading ? "..." : assignments.length}
          icon="assignments"
        />
        <TeacherMetricCard
          label="Published"
          value={loading ? "..." : publishedCount}
          icon="active"
        />
        <TeacherMetricCard
          label="Drafts"
          value={loading ? "..." : draftCount}
          icon="pending"
          description="Draft status is not currently supported by the backend"
        />
        <TeacherMetricCard
          label="Closed"
          value={loading ? "..." : closedCount}
          icon="absent"
        />
      </div>

      <div className="mb-6 rounded-xl bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assignment, course or teacher..."
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-[#B45A2A] lg:flex-1"
          />

          <select
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#B45A2A] lg:w-auto"
          >
            {courses.map((item) => (
              <option key={item} value={item}>
                {item === "All" ? "All Courses" : item}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#B45A2A] lg:w-auto"
          >
            <option value="All">All Status</option>

            <option value="Published">Published</option>

            <option value="Draft">Draft</option>

            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Showing{" "}
          <span className="font-semibold text-[#333333]">
            {loading ? "..." : filteredAssignments.length}
          </span>{" "}
          of {loading ? "..." : assignments.length} assignments
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl bg-white p-10 text-center text-sm text-gray-400 shadow-sm">
          Loading assignments...
        </div>
      ) : (
        <AdminAssignmentTable
          assignments={filteredAssignments}
          onStatusChange={handleStatusChange}
        />
      )}

      {showCreateAssignment && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-4 shadow-xl sm:p-6">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="font-serif text-2xl font-bold text-[#333333]">
                  Create Assignment
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Create a new assignment for a course.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateAssignment(false)}
                className="shrink-0 text-2xl text-gray-400 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Course
                </label>

                <select
                  required
                  value={assignmentForm.courseId}
                  onChange={(e) =>
                    setAssignmentForm({
                      ...assignmentForm,
                      courseId: e.target.value,
                    })
                  }
                  disabled={loadingCourses}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#B45A2A] disabled:cursor-not-allowed disabled:bg-gray-100"
                >
                  <option value="">
                    {loadingCourses ? "Loading courses..." : "Select a course"}
                  </option>

                  {availableCourses.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.code} — {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Assignment Title
                </label>

                <input
                  required
                  type="text"
                  value={assignmentForm.title}
                  onChange={(e) =>
                    setAssignmentForm({
                      ...assignmentForm,
                      title: e.target.value,
                    })
                  }
                  placeholder="Database Project"
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#B45A2A]"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Description
                </label>

                <textarea
                  required
                  rows={4}
                  value={assignmentForm.description}
                  onChange={(e) =>
                    setAssignmentForm({
                      ...assignmentForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Enter assignment instructions..."
                  className="w-full resize-none rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#B45A2A]"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Due Date
                </label>

                <input
                  required
                  type="datetime-local"
                  value={assignmentForm.dueDate}
                  onChange={(e) =>
                    setAssignmentForm({
                      ...assignmentForm,
                      dueDate: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#B45A2A]"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateAssignment(false)}
                  className="w-full rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 sm:w-auto"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creatingAssignment}
                  className="w-full rounded-lg bg-[#B45A2A] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#984A22] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {creatingAssignment ? "Creating..." : "Create Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
