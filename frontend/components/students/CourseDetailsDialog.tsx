"use client";

import { useEffect } from "react";

type Details = {
  title: string;
  code: string;
  credits?: number;
  semester?: string;
  instructor: string;
  description: string;
  syllabus?: string | null;
};

export default function CourseDetailsDialog({
  course,
  onClose,
}: {
  course: Details;
  onClose: () => void;
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="course-details-title"
        className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 text-slate-700 shadow-2xl sm:p-8"
      >
        <div className="flex min-w-0 items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="mb-2 font-serif text-sm text-[#B45A2A]">
              Course Details
            </p>
            <h2
              id="course-details-title"
              className="break-words font-serif text-2xl font-bold tracking-tight text-[#333333]"
            >
              {course.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            autoFocus
            aria-label="Close course details"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-lg text-slate-500 transition hover:bg-slate-50"
          >
            ×
          </button>
        </div>
        <p className="mt-3 break-words text-sm text-slate-500">
          {course.code} · {course.credits ?? "Not specified"} credits
          {course.semester ? ` · ${course.semester}` : ""}
        </p>
        <p className="mt-4 rounded-xl bg-[#F0EDE4] px-4 py-3 text-sm font-medium text-[#B45A2A]">
          Instructor: {course.instructor}
        </p>
        <p className="mt-5 whitespace-pre-wrap break-words text-sm leading-7 text-slate-500">
          {course.description || "No course description published yet."}
        </p>
        <h3 className="mt-6 border-t border-slate-100 pt-5 text-lg font-bold text-slate-900">
          Syllabus
        </h3>
        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-500">
          {course.syllabus || "No syllabus published yet."}
        </p>
      </section>
    </div>
  );
}
