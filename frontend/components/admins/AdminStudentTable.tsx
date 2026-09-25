"use client";

type Student = {
  id: number;
  name: string;
  studentId: string;
  email: string;
  department: string;
  year: string;
  courses: number;
  status: "Active" | "Inactive";
};

type AdminStudentTableProps = {
  students: Student[];
  onToggleStatus: (id: number) => void;
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

export default function AdminStudentTable({
  students,
  onToggleStatus,
}: AdminStudentTableProps) {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm">
      <div className="hidden overflow-x-auto xl:block">
        <table className="w-full min-w-[900px] text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Student
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Department
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Year
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                Courses
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
            {students.map((student) => (
              <tr
                key={student.id}
                className="border-b border-slate-50 transition last:border-0 hover:bg-[#F8F6F0]"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#B45A2A] text-xs font-bold text-white">
                      {getInitials(student.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="break-words text-sm font-semibold text-slate-700">
                        {student.name}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-400">
                        {student.studentId}
                      </p>
                      <p className="mt-0.5 break-all text-xs text-slate-400">
                        {student.email}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="break-words px-6 py-4 text-sm text-slate-600">
                  {student.department}
                </td>

                <td className="px-6 py-4 text-sm text-slate-600">
                  {student.year}
                </td>

                <td className="px-6 py-4 text-center text-sm font-medium text-slate-600">
                  {student.courses}
                </td>

                <td className="px-6 py-4 text-center">
                  <span
                    className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
                      student.status === "Active"
                        ? "bg-green-50 text-green-600"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {student.status}
                  </span>
                </td>

                <td className="px-6 py-4 text-center">
                  <button
                    type="button"
                    onClick={() => onToggleStatus(student.id)}
                    className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition ${
                      student.status === "Active"
                        ? "border border-red-200 text-red-500 hover:bg-red-50"
                        : "bg-[#B45A2A] text-white hover:bg-[#9f4d24]"
                    }`}
                  >
                    {student.status === "Active" ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-3 sm:p-4 xl:hidden">
        {students.map((student) => (
          <article
            key={student.id}
            className="rounded-lg border border-slate-100 p-4"
          >
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:justify-between">
              <div className="flex w-full min-w-0 items-center gap-3 sm:flex-1">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#B45A2A] text-xs font-bold text-white">
                  {getInitials(student.name)}
                </div>
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold text-slate-700">
                    {student.name}
                  </p>
                  <p className="mt-1 truncate text-xs text-slate-400">
                    {student.studentId}
                  </p>
                  <p className="mt-0.5 break-all text-xs text-slate-400">
                    {student.email}
                  </p>
                </div>
              </div>

              <span
                className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
                  student.status === "Active"
                    ? "bg-green-50 text-green-600"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {student.status}
              </span>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-[10px] uppercase text-slate-400">
                  Department
                </p>
                <p className="mt-1 break-words text-sm text-slate-700">
                  {student.department}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-slate-400">Year</p>
                <p className="mt-1 text-sm text-slate-700">{student.year}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-slate-400">Courses</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {student.courses}
                </p>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => onToggleStatus(student.id)}
                className={`w-full whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition sm:w-auto ${
                  student.status === "Active"
                    ? "border border-red-200 text-red-500 hover:bg-red-50"
                    : "bg-[#B45A2A] text-white hover:bg-[#9f4d24]"
                }`}
              >
                {student.status === "Active" ? "Deactivate" : "Activate"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
