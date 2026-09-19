type Student = {
  id: number;
  name: string;
  studentId: string;
  email: string;
  course: string;
  attendance: number;
  grade: string;
  status: "Active" | "Inactive";
};

type StudentTableProps = {
  students: Student[];
};

export default function StudentTable({ students }: StudentTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="hidden overflow-x-auto xl:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wider text-slate-400">
              <th className="px-6 py-4 font-semibold">Student</th>

              <th className="px-6 py-4 font-semibold">Student ID</th>

              <th className="hidden px-6 py-4 font-semibold xl:table-cell">
                Course
              </th>

              <th className="px-6 py-4 font-semibold">Attendance</th>

              <th className="px-6 py-4 font-semibold">Grade</th>

              <th className="px-6 py-4 text-right font-semibold">Status</th>
            </tr>
          </thead>

          <tbody>
            {students.map((student) => (
              <tr
                key={student.id}
                className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#B45A2A] text-xs font-semibold text-white">
                      {student.name
                        .split(" ")
                        .map((name) => name[0])
                        .join("")
                        .slice(0, 2)}
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        {student.name}
                      </p>

                      <p className="text-xs text-slate-400">{student.email}</p>

                      <p className="mt-0.5 text-xs text-slate-400 xl:hidden">
                        {student.course}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 text-sm text-slate-500">
                  {student.studentId}
                </td>

                <td className="hidden px-6 py-4 text-sm text-slate-500 xl:table-cell">
                  {student.course}
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[#B45A2A]"
                        style={{
                          width: `${student.attendance}%`,
                        }}
                      />
                    </div>

                    <span className="text-xs font-medium text-slate-600">
                      {student.attendance}%
                    </span>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <span className="rounded-lg bg-[#F0EDE4] px-2.5 py-1 text-xs font-bold text-slate-700">
                    {student.grade}
                  </span>
                </td>

                <td className="px-6 py-4 text-right">
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-semibold ${
                      student.status === "Active"
                        ? "bg-green-50 text-green-600"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {student.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-4 xl:hidden">
        {students.map((student) => (
          <div
            key={student.id}
            className="rounded-xl border border-slate-100 p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#B45A2A] text-xs font-semibold text-white">
                  {student.name
                    .split(" ")
                    .map((name) => name[0])
                    .join("")
                    .slice(0, 2)}
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    {student.name}
                  </p>

                  <p className="text-xs text-slate-400">{student.studentId}</p>
                </div>
              </div>

              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                  student.status === "Active"
                    ? "bg-green-50 text-green-600"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {student.status}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] uppercase text-slate-400">Course</p>

                <p className="mt-1 text-xs font-semibold text-slate-600">
                  {student.course}
                </p>
              </div>

              <div>
                <p className="text-[10px] uppercase text-slate-400">Grade</p>

                <p className="mt-1 text-xs font-semibold text-slate-600">
                  {student.grade}
                </p>
              </div>

              <div className="col-span-2">
                <div className="flex justify-between">
                  <p className="text-[10px] uppercase text-slate-400">
                    Attendance
                  </p>

                  <p className="text-xs font-semibold text-slate-600">
                    {student.attendance}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
