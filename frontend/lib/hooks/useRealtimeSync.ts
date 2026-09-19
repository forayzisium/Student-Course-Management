"use client";
import { useEffect, useEffectEvent } from "react";
import { API_URL } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
export const STUDENT_REFRESH = "scm:student-refresh";
export function useRealtimeRefresh(refresh: () => void | Promise<void>) {
  const onRefresh = useEffectEvent(refresh);
  useEffect(() => {
    let inFlight = false;
    let queued = false;
    let mounted = true;
    const listener = async () => {
      if (inFlight) {
        queued = true;
        return;
      }
      inFlight = true;
      try {
        await onRefresh();
      } finally {
        inFlight = false;
        if (queued && mounted) {
          queued = false;
          void listener();
        }
      }
    };
    window.addEventListener(STUDENT_REFRESH, listener);
    return () => {
      mounted = false;
      window.removeEventListener(STUDENT_REFRESH, listener);
    };
  }, []);
}
export function useRealtimeSync() {
  const { token, user } = useAuth();
  useEffect(() => {
    if (!token || user?.role !== "STUDENT") return;
    const controller = new AbortController();
    let reconnect: ReturnType<typeof setTimeout>;
    let debounce: ReturnType<typeof setTimeout>;
    let dirty = false;
    const refresh = () => {
      dirty = true;
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        if (document.visibilityState === "visible") {
          dirty = false;
          window.dispatchEvent(new Event(STUDENT_REFRESH));
        }
      }, 300);
    };
    const visible = () => {
      if (dirty || document.visibilityState === "visible") refresh();
    };
    let connectedBefore = false;
    let retry = 1000;
    const connect = async () => {
      try {
        const response = await fetch(API_URL + "/events/student-stream", {
          headers: { Authorization: "Bearer " + token },
          signal: controller.signal,
          cache: "no-store",
        });
        if (response.status === 401 || response.status === 403) return;
        if (!response.ok || !response.body)
          throw new Error("Stream unavailable");
        retry = 1000;
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (!controller.signal.aborted) {
          const chunk = await reader.read();
          if (chunk.done) break;
          buffer += decoder.decode(chunk.value, { stream: true });
          let end;
          while ((end = buffer.indexOf("\n\n")) >= 0) {
            const frame = buffer.slice(0, end);
            buffer = buffer.slice(end + 2);
            const line = frame
              .split("\n")
              .find((line) => line.startsWith("data: "));
            if (!line) continue;
            const event = JSON.parse(line.slice(6));
            if (event.type === "CONNECTED") {
              if (connectedBefore) refresh();
              connectedBefore = true;
            } else if (event.type !== "PING") refresh();
          }
        }
      } catch {
        /* A periodic refresh remains available while offline. */
      }
      if (!controller.signal.aborted) {
        reconnect = setTimeout(() => {
          void connect();
        }, retry);
        retry = Math.min(retry * 2, 30000);
      }
    };
    void connect();
    const fallback = setInterval(refresh, 120000);
    window.addEventListener("focus", visible);
    document.addEventListener("visibilitychange", visible);
    return () => {
      controller.abort();
      clearTimeout(reconnect);
      clearTimeout(debounce);
      clearInterval(fallback);
      window.removeEventListener("focus", visible);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [token, user?.role]);
}
