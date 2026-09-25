"use client";

import { useState } from "react";
import { downloadAuthenticatedFile } from "@/lib/api";

interface Submission {
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
}

interface SubmissionTableProps {
  submissions: Submission[];
  maxMarks: number;
  onGrade: (
    submissionId: number,
    marks: number,
    feedback: string,
  ) => Promise<void>;
}

export default function SubmissionTable({
  submissions,
  maxMarks,
  onGrade,
}: SubmissionTableProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [marks, setMarks] = useState("");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const startEditing = (submission: Submission) => {
    setEditingId(submission.id);
    setMarks(submission.marks !== null ? String(submission.marks) : "");
    setFeedback(submission.feedback ?? "");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setMarks("");
    setFeedback("");
  };
  const handleDownload = async (submission: Submission) => {
    if (!submission.fileName) {
      alert("No file attached to this submission.");
      return;
    }

    try {
      const token = localStorage.getItem("scm_token");

      if (!token) {
        alert("Authentication required.");
        return;
      }

      setDownloadingId(submission.id);
      const blob = await downloadAuthenticatedFile(
        `/submissions/teacher/${submission.id}/file`,
        token,
      );

      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = submission.fileName;
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
    } catch (error) {
      console.error("Failed to download submission:", error);

      alert(
        error instanceof Error ? error.message : "Failed to download file.",
      );
    } finally {
      setDownloadingId(null);
    }
  };

  const handleSave = async (submissionId: number) => {
    const parsedMarks = Number(marks);

    if (
      !marks.trim() ||
      !Number.isFinite(parsedMarks) ||
      parsedMarks < 0 ||
      parsedMarks > maxMarks
    ) {
      alert(`Please enter marks between 0 and ${maxMarks}.`);
      return;
    }

    try {
      setSaving(true);

      await onGrade(submissionId, parsedMarks, feedback);

      cancelEditing();
    } catch (error) {
      console.error("Failed to grade submission:", error);
      alert("Failed to save grade.");
    } finally {
      setSaving(false);
    }
  };

  if (submissions.length === 0) {
    return (
      <div className="rounded-xl border border-[#D8D2C5] bg-[#F7F4EC] p-8 text-center">
        <p className="text-sm text-[#6F4E37]">No submissions yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#D8D2C5] bg-white">
      <div className="space-y-3 p-3 sm:p-4 xl:hidden">
        {submissions.map((submission) => {
          const isEditing = editingId === submission.id;

          return (
            <article
              key={submission.id}
              className="min-w-0 rounded-xl border border-[#E5E0D6] p-4"
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words font-semibold text-[#333333]">
                    {submission.student.user.name}
                  </p>
                  <p className="mt-1 break-all text-xs text-[#777777]">
                    {submission.student.user.email}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${submission.status === "GRADED" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}
                >
                  {submission.status === "GRADED" ? "Graded" : "Submitted"}
                </span>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="min-w-0">
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Student ID
                  </dt>
                  <dd className="mt-1 break-words text-[#555555]">
                    {submission.student.studentId}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Submitted
                  </dt>
                  <dd className="mt-1 text-[#555555]">
                    {new Date(submission.submittedAt).toLocaleDateString()}
                  </dd>
                </div>
              </dl>

              {isEditing ? (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500">
                      Marks / {maxMarks}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={maxMarks}
                      value={marks}
                      onChange={(e) => setMarks(e.target.value)}
                      className="w-full rounded-lg border border-[#CFC8BA] px-3 py-2 text-sm outline-none focus:border-[#B45A2A]"
                      placeholder="Marks"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500">
                      Feedback
                    </label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows={3}
                      className="w-full resize-none rounded-lg border border-[#CFC8BA] px-3 py-2 text-sm outline-none focus:border-[#B45A2A]"
                      placeholder="Feedback"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSave(submission.id)}
                      disabled={saving}
                      className="rounded-lg bg-[#B45A2A] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditing}
                      disabled={saving}
                      className="rounded-lg border border-[#CFC8BA] px-4 py-2.5 text-sm font-medium text-[#555555]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mt-4 rounded-lg bg-[#F8F6F0] p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Marks
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#333333]">
                      {submission.marks !== null
                        ? `${submission.marks}/${maxMarks}`
                        : "—"}
                    </p>
                    <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Feedback
                    </p>
                    <p className="mt-1 break-words text-sm leading-5 text-[#555555]">
                      {submission.feedback || "—"}
                    </p>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {submission.fileName ? (
                      <button
                        type="button"
                        onClick={() => handleDownload(submission)}
                        disabled={downloadingId === submission.id}
                        className="rounded-lg bg-[#F0EDE4] px-3 py-2.5 text-sm font-medium text-[#6F4E37] disabled:opacity-60"
                      >
                        {downloadingId === submission.id
                          ? "Downloading..."
                          : "Download"}
                      </button>
                    ) : (
                      <div className="flex items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-400">
                        No file
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => startEditing(submission)}
                      className="rounded-lg bg-[#111827] px-4 py-2.5 text-sm font-medium text-white"
                    >
                      {submission.status === "GRADED" ? "Edit Grade" : "Grade"}
                    </button>
                  </div>
                </>
              )}
            </article>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto xl:block">
        <table className="w-full min-w-[980px]">
          <thead>
            <tr className="border-b border-[#D8D2C5] bg-[#F0EDE4]">
              <th className="px-5 py-4 text-left text-sm font-semibold text-[#333333]">
                Student
              </th>

              <th className="px-5 py-4 text-left text-sm font-semibold text-[#333333]">
                Student ID
              </th>

              <th className="px-5 py-4 text-left text-sm font-semibold text-[#333333]">
                Submitted
              </th>

              <th className="px-5 py-4 text-left text-sm font-semibold text-[#333333]">
                Status
              </th>

              <th className="px-5 py-4 text-left text-sm font-semibold text-[#333333]">
                Marks
              </th>

              <th className="px-5 py-4 text-left text-sm font-semibold text-[#333333]">
                Feedback
              </th>

              <th className="px-5 py-4 text-left text-sm font-semibold text-[#333333]">
                File
              </th>

              <th className="px-5 py-4 text-right text-sm font-semibold text-[#333333]">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {submissions.map((submission) => {
              const isEditing = editingId === submission.id;

              return (
                <tr
                  key={submission.id}
                  className="border-b border-[#E5E0D6] last:border-b-0"
                >
                  <td className="max-w-56 px-5 py-4">
                    <div>
                      <p className="font-medium text-[#333333]">
                        {submission.student.user.name}
                      </p>

                      <p className="text-xs text-[#777777]">
                        {submission.student.user.email}
                      </p>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-sm text-[#555555]">
                    {submission.student.studentId}
                  </td>

                  <td className="px-5 py-4 text-sm text-[#555555]">
                    {new Date(submission.submittedAt).toLocaleDateString()}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                        submission.status === "GRADED"
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {submission.status === "GRADED" ? "Graded" : "Submitted"}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        max={maxMarks}
                        value={marks}
                        onChange={(e) => setMarks(e.target.value)}
                        className="w-24 rounded-lg border border-[#CFC8BA] px-3 py-2 text-sm outline-none focus:border-[#B45A2A]"
                        placeholder="Marks"
                      />
                    ) : (
                      <span className="text-sm font-medium text-[#333333]">
                        {submission.marks !== null ? submission.marks : "—"}
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    {isEditing ? (
                      <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        rows={2}
                        className="w-56 rounded-lg border border-[#CFC8BA] px-3 py-2 text-sm outline-none focus:border-[#B45A2A]"
                        placeholder="Feedback"
                      />
                    ) : (
                      <span className="break-words text-sm leading-5 text-[#555555]">
                        {submission.feedback || "—"}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {submission.fileName ? (
                      <button
                        type="button"
                        onClick={() => handleDownload(submission)}
                        disabled={downloadingId === submission.id}
                        className="rounded-lg bg-[#F0EDE4] px-3 py-2 text-sm font-medium text-[#6F4E37] transition hover:bg-[#E3DED2] disabled:cursor-wait disabled:opacity-60"
                      >
                        {downloadingId === submission.id
                          ? "Downloading..."
                          : "Download"}
                      </button>
                    ) : (
                      <span className="text-sm text-[#999999]">No file</span>
                    )}
                  </td>

                  <td className="px-5 py-4 text-right">
                    {isEditing ? (
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleSave(submission.id)}
                          disabled={saving}
                          className="rounded-lg bg-[#B45A2A] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#984A22] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {saving ? "Saving..." : "Save"}
                        </button>

                        <button
                          type="button"
                          onClick={cancelEditing}
                          disabled={saving}
                          className="rounded-lg border border-[#CFC8BA] px-4 py-2 text-sm font-medium text-[#555555] transition hover:bg-[#F0EDE4]"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEditing(submission)}
                        className="rounded-lg bg-[#F0EDE4] px-4 py-2 text-sm font-medium text-[#6F4E37] transition hover:bg-[#E3DED2]"
                      >
                        {submission.status === "GRADED"
                          ? "Edit Grade"
                          : "Grade"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
