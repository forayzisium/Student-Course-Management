"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useRealtimeRefresh } from "@/lib/hooks/useRealtimeSync";
import {
  announcementLabel,
  announcementStyle,
  CourseAnnouncement,
  formatAnnouncementDate,
} from "@/lib/announcements";

export default function StudentAnnouncementsPage() {
  const [items, setItems] = useState<CourseAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const token = localStorage.getItem("scm_token");
      if (!token) throw new Error("Authentication required");
      const response = await apiFetch<{
        success: boolean;
        data: CourseAnnouncement[];
      }>("/announcements/my", { token });
      setItems(response.data);
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
  useRealtimeRefresh(load);

  return (
    <div className="min-h-screen bg-[#EAE6DC] p-5 sm:p-8">
      <header className="mb-8">
        <p className="font-serif text-sm text-[#B45A2A]">Student Portal</p>
        <h1 className="mt-1 font-serif text-2xl font-bold text-[#333333] sm:text-3xl">
          Course Updates
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Updates from teachers for your active courses.
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {loading ? (
        <div className="rounded-xl bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
          Loading course updates...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl bg-white p-10 text-center shadow-sm">
          <p className="font-semibold text-slate-700">
            No course announcements yet.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Updates from your enrolled courses will appear here.
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
                  <h2 className="mt-1 text-lg font-semibold text-slate-900">
                    {item.title}
                  </h2>
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
                <div className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <span className="font-semibold">New class time:</span>{" "}
                  {formatAnnouncementDate(item.rescheduledAt)}
                </div>
              )}
              <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-100 pt-4 text-xs text-slate-400">
                <span>Teacher: {item.teacher.name}</span>
                <span>Posted {formatAnnouncementDate(item.createdAt)}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
