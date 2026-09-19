import Link from "next/link";

type TeacherCourseCardProps = {
  id: number;
  code: string;
  title: string;
  description: string;
  students: number;
  assignments: number;
  progress: number;
  semester: string;
  attendance: number | null;
  status?: "Active" | "Completed";
};

export default function TeacherCourseCard({
  id,
  code,
  title,
  description,
  students,
  assignments,
  progress,
  semester,
  attendance,
  status = "Active",
}: TeacherCourseCardProps) {
  const progressValue = Math.min(100, Math.max(0, progress));

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="flex min-w-0 items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#B45A2A]">{code}</p>

          <h2 className="mt-1 break-words text-lg font-bold text-slate-800">
            {title}
          </h2>
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-semibold ${
            status === "Active"
              ? "bg-green-50 text-green-600"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {status}
        </span>
      </div>

      <p className="mt-5 text-sm leading-6 text-slate-500">{description}</p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-[#F0EDE4] p-3">
          <p className="text-xs text-slate-400">Students</p>

          <p className="mt-1 text-lg font-bold text-slate-700">{students}</p>
        </div>

        <div className="rounded-xl bg-[#F0EDE4] p-3">
          <p className="text-xs text-slate-400">Assignments</p>

          <p className="mt-1 text-lg font-bold text-slate-700">{assignments}</p>
        </div>

        <div className="rounded-xl bg-[#F0EDE4] p-3">
          <p className="text-xs text-slate-400">Attendance</p>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            {attendance === null ? "No records" : `${attendance}%`}
          </p>
        </div>

        <div className="rounded-xl bg-[#F0EDE4] p-3">
          <p className="text-xs text-slate-400">Semester</p>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            {semester}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">Course Progress</span>

          <span className="text-sm font-bold text-slate-700">
            {progressValue}%
          </span>
        </div>

        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[#B45A2A] transition-all duration-500"
            style={{
              width: `${progressValue}%`,
            }}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link
          href={`/teacher/courses/${id}`}
          className="flex-1 rounded-xl bg-[#111827] px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          View Course
        </Link>

        <Link
          href="/teacher/students"
          className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          Students
        </Link>
      </div>
    </div>
  );
}
