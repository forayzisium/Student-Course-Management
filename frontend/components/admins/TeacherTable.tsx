type Teacher = {
  id: number;
  name: string;
  email: string;
  department: string;
  courses: number;
  students: number;
  status: "Active" | "Inactive";
};

type TeacherTableProps = {
  teachers: Teacher[];
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

export default function TeacherTable({
  teachers,
  onToggleStatus,
}: TeacherTableProps) {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm">
      <div className="hidden overflow-x-auto xl:block">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Teacher
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Department
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                Courses
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                Students
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
            {teachers.map((teacher) => (
              <tr
                key={teacher.id}
                className="border-b border-slate-100 last:border-0 hover:bg-[#F8F6F0]"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#B45A2A] text-xs font-bold text-white">
                      {getInitials(teacher.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="break-words text-sm font-semibold text-slate-700">
                        {teacher.name}
                      </p>
                      <p className="mt-1 break-all text-xs text-slate-400">
                        {teacher.email}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="break-words px-6 py-4 text-sm text-slate-600">
                  {teacher.department}
                </td>

                <td className="px-6 py-4 text-center text-sm font-medium text-slate-600">
                  {teacher.courses}
                </td>

                <td className="px-6 py-4 text-center text-sm font-medium text-slate-600">
                  {teacher.students}
                </td>

                <td className="px-6 py-4 text-center">
                  <span
                    className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
                      teacher.status === "Active"
                        ? "bg-green-50 text-green-600"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {teacher.status}
                  </span>
                </td>

                <td className="px-6 py-4 text-center">
                  <button
                    type="button"
                    onClick={() => onToggleStatus(teacher.id)}
                    className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition ${
                      teacher.status === "Active"
                        ? "border border-red-200 text-red-500 hover:bg-red-50"
                        : "bg-[#B45A2A] text-white hover:bg-[#9f4d24]"
                    }`}
                  >
                    {teacher.status === "Active" ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-3 sm:p-4 xl:hidden">
        {teachers.map((teacher) => (
          <article
            key={teacher.id}
            className="rounded-lg border border-slate-100 p-4"
          >
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:justify-between">
              <div className="flex w-full min-w-0 items-center gap-3 sm:flex-1">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#B45A2A] text-xs font-bold text-white">
                  {getInitials(teacher.name)}
                </div>
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold text-slate-700">
                    {teacher.name}
                  </p>
                  <p className="mt-1 break-all text-xs text-slate-400">
                    {teacher.email}
                  </p>
                </div>
              </div>

              <span
                className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
                  teacher.status === "Active"
                    ? "bg-green-50 text-green-600"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {teacher.status}
              </span>
            </div>

            <p className="mt-3 break-words text-sm text-slate-600">
              {teacher.department}
            </p>

            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase text-slate-400">
                    Courses
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {teacher.courses}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-slate-400">
                    Students
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {teacher.students}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onToggleStatus(teacher.id)}
                className={`w-full whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition sm:w-auto ${
                  teacher.status === "Active"
                    ? "border border-red-200 text-red-500 hover:bg-red-50"
                    : "bg-[#B45A2A] text-white hover:bg-[#9f4d24]"
                }`}
              >
                {teacher.status === "Active" ? "Deactivate" : "Activate"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
