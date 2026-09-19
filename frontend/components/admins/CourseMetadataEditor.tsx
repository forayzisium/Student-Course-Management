"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import SemesterSelector from "@/components/SemesterSelector";
type Course = {
  id: number;
  code: string;
  name: string;
  credits: number;
  description: string | null;
  syllabus: string | null;
  semesterId: number;
};
export default function CourseMetadataEditor() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selected, setSelected] = useState<Course | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    apiFetch<{ courses: Course[] }>("/courses", {
      token: localStorage.getItem("scm_token") || "",
    })
      .then((r) => setCourses(r.courses))
      .catch((e) => setMessage(e.message));
  }, []);
  const save = async () => {
    if (!selected) return;
    setSaving(true);
    setMessage("");
    try {
      await apiFetch("/courses/" + selected.id, {
        method: "PUT",
        token: localStorage.getItem("scm_token") || "",
        body: JSON.stringify({
          credits: selected.credits,
          description: selected.description,
          syllabus: selected.syllabus,
          semesterId: selected.semesterId,
        }),
      });
      setCourses((prev) =>
        prev.map((c) => (c.id === selected.id ? selected : c)),
      );
      setMessage("Course information saved.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };
  return (
    <details className="group my-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <summary className="cursor-pointer break-words text-lg font-bold text-slate-900 marker:text-[#B45A2A]">
        Edit course credits, description and syllabus
      </summary>
      <p className="mb-5 mt-2 text-sm leading-6 text-slate-500">
        Verify imported course credits before relying on CGPA calculations.
      </p>
      <label className="block text-sm font-semibold text-slate-700">
        Course{" "}
        <select
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#B45A2A] focus:ring-4 focus:ring-[#B45A2A]/10 disabled:cursor-not-allowed disabled:bg-slate-50"
          value={selected?.id || ""}
          onChange={(e) => {
            setSelected(
              courses.find((c) => c.id === Number(e.target.value)) || null,
            );
            setMessage("");
          }}
        >
          <option value="">Select a course</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} - {c.name}
            </option>
          ))}
        </select>
      </label>
      {selected && (
        <div className="mt-5 grid gap-5 border-t border-slate-100 pt-5 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
            Credits
            <input
              type="number"
              min="0.5"
              max="30"
              step="0.5"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#B45A2A] focus:ring-4 focus:ring-[#B45A2A]/10 disabled:cursor-not-allowed disabled:bg-slate-50 sm:max-w-48"
              value={selected.credits}
              onChange={(e) =>
                setSelected({ ...selected, credits: Number(e.target.value) })
              }
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
            Semester
            <div className="mt-2">
              <SemesterSelector
                includeAll={false}
                value={String(selected.semesterId || "")}
                onChange={(semesterId) =>
                  setSelected({ ...selected, semesterId: Number(semesterId) })
                }
              />
            </div>
          </label>
          <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
            Description
            <textarea
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#B45A2A] focus:ring-4 focus:ring-[#B45A2A]/10 disabled:cursor-not-allowed disabled:bg-slate-50 min-h-28 resize-y font-normal leading-6"
              value={selected.description || ""}
              onChange={(e) =>
                setSelected({ ...selected, description: e.target.value })
              }
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
            Syllabus
            <textarea
              rows={5}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#B45A2A] focus:ring-4 focus:ring-[#B45A2A]/10 disabled:cursor-not-allowed disabled:bg-slate-50 min-h-28 resize-y font-normal leading-6"
              value={selected.syllabus || ""}
              onChange={(e) =>
                setSelected({ ...selected, syllabus: e.target.value })
              }
            />
          </label>
          <button
            disabled={saving}
            onClick={save}
            className="w-full rounded-xl bg-[#B45A2A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#984A22] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B45A2A] disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2 sm:w-fit"
          >
            {saving ? "Saving..." : "Save course information"}
          </button>
        </div>
      )}
      {message && (
        <p
          role="status"
          className="mt-4 break-words rounded-xl bg-[#F0EDE4] px-4 py-3 text-sm text-slate-700"
        >
          {message}
        </p>
      )}
    </details>
  );
}
