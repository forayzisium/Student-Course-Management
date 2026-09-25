"use client";

import { useEffectEvent, useEffect, useMemo, useState } from "react";
import CourseDetailsDialog from "@/components/students/CourseDetailsDialog";
import CourseCard from "@/components/students/CourseCard";
import Button from "@/components/Button";
import { useRealtimeRefresh } from "@/lib/hooks/useRealtimeSync";
import { apiFetch } from "@/lib/api";
import {
  getEnrolledCourses,
  type EnrollmentResponse,
} from "@/lib/student-enrollments";

type Tab = "my-courses" | "browse" | "history";

type BackendCourse = {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  credits?: number;
  syllabus?: string | null;
  progress?: number;
  department: string;
  semester: string;
  semesterRecord?: {
    id: number;
    name: string;
    costPerCredit: number;
  };
  status: "ACTIVE" | "INACTIVE";
  teacher?: {
    id: number;
    name: string;
  } | null;
};

type StudentProfileResponse = {
  success: boolean;
  data: {
    id: number;
    name: string;
    username: string;
    email: string;
    status: string;
    studentProfile: {
      id: number;
      studentId: string;
      department: string;
      year: string;
    };
  };
};

type Course = {
  id: number;
  code: string;
  title: string;
  instructor: string;
  category: string;
  description: string;
  credits?: number;
  syllabus?: string | null;
  progress?: number;
  enrolled?: boolean;
  semester?: string;
  tuition?: number;
};
type EnrollmentHistoryItem = {
  id: number;
  studentId: number;
  courseId: number;
  status: string;
  enrolledAt: string;
  course: BackendCourse;
};

export default function StudentCourses() {
  const [details, setDetails] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("my-courses");

  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);

  const [studentProfileId, setStudentProfileId] = useState<number | null>(null);
  const [enrollmentHistory, setEnrollmentHistory] = useState<
    EnrollmentHistoryItem[]
  >([]);

  const [loadingHistory, setLoadingHistory] = useState(false);

  const [enrolledCourseIds, setEnrolledCourseIds] = useState<number[]>([]);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [loadingMyCourses, setLoadingMyCourses] = useState(true);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [enrollingCourseId, setEnrollingCourseId] = useState<number | null>(
    null,
  );

  const [error, setError] = useState("");

  const getToken = () => {
    if (typeof window === "undefined") return "";

    return localStorage.getItem("scm_token") || "";
  };

  const mapCourse = (course: BackendCourse, enrolled = false): Course => ({
    id: course.id,
    code: course.code,
    title: course.name,
    instructor: course.teacher?.name || "Not Assigned",
    category: course.department,
    description: course.description || "No description published yet.",
    credits: course.credits,
    syllabus: course.syllabus,
    progress: course.progress,
    enrolled,
    semester: course.semester,
    tuition:
      course.credits !== undefined && course.semesterRecord
        ? course.credits * course.semesterRecord.costPerCredit
        : undefined,
  });

  const fetchStudentProfile = async () => {
    try {
      setLoadingProfile(true);

      const token = getToken();

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await apiFetch<StudentProfileResponse>("/students/me", {
        token,
      });

      setStudentProfileId(response.data.studentProfile.id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load student profile",
      );
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchMyCourses = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoadingMyCourses(true);
      }

      const token = getToken();

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await apiFetch<EnrollmentResponse<BackendCourse>>(
        "/enrollments/my-courses",
        {
          token,
        },
      );

      const courses = getEnrolledCourses(response);

      setMyCourses(courses.map((course) => mapCourse(course, true)));
      setEnrolledCourseIds(courses.map((course) => course.id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load your courses",
      );
    } finally {
      if (showLoading) {
        setLoadingMyCourses(false);
      }
    }
  };

  const fetchAvailableCourses = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoadingAvailable(true);
      }

      setError("");

      const token = getToken();

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await apiFetch<{
        success: boolean;
        courses: BackendCourse[];
      }>("/courses/available", {
        token,
      });

      const courses = response.courses || [];

      setAvailableCourses(
        courses.map((course) =>
          mapCourse(course, enrolledCourseIds.includes(course.id)),
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load available courses",
      );
    } finally {
      if (showLoading) {
        setLoadingAvailable(false);
      }
    }
  };
  const fetchEnrollmentHistory = async (showLoading = true) => {
    try {
      if (showLoading) setLoadingHistory(true);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await apiFetch<{
        success: boolean;
        enrollments: EnrollmentHistoryItem[];
      }>("/enrollments/my-history", {
        token,
      });

      setEnrollmentHistory(response.enrollments || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load enrollment history",
      );
    } finally {
      if (showLoading) setLoadingHistory(false);
    }
  };

  useRealtimeRefresh(async () => {
    await fetchMyCourses(false);

    if (activeTab === "browse") {
      await fetchAvailableCourses(false);
    }

    if (activeTab === "history") {
      await fetchEnrollmentHistory(false);
    }
  });

  const loadInitialCourses = useEffectEvent(() => {
    void fetchStudentProfile();
    void fetchMyCourses();
  });
  useEffect(() => {
    const timer = setTimeout(loadInitialCourses, 0);

    return () => clearTimeout(timer);
  }, []);

  const categories = useMemo(() => {
    return [
      "All",
      ...Array.from(new Set(availableCourses.map((course) => course.category))),
    ];
  }, [availableCourses]);

  const filteredCourses = useMemo(() => {
    return availableCourses.filter((course) => {
      const searchValue = search.toLowerCase();

      const matchesSearch =
        course.title.toLowerCase().includes(searchValue) ||
        course.code.toLowerCase().includes(searchValue) ||
        course.instructor.toLowerCase().includes(searchValue);

      const matchesCategory =
        selectedCategory === "All" || course.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [availableCourses, search, selectedCategory]);

  const handleEnroll = async (courseId: number) => {
    try {
      setEnrollingCourseId(courseId);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error("Authentication token not found");
      }

      if (!studentProfileId) {
        throw new Error("Student profile could not be identified");
      }

      await apiFetch("/enrollments", {
        method: "POST",
        token,
        body: JSON.stringify({
          studentId: studentProfileId,
          courseId,
        }),
      });

      await fetchMyCourses();

      await fetchAvailableCourses();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to enroll in course",
      );
    } finally {
      setEnrollingCourseId(null);
    }
  };

  const handleBrowseCourses = () => {
    setActiveTab("browse");
    fetchAvailableCourses();
  };

  return (
    <div className="flex min-h-screen bg-[#EAE6DC]">
      <main className="min-w-0 flex-1 p-5 sm:p-8">
        <div className="mb-8">
          <p className="font-serif text-sm text-[#B45A2A]">Student Portal</p>

          <h1 className="mt-1 font-serif text-2xl font-bold tracking-tight text-[#333333] sm:text-3xl">
            My Courses
          </h1>

          <p className="mt-2 font-serif text-sm text-slate-500">
            Manage your courses, explore new subjects, and view your enrollment
            history.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-7 flex flex-wrap gap-2 rounded-xl bg-white p-2 shadow-sm">
          <button
            onClick={() => setActiveTab("my-courses")}
            className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === "my-courses"
                ? "bg-[#B45A2A] text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            My Courses
          </button>

          <button
            onClick={handleBrowseCourses}
            className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === "browse"
                ? "bg-[#B45A2A] text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Browse Courses
          </button>

          <button
            onClick={() => {
              setActiveTab("history");
              fetchEnrollmentHistory();
            }}
            className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === "history"
                ? "bg-[#B45A2A] text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Enrollment History
          </button>
        </div>

        {activeTab === "my-courses" && (
          <section>
            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-900">Your Courses</h2>

              <p className="mt-1 text-sm text-slate-500">
                Continue learning where you left off.
              </p>
            </div>

            {loadingMyCourses ? (
              <div className="rounded-xl bg-white p-10 text-center shadow-sm">
                <p className="text-sm text-slate-500">
                  Loading your courses...
                </p>
              </div>
            ) : myCourses.length === 0 ? (
              <div className="rounded-xl bg-white p-10 text-center shadow-sm">
                <p className="font-medium text-slate-700">
                  No enrolled courses
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Browse available courses and enroll in one.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-2">
                {myCourses.map((course) => (
                  <CourseCard
                    id={course.id}
                    key={course.id}
                    code={course.code}
                    title={course.title}
                    instructor={course.instructor}
                    progress={course.progress ?? 0}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "browse" && (
          <section>
            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-900">
                Browse Courses
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Explore available courses and enroll in a new course.
              </p>
            </div>

            <div className="mb-6 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <svg
                  className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
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
                  placeholder="Search courses..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#B45A2A]"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#B45A2A]"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {loadingAvailable ? (
              <div className="rounded-xl bg-white p-10 text-center shadow-sm">
                <p className="text-sm text-slate-500">
                  Loading available courses...
                </p>
              </div>
            ) : (
              <>
                <div className="grid gap-5 md:grid-cols-2">
                  {filteredCourses.map((course) => {
                    const isEnrolled = enrolledCourseIds.includes(course.id);

                    const isEnrolling = enrollingCourseId === course.id;

                    return (
                      <div
                        key={course.id}
                        className="rounded-xl bg-white p-5 shadow-sm transition hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-medium text-[#B45A2A]">
                              {course.code}
                            </p>

                            <h3 className="mt-1 text-lg font-semibold text-gray-900">
                              {course.title}
                            </h3>
                          </div>

                          <span className="rounded-full bg-[#EAE6DC] px-3 py-1 text-xs font-medium text-slate-600">
                            {course.category}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-slate-600">
                          {course.instructor}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {course.semester}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
                          <span className="rounded-full bg-[#F0EDE4] px-3 py-1 text-slate-700">
                            {course.credits ?? 0} credits
                          </span>
                          {course.tuition !== undefined && (
                            <span className="rounded-full bg-orange-50 px-3 py-1 text-[#B45A2A]">
                              Tuition: ৳
                              {new Intl.NumberFormat("en-BD").format(
                                course.tuition,
                              )}
                            </span>
                          )}
                        </div>

                        <p className="mt-4 text-sm leading-6 text-slate-500">
                          {course.description}
                        </p>

                        <div className="mt-5 flex items-center justify-between">
                          <button
                            onClick={() => setDetails(course)}
                            className="text-sm font-semibold text-slate-700 transition hover:text-[#B45A2A]"
                          >
                            View Details →
                          </button>

                          <Button
                            onClick={() => handleEnroll(course.id)}
                            disabled={
                              isEnrolled ||
                              isEnrolling ||
                              loadingProfile ||
                              !studentProfileId
                            }
                            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition ${
                              isEnrolled ||
                              isEnrolling ||
                              loadingProfile ||
                              !studentProfileId
                                ? "cursor-not-allowed opacity-50"
                                : ""
                            }`}
                          >
                            {loadingProfile
                              ? "Loading..."
                              : isEnrolling
                                ? "Enrolling..."
                                : isEnrolled
                                  ? "Enrolled"
                                  : "Enroll"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredCourses.length === 0 && (
                  <div className="rounded-xl bg-white p-10 text-center shadow-sm">
                    <p className="font-medium text-slate-700">
                      No courses found
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Try changing your search or category.
                    </p>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {activeTab === "history" && (
          <section>
            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-900">
                Enrollment History
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                View your previous course enrollments.
              </p>
            </div>

            {loadingHistory ? (
              <div className="rounded-xl bg-white p-10 text-center shadow-sm">
                <p className="text-sm text-slate-500">
                  Loading enrollment history...
                </p>
              </div>
            ) : enrollmentHistory.length === 0 ? (
              <div className="rounded-xl bg-white p-10 text-center shadow-sm">
                <p className="font-medium text-slate-700">
                  No enrollment history found
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Your previous enrollments will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl bg-white shadow-sm">
                <div className="space-y-3 p-4 xl:hidden">
                  {enrollmentHistory.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-xl border border-slate-100 p-4"
                    >
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[#B45A2A]">
                            {item.course.code}
                          </p>
                          <h3 className="mt-1 break-words font-semibold text-slate-900">
                            {item.course.name}
                          </h3>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${item.status === "ACTIVE" ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-600"}`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <dl className="mt-4 grid grid-cols-2 gap-3">
                        <div className="min-w-0">
                          <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            Instructor
                          </dt>
                          <dd className="mt-1 break-words text-sm text-slate-700">
                            {item.course.teacher?.name || "Not Assigned"}
                          </dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            Semester
                          </dt>
                          <dd className="mt-1 break-words text-sm text-slate-700">
                            {item.course.semester}
                          </dd>
                        </div>
                        <div className="col-span-2 min-w-0">
                          <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            Enrolled
                          </dt>
                          <dd className="mt-1 text-sm text-slate-700">
                            {new Date(item.enrolledAt).toLocaleDateString()}
                          </dd>
                        </div>
                      </dl>
                    </article>
                  ))}
                </div>
                <div className="hidden overflow-x-auto xl:block">
                  <table className="w-full min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-200 text-left">
                        <th className="px-6 py-4 text-sm font-semibold text-slate-700">
                          Course
                        </th>

                        <th className="px-6 py-4 text-sm font-semibold text-slate-700">
                          Instructor
                        </th>

                        <th className="px-6 py-4 text-sm font-semibold text-slate-700">
                          Semester
                        </th>

                        <th className="px-6 py-4 text-sm font-semibold text-slate-700">
                          Enrolled
                        </th>

                        <th className="px-6 py-4 text-sm font-semibold text-slate-700">
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {enrollmentHistory.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-slate-100 last:border-0"
                        >
                          <td className="px-6 py-5">
                            <p className="text-xs font-medium text-[#B45A2A]">
                              {item.course.code}
                            </p>

                            <p className="mt-1 font-semibold text-slate-900">
                              {item.course.name}
                            </p>
                          </td>

                          <td className="px-6 py-5 text-sm text-slate-600">
                            {item.course.teacher?.name || "Not Assigned"}
                          </td>

                          <td className="px-6 py-5 text-sm text-slate-600">
                            {item.course.semester}
                          </td>

                          <td className="px-6 py-5 text-sm text-slate-600">
                            {new Date(item.enrolledAt).toLocaleDateString()}
                          </td>

                          <td className="px-6 py-5">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ${
                                item.status === "ACTIVE"
                                  ? "bg-green-50 text-green-700"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}
        {details && (
          <CourseDetailsDialog
            course={details}
            onClose={() => setDetails(null)}
          />
        )}
      </main>
    </div>
  );
}
