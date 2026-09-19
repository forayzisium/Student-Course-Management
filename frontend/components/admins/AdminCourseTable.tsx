"use client";

export type AdminCourse = {
  id: number;
  code: string;
  name: string;
  department: string;
  teacher: string;
  students: number;
  semester: string;
  status: "Active" | "Inactive";
};

type AdminCourseTableProps = {
  courses: AdminCourse[];
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

export default function AdminCourseTable({
  courses,
  onToggleStatus,
}: AdminCourseTableProps) {
  if (courses.length === 0) {
    return (
      <div className="rounded-xl bg-white p-10 text-center shadow-sm">
        <p className="text-gray-500">No courses found.</p>
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
                Course
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Department
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Teacher
              </th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Semester
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
            {courses.map((course) => (
              <tr
                key={course.id}
                className="border-b border-slate-50 transition last:border-0 hover:bg-[#F8F6F0]"
              >
                <td className="px-6 py-4">
                  <p className="break-words text-sm font-semibold text-slate-700">
                    {course.name}
                  </p>
                  <p className="mt-1 break-words text-xs text-slate-400">
                    {course.code}
                  </p>
                </td>

                <td className="break-words px-6 py-4 text-sm text-slate-600">
                  {course.department}
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F0EDE4] text-xs font-semibold text-[#B45A2A]">
                      {getInitials(course.teacher)}
                    </div>
                    <span className="min-w-0 break-words text-sm font-medium text-slate-700">
                      {course.teacher}
                    </span>
                  </div>
                </td>

                <td className="break-words px-6 py-4 text-sm text-slate-600">
                  {course.semester}
                </td>

                <td className="px-6 py-4 text-center text-sm font-semibold text-slate-700">
                  {course.students}
                </td>

                <td className="px-6 py-4 text-center">
                  <span
                    className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
                      course.status === "Active"
                        ? "bg-green-50 text-green-600"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {course.status}
                  </span>
                </td>

                <td className="px-6 py-4 text-center">
                  <button
                    type="button"
                    onClick={() => onToggleStatus(course.id)}
                    className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition ${
                      course.status === "Active"
                        ? "border border-red-200 text-red-500 hover:bg-red-50"
                        : "bg-[#B45A2A] text-white hover:bg-[#9f4d24]"
                    }`}
                  >
                    {course.status === "Active" ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-4 xl:hidden">
        {courses.map((course) => (
          <article
            key={course.id}
            className="rounded-lg border border-slate-100 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="break-words text-sm font-semibold text-slate-700">
                  {course.name}
                </p>
                <p className="mt-1 break-words text-xs text-slate-400">
                  {course.code}
                </p>
              </div>

              <span
                className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
                  course.status === "Active"
                    ? "bg-green-50 text-green-600"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {course.status}
              </span>
            </div>

            <p className="mt-3 break-words text-sm text-slate-600">
              {course.department}
            </p>

            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F0EDE4] text-xs font-semibold text-[#B45A2A]">
                {getInitials(course.teacher)}
              </div>
              <span className="min-w-0 break-words text-sm font-medium text-slate-700">
                {course.teacher}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <p className="text-[10px] uppercase text-slate-400">Semester</p>
                <p className="mt-1 break-words text-sm text-slate-700">
                  {course.semester}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-slate-400">Students</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {course.students}
                </p>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => onToggleStatus(course.id)}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  course.status === "Active"
                    ? "border border-red-200 text-red-500 hover:bg-red-50"
                    : "bg-[#B45A2A] text-white hover:bg-[#9f4d24]"
                }`}
              >
                {course.status === "Active" ? "Deactivate" : "Activate"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
