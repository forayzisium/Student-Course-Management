"use client";

import { useEffect, FormEvent, useMemo, useState } from "react";

import AdminCourseTable, {
  AdminCourse,
} from "@/components/admins/AdminCourseTable";
import CourseMetadataEditor from "@/components/admins/CourseMetadataEditor";
import { apiFetch } from "@/lib/api";
import TeacherMetricCard from "@/components/teachers/TeacherMetricCard";
import SemesterSelector from "@/components/SemesterSelector";

type BackendCourse = {
  id: number;
  code: string;
  name: string;
  department: string;
  semester: string;
  semesterId: number;
  status: "ACTIVE" | "INACTIVE";
  teacher: {
    id: number;
    name: string;
    email: string;
  } | null;
  _count: {
    enrollments: number;
  };
};

type CoursesResponse = {
  success: boolean;
  courses: BackendCourse[];
};

type BackendTeacher = {
  id: number;
  name: string;
  email: string;
  status: "ACTIVE" | "PENDING" | "REJECTED" | "INACTIVE";
};

type TeachersResponse = {
  success: boolean;
  data: BackendTeacher[];
};

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All");
  const [status, setStatus] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddCourse, setShowAddCourse] = useState(false);
  const [creatingCourse, setCreatingCourse] = useState(false);
  const [courseForm, setCourseForm] = useState({
    code: "",
    name: "",
    department: "",
    semesterId: "",
    teacherId: "",
  });

  const [availableTeachers, setAvailableTeachers] = useState<BackendTeacher[]>(
    [],
  );
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  const fetchTeachers = async () => {
    try {
      setLoadingTeachers(true);
      setError("");

      const token = localStorage.getItem("scm_token");

      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const response = await apiFetch<TeachersResponse>("/teachers", {
        token,
      });

      setAvailableTeachers(
        response.data.filter((teacher) => teacher.status === "ACTIVE"),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load teachers.");
    } finally {
      setLoadingTeachers(false);
    }
  };

  const handleOpenAddCourse = () => {
    setShowAddCourse(true);
    fetchTeachers();
  };

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("scm_token");

        if (!token) {
          throw new Error("Authentication token not found.");
        }

        const response = await apiFetch<CoursesResponse>("/courses", {
          token,
        });

        const formattedCourses: AdminCourse[] = response.courses.map(
          (course) => ({
            id: course.id,
            code: course.code,
            name: course.name,
            department: course.department,
            teacher: course.teacher?.name || "Not assigned",
            students: course._count?.enrollments ?? 0,
            semester: course.semester,
            status: course.status === "ACTIVE" ? "Active" : "Inactive",
          }),
        );

        setCourses(formattedCourses);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load courses.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const departments = useMemo(() => {
    return [
      "All",
      ...Array.from(new Set(courses.map((course) => course.department))),
    ];
  }, [courses]);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const searchValue = search.toLowerCase().trim();

      const matchesSearch =
        course.name.toLowerCase().includes(searchValue) ||
        course.code.toLowerCase().includes(searchValue) ||
        course.teacher.toLowerCase().includes(searchValue);

      const matchesDepartment =
        department === "All" || course.department === department;

      const matchesStatus = status === "All" || course.status === status;

      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [courses, search, department, status]);

  const activeCourses = courses.filter(
    (course) => course.status === "Active",
  ).length;

  const inactiveCourses = courses.filter(
    (course) => course.status === "Inactive",
  ).length;

  const totalEnrollments = courses.reduce(
    (total, course) => total + course.students,
    0,
  );

  const handleToggleStatus = async (id: number) => {
    const course = courses.find((currentCourse) => currentCourse.id === id);

    if (!course) return;

    try {
      setError("");

      const token = localStorage.getItem("scm_token");

      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const newStatus = course.status === "Active" ? "INACTIVE" : "ACTIVE";

      await apiFetch(`/courses/${id}`, {
        method: "PUT",
        token,
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      setCourses((currentCourses) =>
        currentCourses.map((currentCourse) =>
          currentCourse.id === id
            ? {
                ...currentCourse,
                status: newStatus === "ACTIVE" ? "Active" : "Inactive",
              }
            : currentCourse,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update course status.",
      );
    }
  };

  const handleCreateCourse = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");

    if (!courseForm.code.trim()) {
      setError("Course code is required.");
      return;
    }

    if (!courseForm.name.trim()) {
      setError("Course name is required.");
      return;
    }

    if (!courseForm.department.trim()) {
      setError("Department is required.");
      return;
    }

    if (!courseForm.semesterId.trim()) {
      setError("Semester is required.");
      return;
    }

    if (!courseForm.teacherId.trim()) {
      setError("Please select a teacher.");
      return;
    }

    try {
      setCreatingCourse(true);

      const token = localStorage.getItem("scm_token");

      if (!token) {
        throw new Error("Authentication token not found.");
      }

      await apiFetch("/courses", {
        method: "POST",
        token,
        body: JSON.stringify({
          code: courseForm.code.trim(),
          name: courseForm.name.trim(),
          department: courseForm.department.trim(),
          semesterId: Number(courseForm.semesterId),
          teacherId: Number(courseForm.teacherId),
        }),
      });

      setShowAddCourse(false);

      setCourseForm({
        code: "",
        name: "",
        department: "",
        semesterId: "",
        teacherId: "",
      });

      const response = await apiFetch<CoursesResponse>("/courses", {
        token,
      });

      const formattedCourses: AdminCourse[] = response.courses.map(
        (course) => ({
          id: course.id,
          code: course.code,
          name: course.name,
          department: course.department,
          teacher: course.teacher?.name || "Not assigned",
          students: course._count?.enrollments ?? 0,
          semester: course.semester,
          status: course.status === "ACTIVE" ? "Active" : "Inactive",
        }),
      );

      setCourses(formattedCourses);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create course.");
    } finally {
      setCreatingCourse(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#EAE6DC] p-4 font-inter sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="min-w-0">
          <p className="mb-1 text-sm font-medium text-[#B45A2A]">
            Course Management
          </p>

          <h1 className="font-serif text-3xl font-bold text-[#333333]">
            Courses
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            Manage courses, assigned teachers and course status.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddCourse}
          className="w-full rounded-lg bg-[#B45A2A] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#984A22] sm:w-auto"
        >
          + Add Course
        </button>
      </div>

      <CourseMetadataEditor />
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="mb-8 grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
        <div className="hidden">
          <p className="text-sm text-gray-500">Total Courses</p>

          <h2 className="mt-2 text-2xl font-bold text-[#333333]">
            {loading ? "..." : courses.length}
          </h2>
        </div>

        <div className="hidden">
          <p className="text-sm text-gray-500">Active Courses</p>

          <h2 className="mt-2 text-2xl font-bold text-[#333333]">
            {loading ? "..." : activeCourses}
          </h2>
        </div>

        <div className="hidden">
          <p className="text-sm text-gray-500">Inactive Courses</p>

          <h2 className="mt-2 text-2xl font-bold text-[#333333]">
            {loading ? "..." : inactiveCourses}
          </h2>
        </div>

        <div className="hidden">
          <p className="text-sm text-gray-500">Total Enrollments</p>

          <h2 className="mt-2 text-2xl font-bold text-[#333333]">—</h2>

          <p className="mt-1 text-xs text-gray-400">
            Enrollment data not provided by API
          </p>
        </div>
        <TeacherMetricCard
          label="Total Courses"
          value={loading ? "..." : courses.length}
          icon="courses"
        />
        <TeacherMetricCard
          label="Active Courses"
          value={loading ? "..." : activeCourses}
          icon="active"
        />
        <TeacherMetricCard
          label="Inactive Courses"
          value={loading ? "..." : inactiveCourses}
          icon="absent"
        />
        <div className="hidden">
          <TeacherMetricCard
            label="Legacy Total Enrollments"
            value="—"
            icon="students"
            description="Active course enrollments"
          />
        </div>
        <TeacherMetricCard
          label="Total Enrollments"
          value={loading ? "..." : totalEnrollments}
          icon="students"
          description="Active course enrollments"
        />
      </div>

      <div className="mb-6 rounded-xl bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search course, code or teacher..."
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#B45A2A] lg:flex-1"
          />

          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#B45A2A] lg:w-auto"
          >
            {departments.map((item) => (
              <option key={item} value={item}>
                {item === "All" ? "All Departments" : item}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#B45A2A] lg:w-auto"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing{" "}
          <span className="font-semibold text-[#333333]">
            {loading ? "..." : filteredCourses.length}
          </span>{" "}
          of {loading ? "..." : courses.length} courses
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl bg-white p-10 text-center text-sm text-gray-400 shadow-sm">
          Loading courses...
        </div>
      ) : (
        <AdminCourseTable
          courses={filteredCourses}
          onToggleStatus={handleToggleStatus}
        />
      )}

      {showAddCourse && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-4 shadow-xl sm:p-6">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="font-serif text-2xl font-bold text-[#333333]">
                  Add Course
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Create a new course for SCM.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddCourse(false)}
                className="shrink-0 text-2xl text-gray-400 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Course Code
                </label>
                <input
                  required
                  value={courseForm.code}
                  onChange={(e) =>
                    setCourseForm({
                      ...courseForm,
                      code: e.target.value,
                    })
                  }
                  placeholder="CSE 326"
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#B45A2A]"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Course Name
                </label>
                <input
                  required
                  value={courseForm.name}
                  onChange={(e) =>
                    setCourseForm({
                      ...courseForm,
                      name: e.target.value,
                    })
                  }
                  placeholder="Web Development"
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#B45A2A]"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Department
                </label>
                <input
                  required
                  value={courseForm.department}
                  onChange={(e) =>
                    setCourseForm({
                      ...courseForm,
                      department: e.target.value,
                    })
                  }
                  placeholder="Computer Science & Engineering"
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#B45A2A]"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Semester
                </label>
                <SemesterSelector
                  includeAll={false}
                  value={courseForm.semesterId}
                  onChange={(semesterId) =>
                    setCourseForm((current) => ({ ...current, semesterId }))
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Teacher
                </label>
                <select
                  required
                  value={courseForm.teacherId}
                  onChange={(e) =>
                    setCourseForm({
                      ...courseForm,
                      teacherId: e.target.value,
                    })
                  }
                  disabled={loadingTeachers}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#B45A2A] disabled:cursor-not-allowed disabled:bg-gray-100"
                >
                  <option value="">
                    {loadingTeachers
                      ? "Loading teachers..."
                      : "Select a teacher"}
                  </option>

                  {availableTeachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                      {teacher.email ? ` — ${teacher.email}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddCourse(false)}
                  className="w-full rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 sm:w-auto"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creatingCourse}
                  className="w-full rounded-lg bg-[#B45A2A] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#984A22] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {creatingCourse ? "Creating..." : "Create Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
