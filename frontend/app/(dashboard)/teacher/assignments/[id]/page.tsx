"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import SubmissionTable from "@/components/teachers/SubmissionTable";
import { apiFetch } from "@/lib/api";

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
    user: { id: number; name: string; email: string };
  };
};
type Detail = {
  assignment: {
    id: number;
    title: string;
    description: string | null;
    dueDate: string;
    maxMarks: number;
    course: { id: number; code: string; name: string };
  };
  submissions: Submission[];
};

export default function TeacherAssignmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("scm_token") || "";
      const response = await apiFetch<{ success: boolean; data: Detail }>(
        `/submissions/teacher/assignment/${id}`,
        { token },
      );
      setDetail(response.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load assignment.",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const grade = async (
    submissionId: number,
    marks: number,
    feedback: string,
  ) => {
    const token = localStorage.getItem("scm_token") || "";
    await apiFetch(`/submissions/teacher/${submissionId}/grade`, {
      method: "PUT",
      token,
      body: JSON.stringify({ marks, feedback }),
    });
    await load();
  };

  return (
    <main className="min-h-screen bg-[#EAE6DC] p-5 sm:p-8">
      <Link
        href="/teacher/assignments"
        className="text-sm font-semibold text-[#B45A2A]"
      >
        ← Assignments
      </Link>
      {loading ? (
        <div className="mt-6 rounded-2xl bg-white p-10 text-center text-slate-500">
          Loading assignment...
        </div>
      ) : error || !detail ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          {error || "Assignment not found."}
        </div>
      ) : (
        <>
          <section className="mt-5 rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-[#B45A2A]">
              {detail.assignment.course.code} · {detail.assignment.course.name}
            </p>
            <h1 className="mt-2 font-serif text-3xl font-bold text-[#333333]">
              {detail.assignment.title}
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              {detail.assignment.description || "No description provided."}
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-600">
              <span className="rounded-xl bg-[#F0EDE4] px-4 py-2">
                Due {new Date(detail.assignment.dueDate).toLocaleString()}
              </span>
              <span className="rounded-xl bg-[#F0EDE4] px-4 py-2">
                Maximum marks: {detail.assignment.maxMarks}
              </span>
              <span className="rounded-xl bg-[#F0EDE4] px-4 py-2">
                Submissions: {detail.submissions.length}
              </span>
            </div>
          </section>
          <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-5 font-serif text-xl font-bold text-[#333333]">
              Student submissions
            </h2>
            <SubmissionTable
              submissions={detail.submissions}
              maxMarks={detail.assignment.maxMarks}
              onGrade={grade}
            />
          </section>
        </>
      )}
    </main>
  );
}
