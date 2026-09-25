"use client";

import React from "react";

interface StateCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}

export default function StatCard({
  title,
  value,
  description,
  icon,
}: StateCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 font-inter shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
        <div className="min-w-0">
          <p className="break-words text-sm font-medium leading-5 text-gray-500">
            {title}
          </p>

          <h2 className="mt-2 break-words text-3xl font-bold text-gray-900">
            {value}
          </h2>

          <p className="mt-2 break-words text-sm leading-5 text-gray-500">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#111827] text-white shadow-md">
          {icon}
        </div>
      </div>
    </div>
  );
}
