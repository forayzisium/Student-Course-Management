export type AnnouncementType =
  | "GENERAL"
  | "CLASS_CANCELLED"
  | "CLASS_RESCHEDULED"
  | "ROOM_CHANGE"
  | "REMINDER";

export type CourseAnnouncement = {
  id: number;
  courseId: number;
  teacherId: number;
  title: string;
  message: string;
  type: AnnouncementType;
  rescheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
  course: { id: number; code: string; name: string };
  teacher: { id: number; name: string };
};

export const announcementTypes: { value: AnnouncementType; label: string }[] = [
  { value: "GENERAL", label: "General" },
  { value: "CLASS_CANCELLED", label: "Class Cancelled" },
  { value: "CLASS_RESCHEDULED", label: "Class Rescheduled" },
  { value: "ROOM_CHANGE", label: "Room Change" },
  { value: "REMINDER", label: "Reminder" },
];

export function announcementLabel(type: AnnouncementType) {
  return (
    announcementTypes.find((item) => item.value === type)?.label ?? "General"
  );
}

export function announcementStyle(type: AnnouncementType) {
  const styles: Record<AnnouncementType, string> = {
    GENERAL: "bg-blue-50 text-blue-700",
    CLASS_CANCELLED: "bg-red-50 text-red-700",
    CLASS_RESCHEDULED: "bg-amber-50 text-amber-700",
    ROOM_CHANGE: "bg-violet-50 text-violet-700",
    REMINDER: "bg-emerald-50 text-emerald-700",
  };
  return styles[type];
}

export function formatAnnouncementDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
