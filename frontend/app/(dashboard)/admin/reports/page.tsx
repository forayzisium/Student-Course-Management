"use client";

import { useEffect, useMemo, useState } from "react";
import ReportStatCard from "@/components/admins/ReportStatCard";
import ReportProgressCard from "@/components/admins/ReportProgressCard";
import AdminMetricIcon from "@/components/admins/AdminMetricIcon";
import { apiFetch } from "@/lib/api";

type ReportsData = {
  students: {
    total: number;
    active?: number;
  };

  teachers: {
    total?: number;
    active?: number;
  };

  courses: {
    total: number;
    active?: number;
  };

  assignments: {
    total: number;
    active?: number;
  };

  enrollments?: {
    total?: number;
    active?: number;
    activeEnrollments?: number;
  };

  activeEnrollments?: number;

  attendance: {
    total: number;
    present: number;
    absent: number;
    late: number;
  };

  grades: {
    total: number;
  };

  payments: {
    total: number;
    paid: number;
    pending: number;
  };
};

type ReportsResponse = {
  success: boolean;
  data: ReportsData;
};

type SystemOverviewProgressBarProps = {
  active?: number;
  total?: number;
  label: string;
};

function SystemOverviewProgressBar({
  active,
  total,
  label,
}: SystemOverviewProgressBarProps) {
  if (total === 0) {
    return <p className="text-xs text-gray-500">No records</p>;
  }
  if (
    total === undefined ||
    active === undefined ||
    !Number.isFinite(total) ||
    !Number.isFinite(active) ||
    total < 0 ||
    active < 0 ||
    active > total
  ) {
    return <p className="text-xs text-gray-500">Active share unavailable</p>;
  }
  const progress = calculateProgressPercentage(active, total);
  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-center justify-between gap-3 text-xs">
        <span className="text-gray-600">
          {active} of {total} active
        </span>
        <span className="font-semibold text-[#B45A2A]">{progress}%</span>
      </div>
      <div
        role="progressbar"
        aria-label={label + " active share"}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        aria-valuetext={active + " of " + total + " active (" + progress + "%)"}
        className="h-2 overflow-hidden rounded-full bg-gray-100"
      >
        <div
          className="h-full rounded-full bg-[#B45A2A] transition-all"
          style={{ width: progress + "%" }}
        />
      </div>
    </div>
  );
}

const calculateProgressPercentage = (
  active: number | undefined,
  total: number | undefined,
) => {
  const activeValue = Number(active ?? 0);
  const totalValue = Number(total ?? 0);

  if (
    !Number.isFinite(activeValue) ||
    !Number.isFinite(totalValue) ||
    totalValue <= 0
  ) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(0, Math.round((activeValue / totalValue) * 100)),
  );
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("scm_token");

        if (!token) {
          throw new Error("Authentication token not found.");
        }

        const response = await apiFetch<ReportsResponse>("/admin/reports", {
          method: "GET",
          token,
        });

        setReports(response.data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load reports.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  /*
   * The backend may return the active enrollment count
   * in different forms depending on the current controller.
   *
   * We normalize it into one number here.
   */
  const activeEnrollments = useMemo(() => {
    if (!reports) {
      return 0;
    }

    const value =
      reports.enrollments?.active ??
      reports.enrollments?.activeEnrollments ??
      reports.activeEnrollments ??
      0;

    const numericValue = Number(value);

    return Number.isFinite(numericValue) ? numericValue : 0;
  }, [reports]);

  const attendancePercentage = useMemo(() => {
    if (!reports?.attendance || reports.attendance.total === 0) {
      return 0;
    }

    const percentage =
      (reports.attendance.present / reports.attendance.total) * 100;

    return Number.isFinite(percentage) ? Math.round(percentage) : 0;
  }, [reports]);

  const feeCollectionPercentage = useMemo(() => {
    if (!reports?.payments || reports.payments.total === 0) {
      return 0;
    }

    const percentage = (reports.payments.paid / reports.payments.total) * 100;

    return Number.isFinite(percentage) ? Math.round(percentage) : 0;
  }, [reports]);

  const enrollmentPercentage = useMemo(
    () =>
      calculateProgressPercentage(
        activeEnrollments,
        reports?.enrollments?.total,
      ),
    [activeEnrollments, reports?.enrollments?.total],
  );

  const overviewRows = [
    {
      label: "Students",
      total: reports?.students.total,
      active: reports?.students.active,
    },
    {
      label: "Teachers",
      total: reports?.teachers.total,
      active: reports?.teachers.active,
    },
    {
      label: "Courses",
      total: reports?.courses.total,
      active: reports?.courses.active,
    },
    {
      label: "Assignments",
      total: reports?.assignments.total,
      active: reports?.assignments.active,
    },
    {
      label: "Enrollments",
      total: reports?.enrollments?.total,
      active:
        reports?.enrollments?.active ??
        reports?.enrollments?.activeEnrollments ??
        reports?.activeEnrollments,
    },
  ];

  const handleExportReport = () => {
    if (!reports) return;

    const rows = [
      ["SCM Report"],
      ["Scope", "Current database totals"],
      ["Generated", new Date().toLocaleString()],
      [],
      ["Metric", "Value", "Status"],
      ["Total Students", reports.students.total, "Registered"],
      [
        "Active Teachers",
        reports.teachers.active ?? reports.teachers.total ?? 0,
        "Active",
      ],
      ["Total Courses", reports.courses.total, "Available"],
      ["Total Assignments", reports.assignments.total, "Created"],
      ["Active Enrollments", activeEnrollments, "Active"],
      ["Grade Records", reports.grades.total, "Recorded"],
      ["Attendance Rate", `${attendancePercentage}%`, "Overall"],
      ["Present Attendance", reports.attendance.present, "Present"],
      ["Absent Attendance", reports.attendance.absent, "Absent"],
      ["Late Attendance", reports.attendance.late, "Late"],
      ["Payment Records", reports.payments.total, "Total"],
      ["Paid Payments", reports.payments.paid, "Paid"],
      ["Pending Payments", reports.payments.pending, "Pending"],
      ["Fee Collection Rate", `${feeCollectionPercentage}%`, "Overall"],
    ];

    const csvContent = rows
      .map((row) =>
        row
          .map((value) => {
            const text = String(value ?? "");
            return `"${text.replace(/"/g, '""')}"`;
          })
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "SCM-Report-Current-Totals.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#EAE6DC] p-4 font-inter sm:p-6 lg:p-8">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="rounded-xl bg-white px-4 py-5 shadow-sm sm:px-8 sm:py-6">
            <p className="text-sm text-gray-600">Loading reports...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#EAE6DC] p-4 font-inter sm:p-6 lg:p-8">
        <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6 lg:p-8">
          <h1 className="font-serif text-2xl font-bold text-[#333333]">
            Reports
          </h1>

          <p className="mt-3 text-sm text-red-600">{error}</p>
        </div>
      </main>
    );
  }

  if (!reports) {
    return (
      <main className="min-h-screen bg-[#EAE6DC] p-4 font-inter sm:p-6 lg:p-8">
        <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6 lg:p-8">
          <p className="text-sm text-gray-600">No report data available.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#EAE6DC] p-4 font-inter sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-sm font-medium text-[#B45A2A]">
            Analytics & Reports
          </p>

          <h1 className="font-serif text-3xl font-bold text-[#333333]">
            Reports
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            View academic, attendance and performance overview.
          </p>
        </div>

        <div className="w-full sm:w-auto">
          <button
            type="button"
            onClick={handleExportReport}
            className="w-full rounded-lg bg-[#B45A2A] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#984A22] sm:w-auto"
          >
            Export Report
          </button>
        </div>
      </div>

      <div className="mb-8 grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
        <ReportStatCard
          title="Total Students"
          value={reports.students.total.toLocaleString()}
          description="Registered students"
          icon={<AdminMetricIcon type="students" />}
        />

        <ReportStatCard
          title="Active Teachers"
          value={(
            reports.teachers.active ??
            reports.teachers.total ??
            0
          ).toString()}
          description="Active teaching staff"
          icon={<AdminMetricIcon type="teachers" />}
        />

        <ReportStatCard
          title="Total Courses"
          value={reports.courses.total.toString()}
          description="Courses available"
          icon={<AdminMetricIcon type="courses" />}
        />

        <ReportStatCard
          title="Attendance"
          value={`${attendancePercentage}%`}
          description="Overall attendance rate"
          icon={<AdminMetricIcon type="attendance" />}
        />
      </div>

      <div className="mb-8 grid gap-6 xl:grid-cols-2">
        <ReportProgressCard
          title="Student Attendance"
          value={attendancePercentage}
          description={`${reports.attendance.present} present, ${reports.attendance.absent} absent, ${reports.attendance.late} late`}
        />

        <ReportProgressCard
          title="Fee Collection"
          value={feeCollectionPercentage}
          description={`${reports.payments.paid} of ${reports.payments.total} payment records marked as paid`}
        />

        <ReportProgressCard
          title="Active Enrollments"
          value={enrollmentPercentage}
          description={`${activeEnrollments} active enrollments`}
        />

        <ReportStatCard
          title="Grade Records"
          value={reports.grades.total.toLocaleString()}
          description={`${reports.assignments.total} assignments created`}
          icon={<AdminMetricIcon type="grades" />}
        />
      </div>

      <div className="rounded-xl bg-white shadow-sm">
        <div className="border-b border-gray-100 p-4 sm:p-6">
          <h2 className="font-serif text-xl font-bold text-[#333333]">
            System Overview
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Current database totals. Active share shows the percentage of
            records with Active status.
          </p>
        </div>

        <div className="space-y-3 p-4 sm:p-6 xl:hidden">
          {overviewRows.map((row) => (
            <div
              key={row.label}
              className="rounded-lg border border-gray-100 p-4"
            >
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <span className="min-w-0 break-words font-semibold text-[#333333]">
                  {row.label}
                </span>
                <span className="break-words text-right text-sm text-gray-600">
                  {row.total ?? "?"} total
                </span>
              </div>
              <p className="mb-2 text-xs font-medium text-gray-500">
                Active share
              </p>
              <SystemOverviewProgressBar {...row} />
            </div>
          ))}
        </div>

        <div className="hidden overflow-x-auto xl:block">
          <table className="w-full min-w-[520px] text-left">
            <thead className="border-b border-gray-200 bg-[#F8F6F1]">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-4 text-sm font-semibold text-gray-700"
                >
                  Metric
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-sm font-semibold text-gray-700"
                >
                  Total
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-sm font-semibold text-gray-700"
                >
                  Active share
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {overviewRows.map((row) => (
                <tr key={row.label} className="transition hover:bg-[#FAF8F3]">
                  <th
                    scope="row"
                    className="px-6 py-5 font-semibold text-[#333333]"
                  >
                    {row.label}
                  </th>
                  <td className="px-6 py-5 text-sm text-gray-600">
                    {row.total ?? "?"}
                  </td>
                  <td className="px-6 py-5">
                    <SystemOverviewProgressBar {...row} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
          <h2 className="font-serif text-xl font-bold text-[#333333]">
            Academic Summary
          </h2>

          <div className="mt-5 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-gray-100 pb-3">
              <span className="min-w-0 break-words text-sm text-gray-600">
                Grade Records
              </span>

              <span className="break-all text-right font-semibold text-[#333333]">
                {reports.grades.total}
              </span>
            </div>

            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-gray-100 pb-3">
              <span className="min-w-0 break-words text-sm text-gray-600">
                Assignments
              </span>

              <span className="break-all text-right font-semibold text-[#333333]">
                {reports.assignments.total}
              </span>
            </div>

            <div className="flex flex-wrap items-start justify-between gap-2">
              <span className="min-w-0 break-words text-sm text-gray-600">
                Active Enrollments
              </span>

              <span className="break-all text-right font-semibold text-[#333333]">
                {activeEnrollments}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
          <h2 className="font-serif text-xl font-bold text-[#333333]">
            Financial Summary
          </h2>

          <div className="mt-5 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-gray-100 pb-3">
              <span className="min-w-0 break-words text-sm text-gray-600">
                Total Payment Records
              </span>

              <span className="break-all text-right font-semibold text-[#333333]">
                {reports.payments.total}
              </span>
            </div>

            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-gray-100 pb-3">
              <span className="min-w-0 break-words text-sm text-gray-600">
                Paid Records
              </span>

              <span className="break-all text-right font-semibold text-green-600">
                {reports.payments.paid}
              </span>
            </div>

            <div className="flex flex-wrap items-start justify-between gap-2">
              <span className="min-w-0 break-words text-sm text-gray-600">
                Pending Records
              </span>

              <span className="break-all text-right font-semibold text-red-600">
                {reports.payments.pending}
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
