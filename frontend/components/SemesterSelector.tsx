"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";

export type SemesterOption = { id: number; name: string; isCurrent: boolean };

export default function SemesterSelector({
  value,
  onChange,
  includeAll = true,
  disabled = false,
}: {
  value: string;
  onChange: (semesterId: string) => void;
  includeAll?: boolean;
  disabled?: boolean;
}) {
  const [semesters, setSemesters] = useState<SemesterOption[]>([]);
  const [loading, setLoading] = useState(true);
  const selectSemester = useEffectEvent(onChange);
  const initialValue = useRef(value);

  useEffect(() => {
    apiFetch<{ data: SemesterOption[] }>("/semesters", {
      token: localStorage.getItem("scm_token") || "",
    })
      .then((response) => {
        setSemesters(response.data || []);
        if (!includeAll && !initialValue.current) {
          const preferred =
            response.data.find((item) => item.isCurrent) || response.data[0];
          if (preferred) selectSemester(String(preferred.id));
        }
      })
      .finally(() => setLoading(false));
  }, [includeAll]);

  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled || loading}
      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#B45A2A] disabled:bg-slate-50"
    >
      {includeAll && <option value="">All Semesters</option>}
      {!includeAll && (
        <option value="">
          {loading ? "Loading semesters..." : "Select a semester"}
        </option>
      )}
      {semesters.map((semester) => (
        <option key={semester.id} value={semester.id}>
          {semester.name}
          {semester.isCurrent ? " (Current)" : ""}
        </option>
      ))}
    </select>
  );
}
