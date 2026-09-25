"use client";

export type AdminAssignment = {
  id: number;
  title: string;
  course: string;
  courseCode: string;
  teacher: string;
  dueDate: string;
  submissions: number;
  totalStudents: number;
  status: "Published" | "Draft" | "Closed";
};

type AdminAssignmentTableProps = {
  assignments: AdminAssignment[];
  onStatusChange: (id: number, status: AdminAssignment["status"]) => void;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getStatusClass(status: AdminAssignment["status"]) {
  if (status === "Published") {
    return "bg-green-50 text-green-600";
  }

  if (status === "Draft") {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-slate-100 text-slate-500";
}

export default function AdminAssignmentTable({
  assignments,
  onStatusChange,
}: AdminAssignmentTableProps) {
  if (assignments.length === 0) {
    return (
      <div className="rounded-xl bg-white p-10 text-center shadow-sm">
        <p className="text-gray-500">No assignments found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm">
      <div className="hidden overflow-x-auto xl:block">
        <table className="w-full min-w-[1000px] text-left">
          <thead className="border-b border-slate-100 bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Assignment
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Course
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Teacher
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Due Date
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                Submissions
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                Status
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {assignments.map((assignment) => {
              const percentage =
                assignment.totalStudents > 0
                  ? Math.round(
                      (assignment.submissions / assignment.totalStudents) * 100,
                    )
                  : 0;

              return (
                <tr
                  key={assignment.id}
                  className="border-b border-slate-50 transition last:border-0 hover:bg-[#F8F6F0]"
                >
                  <td className="px-6 py-4">
                    <p className="break-words text-sm font-semibold text-slate-700">
                      {assignment.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {percentage}% submitted
                    </p>
                  </td>

                  <td className="px-6 py-4">
                    <p className="break-words text-sm font-medium text-slate-700">
                      {assignment.course}
                    </p>
                    <p className="mt-1 break-words text-xs text-slate-400">
                      {assignment.courseCode}
                    </p>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F5EDE6] text-sm font-semibold text-[#B45A2A] ring-1 ring-[#E8DED4]">
                        {getInitials(assignment.teacher)}
                      </div>

                      <div className="min-w-0">
                        <p className="break-words text-sm font-semibold text-slate-700">
                          {assignment.teacher}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          Instructor
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="break-words px-6 py-4 text-sm text-slate-600">
                    {assignment.dueDate}
                  </td>

                  <td className="px-6 py-4 text-center">
                    <p className="text-sm font-medium text-slate-700">
                      {assignment.submissions}/{assignment.totalStudents}
                    </p>
                    <div className="mx-auto mt-2 h-1.5 w-24 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-[#B45A2A]"
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span
                      className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                        assignment.status,
                      )}`}
                    >
                      {assignment.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <select
                      value={assignment.status}
                      onChange={(e) =>
                        onStatusChange(
                          assignment.id,
                          e.target.value as AdminAssignment["status"],
                        )
                      }
                      className="whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#B45A2A]"
                    >
                      <option value="Published">Published</option>
                      <option value="Draft">Draft</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-4 xl:hidden">
        {assignments.map((assignment) => {
          const percentage =
            assignment.totalStudents > 0
              ? Math.round(
                  (assignment.submissions / assignment.totalStudents) * 100,
                )
              : 0;

          return (
            <article
              key={assignment.id}
              className="rounded-lg border border-slate-100 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold text-slate-700">
                    {assignment.title}
                  </p>
                  <p className="mt-1 break-words text-xs text-slate-400">
                    {assignment.course} · {assignment.courseCode}
                  </p>
                </div>

                <span
                  className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                    assignment.status,
                  )}`}
                >
                  {assignment.status}
                </span>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F5EDE6] text-sm font-semibold text-[#B45A2A] ring-1 ring-[#E8DED4]">
                  {getInitials(assignment.teacher)}
                </div>

                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold text-slate-700">
                    {assignment.teacher}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">Instructor</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] uppercase text-slate-400">
                    Due Date
                  </p>
                  <p className="mt-1 break-words text-sm text-slate-700">
                    {assignment.dueDate}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-slate-400">
                    Submissions
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {assignment.submissions}/{assignment.totalStudents}
                  </p>
                </div>
              </div>

              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-[#B45A2A]"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                {percentage}% submitted
              </p>

              <div className="mt-4 flex justify-end">
                <select
                  value={assignment.status}
                  onChange={(e) =>
                    onStatusChange(
                      assignment.id,
                      e.target.value as AdminAssignment["status"],
                    )
                  }
                  className="whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-[#B45A2A]"
                >
                  <option value="Published">Published</option>
                  <option value="Draft">Draft</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
