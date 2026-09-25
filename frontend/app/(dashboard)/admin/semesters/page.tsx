"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Semester = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  costPerCredit: number;
  _count: { courses: number };
};
const empty = {
  name: "",
  startDate: "",
  endDate: "",
  isCurrent: false,
  costPerCredit: "",
};

export default function AdminSemestersPage() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const token = () => localStorage.getItem("scm_token") || "";
  const load = useCallback(
    async () =>
      setSemesters(
        (await apiFetch<{ data: Semester[] }>("/semesters", { token: token() }))
          .data || [],
      ),
    [],
  );
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiFetch(editingId ? `/semesters/${editingId}` : "/semesters", {
        method: editingId ? "PUT" : "POST",
        token: token(),
        body: JSON.stringify(form),
      });
      setForm(empty);
      setEditingId(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save semester");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    try {
      await apiFetch(`/semesters/${id}`, { method: "DELETE", token: token() });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to delete semester");
    }
  }

  return (
    <main className="min-h-screen bg-[#EAE6DC] p-5 sm:p-8">
      <p className="font-serif text-sm text-[#B45A2A]">SCM Administration</p>
      <h1 className="mt-1 font-serif text-3xl font-bold text-[#333333]">
        Semesters
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Manage academic terms and choose the current semester.
      </p>
      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="mt-8 grid items-start gap-6 xl:grid-cols-[380px_1fr]">
        <form
          onSubmit={submit}
          className="space-y-4 rounded-2xl bg-white p-6 shadow-sm"
        >
          <h2 className="font-serif text-xl font-bold">
            {editingId ? "Edit Semester" : "Add Semester"}
          </h2>
          <input
            required
            placeholder="Fall 2024"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-xl border border-slate-200 px-4 py-3"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              required
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="min-w-0 rounded-xl border border-slate-200 px-3 py-3"
            />
            <input
              required
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              className="min-w-0 rounded-xl border border-slate-200 px-3 py-3"
            />
          </div>
          <label className="block text-sm font-medium text-slate-700">
            Cost per credit (BDT)
            <input
              required
              min="0"
              step="0.01"
              type="number"
              placeholder="2400"
              value={form.costPerCredit}
              onChange={(e) =>
                setForm({ ...form, costPerCredit: e.target.value })
              }
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
            />
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={form.isCurrent}
              onChange={(e) =>
                setForm({ ...form, isCurrent: e.target.checked })
              }
            />
            Set as current semester
          </label>
          <div className="flex gap-3">
            <button
              disabled={saving}
              className="rounded-xl border border-[#B45A2A] bg-[#B45A2A] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:border-[#984A22] hover:bg-[#984A22] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#B45A2A]/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Semester"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(empty);
                }}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
        <div className="space-y-3">
          {semesters.map((semester) => (
            <article
              key={semester.id}
              className="rounded-2xl bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-slate-900">
                      {semester.name}
                    </h2>
                    {semester.isCurrent && (
                      <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {new Date(semester.startDate).toLocaleDateString()} –{" "}
                    {new Date(semester.endDate).toLocaleDateString()} ·{" "}
                    {semester._count.courses} courses
                  </p>
                  <p className="mt-1 flex flex-wrap items-baseline gap-x-1 text-sm font-medium text-slate-700">
                    ৳
                    {new Intl.NumberFormat("en-BD").format(
                      semester.costPerCredit,
                    )}{" "}
                    per credit
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setEditingId(semester.id);
                      setForm({
                        name: semester.name,
                        startDate: semester.startDate.slice(0, 10),
                        endDate: semester.endDate.slice(0, 10),
                        isCurrent: semester.isCurrent,
                        costPerCredit: String(semester.costPerCredit),
                      });
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow focus:outline-none focus:ring-2 focus:ring-slate-200"
                  >
                    Edit
                  </button>
                  {!semester.isCurrent && (
                    <button
                      onClick={() =>
                        void apiFetch(`/semesters/${semester.id}`, {
                          method: "PUT",
                          token: token(),
                          body: JSON.stringify({ isCurrent: true }),
                        }).then(load)
                      }
                      className="rounded-xl border border-[#111827] bg-[#111827] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:border-slate-700 hover:bg-slate-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-400/40"
                    >
                      Make Current
                    </button>
                  )}
                  <button
                    disabled={semester._count.courses > 0}
                    onClick={() => void remove(semester.id)}
                    className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 shadow-sm transition-all duration-200 hover:border-red-300 hover:bg-red-50 hover:shadow focus:outline-none focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-red-200 disabled:hover:bg-white disabled:hover:shadow-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
