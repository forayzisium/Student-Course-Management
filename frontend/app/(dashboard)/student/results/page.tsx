"use client";

import { useEffect, useMemo, useState } from "react";
import { weightedGpa } from "@/lib/academic-metrics";
import { apiFetch } from "@/lib/api";

type ApiGrade = {
  id: number;
  assignment: number | null;
  midterm: number | null;
  final: number | null;
  total: number;
  course: {
    id: number;
    code: string;
    name: string;
    semester: string;
    credits: number;
    teacher: {
      id: number;
      name: string;
    };
  };
};

type CourseResult = {
  id: number;
  code: string;
  course: string;
  semester: string;
  credits: number;
  assignment: number;
  midterm: number;
  final: number;
  marks: number;
  grade: string;
  point: number;
  teacher: string;
};

function getGrade(marks: number) {
  if (marks >= 80) return "A+";
  if (marks >= 75) return "A";
  if (marks >= 70) return "A-";
  if (marks >= 65) return "B+";
  if (marks >= 60) return "B";
  if (marks >= 55) return "B-";
  if (marks >= 50) return "C+";
  if (marks >= 45) return "C";
  if (marks >= 40) return "D";
  return "F";
}

function getGradePoint(grade: string) {
  switch (grade) {
    case "A+":
      return 4.0;
    case "A":
      return 3.75;
    case "A-":
      return 3.5;
    case "B+":
      return 3.25;
    case "B":
      return 3.0;
    case "B-":
      return 2.75;
    case "C+":
      return 2.5;
    case "C":
      return 2.25;
    case "D":
      return 2.0;
    default:
      return 0;
  }
}

function getGradeClass(grade: string) {
  if (grade === "A+" || grade === "A") {
    return "bg-green-50 text-green-700";
  }

  if (grade === "A-") {
    return "bg-blue-50 text-blue-700";
  }

  if (grade === "B+" || grade === "B" || grade === "B-") {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-red-50 text-red-700";
}

function formatSemester(semester: string) {
  if (!semester) return "Current Semester";

  return semester
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function StudentResults() {
  const [selectedSemester, setSelectedSemester] = useState("All Semesters");
  const [grades, setGrades] = useState<ApiGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("scm_token");

        if (!token) {
          throw new Error("Authentication required");
        }

        const response = await apiFetch<{
          success: boolean;
          data: ApiGrade[];
        }>("/grades/my", {
          token,
        });

        setGrades(response.data ?? []);
      } catch (error) {
        console.error("Failed to fetch grades:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load your results.",
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchGrades();
    const refresh = () => {
      void fetchGrades();
    };
    window.addEventListener("scm:student-refresh", refresh);
    return () => window.removeEventListener("scm:student-refresh", refresh);
  }, []);

  const allResults = useMemo<CourseResult[]>(() => {
    return grades.map((grade) => {
      const assignment = grade.assignment ?? 0;
      const midterm = grade.midterm ?? 0;
      const final = grade.final ?? 0;
      const total = grade.total ?? assignment + midterm + final;

      const letterGrade = getGrade(total);
      const point = getGradePoint(letterGrade);

      return {
        id: grade.id,
        code: grade.course.code,
        course: grade.course.name,
        semester: grade.course.semester,
        credits: grade.course.credits,
        assignment,
        midterm,
        final,
        marks: total,
        grade: letterGrade,
        point,
        teacher: grade.course.teacher.name,
      };
    });
  }, [grades]);

  const currentResults =
    selectedSemester === "All Semesters"
      ? allResults
      : allResults.filter((r) => r.semester === selectedSemester);
  const semesters = [...new Set(allResults.map((r) => r.semester))];
  const totalCredits = currentResults.reduce((sum, r) => sum + r.credits, 0);
  const cumulativeGpa = weightedGpa(allResults)?.toFixed(2) ?? "N/A";
  const totalCourses = currentResults.length;

  const totalMarks = currentResults.reduce(
    (total, result) => total + result.marks,
    0,
  );

  const averageMarks = totalCourses > 0 ? totalMarks / totalCourses : 0;

  const totalGradePoints = currentResults.reduce(
    (total, result) => total + result.point * result.credits,
    0,
  );

  const calculatedGPA = weightedGpa(currentResults)?.toFixed(2) ?? "N/A";

  const passedCourses = currentResults.filter(
    (result) => result.marks >= 40,
  ).length;

  const excellentCourses = currentResults.filter(
    (result) => result.grade === "A+" || result.grade === "A",
  ).length;

  const currentSemester =
    selectedSemester === "All Semesters"
      ? selectedSemester
      : formatSemester(selectedSemester);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#EAE6DC]">
        <main className="min-w-0 flex-1 p-5 sm:p-8">
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#D8D2C5] border-t-[#B45A2A]" />

              <p className="mt-4 text-sm text-slate-500">
                Loading your results...
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-[#EAE6DC]">
        <main className="min-w-0 flex-1 p-5 sm:p-8">
          <div className="mb-8">
            <p className="font-serif text-sm text-[#B45A2A]">Student Portal</p>

            <h1 className="mt-1 font-serif text-2xl font-bold tracking-tight text-[#333333] sm:text-3xl">
              Results
            </h1>
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <p className="text-sm font-medium text-red-700">{error}</p>

            <p className="mt-2 text-xs text-red-600">
              Please refresh the page and try again.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#EAE6DC]">
      <main className="min-w-0 flex-1 p-5 sm:p-8">
        <div className="mb-8">
          <p className="font-serif text-sm text-[#B45A2A]">Student Portal</p>

          <h1 className="mt-1 font-serif text-2xl font-bold tracking-tight text-[#333333] sm:text-3xl">
            Results
          </h1>

          <p className="mt-2 font-serif text-sm text-slate-500">
            View your grades, GPA, and academic results.
          </p>
        </div>

        <section className="mb-8 flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="w-full sm:max-w-xs">
            <label
              htmlFor="semester"
              className="block text-sm font-semibold text-slate-700"
            >
              Results semester
            </label>
            <select
              id="semester"
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#B45A2A] focus:ring-4 focus:ring-[#B45A2A]/10 disabled:cursor-not-allowed disabled:bg-slate-50"
            >
              <option>All Semesters</option>
              {semesters.map((term) => (
                <option key={term}>{term}</option>
              ))}
            </select>
          </div>
          <p className="text-sm leading-6 text-slate-500 sm:max-w-sm sm:text-right">
            <span className="block text-xs font-medium uppercase tracking-wider text-slate-400">
              Cumulative CGPA
            </span>
            <span className="my-1 block font-serif text-2xl font-bold text-[#B45A2A]">
              {cumulativeGpa}
            </span>
            Based on recorded grades and course credits.
          </p>
        </section>

        <section>
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-900">
              Current Results
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {currentSemester} academic results
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    {selectedSemester === "All Semesters"
                      ? "Cumulative CGPA"
                      : "Term GPA"}
                  </p>

                  <p className="mt-1 text-3xl font-bold text-slate-900">
                    {calculatedGPA}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Based on available grades
                  </p>
                </div>

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
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
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">Courses</p>

                  <p className="mt-1 text-3xl font-bold text-slate-900">
                    {totalCourses}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">Graded courses</p>
                </div>

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">Average Marks</p>

                  <p className="mt-1 text-3xl font-bold text-slate-900">
                    {averageMarks.toFixed(1)}%
                  </p>

                  <p className="mt-1 text-xs text-slate-400">Current results</p>
                </div>

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 19V5"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m4 17 5-5 4 3 7-8"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16 7h4v4"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">Passed</p>

                  <p className="mt-1 text-3xl font-bold text-green-600">
                    {passedCourses}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    of {totalCourses} courses
                  </p>
                </div>

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m5 12 4 4L19 6"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>

        {currentResults.length === 0 ? (
          <section className="mt-10">
            <div className="rounded-xl bg-white p-10 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F0EDE4]">
                <svg
                  className="h-7 w-7 text-[#B45A2A]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 19V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 7h8M8 11h8M8 15h5"
                  />
                </svg>
              </div>

              <h2 className="mt-4 text-lg font-bold text-slate-900">
                No grades available
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Your grades will appear here once your teacher publishes them.
              </p>
            </div>
          </section>
        ) : (
          <>
            <section className="mt-10">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-slate-900">
                  Grade Sheet
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Your marks and grades.
                </p>
              </div>

              <div className="overflow-hidden rounded-xl bg-white shadow-sm">
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full min-w-[900px]">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Course
                        </th>

                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Assignment
                        </th>

                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Midterm
                        </th>

                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Final
                        </th>

                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Total
                        </th>

                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Grade
                        </th>

                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Point
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {currentResults.map((result) => (
                        <tr
                          key={result.id}
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
                        >
                          <td className="px-6 py-4">
                            <p className="text-sm font-semibold text-slate-900">
                              {result.course}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {result.code}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              Teacher: {result.teacher}
                            </p>
                          </td>

                          <td className="px-6 py-4 text-sm text-slate-600">
                            {result.assignment}
                          </td>

                          <td className="px-6 py-4 text-sm text-slate-600">
                            {result.midterm}
                          </td>

                          <td className="px-6 py-4 text-sm text-slate-600">
                            {result.final}
                          </td>

                          <td className="px-6 py-4 text-sm font-bold text-slate-700">
                            {result.marks}
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ${getGradeClass(
                                result.grade,
                              )}`}
                            >
                              {result.grade}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                            {result.point.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-3 p-4 lg:hidden">
                  {currentResults.map((result) => (
                    <article
                      key={result.id}
                      className="rounded-lg border border-slate-100 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900">
                            {result.course}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {result.code}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {result.teacher}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${getGradeClass(
                            result.grade,
                          )}`}
                        >
                          {result.grade}
                        </span>
                      </div>

                      <dl className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                          <dt className="text-[10px] uppercase text-slate-400">
                            Assignment
                          </dt>

                          <dd className="mt-1 text-sm font-medium text-slate-700">
                            {result.assignment}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-[10px] uppercase text-slate-400">
                            Midterm
                          </dt>

                          <dd className="mt-1 text-sm font-medium text-slate-700">
                            {result.midterm}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-[10px] uppercase text-slate-400">
                            Final
                          </dt>

                          <dd className="mt-1 text-sm font-medium text-slate-700">
                            {result.final}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-[10px] uppercase text-slate-400">
                            Total
                          </dt>

                          <dd className="mt-1 text-sm font-bold text-slate-800">
                            {result.marks}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-[10px] uppercase text-slate-400">
                            Grade Point
                          </dt>

                          <dd className="mt-1 text-sm font-semibold text-slate-700">
                            {result.point.toFixed(2)}
                          </dd>
                        </div>
                      </dl>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="mt-10">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-slate-900">
                  GPA Calculation
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  GPA weights each recorded course grade point by its stored
                  credits.
                </p>
              </div>

              <div className="rounded-xl bg-white p-6 shadow-sm">
                <div className="grid gap-5 sm:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-400">
                      Courses
                    </p>

                    <p className="mt-2 text-xl font-bold text-slate-900">
                      {totalCourses}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-400">
                      Weighted Grade Points
                    </p>

                    <p className="mt-2 text-xl font-bold text-slate-900">
                      {totalGradePoints.toFixed(2)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-400">
                      GPA
                    </p>

                    <p className="mt-2 text-xl font-bold text-[#B45A2A]">
                      {calculatedGPA}
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-lg bg-[#F0EDE4] p-4">
                  <p className="text-sm text-slate-600">
                    GPA = Sum of (Grade Point x Credits) / Total Credits
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {totalGradePoints.toFixed(2)} / {totalCredits} ={" "}
                    {calculatedGPA}
                  </p>
                </div>
              </div>
            </section>

            <section className="mt-10">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-slate-900">
                  Performance
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Overview of your current academic performance.
                </p>
              </div>

              <div className="rounded-xl bg-white p-6 shadow-sm">
                <div className="grid gap-5 sm:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-400">
                      Excellent
                    </p>

                    <p className="mt-2 text-2xl font-bold text-green-600">
                      {excellentCourses}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">A+ / A grades</p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-400">
                      Passed
                    </p>

                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {passedCourses}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Passing courses
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-400">
                      Average
                    </p>

                    <p className="mt-2 text-2xl font-bold text-[#B45A2A]">
                      {averageMarks.toFixed(1)}%
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Overall average
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
