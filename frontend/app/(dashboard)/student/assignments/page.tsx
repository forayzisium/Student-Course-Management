"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRealtimeRefresh } from "@/lib/hooks/useRealtimeSync";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

type AssignmentStatus = "Pending" | "Submitted" | "Graded";

type ApiSubmission = {
  id: number;
  submittedAt: string;
  status: "SUBMITTED" | "GRADED";
  marks: number | null;
  feedback: string | null;
  fileName: string | null;
  fileUrl: string | null;
};

type ApiAssignment = {
  id: number;
  title: string;
  description: string | null;
  dueDate: string;
  course: {
    id: number;
    code: string;
    name: string;
    teacher: {
      id: number;
      name: string;
    } | null;
  };
  submissions: ApiSubmission[];
};

type Assignment = {
  id: number;
  courseId: number;
  courseCode: string;
  course: string;
  teacherName: string;
  title: string;
  description: string;
  dueDate: string;
  rawDueDate: string;
  status: AssignmentStatus;
  marks: number | null;
  feedback: string | null;
  submittedAt: string | null;
  fileName: string | null;
  fileUrl: string | null;
};

type AssignmentsResponse = {
  success: boolean;
  data?: ApiAssignment[];
  message?: string;
};

type SubmissionResponse = {
  success: boolean;
  data?: {
    id: number;
    assignmentId: number;
    studentId: number;
    submittedAt: string;
    status: "SUBMITTED" | "GRADED";
    marks: number | null;
    feedback: string | null;
    fileName: string | null;
    fileUrl: string | null;
  };
  message?: string;
};

type AssignmentDetailsResponse = {
  success: boolean;
  data?: {
    id: number;
    title: string;
    description: string | null;
    dueDate: string;
    course: {
      id: number;
      code: string;
      name: string;
      teacher: {
        id: number;
        name: string;
      } | null;
    };
    submissions: ApiSubmission[];
  };
  message?: string;
};

export default function StudentAssignments() {
  return (
    <Suspense fallback={<p className="p-8">Loading assignments...</p>}>
      <StudentAssignmentsContent />
    </Suspense>
  );
}
function StudentAssignmentsContent() {
  const searchParams = useSearchParams();
  const selectedCourse = searchParams.get("course");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeFilter, setActiveFilter] = useState<"All" | AssignmentStatus>(
    "All",
  );

  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);

  const [detailsLoading, setDetailsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "Invalid date";
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  const getAssignmentStatus = useCallback(
    (assignment: ApiAssignment): AssignmentStatus => {
      const submission = assignment.submissions?.[0];

      if (submission?.status === "GRADED") {
        return "Graded";
      }

      if (submission?.status === "SUBMITTED") {
        return "Submitted";
      }

      return "Pending";
    },
    [],
  );

  const mapAssignment = useCallback(
    (assignment: ApiAssignment): Assignment => {
      const submission = assignment.submissions?.[0] ?? null;

      return {
        id: assignment.id,
        courseId: assignment.course.id,
        courseCode: assignment.course.code,
        course: assignment.course.name,
        teacherName: assignment.course.teacher?.name || "Not assigned",
        title: assignment.title,
        description: assignment.description || "",
        dueDate: formatDate(assignment.dueDate),
        rawDueDate: assignment.dueDate,
        status: getAssignmentStatus(assignment),
        marks: submission?.marks ?? null,
        feedback: submission?.feedback ?? null,
        submittedAt: submission?.submittedAt ?? null,
        fileName: submission?.fileName ?? null,
        fileUrl: submission?.fileUrl ?? null,
      };
    },
    [formatDate, getAssignmentStatus],
  );

  const loadAssignments = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) {
          setLoading(true);
        }

        setError("");

        const token = localStorage.getItem("scm_token");

        if (!token) {
          throw new Error("Authentication token not found.");
        }

        const response = await apiFetch<AssignmentsResponse>(
          "/assignments/student-assignments",
          {
            token,
          },
        );

        if (!response.success) {
          throw new Error(response.message || "Failed to load assignments.");
        }

        const formattedAssignments = (response.data || []).map(mapAssignment);

        setAssignments(formattedAssignments);
      } catch (err) {
        console.error("Failed to load student assignments:", err);

        setError(
          err instanceof Error ? err.message : "Failed to load assignments.",
        );
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [mapAssignment],
  );

  useRealtimeRefresh(async () => {
    await loadAssignments(false);
  });

  useEffect(() => {
    let cancelled = false;

    const loadInitialAssignments = async () => {
      try {
        const token = localStorage.getItem("scm_token");

        if (!token) {
          throw new Error("Authentication token not found.");
        }

        const response = await apiFetch<AssignmentsResponse>(
          "/assignments/student-assignments",
          {
            token,
          },
        );

        if (!response.success) {
          throw new Error(response.message || "Failed to load assignments.");
        }

        if (cancelled) return;

        const formattedAssignments = (response.data || []).map(mapAssignment);

        setAssignments(formattedAssignments);
        setError("");
      } catch (err) {
        if (cancelled) return;

        console.error("Failed to load student assignments:", err);

        setError(
          err instanceof Error ? err.message : "Failed to load assignments.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadInitialAssignments();

    return () => {
      cancelled = true;
    };
  }, [mapAssignment]);

  const filteredAssignments = useMemo(() => {
    const courseAssignments = selectedCourse
      ? assignments.filter((a) => String(a.courseId) === selectedCourse)
      : assignments;
    if (activeFilter === "All") {
      return courseAssignments;
    }

    return courseAssignments.filter(
      (assignment) => assignment.status === activeFilter,
    );
  }, [assignments, activeFilter, selectedCourse]);

  const pendingCount = assignments.filter(
    (assignment) => assignment.status === "Pending",
  ).length;

  const submittedCount = assignments.filter(
    (assignment) => assignment.status === "Submitted",
  ).length;

  const gradedCount = assignments.filter(
    (assignment) => assignment.status === "Graded",
  ).length;

  const closeModal = () => {
    if (submitting || detailsLoading) {
      return;
    }

    setSelectedAssignment(null);
    setSelectedFile(null);
    setSubmitError("");
  };

  const handleOpenAssignment = async (assignment: Assignment) => {
    try {
      setSelectedAssignment(assignment);
      setSelectedFile(null);
      setSubmitError("");
      setDetailsLoading(true);

      const token = localStorage.getItem("scm_token");

      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const response = await apiFetch<AssignmentDetailsResponse>(
        `/submissions/student/assignment/${assignment.id}`,
        {
          token,
        },
      );

      if (!response.success || !response.data) {
        throw new Error(
          response.message || "Failed to load assignment details.",
        );
      }

      const submission = response.data.submissions?.[0] ?? null;

      setSelectedAssignment({
        ...assignment,

        courseCode: response.data.course.code,

        course: response.data.course.name,

        teacherName:
          response.data.course.teacher?.name || assignment.teacherName,

        title: response.data.title,

        description: response.data.description || "",

        dueDate: formatDate(response.data.dueDate),

        rawDueDate: response.data.dueDate,

        status:
          submission?.status === "GRADED"
            ? "Graded"
            : submission?.status === "SUBMITTED"
              ? "Submitted"
              : "Pending",

        marks: submission?.marks ?? null,

        feedback: submission?.feedback ?? null,

        submittedAt: submission?.submittedAt ?? null,
        fileName: submission?.fileName ?? null,

        fileUrl: submission?.fileUrl ?? null,
      });
    } catch (err) {
      console.error("Failed to load assignment details:", err);

      setSubmitError(
        err instanceof Error
          ? err.message
          : "Failed to load assignment details.",
      );
    } finally {
      setDetailsLoading(false);
    }
  };
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    setSubmitError("");

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const maxFileSize = 10 * 1024 * 1024;

    if (file.size > maxFileSize) {
      setSelectedFile(null);
      event.target.value = "";
      setSubmitError("File size must be 10 MB or less.");
      return;
    }

    const allowedExtensions = [
      ".pdf",
      ".doc",
      ".docx",
      ".ppt",
      ".pptx",
      ".xls",
      ".xlsx",
      ".txt",
      ".zip",
    ];

    const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();

    if (!allowedExtensions.includes(extension)) {
      setSelectedFile(null);
      event.target.value = "";

      setSubmitError(
        "Invalid file type. Allowed: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT and ZIP.",
      );

      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = async () => {
    if (!selectedAssignment || submitting) {
      return;
    }

    if (!selectedFile) {
      setSubmitError("Please choose an assignment file before submitting.");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setSubmitError("File size must be 10 MB or less.");
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError("");

      const token = localStorage.getItem("scm_token");

      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const formData = new FormData();

      formData.append("file", selectedFile);

      const response = await apiFetch<SubmissionResponse>(
        `/submissions/student/assignment/${selectedAssignment.id}`,
        {
          method: "POST",
          token,
          body: formData,
        },
      );

      if (!response.success) {
        throw new Error(response.message || "Failed to submit assignment.");
      }

      const submission = response.data;

      const updatedAssignment: Assignment = {
        ...selectedAssignment,

        status: submission?.status === "GRADED" ? "Graded" : "Submitted",

        marks: submission?.marks ?? null,

        feedback: submission?.feedback ?? null,

        submittedAt: submission?.submittedAt ?? new Date().toISOString(),

        fileName: submission?.fileName ?? selectedFile.name,

        fileUrl: submission?.fileUrl ?? null,
      };

      setSelectedAssignment(updatedAssignment);

      setSelectedFile(null);

      setAssignments((current) =>
        current.map((assignment) =>
          assignment.id === updatedAssignment.id
            ? updatedAssignment
            : assignment,
        ),
      );

      await loadAssignments();
    } catch (err) {
      console.error("Submit assignment error:", err);

      setSubmitError(
        err instanceof Error ? err.message : "Failed to submit assignment.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isPastDue = selectedAssignment
    ? new Date(selectedAssignment.rawDueDate) < new Date()
    : false;

  return (
    <div className="flex min-h-screen bg-[#EAE6DC]">
      <main className="min-w-0 flex-1 p-5 sm:p-8">
        {selectedCourse && (
          <p className="mb-5 rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500">
            Showing this course only.{" "}
            <Link
              href="/student/assignments"
              className="font-semibold text-[#B45A2A] hover:text-[#984A22]"
            >
              Show all assignments
            </Link>
          </p>
        )}

        <div className="mb-8">
          <p className="font-serif text-sm text-[#B45A2A]">Student Portal</p>

          <h1 className="mt-1 font-serif text-2xl font-bold tracking-tight text-[#333333] sm:text-3xl">
            Assignments
          </h1>

          <p className="mt-2 font-serif text-sm text-slate-500">
            View your assignments, submit your work, and check feedback.
          </p>
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

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="relative rounded-xl bg-white p-5 shadow-sm">
            <div className="absolute right-5 top-5 rounded-lg bg-slate-900 p-2 text-white">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3m0 3h.01M10.3 3.9 2.9 17a2 2 0 0 0 1.7 3h14.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
                />
              </svg>
            </div>

            <p className="pr-12 text-sm text-slate-500">Pending</p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {loading ? "..." : pendingCount}
            </p>

            <p className="mt-1 text-xs text-slate-400">Need your attention</p>
          </div>

          <div className="relative rounded-xl bg-white p-5 shadow-sm">
            <div className="absolute right-5 top-5 rounded-lg bg-slate-900 p-2 text-white">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 16V4m0 0L8 8m4-4 4 4M5 13v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"
                />
              </svg>
            </div>

            <p className="pr-12 text-sm text-slate-500">Submitted</p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {loading ? "..." : submittedCount}
            </p>

            <p className="mt-1 text-xs text-slate-400">Waiting for grading</p>
          </div>

          <div className="relative rounded-xl bg-white p-5 shadow-sm sm:col-span-2 lg:col-span-1">
            <div className="absolute right-5 top-5 rounded-lg bg-slate-900 p-2 text-white">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
              >
                <circle cx="12" cy="12" r="9" />

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m8.5 12 2.25 2.25L15.5 9.5"
                />
              </svg>
            </div>

            <p className="pr-12 text-sm text-slate-500">Graded</p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {loading ? "..." : gradedCount}
            </p>

            <p className="mt-1 text-xs text-slate-400">Feedback available</p>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {(["All", "Pending", "Submitted", "Graded"] as const).map(
            (filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                  activeFilter === filter
                    ? "bg-[#B45A2A] text-white"
                    : "bg-white text-slate-600 shadow-sm hover:bg-slate-50"
                }`}
              >
                {filter}
              </button>
            ),
          )}
        </div>

        {loading ? (
          <div className="rounded-xl bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-slate-500">Loading assignments...</p>
          </div>
        ) : (
          <>
            <div className="grid gap-5 lg:grid-cols-2">
              {filteredAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="rounded-xl bg-white p-6 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-[#B45A2A]">
                        {assignment.courseCode}
                      </p>

                      <h2 className="mt-1 text-lg font-semibold text-slate-900">
                        {assignment.title}
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        {assignment.course}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Teacher: {assignment.teacherName}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                        assignment.status === "Pending"
                          ? "bg-amber-50 text-amber-700"
                          : assignment.status === "Submitted"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-green-50 text-green-700"
                      }`}
                    >
                      {assignment.status}
                    </span>
                  </div>

                  <p className="mt-5 text-sm leading-6 text-slate-500">
                    {assignment.description}
                  </p>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                    <div>
                      <p className="text-xs text-slate-400">Due date</p>

                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {assignment.dueDate}
                      </p>
                    </div>

                    {assignment.status === "Graded" &&
                      assignment.marks !== null && (
                        <div className="text-right">
                          <p className="text-xs text-slate-400">Marks</p>

                          <p className="mt-1 text-sm font-bold text-slate-900">
                            {assignment.marks}
                          </p>
                        </div>
                      )}
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleOpenAssignment(assignment)}
                    className="mt-5 w-full rounded-lg bg-[#111827] px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    {assignment.status === "Pending"
                      ? "View & Submit"
                      : assignment.status === "Submitted"
                        ? "View Submission"
                        : "View Feedback"}
                  </button>
                </div>
              ))}
            </div>

            {filteredAssignments.length === 0 && (
              <div className="rounded-xl bg-white p-10 text-center shadow-sm">
                <p className="font-semibold text-slate-700">
                  No assignments found
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  There are no assignments in this category.
                </p>
              </div>
            )}
          </>
        )}

        {selectedAssignment && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-slate-100 p-6">
                <div>
                  <p className="text-sm font-medium text-[#B45A2A]">
                    {selectedAssignment.courseCode}
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-slate-900">
                    {selectedAssignment.title}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {selectedAssignment.course}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Teacher: {selectedAssignment.teacherName}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting || detailsLoading}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                {submitError && (
                  <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {submitError}
                  </div>
                )}

                {detailsLoading ? (
                  <div className="rounded-xl bg-[#F0EDE4] p-10 text-center">
                    <p className="text-sm text-slate-500">
                      Loading assignment details...
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="rounded-xl bg-[#F0EDE4] p-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Assignment
                      </p>

                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {selectedAssignment.description}
                      </p>

                      <div className="mt-4">
                        <p className="text-xs text-slate-400">Due date</p>

                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {selectedAssignment.dueDate}
                        </p>
                      </div>
                    </div>

                    {selectedAssignment.status === "Graded" && (
                      <div className="mt-5">
                        <div className="rounded-xl border border-green-100 bg-green-50 p-5">
                          <div className="flex items-center justify-between gap-4">
                            <p className="font-semibold text-green-800">
                              Teacher Feedback
                            </p>

                            {selectedAssignment.marks !== null && (
                              <span className="text-lg font-bold text-green-800">
                                {selectedAssignment.marks} marks
                              </span>
                            )}
                          </div>

                          <p className="mt-3 text-sm leading-6 text-green-700">
                            {selectedAssignment.feedback ||
                              "No written feedback was provided."}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedAssignment.status === "Pending" && (
                      <div className="mt-5">
                        <div
                          className={`rounded-xl border p-5 ${
                            isPastDue
                              ? "border-red-100 bg-red-50"
                              : "border-amber-100 bg-amber-50"
                          }`}
                        >
                          <p
                            className={`font-semibold ${
                              isPastDue ? "text-red-800" : "text-amber-800"
                            }`}
                          >
                            {isPastDue ? "Deadline Passed" : "Ready to Submit"}
                          </p>

                          <p
                            className={`mt-2 text-sm leading-6 ${
                              isPastDue ? "text-red-700" : "text-amber-700"
                            }`}
                          >
                            {isPastDue
                              ? "The assignment deadline has passed, so the backend will not accept a new submission."
                              : "Upload your completed assignment file before submitting."}
                          </p>
                        </div>

                        {!isPastDue && (
                          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                            <label
                              htmlFor="assignment-file"
                              className="block text-sm font-semibold text-slate-700"
                            >
                              Assignment File
                            </label>

                            <input
                              id="assignment-file"
                              type="file"
                              onChange={handleFileChange}
                              disabled={submitting}
                              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip"
                              className="mt-3 block w-full cursor-pointer rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-600 file:mr-4 file:cursor-pointer file:border-0 file:bg-[#111827] file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800 disabled:cursor-not-allowed"
                            />

                            <p className="mt-2 text-xs text-slate-400">
                              Allowed: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX,
                              TXT, ZIP · Maximum 10 MB
                            </p>

                            {selectedFile && (
                              <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-[#F0EDE4] px-3 py-2.5">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-slate-700">
                                    {selectedFile.name}
                                  </p>

                                  <p className="text-xs text-slate-400">
                                    {(
                                      selectedFile.size /
                                      (1024 * 1024)
                                    ).toFixed(2)}{" "}
                                    MB
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => setSelectedFile(null)}
                                  disabled={submitting}
                                  className="shrink-0 text-xs font-semibold text-red-500 hover:text-red-700 disabled:opacity-50"
                                >
                                  Remove
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        <button
                          type="button"
                          disabled={submitting || isPastDue || !selectedFile}
                          onClick={() => void handleSubmit()}
                          className={`mt-4 w-full rounded-lg px-4 py-3 text-sm font-semibold text-white transition ${
                            submitting || isPastDue || !selectedFile
                              ? "cursor-not-allowed bg-slate-300"
                              : "bg-[#111827] hover:bg-slate-800"
                          }`}
                        >
                          {submitting
                            ? "Uploading & Submitting..."
                            : "Submit Assignment"}
                        </button>
                      </div>
                    )}

                    {selectedAssignment.status === "Submitted" && (
                      <div className="mt-5 rounded-xl bg-blue-50 p-5">
                        <p className="font-semibold text-blue-800">
                          Assignment Submitted
                        </p>

                        <p className="mt-2 text-sm leading-6 text-blue-700">
                          Your assignment has been submitted successfully and is
                          waiting for the teacher to review it.
                        </p>

                        {selectedAssignment.submittedAt && (
                          <p className="mt-3 text-xs text-blue-500">
                            Submitted on{" "}
                            {new Date(
                              selectedAssignment.submittedAt,
                            ).toLocaleString()}
                          </p>
                        )}
                        {selectedAssignment.fileName && (
                          <div className="mt-4 rounded-lg bg-white/70 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                              Submitted File
                            </p>

                            <p className="mt-1 truncate text-sm font-medium text-blue-800">
                              {selectedAssignment.fileName}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex justify-end border-t border-slate-100 px-6 py-5">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting || detailsLoading}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
