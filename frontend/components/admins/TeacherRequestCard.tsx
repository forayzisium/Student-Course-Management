type TeacherRequestCardProps = {
  name: string;
  email: string;
  department: string;
  qualification: string;
  experience: string;
  submittedDate: string;
  status: "Pending" | "Approved" | "Rejected";
  onApprove?: () => void;
  onReject?: () => void;
};

export default function TeacherRequestCard({
  name,
  email,
  department,
  qualification,
  experience,
  submittedDate,
  status,
  onApprove,
  onReject,
}: TeacherRequestCardProps) {
  const initials = name
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex w-full min-w-0 flex-col items-start gap-4 sm:flex-row sm:items-center lg:flex-1">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#B45A2A] font-serif text-lg font-bold text-white">
            {initials}
          </div>

          <div className="min-w-0">
            <h3 className="break-words font-serif text-lg font-bold text-slate-800">
              {name}
            </h3>

            <p className="mt-1 break-all text-sm text-slate-500">{email}</p>

            <p className="mt-1 text-xs text-slate-400">
              Submitted {submittedDate}
            </p>
          </div>
        </div>

        <span
          className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
            status === "Pending"
              ? "bg-amber-50 text-amber-600"
              : status === "Approved"
                ? "bg-green-50 text-green-600"
                : "bg-red-50 text-red-500"
          }`}
        >
          {status}
        </span>
      </div>

      <div className="mt-6 grid gap-4 border-t border-slate-100 pt-5 lg:grid-cols-3">
        <div>
          <p className="text-xs text-slate-400">Department</p>

          <p className="mt-1 break-words text-sm font-medium text-slate-700">
            {department}
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-400">Qualification</p>

          <p className="mt-1 break-words text-sm font-medium text-slate-700">
            {qualification}
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-400">Experience</p>

          <p className="mt-1 break-words text-sm font-medium text-slate-700">
            {experience}
          </p>
        </div>
      </div>

      {status === "Pending" && (
        <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 lg:flex-row lg:justify-end">
          <button
            type="button"
            onClick={onReject}
            className="w-full rounded-xl border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-50 lg:w-auto"
          >
            Reject
          </button>

          <button
            type="button"
            onClick={onApprove}
            className="w-full rounded-xl bg-[#B45A2A] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#9f4d24] lg:w-auto"
          >
            Approve Teacher
          </button>
        </div>
      )}
    </div>
  );
}
