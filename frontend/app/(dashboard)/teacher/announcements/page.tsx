"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import {
  announcementLabel,
  announcementStyle,
  announcementTypes,
  AnnouncementType,
  CourseAnnouncement,
  formatAnnouncementDate,
} from "@/lib/announcements";

type Course = { id: number; code: string; name: string; status: string };
type FormState = {
  courseId: string;
  title: string;
  message: string;
  type: AnnouncementType;
  rescheduledAt: string;
};
const emptyForm: FormState = {
  courseId: "",
  title: "",
  message: "",
  type: "GENERAL",
  rescheduledAt: "",
};

export default function TeacherAnnouncementsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [items, setItems] = useState<CourseAnnouncement[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    try {
      const token = localStorage.getItem("scm_token");
      if (!token) throw new Error("Authentication required");
      const [courseResponse, announcementResponse] = await Promise.all([
        apiFetch<{ success: boolean; data: Course[] }>("/courses/my-courses", {
          token,
        }),
        apiFetch<{ success: boolean; data: CourseAnnouncement[] }>(
          "/announcements/teacher",
          { token },
        ),
      ]);
      const ownCourses = courseResponse.data.filter(
        (course) => course.status === "ACTIVE",
      );
      setCourses(ownCourses);
      setItems(announcementResponse.data);
      setForm((current) => ({
        ...current,
        courseId: current.courseId || String(ownCourses[0]?.id ?? ""),
      }));
      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load announcements",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeout);
  }, [load]);
  const selectedCourse = useMemo(
    () => courses.find((course) => String(course.id) === form.courseId),
    [courses, form.courseId],
  );

  function reset() {
    setEditingId(null);
    setForm({ ...emptyForm, courseId: String(courses[0]?.id ?? "") });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("scm_token");
      if (!token) throw new Error("Authentication required");
      await apiFetch(
        editingId ? `/announcements/${editingId}` : "/announcements",
        {
          method: editingId ? "PUT" : "POST",
          token,
          body: JSON.stringify({
            courseId: Number(form.courseId),
            title: form.title,
            message: form.message,
            type: form.type,
            rescheduledAt:
              form.type === "CLASS_RESCHEDULED" ? form.rescheduledAt : null,
          }),
        },
      );
      setSuccess(
        editingId ? "Announcement updated." : "Announcement published.",
      );
      reset();
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save announcement",
      );
    } finally {
      setSaving(false);
    }
  }

  function edit(item: CourseAnnouncement) {
    setEditingId(item.id);
    setForm({
      courseId: String(item.courseId),
      title: item.title,
      message: item.message,
      type: item.type,
      rescheduledAt: item.rescheduledAt
        ? new Date(item.rescheduledAt).toISOString().slice(0, 16)
        : "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(item: CourseAnnouncement) {
    if (!window.confirm(`Delete “${item.title}”?`)) return;
    try {
      const token = localStorage.getItem("scm_token");
      if (!token) throw new Error("Authentication required");
      await apiFetch(`/announcements/${item.id}`, { method: "DELETE", token });
      if (editingId === item.id) reset();
      setSuccess("Announcement deleted.");
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete announcement",
      );
    }
  }

  return (
    <div className="min-h-screen bg-[#EAE6DC] p-5 sm:p-8">
      <header className="mb-8">
        <p className="font-serif text-sm text-[#B45A2A]">Teacher Portal</p>
        <h1 className="mt-1 font-serif text-2xl font-bold text-[#333333] sm:text-3xl">
          Announcements
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Publish course-specific updates to actively enrolled students.
        </p>
      </header>

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700">
          {success}
        </div>
      )}

      <form
        onSubmit={submit}
        className="mb-8 rounded-xl bg-white p-5 shadow-sm sm:p-6"
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {editingId ? "Edit announcement" : "Create announcement"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Only students with an active enrollment in the selected course can
              access it.
            </p>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={reset}
              className="text-sm font-semibold text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
          )}
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Course
            <select
              required
              value={form.courseId}
              onChange={(e) => setForm({ ...form, courseId: e.target.value })}
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 outline-none focus:border-[#B45A2A]"
            >
              <option value="">Select a course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code} · {course.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Type
            <select
              value={form.type}
              onChange={(e) =>
                setForm({ ...form, type: e.target.value as AnnouncementType })
              }
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 outline-none focus:border-[#B45A2A]"
            >
              {announcementTypes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="mt-5 block text-sm font-medium text-slate-700">
          Title
          <input
            required
            maxLength={160}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-[#B45A2A]"
            placeholder="e.g. Classroom changed"
          />
        </label>
        <label className="mt-5 block text-sm font-medium text-slate-700">
          Message
          <textarea
            required
            maxLength={5000}
            rows={5}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="mt-2 w-full resize-y rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-[#B45A2A]"
            placeholder="Share the course update..."
          />
        </label>
        {form.type === "CLASS_RESCHEDULED" && (
          <label className="mt-5 block max-w-md text-sm font-medium text-slate-700">
            New class date and time
            <input
              required
              type="datetime-local"
              value={form.rescheduledAt}
              onChange={(e) =>
                setForm({ ...form, rescheduledAt: e.target.value })
              }
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-[#B45A2A]"
            />
          </label>
        )}
        <button
          disabled={saving || loading || !selectedCourse}
          className="mt-6 rounded-lg bg-[#111827] px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : editingId
              ? "Save changes"
              : "Publish announcement"}
        </button>
      </form>

      <section>
        <h2 className="mb-4 font-serif text-xl font-bold text-[#333333]">
          Published announcements
        </h2>
        {loading ? (
          <div className="rounded-xl bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
            Loading announcements...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl bg-white p-10 text-center shadow-sm">
            <p className="font-semibold text-slate-700">
              No announcements published yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <article
                key={item.id}
                className="rounded-xl bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#B45A2A]">
                      {item.course.code} · {item.course.name}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900">
                      {item.title}
                    </h3>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${announcementStyle(item.type)}`}
                  >
                    {announcementLabel(item.type)}
                  </span>
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {item.message}
                </p>
                {item.rescheduledAt && (
                  <p className="mt-3 text-sm font-medium text-amber-700">
                    New class time: {formatAnnouncementDate(item.rescheduledAt)}
                  </p>
                )}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <p className="text-xs text-slate-400">
                    Posted {formatAnnouncementDate(item.createdAt)}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => edit(item)}
                      className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => void remove(item)}
                      className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
