type MetricIcon =
  | "courses"
  | "students"
  | "assignments"
  | "pending"
  | "active"
  | "progress"
  | "excellent"
  | "passed"
  | "present"
  | "absent"
  | "late";

type TeacherMetricCardProps = {
  label: string;
  value: string | number;
  icon: MetricIcon;
  valueClassName?: string;
  description?: string;
};

const paths: Record<MetricIcon, React.ReactNode> = {
  courses: (
    <>
      <path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Z" />
      <path d="M8 7h8M8 11h8M8 15h5" />
    </>
  ),
  students: (
    <>
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M3.5 19c.7-3.1 2.7-5 5.5-5s4.8 1.9 5.5 5M14 15c2.5-.2 4.8 1.2 5.5 4" />
    </>
  ),
  assignments: (
    <>
      <path d="M9 5h6M9 3h6a1 1 0 0 1 1 1v1h1a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h1V4a1 1 0 0 1 1-1Z" />
      <path d="m9 13 2 2 4-4" />
    </>
  ),
  pending: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  active: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.5 2.5L16 9" />
    </>
  ),
  progress: (
    <>
      <path d="M4 19V9M10 19V5M16 19v-7M22 19V3" />
    </>
  ),
  excellent: (
    <>
      <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.4l6.1-.9L12 3Z" />
    </>
  ),
  passed: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.5 2.5L16 9" />
    </>
  ),
  present: (
    <>
      <path d="M5 12.5 9.5 17 19 7.5" />
    </>
  ),
  absent: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6m0-6-6 6" />
    </>
  ),
  late: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
};

export default function TeacherMetricCard({
  label,
  value,
  icon,
  valueClassName = "text-slate-800",
  description,
}: TeacherMetricCardProps) {
  return (
    <div className="min-w-0 rounded-2xl bg-white p-5 shadow-sm">
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
        <div className="min-w-0">
          <p className="break-words text-sm leading-5 text-slate-400">
            {label}
          </p>
          <p
            className={`mt-3 break-words text-3xl font-bold ${valueClassName}`}
          >
            {value}
          </p>
          {description && (
            <p className="mt-1 break-words text-xs text-slate-400">
              {description}
            </p>
          )}
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#111827] text-white shadow-sm">
          <svg
            aria-hidden="true"
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {paths[icon]}
          </svg>
        </div>
      </div>
    </div>
  );
}
