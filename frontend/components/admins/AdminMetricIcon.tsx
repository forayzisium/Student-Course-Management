export type AdminMetricIconType =
  | "students"
  | "teachers"
  | "courses"
  | "assignments"
  | "attendance"
  | "grades"
  | "active"
  | "inactive"
  | "pending"
  | "records"
  | "payments";

type AdminMetricIconProps = {
  type: AdminMetricIconType;
};

const sharedProps = {
  className: "h-5 w-5",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export default function AdminMetricIcon({ type }: AdminMetricIconProps) {
  if (type === "students") {
    return (
      <svg {...sharedProps}>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M3.5 19c.7-3.7 2.7-5.5 5.5-5.5s4.8 1.8 5.5 5.5" />
        <path d="M15.5 5.2a3.4 3.4 0 0 1 0 6.6M17 14c2 .7 3.2 2.3 3.7 5" />
      </svg>
    );
  }

  if (type === "teachers") {
    return (
      <svg {...sharedProps}>
        <path d="m3 8.5 9-4 9 4-9 4-9-4Z" />
        <path d="M7 10.7v4.1c2.7 2.2 7.3 2.2 10 0v-4.1" />
        <path d="M21 9v5" />
      </svg>
    );
  }

  if (type === "courses") {
    return (
      <svg {...sharedProps}>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" />
        <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z" />
      </svg>
    );
  }

  if (type === "assignments") {
    return (
      <svg {...sharedProps}>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M9 3.5h6M8.5 10h7M8.5 14h7M8.5 18h4" />
      </svg>
    );
  }

  if (type === "attendance") {
    return (
      <svg {...sharedProps}>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M8 3v4M16 3v4M3 10h18" />
        <path d="m8 15 2 2 5-5" />
      </svg>
    );
  }

  if (type === "grades") {
    return (
      <svg {...sharedProps}>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M9 3.5h6M8.5 10h7" />
        <path d="m8.5 15 2 2 4.5-5" />
      </svg>
    );
  }

  if (type === "active") {
    return (
      <svg {...sharedProps}>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 2.5 2.5L16 9" />
      </svg>
    );
  }

  if (type === "inactive") {
    return (
      <svg {...sharedProps}>
        <circle cx="12" cy="12" r="9" />
        <path d="m9 9 6 6M15 9l-6 6" />
      </svg>
    );
  }

  if (type === "pending") {
    return (
      <svg {...sharedProps}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }

  if (type === "payments") {
    return (
      <svg {...sharedProps}>
        <rect x="3" y="6" width="18" height="13" rx="2" />
        <path d="M3 10h18M16 15h2" />
      </svg>
    );
  }

  return (
    <svg {...sharedProps}>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4.5h6M8.5 10h7M8.5 14h7M8.5 18h4" />
    </svg>
  );
}
