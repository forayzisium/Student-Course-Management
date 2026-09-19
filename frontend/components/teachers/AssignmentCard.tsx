import Link from "next/link";

type AssignmentCardProps = {
  id: number;
  title: string;
  course: string;
  dueDate: string;
  submissions: number;
  totalStudents: number;
  status: "Active" | "Closed" | "Grading";
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
};

export default function AssignmentCard({
  id,
  title,
  course,
  dueDate,
  submissions,
  totalStudents,
  status,
  onEdit,
  onDelete,
}: AssignmentCardProps) {
  const submissionPercentage =
    totalStudents > 0 ? Math.round((submissions / totalStudents) * 100) : 0;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#B45A2A]">{course}</p>

          <h3 className="mt-1 text-base font-bold text-slate-800">{title}</h3>
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-semibold ${
            status === "Active"
              ? "bg-green-50 text-green-600"
              : status === "Grading"
                ? "bg-amber-50 text-amber-600"
                : "bg-slate-100 text-slate-500"
          }`}
        >
          {status}
        </span>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Submissions</span>

          <span className="font-semibold text-slate-600">
            {submissions}/{totalStudents}
          </span>
        </div>

        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[#B45A2A] transition-all"
            style={{
              width: `${submissionPercentage}%`,
            }}
          />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="4" width="18" height="17" rx="2" />

            <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          Due {dueDate}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onEdit(id)}
            className="text-xs font-semibold text-slate-500 transition hover:text-[#B45A2A]"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() => onDelete(id)}
            className="text-xs font-semibold text-red-500 transition hover:text-red-600"
          >
            Delete
          </button>

          <Link
            href={`/teacher/assignments/${id}`}
            className="text-xs font-semibold text-[#B45A2A] hover:underline"
          >
            View →
          </Link>
        </div>
      </div>
    </div>
  );
}
