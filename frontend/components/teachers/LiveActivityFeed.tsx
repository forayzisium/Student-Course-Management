"use client";

import { useEffect, useRef, useState } from "react";
import { API_URL, apiFetch } from "@/lib/api";

export type TeacherActivity = {
  id: string;
  type: string;
  title: string;
  description: string;
  courseCode?: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  createdAt: string;
};

function mergeActivities(
  current: TeacherActivity[],
  incoming: TeacherActivity[],
) {
  const activities = new Map(
    current.map((activity) => [activity.id, activity]),
  );

  for (const activity of incoming) {
    activities.set(activity.id, activity);
  }

  return [...activities.values()]
    .sort(
      (first, second) =>
        new Date(second.createdAt).getTime() -
        new Date(first.createdAt).getTime(),
    )
    .slice(0, 20);
}

function formatRelativeTime(createdAt: string) {
  const seconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000),
  );

  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return days === 1 ? "Yesterday" : `${days}d ago`;
}

function ActivityIcon({ type }: { type: string }) {
  if (type.includes("ATTENDANCE")) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <rect
          x="3"
          y="5"
          width="18"
          height="16"
          rx="2"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M8 3v4M16 3v4M3 10h18m-13 5 2 2 5-5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (type.includes("GRADE")) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path
          d="m5 13 4 4L19 7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (type.includes("ENROLLMENT")) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="2" />
        <path
          d="M3.5 19c.7-3.1 2.7-5 5.5-5s4.8 1.9 5.5 5M17 8v6m-3-3h6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <rect
        x="5"
        y="4"
        width="14"
        height="17"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M9 4.5h6M9 10h6M9 14h4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function waitForReconnect(delay: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    const timeout = window.setTimeout(resolve, delay);

    signal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timeout);
        resolve();
      },
      { once: true },
    );
  });
}

export default function LiveActivityFeed() {
  const [activities, setActivities] = useState<TeacherActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [newActivityIds, setNewActivityIds] = useState<Set<string>>(new Set());
  const [notification, setNotification] = useState<TeacherActivity | null>(
    null,
  );
  const [newCount, setNewCount] = useState(0);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    const timersForCleanup = timers.current;

    async function syncActivities(token: string) {
      const response = await apiFetch<{
        success: boolean;
        data: TeacherActivity[];
      }>("/activities/teacher/recent?limit=20", {
        token,
        signal: controller.signal,
      });

      setActivities((current) => mergeActivities(current, response.data || []));
    }

    function handleActivity(activity: TeacherActivity) {
      setActivities((current) => {
        if (current.some((item) => item.id === activity.id)) return current;
        return [activity, ...current].slice(0, 20);
      });
      setNewActivityIds((current) => new Set(current).add(activity.id));
      setNotification(activity);
      setNewCount((count) => count + 1);

      timers.current.push(
        window.setTimeout(() => {
          setNewActivityIds((current) => {
            const next = new Set(current);
            next.delete(activity.id);
            return next;
          });
        }, 3500),
        window.setTimeout(() => {
          setNotification((current) =>
            current?.id === activity.id ? null : current,
          );
        }, 5000),
      );
    }

    async function consumeStream(token: string) {
      let reconnectAttempt = 0;

      while (!controller.signal.aborted) {
        try {
          await syncActivities(token);

          const response = await fetch(`${API_URL}/activities/teacher/stream`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          });

          if (!response.ok || !response.body) {
            throw new Error("Activity stream unavailable");
          }

          reconnectAttempt = 0;

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (!controller.signal.aborted) {
            const { done, value } = await reader.read();
            if (done) throw new Error("Activity stream closed");

            buffer += decoder
              .decode(value, { stream: true })
              .replace(/\r\n/g, "\n");
            let boundary = buffer.indexOf("\n\n");

            while (boundary !== -1) {
              const frame = buffer.slice(0, boundary);
              buffer = buffer.slice(boundary + 2);

              const event = frame
                .split("\n")
                .find((line) => line.startsWith("event:"))
                ?.slice(6)
                .trim();
              const data = frame
                .split("\n")
                .filter((line) => line.startsWith("data:"))
                .map((line) => line.slice(5).trim())
                .join("\n");

              if (event === "activity" && data) {
                handleActivity(JSON.parse(data) as TeacherActivity);
              }

              boundary = buffer.indexOf("\n\n");
            }
          }
        } catch (error) {
          if (controller.signal.aborted) break;

          console.error("Teacher activity stream disconnected:", error);
          reconnectAttempt += 1;
          await waitForReconnect(
            Math.min(1000 * 2 ** reconnectAttempt, 15000),
            controller.signal,
          );
        }
      }
    }

    async function start() {
      const token = localStorage.getItem("scm_token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        await syncActivities(token);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Failed to load teacher activities:", error);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }

      if (!controller.signal.aborted) void consumeStream(token);
    }

    void start();

    return () => {
      controller.abort();
      for (const timer of timersForCleanup) window.clearTimeout(timer);
    };
  }, []);

  return (
    <>
      <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5 sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Recent Activity
                </h2>
                {newCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setNewCount(0)}
                    className="rounded-full bg-[#B45A2A] px-2 py-0.5 text-[10px] font-bold text-white"
                    aria-label={`${newCount} new activities. Mark as seen.`}
                  >
                    {newCount} new
                  </button>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500">Classroom updates.</p>
            </div>
          </div>
        </div>

        <div
          className="max-h-[520px] overflow-y-auto px-4 py-3 sm:px-5"
          aria-live="polite"
          aria-busy={loading}
        >
          {loading ? (
            <div className="space-y-3 py-2">
              {[0, 1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="flex animate-pulse gap-3 rounded-xl p-3"
                >
                  <div className="h-9 w-9 rounded-xl bg-slate-100" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3 w-2/3 rounded bg-slate-100" />
                    <div className="h-3 w-full rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="px-4 py-14 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F0EDE4] text-[#B45A2A]">
                <ActivityIcon type="ASSIGNMENT" />
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-700">
                No activity yet
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                New classroom updates will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {activities.map((activity) => {
                const isNew = newActivityIds.has(activity.id);
                const priorityClasses =
                  activity.priority === "HIGH"
                    ? "bg-red-50 text-red-600"
                    : activity.priority === "MEDIUM"
                      ? "bg-amber-50 text-amber-600"
                      : "bg-slate-100 text-slate-500";

                return (
                  <article
                    key={activity.id}
                    className={`relative flex gap-3 rounded-xl border p-3 transition-colors ${
                      isNew
                        ? "activity-entry border-[#B45A2A]/25 bg-orange-50/70"
                        : "border-transparent hover:bg-slate-50"
                    }`}
                  >
                    {isNew && (
                      <span className="absolute right-3 top-3 h-1.5 w-1.5 animate-pulse rounded-full bg-[#B45A2A] motion-reduce:animate-none" />
                    )}
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${priorityClasses}`}
                    >
                      <ActivityIcon type={activity.type} />
                    </div>
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <h3 className="text-sm font-semibold text-slate-800">
                          {activity.title}
                        </h3>
                        {activity.courseCode && (
                          <span className="rounded-md bg-[#F0EDE4] px-1.5 py-0.5 text-[10px] font-bold text-[#8F4926]">
                            {activity.courseCode}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {activity.description}
                      </p>
                      <time
                        dateTime={activity.createdAt}
                        className="mt-1.5 block text-[10px] font-medium text-slate-400"
                      >
                        {formatRelativeTime(activity.createdAt)}
                      </time>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <div
        className="pointer-events-none fixed bottom-5 right-5 z-50 w-[calc(100%-2.5rem)] max-w-sm"
        aria-live="assertive"
      >
        {notification && (
          <div className="activity-toast pointer-events-auto overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15">
            <div className="h-1 bg-[#B45A2A]" />
            <div className="flex gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#B45A2A]">
                <ActivityIcon type={notification.type} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#B45A2A]">
                  New activity
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {notification.title}
                </p>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                  {notification.description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNotification(null)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Dismiss notification"
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path
                    d="m5 5 10 10M15 5 5 15"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
