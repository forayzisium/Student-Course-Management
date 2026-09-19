"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import StatCard from "@/components/students/StatCard";
import CourseCard from "@/components/students/CourseCard";
import AssignmentCard from "@/components/students/AssignmentCard";
import { weightedGpa } from "@/lib/academic-metrics";
import { apiFetch } from "@/lib/api";
import {
  getEnrolledCourses,
  type EnrollmentResponse,
} from "@/lib/student-enrollments";

type ApiCourse = {
  id: number;
  code?: string;
  name?: string;
  title?: string;
  department?: string;
  semester?: string;
  status?: string;
  teacher?: {
    id?: number;
    name?: string;
  };
  instructor?: {
    id?: number;
    name?: string;
  };
  progress?: number;
};
type ApiAssignment = {
  id: number;
  title?: string;
  name?: string;
  description?: string;
  dueDate?: string;
  status?: string;

  course?: {
    id?: number;
    code?: string;
    name?: string;
  };

  submissions?: {
    id?: number;
    status?: string;
    submittedAt?: string;
    marks?: number | null;
    feedback?: string | null;
  }[];
};
type ApiGrade = {
  id: number;
  assignment?: number | null;
  midterm?: number | null;
  final?: number | null;
  total?: number | null;
  course?: {
    id?: number;
    code?: string;
    name?: string;
    semester?: string;
    credits: number;
  };
};

type ApiAttendance = {
  id: number;
  studentId: number;
  courseId: number;
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE";
  course?: {
    id?: number;
    code?: string;
    name?: string;
    semester?: string;
  };
};

type ApiFee = {
  id: number;
  feeType: string;
  amount: number;
  outstandingAmount: number;
  dueDate: string;
  status: "UNPAID" | "PARTIAL" | "PAID" | "OVERDUE";
};

type CoursesResponse = EnrollmentResponse<ApiCourse>;

type AssignmentsResponse = {
  success: boolean;
  data: ApiAssignment[];
};

type GradesResponse = {
  success: boolean;
  data: ApiGrade[];
};

type AttendanceResponse = {
  success: boolean;
  data: ApiAttendance[];
};

type StudentProfileResponse = {
  success: boolean;
  data: {
    id: number;
    name: string;
    username: string;
    email: string;
    status: string;
    createdAt: string;
    studentProfile: {
      id: number;
      studentId: string;
      department: string;
      year: string;
      enrollments: {
        id: number;
        enrolledAt: string;
        course: {
          id: number;
          code: string;
          name: string;
          department: string;
          semester: string;
          status: string;
        };
      }[];
    };
  };
};

type FeesResponse = {
  success: boolean;
  data: ApiFee[];
};

function getGradePoint(total: number): number {
  if (total >= 80) return 4.0;
  if (total >= 75) return 3.75;
  if (total >= 70) return 3.5;
  if (total >= 65) return 3.25;
  if (total >= 60) return 3.0;
  if (total >= 55) return 2.75;
  if (total >= 50) return 2.5;
  if (total >= 45) return 2.25;
  if (total >= 40) return 2.0;

  return 0;
}

type ApiActivity = {
  id: number;
  type: string;
  title: string;
  description: string;
  date: string;
};

type ActivityResponse = {
  success: boolean;
  data: ApiActivity[];
};

function formatDueDate(date?: string): string {
  if (!date) return "No due date";

  const due = new Date(date);

  if (Number.isNaN(due.getTime())) {
    return "No due date";
  }

  const now = new Date();

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());

  const diffMs = dueDay.getTime() - today.getTime();

  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Today";
  }

  if (diffDays === 1) {
    return "Tomorrow";
  }

  if (diffDays === -1) {
    return "Yesterday";
  }

  if (diffDays > 1 && diffDays <= 7) {
    return `In ${diffDays} days`;
  }

  return due.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function isAssignmentSubmitted(assignment: ApiAssignment): boolean {
  if (
    assignment.submissions?.some(
      (submission) =>
        submission.status === "SUBMITTED" || submission.status === "GRADED",
    )
  ) {
    return true;
  }

  if (
    assignment.status?.toUpperCase() === "SUBMITTED" ||
    assignment.status?.toUpperCase() === "GRADED"
  ) {
    return true;
  }

  return false;
}

function isAssignmentPending(assignment: ApiAssignment): boolean {
  return !isAssignmentSubmitted(assignment);
}

function getTeacherName(course: ApiCourse): string {
  return course.teacher?.name || course.instructor?.name || "Instructor";
}

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return "Just now";
  }

  if (diffMinutes === 1) {
    return "1 minute ago";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} minutes ago`;
  }

  if (diffHours === 1) {
    return "1 hour ago";
  }

  if (diffHours < 24) {
    return `${diffHours} hours ago`;
  }

  if (diffDays === 1) {
    return "Yesterday";
  }

  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getActivityIcon(type: string) {
  if (type === "ASSIGNMENT") {
    return (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 5h6M9 3h6a1 1 0 0 1 1 1v1h1a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h1V4a1 1 0 0 1 1-1Z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="m9 13 2 2 4-4" />
      </svg>
    );
  }

  if (type === "GRADE") {
    return (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 19V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 17v-4M12 17V9M16 17v-7"
        />
      </svg>
    );
  }

  if (type === "ATTENDANCE") {
    return (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l4 4L19 6" />
      </svg>
    );
  }

  if (type === "PAYMENT") {
    return (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18v10H3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18" />
      </svg>
    );
  }

  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M12 8v4M12 16h.01" />
    </svg>
  );
}

function getActivityStyles(type: string) {
  if (type === "ASSIGNMENT") {
    return {
      bg: "bg-blue-50 text-blue-600",
      border: "border-l-blue-500",
    };
  }

  if (type === "GRADE") {
    return {
      bg: "bg-emerald-50 text-emerald-600",
      border: "border-l-emerald-500",
    };
  }

  if (type === "ATTENDANCE") {
    return {
      bg: "bg-amber-50 text-amber-600",
      border: "border-l-amber-500",
    };
  }

  if (type === "PAYMENT") {
    return {
      bg: "bg-violet-50 text-violet-600",
      border: "border-l-violet-500",
    };
  }

  return {
    bg: "bg-slate-100 text-slate-600",
    border: "border-l-slate-500",
  };
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

export default function StudentDashboard() {
  const [courses, setCourses] = useState<ApiCourse[]>([]);
  const [activities, setActivities] = useState<ApiActivity[]>([]);

  const [assignments, setAssignments] = useState<ApiAssignment[]>([]);

  const [grades, setGrades] = useState<ApiGrade[]>([]);

  const [attendance, setAttendance] = useState<ApiAttendance[]>([]);

  const [studentFirstName, setStudentFirstName] = useState("Student");

  const [studentLastName, setStudentLastName] = useState("");

  const [fees, setFees] = useState<ApiFee[]>([]);

  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(0);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let inFlight = false;
    let refreshQueued = false;
    let hasLoaded = false;
    const controller = new AbortController();

    async function loadDashboard() {
      if (inFlight) {
        // Do not lose an enrollment/realtime update that arrives while the
        // previous dashboard snapshot is still loading.
        refreshQueued = true;
        return;
      }
      inFlight = true;
      try {
        const token = localStorage.getItem("scm_token");

        if (!token) {
          throw new Error("Authentication required");
        }

        const [
          coursesResponse,
          assignmentsResponse,
          gradesResponse,
          attendanceResponse,
          studentResponse,
          feesResponse,
          activityResponse,
        ] = await Promise.all([
          apiFetch<CoursesResponse>("/enrollments/my-courses", {
            token,
            cache: "no-store",
            signal: controller.signal,
          }),

          apiFetch<AssignmentsResponse>("/assignments/student-assignments", {
            token,
            cache: "no-store",
            signal: controller.signal,
          }),

          apiFetch<GradesResponse>("/grades/my-grades", {
            token,
            cache: "no-store",
            signal: controller.signal,
          }),

          apiFetch<AttendanceResponse>("/attendance/my-attendance", {
            token,
            cache: "no-store",
            signal: controller.signal,
          }),

          apiFetch<StudentProfileResponse>("/students/me", {
            token,
            cache: "no-store",
            signal: controller.signal,
          }),

          apiFetch<FeesResponse>("/fees/my", {
            token,
            cache: "no-store",
            signal: controller.signal,
          }),

          apiFetch<ActivityResponse>("/students/me/activity", {
            token,
            cache: "no-store",
            signal: controller.signal,
          }),
        ]);

        if (!mounted) return;

        for (const response of [
          assignmentsResponse,
          gradesResponse,
          attendanceResponse,
          feesResponse,
          activityResponse,
        ]) {
          if (!response.success || !Array.isArray(response.data)) {
            throw new Error("Invalid dashboard response. Please try again.");
          }
        }
        if (!studentResponse.success || !studentResponse.data) {
          throw new Error("Unable to load student profile");
        }
        setCourses(getEnrolledCourses(coursesResponse));

        setAssignments(
          Array.isArray(assignmentsResponse.data)
            ? assignmentsResponse.data
            : [],
        );

        setGrades(
          Array.isArray(gradesResponse.data) ? gradesResponse.data : [],
        );

        setAttendance(
          Array.isArray(attendanceResponse.data) ? attendanceResponse.data : [],
        );

        const fullName = studentResponse.data?.name || "Student";

        const nameParts = fullName.trim().split(/\s+/);

        setStudentFirstName(nameParts.shift() || "Student");

        setStudentLastName(nameParts.join(" "));

        setFees(Array.isArray(feesResponse.data) ? feesResponse.data : []);

        setActivities(activityResponse.data || []);
        hasLoaded = true;
        setHasData(true);
        setLastUpdated(Date.now());
        setError(null);
      } catch (err) {
        if (!mounted || isAbortError(err)) return;

        console.error("Failed to load student dashboard:", err);

        setError(
          hasLoaded
            ? "Unable to refresh dashboard. Showing the last loaded data; retrying automatically."
            : err instanceof Error
              ? err.message
              : "Failed to load dashboard",
        );
      } finally {
        inFlight = false;
        if (mounted) {
          setLoading(false);
          if (refreshQueued) {
            refreshQueued = false;
            void loadDashboard();
          }
        }
      }
    }

    void loadDashboard();
    const refresh = () => {
      if (document.visibilityState === "visible") void loadDashboard();
    };
    window.addEventListener("scm:student-refresh", refresh);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      mounted = false;
      controller.abort(
        new DOMException("Student dashboard unmounted", "AbortError"),
      );
      window.removeEventListener("scm:student-refresh", refresh);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  const activeCourses = useMemo(() => {
    return courses;
  }, [courses]);

  const pendingAssignments = useMemo(() => {
    return assignments.filter(isAssignmentPending);
  }, [assignments]);

  const gradedCourseCount = useMemo(() => {
    const courseIds = new Set<number>();

    grades.forEach((grade) => {
      if (grade.course?.id) {
        courseIds.add(grade.course.id);
      }
    });

    return courseIds.size;
  }, [grades]);

  const currentGpa = useMemo(() => {
    const validGrades = grades.filter(
      (grade) =>
        typeof grade.total === "number" && Number.isFinite(grade.total),
    );

    if (validGrades.length === 0) {
      return null;
    }

    return (
      weightedGpa(
        validGrades.map((grade) => ({
          point: getGradePoint(grade.total as number),
          credits: grade.course?.credits ?? 0,
        })),
      )?.toFixed(2) ?? null
    );
  }, [grades]);

  const attendancePercentage = useMemo(() => {
    if (attendance.length === 0) {
      return null;
    }

    const attended = attendance.filter(
      (record) => record.status === "PRESENT" || record.status === "LATE",
    ).length;

    return Math.round((attended / attendance.length) * 100);
  }, [attendance]);

  const outstandingBalance = useMemo(() => {
    return fees
      .filter((fee) => fee.outstandingAmount > 0)
      .reduce((total, fee) => total + fee.outstandingAmount, 0);
  }, [fees]);

  const nextFeeDueDate = useMemo(() => {
    const unpaidFees = fees
      .filter((fee) => fee.outstandingAmount > 0)
      .sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
      );

    return unpaidFees[0]?.dueDate || null;
  }, [fees]);

  const currentSemester = useMemo(() => {
    const semesters = [
      ...new Set(
        activeCourses.map((course) => course.semester).filter(Boolean),
      ),
    ];
    return semesters.length > 1
      ? "Multiple semesters"
      : semesters[0] || "No enrolled semester";
  }, [activeCourses]);

  const displayedCourses = useMemo(() => {
    return activeCourses.slice(0, 4);
  }, [activeCourses]);

  const displayedAssignments = useMemo(() => {
    return assignments
      .filter((assignment) => !isAssignmentSubmitted(assignment))
      .sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;

        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      })
      .slice(0, 4);
  }, [assignments]);

  function getCourseProgress(
    course: ApiCourse,
    assignments: ApiAssignment[],
  ): number {
    const courseAssignments = assignments.filter(
      (assignment) => assignment.course?.id === course.id,
    );

    if (courseAssignments.length === 0) {
      return 0;
    }

    const submittedCount = courseAssignments.filter((assignment) =>
      assignment.submissions?.some(
        (submission) =>
          submission.status === "SUBMITTED" || submission.status === "GRADED",
      ),
    ).length;

    return Math.round((submittedCount / courseAssignments.length) * 100);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#EAE6DC]">
        <main className="min-w-0 flex-1 p-5 sm:p-8">
          <div className="flex min-h-[70vh] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#B45A2A]/20 border-t-[#B45A2A]" />

              <p className="mt-4 font-serif text-sm text-slate-500">
                Loading your dashboard...
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error && !hasData) {
    return (
      <div className="flex min-h-screen bg-[#EAE6DC]">
        <main className="min-w-0 flex-1 p-5 sm:p-8">
          <div className="flex min-h-[70vh] items-center justify-center">
            <div className="max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="9" />

                  <path strokeLinecap="round" d="M12 8v4M12 16h.01" />
                </svg>
              </div>

              <h2 className="mt-4 font-serif text-xl font-bold text-[#333333]">
                Unable to load dashboard
              </h2>

              <p className="mt-2 text-sm text-slate-500">{error}</p>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-6 rounded-xl bg-[#B45A2A] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#984A22]"
              >
                Try Again
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#EAE6DC]">
      <main className="min-w-0 flex-1 p-5 sm:p-8">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-serif text-sm text-[#B45A2A]">
              Student Dashboard
            </p>

            <h1 className="mt-1 font-serif text-2xl font-bold tracking-tight text-[#333333] sm:text-3xl">
              Welcome back, {studentFirstName}
              {studentLastName ? ` ${studentLastName}` : ""}
            </h1>

            <p className="mt-2 font-serif text-sm text-slate-500">
              Here&apos;s an overview of your academic activity.
            </p>
          </div>

          <div className="flex w-fit items-center gap-2 rounded-xl border bg-slate-900 px-4 py-3 text-white shadow-md">
            <svg
              className="h-5 w-5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="4" width="18" height="17" rx="2" />

              <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
            </svg>

            <span className="font-serif text-sm font-medium text-white">
              {currentSemester}
            </span>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="mb-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800"
          >
            {error}
          </p>
        )}
        <p className="mb-4 text-xs text-slate-500">
          Updates automatically when your academic records change.
        </p>
        <section>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard
              title="Enrolled Courses"
              value={String(activeCourses.length).padStart(2, "0")}
              description="Active enrollments"
              icon={
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 14 3 9l9-5 9 5-9 5Z"
                  />

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7 12v5c3 2 7 2 10 0v-5"
                  />
                </svg>
              }
            />

            <StatCard
              title="Graded Courses"
              value={String(gradedCourseCount).padStart(2, "0")}
              description="Courses with results"
              icon={
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="9" />

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m8 12 2.5 2.5L16 9"
                  />
                </svg>
              }
            />

            <StatCard
              title="Assignments"
              value={String(pendingAssignments.length).padStart(2, "0")}
              description="Pending assignments"
              icon={
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5h6M9 3h6a1 1 0 0 1 1 1v1h1a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h1V4a1 1 0 0 1 1-1Z"
                  />

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m9 13 2 2 4-4"
                  />
                </svg>
              }
            />

            <StatCard
              title="Cumulative CGPA"
              value={currentGpa === null ? "—" : currentGpa}
              description={
                grades.length > 0
                  ? "Weighted by course credits"
                  : "No grades available"
              }
              icon={
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 19V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14"
                  />

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 17v-4M12 17V9M16 17v-7"
                  />
                </svg>
              }
            />

            <StatCard
              title="Attendance"
              value={
                attendancePercentage === null ? "—" : `${attendancePercentage}%`
              }
              description={
                attendance.length > 0
                  ? `${attendance.length} attendance records`
                  : "No attendance available"
              }
              icon={
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 12l4 4L19 6"
                  />
                </svg>
              }
            />
          </div>
        </section>

        <section className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm font-medium text-slate-500">
                  Outstanding Fees
                </p>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#111827] text-white">
                  <svg
                    aria-hidden="true"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 7h18v12H3zM3 10h18M7 15h4"
                    />
                  </svg>
                </div>
              </div>

              <p className="mt-2 font-serif text-2xl font-bold text-[#333333]">
                ৳{outstandingBalance.toLocaleString()}
              </p>

              <Link
                href="/student/payFees"
                className="mt-3 inline-block text-sm font-semibold text-[#B45A2A] hover:text-[#984A22]"
              >
                Pay fees →
              </Link>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm font-medium text-slate-500">
                  Next Payment Due
                </p>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#111827] text-white">
                  <svg
                    aria-hidden="true"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="4" width="18" height="17" rx="2" />
                    <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                </div>
              </div>

              <p className="mt-2 font-serif text-2xl font-bold text-[#333333]">
                {nextFeeDueDate
                  ? new Date(nextFeeDueDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "No pending fees"}
              </p>

              <Link
                href="/student/payFees"
                className="mt-3 inline-block text-sm font-semibold text-[#B45A2A] hover:text-[#984A22]"
              >
                View payment details →
              </Link>
            </div>
          </div>
        </section>

        <div className="mt-10 grid gap-8 xl:grid-cols-[1.6fr_1fr]">
          <section>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">My Courses</h2>

                <p className="mt-1 text-sm text-slate-500">
                  Your currently enrolled courses.
                </p>
              </div>

              <Link
                href="/student/courses"
                className="text-sm font-semibold text-slate-700 transition hover:text-[#B45A2A]"
              >
                View all →
              </Link>
            </div>

            {displayedCourses.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                <p className="font-serif text-sm text-slate-500">
                  You have no active enrollments yet.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {displayedCourses.map((course) => (
                  <CourseCard
                    id={course.id}
                    key={course.id}
                    code={course.code || "Course"}
                    title={course.name || course.title || "Untitled Course"}
                    instructor={getTeacherName(course)}
                    progress={
                      course.progress ?? getCourseProgress(course, assignments)
                    }
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Pending Assignments
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Assignments awaiting submission, including overdue work.
                </p>
              </div>

              <Link
                href="/student/assignments"
                className="text-sm font-semibold text-slate-700 transition hover:text-[#B45A2A]"
              >
                View all →
              </Link>
            </div>

            {displayedAssignments.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                <p className="font-serif text-sm text-slate-500">
                  No assignments available.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {displayedAssignments.map((assignment) => {
                  const submitted = isAssignmentSubmitted(assignment);

                  return (
                    <AssignmentCard
                      key={assignment.id}
                      course={
                        assignment.course?.name ||
                        assignment.course?.code ||
                        "Course"
                      }
                      title={
                        assignment.title || assignment.name || "Assignment"
                      }
                      dueDate={formatDueDate(assignment.dueDate)}
                      status={
                        submitted
                          ? "Submitted"
                          : assignment.dueDate &&
                              new Date(assignment.dueDate).getTime() <
                                lastUpdated
                            ? "Overdue"
                            : "Pending"
                      }
                    />
                  );
                })}
              </div>
            )}
          </section>
        </div>
        <section className="mt-10">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Recent Activity
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your latest academic activities.
              </p>
            </div>
          </div>

          {activities.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <p className="font-serif text-sm text-slate-500">
                No recent activity available.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {activities.map((activity, index) => {
                const activityStyles = getActivityStyles(activity.type);

                return (
                  <div
                    key={`${activity.type}-${activity.id}`}
                    className={`flex items-start gap-4 border-l-4 ${activityStyles.border} p-5 ${
                      index !== activities.length - 1
                        ? "border-b border-slate-100"
                        : ""
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${activityStyles.bg}`}
                    >
                      {getActivityIcon(activity.type)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-slate-900">
                        {activity.title}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {activity.description}
                      </p>

                      <p className="mt-2 text-xs text-slate-400">
                        {getRelativeTime(activity.date)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
