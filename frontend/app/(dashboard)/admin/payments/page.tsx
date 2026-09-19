"use client";

import { useEffect, useMemo, useState } from "react";

import AdminPaymentTable, {
  AdminPayment,
} from "@/components/admins/AdminPaymentTable";
import { apiFetch } from "@/lib/api";
import TeacherMetricCard from "@/components/teachers/TeacherMetricCard";

type BackendPayment = {
  id: number;
  feeType: string;
  transactionId?: string | null;
  channel?: string | null;
  amount: number | string;
  paymentDate: string;
  method: "CASH" | "CARD" | "BANK_TRANSFER" | "MOBILE_BANKING";
  status: "PENDING" | "PAID" | "FAILED" | "CANCELLED";
  student: {
    id: number;
    studentId: string;
    user: {
      id: number;
      name: string;
      email: string;
    };
  };
};

type PaymentsResponse = {
  success: boolean;
  data: BackendPayment[];
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [feeType, setFeeType] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const [recordingPayment, setRecordingPayment] = useState(false);

  const [students, setStudents] = useState<
    {
      id: number;
      studentId: string;
      user: {
        name: string;
        email: string;
      };
    }[]
  >([]);

  const [loadingStudents, setLoadingStudents] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    studentId: "",
    feeType: "",
    amount: "",
    method: "MOBILE_BANKING",
    status: "PAID",
  });

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("scm_token");

        if (!token) {
          throw new Error("Authentication token not found.");
        }

        const response = await apiFetch<PaymentsResponse>("/payments", {
          token,
        });

        const formattedPayments: AdminPayment[] = response.data.map(
          (payment) => ({
            id: payment.id,

            studentName: payment.student?.user?.name || "Unknown Student",

            studentId: payment.student?.studentId || "N/A",

            department: "Not available",

            feeType: payment.feeType,
            transactionId: payment.transactionId,
            channel: payment.channel,

            amount: Number(payment.amount),

            paymentDate: new Date(payment.paymentDate).toLocaleDateString(
              "en-US",
              {
                month: "short",
                day: "numeric",
                year: "numeric",
              },
            ),

            method: formatPaymentMethod(payment.method),

            status: formatPaymentStatus(payment.status),
          }),
        );

        setPayments(formattedPayments);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load payments.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);
  const handleOpenRecordPayment = async () => {
    setError("");
    setShowRecordPayment(true);

    try {
      setLoadingStudents(true);

      const token = localStorage.getItem("scm_token");

      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const response = await apiFetch<{
        success: boolean;
        data: {
          id: number;
          studentId: string;
          user: {
            name: string;
            email: string;
          };
        }[];
      }>("/students", {
        token,
      });

      setStudents(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load students.");
    } finally {
      setLoadingStudents(false);
    }
  };
  const feeTypes = useMemo(() => {
    return [
      "All",
      ...Array.from(new Set(payments.map((payment) => payment.feeType))),
    ];
  }, [payments]);

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const searchValue = search.toLowerCase().trim();

      const matchesSearch =
        payment.studentName.toLowerCase().includes(searchValue) ||
        payment.studentId.toLowerCase().includes(searchValue) ||
        payment.department.toLowerCase().includes(searchValue) ||
        payment.feeType.toLowerCase().includes(searchValue);

      const matchesStatus = status === "All" || payment.status === status;

      const matchesFeeType = feeType === "All" || payment.feeType === feeType;

      return matchesSearch && matchesStatus && matchesFeeType;
    });
  }, [payments, search, status, feeType]);

  const handleStatusChange = async (
    id: number,
    newStatus: AdminPayment["status"],
  ) => {
    const payment = payments.find((currentPayment) => currentPayment.id === id);

    if (!payment) return;

    try {
      setError("");

      const token = localStorage.getItem("scm_token");

      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const backendStatus = convertToBackendStatus(newStatus);

      await apiFetch(`/payments/${id}/status`, {
        method: "PATCH",
        token,
        body: JSON.stringify({
          status: backendStatus,
        }),
      });

      setPayments((currentPayments) =>
        currentPayments.map((currentPayment) =>
          currentPayment.id === id
            ? {
                ...currentPayment,
                status: newStatus,
              }
            : currentPayment,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update payment status.",
      );
    }
  };

  const totalCollected = payments
    .filter((payment) => payment.status === "Paid")
    .reduce((total, payment) => total + payment.amount, 0);

  const pendingAmount = payments
    .filter((payment) => payment.status === "Pending")
    .reduce((total, payment) => total + payment.amount, 0);

  const failedAmount = payments
    .filter((payment) => payment.status === "Failed")
    .reduce((total, payment) => total + payment.amount, 0);

  const paidCount = payments.filter(
    (payment) => payment.status === "Paid",
  ).length;

  return (
    <main className="min-h-screen bg-[#EAE6DC] p-4 font-inter sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="min-w-0">
          <p className="mb-1 text-sm font-medium text-[#B45A2A]">
            Payment Management
          </p>

          <h1 className="font-serif text-3xl font-bold text-[#333333]">
            Payments
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            Monitor student fees and payment records.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenRecordPayment}
          className="w-full rounded-lg bg-[#B45A2A] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#984A22] sm:w-auto"
        >
          + Record Payment
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="mb-8 grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
        <div className="hidden">
          <p className="text-sm text-gray-500">Total Collected</p>

          <h2 className="mt-2 text-2xl font-bold text-[#333333]">
            {loading ? "..." : `৳${totalCollected.toLocaleString()}`}
          </h2>

          <p className="mt-1 text-xs text-green-600">
            {loading ? "Loading..." : `${paidCount} paid transactions`}
          </p>
        </div>

        <div className="hidden">
          <p className="text-sm text-gray-500">Pending Amount</p>

          <h2 className="mt-2 text-2xl font-bold text-[#333333]">
            {loading ? "..." : `৳${pendingAmount.toLocaleString()}`}
          </h2>

          <p className="mt-1 text-xs text-yellow-600">Awaiting payment</p>
        </div>

        <div className="hidden">
          <p className="text-sm text-gray-500">Failed Amount</p>

          <h2 className="mt-2 text-2xl font-bold text-[#333333]">
            {loading ? "..." : `৳${failedAmount.toLocaleString()}`}
          </h2>

          <p className="mt-1 text-xs text-red-600">Failed transactions</p>
        </div>

        <div className="hidden">
          <p className="text-sm text-gray-500">Total Records</p>

          <h2 className="mt-2 text-2xl font-bold text-[#333333]">
            {loading ? "..." : payments.length}
          </h2>

          <p className="mt-1 text-xs text-gray-500">All payment records</p>
        </div>
        <TeacherMetricCard
          label="Total Collected"
          value={loading ? "..." : `৳${totalCollected.toLocaleString()}`}
          icon="passed"
          description={
            loading ? "Loading..." : `${paidCount} paid transactions`
          }
        />
        <TeacherMetricCard
          label="Pending Amount"
          value={loading ? "..." : `৳${pendingAmount.toLocaleString()}`}
          icon="pending"
          description="Awaiting payment"
        />
        <TeacherMetricCard
          label="Failed Amount"
          value={loading ? "..." : `৳${failedAmount.toLocaleString()}`}
          icon="absent"
          description="Failed transactions"
        />
        <TeacherMetricCard
          label="Total Records"
          value={loading ? "..." : payments.length}
          icon="assignments"
          description="All payment records"
        />
      </div>

      <div className="mb-6 rounded-xl bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student, ID or fee type..."
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-[#B45A2A] lg:flex-1"
          />

          <select
            value={feeType}
            onChange={(e) => setFeeType(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#B45A2A] lg:w-auto"
          >
            {feeTypes.map((item) => (
              <option key={item} value={item}>
                {item === "All" ? "All Fee Types" : item}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#B45A2A] lg:w-auto"
          >
            <option value="All">All Status</option>

            <option value="Paid">Paid</option>

            <option value="Pending">Pending</option>

            <option value="Failed">Failed</option>

            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Showing{" "}
          <span className="font-semibold text-[#333333]">
            {loading ? "..." : filteredPayments.length}
          </span>{" "}
          of {loading ? "..." : payments.length} payment records
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl bg-white p-10 text-center text-sm text-gray-400 shadow-sm">
          Loading payments...
        </div>
      ) : (
        <AdminPaymentTable
          payments={filteredPayments}
          onStatusChange={handleStatusChange}
        />
      )}
      {showRecordPayment && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-4 shadow-xl sm:p-6">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="font-serif text-2xl font-bold text-[#333333]">
                  Record Payment
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Record a student payment.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowRecordPayment(false)}
                className="shrink-0 text-2xl text-gray-400 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={async (event) => {
                event.preventDefault();

                try {
                  setRecordingPayment(true);
                  setError("");

                  const token = localStorage.getItem("scm_token");

                  if (!token) {
                    throw new Error("Authentication token not found.");
                  }

                  await apiFetch("/payments/admin", {
                    method: "POST",
                    token,
                    body: JSON.stringify({
                      studentId: Number(paymentForm.studentId),
                      feeType: paymentForm.feeType.trim(),
                      amount: Number(paymentForm.amount),
                      method: paymentForm.method,
                      status: paymentForm.status,
                    }),
                  });

                  setPaymentForm({
                    studentId: "",
                    feeType: "",
                    amount: "",
                    method: "MOBILE_BANKING",
                    status: "PAID",
                  });

                  setShowRecordPayment(false);

                  window.location.reload();
                } catch (err) {
                  setError(
                    err instanceof Error
                      ? err.message
                      : "Failed to record payment.",
                  );
                } finally {
                  setRecordingPayment(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Student
                </label>

                <select
                  required
                  value={paymentForm.studentId}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      studentId: e.target.value,
                    })
                  }
                  disabled={loadingStudents}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#B45A2A]"
                >
                  <option value="">
                    {loadingStudents
                      ? "Loading students..."
                      : "Select a student"}
                  </option>

                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student?.studentId || "N/A"} —{" "}
                      {student?.user?.name || "Unknown Student"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Fee Type
                </label>

                <input
                  required
                  type="text"
                  value={paymentForm.feeType}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      feeType: e.target.value,
                    })
                  }
                  placeholder="Tuition Fee"
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#B45A2A]"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Amount
                </label>

                <input
                  required
                  min="1"
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      amount: e.target.value,
                    })
                  }
                  placeholder="5000"
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#B45A2A]"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Payment Method
                </label>

                <select
                  value={paymentForm.method}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      method: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#B45A2A]"
                >
                  <option value="MOBILE_BANKING">Mobile Banking</option>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Status
                </label>

                <select
                  value={paymentForm.status}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      status: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#B45A2A]"
                >
                  <option value="PAID">Paid</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowRecordPayment(false)}
                  className="w-full rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 sm:w-auto"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={recordingPayment}
                  className="w-full rounded-lg bg-[#B45A2A] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#984A22] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {recordingPayment ? "Recording..." : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

function formatPaymentMethod(
  method: BackendPayment["method"],
): AdminPayment["method"] {
  switch (method) {
    case "BANK_TRANSFER":
      return "Bank";

    case "MOBILE_BANKING":
      return "Mobile Banking";

    case "CARD":
      return "Card";

    case "CASH":
      return "Cash";

    default:
      return method;
  }
}

function formatPaymentStatus(
  status: BackendPayment["status"],
): AdminPayment["status"] {
  switch (status) {
    case "PAID":
      return "Paid";

    case "PENDING":
      return "Pending";

    case "FAILED":
      return "Failed";

    case "CANCELLED":
      return "Cancelled";

    default:
      return "Pending";
  }
}

function convertToBackendStatus(
  status: AdminPayment["status"],
): BackendPayment["status"] {
  switch (status) {
    case "Paid":
      return "PAID";

    case "Pending":
      return "PENDING";

    case "Failed":
      return "FAILED";

    case "Cancelled":
      return "CANCELLED";

    default:
      return "PENDING";
  }
}
