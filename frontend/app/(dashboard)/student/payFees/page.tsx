"use client";

import { useEffect, useMemo, useState } from "react";
import { useRealtimeRefresh } from "@/lib/hooks/useRealtimeSync";
import { apiFetch } from "@/lib/api";

type BackendFee = {
  id: number;
  feeType: string;
  amount: number | string;
  outstandingAmount: number;
  payableAmount: number;
  pendingAmount: number;
  dueDate: string;
  status: string;
  paidAmount: number;
  course?: { id: number; code: string; name: string; credits: number } | null;
  semester?: { id: number; name: string; costPerCredit: number } | null;
};

type FeeItem = {
  id: number;
  name: string;
  description: string;
  amount: number;
  dueDate: string;
};

type BackendPayment = {
  id: number;
  feeType: string;
  amount: number | string;
  method: string;
  status: string;
  transactionId?: string | null;
  paymentDate?: string;
  createdAt?: string;
};

type Payment = {
  id: number;
  date: string;
  description: string;
  amount: number;
  status: "Paid" | "Pending" | "Failed" | "Cancelled";
  method: string;
};

const getPaymentMethodLabel = (method: string) => {
  switch (method) {
    case "MOBILE_BANKING":
      return "Mobile Banking";
    case "CARD":
      return "Card";
    case "BANK_TRANSFER":
      return "Bank Transfer";
    case "CASH":
      return "Cash";
    default:
      return method;
  }
};

const getPaymentStatus = (
  status: string,
): "Paid" | "Pending" | "Failed" | "Cancelled" => {
  switch (status.toUpperCase()) {
    case "PAID":
      return "Paid";
    case "FAILED":
      return "Failed";
    case "CANCELLED":
      return "Cancelled";
    default:
      return "Pending";
  }
};

export default function PayFeesPage() {
  const [references, setReferences] = useState<Record<number, string>>({});
  const [balance, setBalance] = useState({
    outstanding: 0,
    pending: 0,
    count: 0,
  });
  const [feeItems, setFeeItems] = useState<FeeItem[]>([]);
  const [accountFees, setAccountFees] = useState<BackendFee[]>([]);
  const [selectedFees, setSelectedFees] = useState<number[]>([]);

  const [paymentMethod, setPaymentMethod] = useState("bKash");

  const [payments, setPayments] = useState<Payment[]>([]);

  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const [nextDueDate, setNextDueDate] = useState<string | null>(null);

  const totalAmount = feeItems
    .filter((fee) => selectedFees.includes(fee.id))
    .reduce((total, fee) => total + fee.amount, 0);

  const selectedFeeItems = useMemo(
    () => feeItems.filter((fee) => selectedFees.includes(fee.id)),
    [feeItems, selectedFees],
  );

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-BD").format(amount);
  };

  const formatDate = (date: string) => {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };


  const loadFees = async () => {
    try {
      const token = localStorage.getItem("scm_token");

      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const response = await apiFetch<{
        success: boolean;
        data: BackendFee[];
        message?: string;
      }>("/fees/my", {
        token,
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to load outstanding fees.");
      }

      setBalance({
        outstanding: response.data.reduce(
          (sum, fee) => sum + fee.outstandingAmount,
          0,
        ),
        pending: response.data.reduce((sum, fee) => sum + fee.pendingAmount, 0),
        count: response.data.filter((fee) => fee.outstandingAmount > 0).length,
      });
      setAccountFees(response.data || []);
      const outstandingFees = (response.data || [])
        .filter((fee) => fee.payableAmount > 0)
        .map((fee) => ({
          id: fee.id,
          name: fee.feeType,
          description: `${fee.feeType} fee`,
          amount: Number(fee.payableAmount),
          dueDate: formatDate(fee.dueDate),
        }));

      setFeeItems(outstandingFees);

      setSelectedFees((current) =>
        current.filter((id) => outstandingFees.some((fee) => fee.id === id)),
      );

      const firstDueDate = (response.data || [])
        .filter((fee) => fee.outstandingAmount > 0)
        .map((fee) => new Date(fee.dueDate))
        .filter((date) => !Number.isNaN(date.getTime()))
        .sort((a, b) => a.getTime() - b.getTime())[0];

      setNextDueDate(
        firstDueDate
          ? firstDueDate.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
          : null,
      );
    } catch (err) {
      console.error("Failed to load fees:", err);

      setError(
        err instanceof Error ? err.message : "Failed to load outstanding fees.",
      );
    }
  };


  const loadPayments = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("scm_token");

      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const response = await apiFetch<{
        success: boolean;
        data: BackendPayment[];
        message?: string;
      }>("/payments/my-payments", {
        token,
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to load payment history.");
      }

      const formattedPayments: Payment[] = (response.data || []).map(
        (payment) => ({
          id: payment.id,

          date: formatDate(payment.paymentDate || payment.createdAt || ""),

          description:
            payment.feeType +
            (payment.transactionId ? " - Ref: " + payment.transactionId : ""),

          amount: Number(payment.amount),

          status: getPaymentStatus(payment.status),

          method: getPaymentMethodLabel(payment.method),
        }),
      );

      setPayments(formattedPayments);
    } catch (err) {
      console.error("Failed to load payments:", err);

      setError(
        err instanceof Error ? err.message : "Failed to load payment history.",
      );
    } finally {
      setLoading(false);
    }
  };

  useRealtimeRefresh(async () => {
    if (showPaymentModal || submitting) return;
    await loadFees();
    await loadPayments();
  });


  useEffect(() => {
    let cancelled = false;

    const loadInitialData = async () => {
      try {
        const token = localStorage.getItem("scm_token");

        if (!token) {
          throw new Error("Authentication token not found.");
        }

        const [feesResponse, paymentsResponse] = await Promise.all([
          apiFetch<{
            success: boolean;
            data: BackendFee[];
            message?: string;
          }>("/fees/my", {
            token,
          }),

          apiFetch<{
            success: boolean;
            data: BackendPayment[];
            message?: string;
          }>("/payments/my-payments", {
            token,
          }),
        ]);

        if (!feesResponse.success) {
          throw new Error(
            feesResponse.message || "Failed to load outstanding fees.",
          );
        }

        if (!paymentsResponse.success) {
          throw new Error(
            paymentsResponse.message || "Failed to load payment history.",
          );
        }

        if (cancelled) return;

        setAccountFees(feesResponse.data || []);

        setBalance({
          outstanding: feesResponse.data.reduce(
            (sum, fee) => sum + fee.outstandingAmount,
            0,
          ),
          pending: feesResponse.data.reduce(
            (sum, fee) => sum + fee.pendingAmount,
            0,
          ),
          count: feesResponse.data.filter((fee) => fee.outstandingAmount > 0)
            .length,
        });

        const outstandingFees = (feesResponse.data || [])
          .filter((fee) => fee.payableAmount > 0)
          .map((fee) => ({
            id: fee.id,
            name: fee.feeType,
            description: `${fee.feeType} fee`,
            amount: Number(fee.payableAmount),
            dueDate: formatDate(fee.dueDate),
          }));

        setFeeItems(outstandingFees);

        setSelectedFees(outstandingFees.map((fee) => fee.id));

        const firstDueDate = (feesResponse.data || [])
          .filter((fee) => fee.outstandingAmount > 0)
          .map((fee) => new Date(fee.dueDate))
          .filter((date) => !Number.isNaN(date.getTime()))
          .sort((a, b) => a.getTime() - b.getTime())[0];

        setNextDueDate(
          firstDueDate
            ? firstDueDate.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
            : null,
        );


        const formattedPayments: Payment[] = (paymentsResponse.data || []).map(
          (payment) => ({
            id: payment.id,

            date: formatDate(payment.paymentDate || payment.createdAt || ""),

            description:
              payment.feeType +
              (payment.transactionId ? " - Ref: " + payment.transactionId : ""),

            amount: Number(payment.amount),

            status: getPaymentStatus(payment.status),

            method: getPaymentMethodLabel(payment.method),
          }),
        );

        setPayments(formattedPayments);
      } catch (err) {
        if (cancelled) return;

        console.error("Failed to load payment data:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load fee information.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadInitialData();

    return () => {
      cancelled = true;
    };
  }, []);


  const toggleFee = (id: number) => {
    setSelectedFees((current) =>
      current.includes(id)
        ? current.filter((feeId) => feeId !== id)
        : [...current, id],
    );
  };


  const getBackendPaymentMethod = () => {
    if (paymentMethod === "bKash" || paymentMethod === "Nagad") {
      return "MOBILE_BANKING";
    }

    if (paymentMethod === "Card") {
      return "CARD";
    }

    return "MOBILE_BANKING";
  };


  const handlePayment = async () => {
    if (selectedFeeItems.length === 0) {
      setError("Please select at least one fee.");
      return;
    }

    if (selectedFeeItems.some((fee) => !references[fee.id]?.trim())) {
      setError("Enter a transaction reference for every selected fee.");
      return;
    }
    try {
      setSubmitting(true);
      setError("");

      const token = localStorage.getItem("scm_token");

      if (!token) {
        throw new Error("Authentication token not found.");
      }

      /*
       * Backend accepts one verified reference per fee payment
       * record with feeType + amount + method.
       *
       * Therefore, create one payment for
       * each selected fee.
       */

      for (const fee of selectedFeeItems) {
        const response = await apiFetch<{
          success: boolean;
          data?: BackendPayment;
          message?: string;
        }>("/payments", {
          method: "POST",
          token,

          body: JSON.stringify({
            transactionId: references[fee.id]?.trim(),
            channel: paymentMethod,
            feeId: fee.id,
            amount: fee.amount,
            method: getBackendPaymentMethod(),
          }),
        });

        if (!response.success) {
          throw new Error(response.message || `Failed to submit ${fee.name}.`);
        }
      }

      setShowPaymentModal(false);
      setPaymentSuccess(true);

      setSelectedFees([]);

      await loadPayments();
      await loadFees();

      setTimeout(() => {
        setPaymentSuccess(false);
      }, 5000);
    } catch (err) {
      console.error("Payment submission error:", err);

      setError(
        err instanceof Error ? err.message : "Failed to submit payment.",
      );
    } finally {
      setSubmitting(false);
    }
  };


  const lastPayment = payments.find((payment) => payment.status === "Paid");
  const totalCharges = accountFees.reduce(
    (sum, fee) => sum + Number(fee.amount),
    0,
  );
  const totalPaid = accountFees.reduce(
    (sum, fee) => sum + Number(fee.paidAmount || 0),
    0,
  );

  return (
    <div className="flex min-h-screen bg-[#EAE6DC]">
      <main className="min-w-0 flex-1 p-5 sm:p-8">

        <div className="mb-8">
          <p className="font-serif text-sm text-[#B45A2A]">Student Portal</p>

          <h1 className="mt-1 font-serif text-3xl font-bold text-[#333333]">
            Pay Fees
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Submit references for payments made externally and track
            administrator verification. Pending amounts are reserved until
            reviewed.
          </p>
        </div>


        {error && (
          <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}


        {paymentSuccess && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium text-green-700">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100">
              ✓
            </div>
            Payment submitted for administrator verification. Your balance
            changes only after approval.
          </div>
        )}


        <div className="grid gap-5 lg:grid-cols-3">

          <div className="rounded-2xl bg-[#B45A2A] p-6 text-white shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-white/80">
                Outstanding Balance
              </p>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#111827] text-white">
                ৳
              </div>
            </div>

            <h2 className="mt-5 text-3xl font-bold">
              ৳ {formatAmount(balance.outstanding)}
            </h2>

            <p className="mt-2 text-sm text-white/70">
              {balance.count} outstanding fee
              {balance.count !== 1 ? "s" : ""}
              <span className="mt-2 block">
                Awaiting verification: BDT {formatAmount(balance.pending)}.
                Pending payments remain outstanding until approved.
              </span>
            </p>
          </div>


          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#111827] text-white">
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="4" width="18" height="17" rx="2" />

                  <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
                </svg>
              </div>

              <div>
                <p className="text-xs text-slate-400">Next Due Date</p>

                <p className="mt-1 font-semibold text-slate-800">
                  {nextDueDate || "No outstanding fees"}
                </p>
              </div>
            </div>

            <p className="mt-6 text-sm text-slate-500">
              {nextDueDate
                ? "Please complete your payment before the due date."
                : "You have no outstanding fees."}
            </p>
          </div>


          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#111827] text-white">
                ✓
              </div>

              <div>
                <p className="text-xs text-slate-400">Last Payment</p>

                <p className="mt-1 font-semibold text-slate-800">
                  {lastPayment
                    ? `৳ ${formatAmount(lastPayment.amount)}`
                    : "No approved payments"}
                </p>
              </div>
            </div>

            <p className="mt-6 text-sm text-slate-500">
              {lastPayment
                ? `Last paid on ${lastPayment.date} via ${lastPayment.method}.`
                : "No approved payments yet."}
            </p>
          </div>
        </div>

        <section className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="flex flex-col gap-5 border-b border-slate-100 p-5 sm:p-6 xl:flex-row xl:items-end xl:justify-between xl:p-8">
            <div className="min-w-0">
              <p className="font-serif text-sm text-[#B45A2A]">
                Statement of Account
              </p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">
                Tuition ledger
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Enrollment charges are calculated from course credits and the
                semester rate.
              </p>
            </div>
            <div className="grid w-full grid-cols-1 gap-2 text-sm sm:grid-cols-3 xl:w-auto xl:min-w-[390px]">
              <div className="min-w-0 rounded-xl bg-[#F0EDE4] px-4 py-3">
                <p className="text-xs text-slate-500">Charges</p>
                <p className="font-semibold">৳{formatAmount(totalCharges)}</p>
              </div>
              <div className="min-w-0 rounded-xl bg-green-50 px-4 py-3">
                <p className="text-xs text-slate-500">Paid</p>
                <p className="mt-1 break-words font-semibold text-green-700">
                  ৳{formatAmount(totalPaid)}
                </p>
              </div>
              <div className="min-w-0 rounded-xl bg-orange-50 px-4 py-3">
                <p className="text-xs text-slate-500">Balance</p>
                <p className="mt-1 break-words font-semibold text-[#B45A2A]">
                  ৳{formatAmount(balance.outstanding)}
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-5 lg:hidden">
            {accountFees.length === 0 ? (
              <p className="px-3 py-10 text-center text-sm text-slate-500">
                Your enrollment charges will appear here.
              </p>
            ) : (
              <div className="space-y-3">
                {accountFees.map((fee) => (
                  <article
                    key={fee.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words font-semibold text-slate-900">
                          {fee.course?.code || fee.feeType}
                        </p>
                        <p className="mt-1 break-words text-xs leading-5 text-slate-500">
                          {fee.course?.name || fee.feeType}
                        </p>
                      </div>
                      <span className="max-w-[45%] shrink-0 break-words rounded-full bg-[#F0EDE4] px-2.5 py-1 text-right text-xs font-medium text-slate-700">
                        {fee.semester?.name || "General"}
                      </span>
                    </div>

                    <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                      <div className="min-w-0">
                        <dt className="text-xs text-slate-400">Credits</dt>
                        <dd className="mt-1 font-medium text-slate-800">
                          {fee.course?.credits ?? "—"}
                        </dd>
                      </div>
                      <div className="min-w-0 text-right">
                        <dt className="text-xs text-slate-400">Rate</dt>
                        <dd className="mt-1 break-words font-medium text-slate-800">
                          {fee.semester
                            ? `BDT ${formatAmount(fee.semester.costPerCredit)}`
                            : "—"}
                        </dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-xs text-slate-400">Charge</dt>
                        <dd className="mt-1 break-words font-medium text-slate-800">
                          BDT {formatAmount(Number(fee.amount))}
                        </dd>
                      </div>
                      <div className="min-w-0 text-right">
                        <dt className="text-xs text-slate-400">Paid</dt>
                        <dd className="mt-1 break-words font-medium text-green-700">
                          BDT {formatAmount(Number(fee.paidAmount || 0))}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Balance
                      </span>
                      <span className="break-words text-right font-bold text-[#B45A2A]">
                        BDT {formatAmount(Number(fee.outstandingAmount))}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-[#F0EDE4] text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4">Course</th>
                  <th className="px-4 py-4">Semester</th>
                  <th className="px-4 py-4 text-center">Credits</th>
                  <th className="px-4 py-4 text-right">Rate</th>
                  <th className="px-4 py-4 text-right">Charge</th>
                  <th className="px-4 py-4 text-right">Paid</th>
                  <th className="px-6 py-4 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accountFees.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-10 text-center text-slate-500"
                    >
                      Your enrollment charges will appear here.
                    </td>
                  </tr>
                ) : (
                  accountFees.map((fee) => (
                    <tr key={fee.id}>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">
                          {fee.course?.code || fee.feeType}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {fee.course?.name || fee.feeType}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {fee.semester?.name || "General"}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {fee.course?.credits ?? "—"}
                      </td>
                      <td className="px-4 py-4 text-right">
                        {fee.semester
                          ? `৳${formatAmount(fee.semester.costPerCredit)}`
                          : "—"}
                      </td>
                      <td className="px-4 py-4 text-right font-medium">
                        ৳{formatAmount(Number(fee.amount))}
                      </td>
                      <td className="px-4 py-4 text-right text-green-700">
                        ৳{formatAmount(Number(fee.paidAmount || 0))}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-[#B45A2A]">
                        ৳{formatAmount(Number(fee.outstandingAmount))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>


        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">

          <section className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900">
                Outstanding Fees
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Select the fees you want to pay.
              </p>
            </div>

            <div className="space-y-3">
              {feeItems.length === 0 ? (
                <div className="rounded-xl bg-[#F0EDE4] px-5 py-10 text-center">
                  <p className="font-semibold text-slate-700">
                    No outstanding fees.
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    You have no fees available for payment right now.
                  </p>
                </div>
              ) : (
                feeItems.map((fee) => {
                  const selected = selectedFees.includes(fee.id);

                  return (
                    <button
                      key={fee.id}
                      type="button"
                      onClick={() => toggleFee(fee.id)}
                      className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition ${selected
                          ? "border-slate-300 bg-[#B45A2A]/5"
                          : "border-slate-100 hover:bg-slate-50"
                        }`}
                    >
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${selected
                            ? "border-[#B45A2A] bg-[#B45A2A] text-white"
                            : "border-slate-300"
                          }`}
                      >
                        {selected && (
                          <svg
                            className="h-3.5 w-3.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m5 12 4 4L19 6"
                            />
                          </svg>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-slate-800">
                          {fee.name}
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          {fee.description}
                        </p>

                        <p className="mt-2 text-xs text-slate-400">
                          Due: {fee.dueDate}
                        </p>
                      </div>

                      <p className="shrink-0 font-semibold text-slate-800">
                        ৳ {formatAmount(fee.amount)}
                      </p>
                    </button>
                  );
                })
              )}
            </div>


            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-6">
              <span className="font-semibold text-slate-700">
                Total Selected
              </span>

              <span className="text-xl font-bold text-[#B45A2A]">
                ৳ {formatAmount(totalAmount)}
              </span>
            </div>
          </section>


          <section className="h-fit rounded-2xl bg-white p-6 shadow-sm sm:p-7">
            <h2 className="text-lg font-bold text-slate-900">Payment</h2>

            <p className="mt-1 text-sm text-slate-500">
              Choose the method used for your external payment.
            </p>


            <div className="mt-6 space-y-3">

              <button
                type="button"
                onClick={() => setPaymentMethod("bKash")}
                className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${paymentMethod === "bKash"
                    ? "border-slate-300 bg-[#B45A2A]/5"
                    : "border-slate-100 hover:bg-slate-50"
                  }`}
              >
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-[#E2136E]">
                  <img
                    src="https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/22/e1/e9/22e1e9dc-0b32-5faa-42a0-6a2b3814f72a/APPICON_PRODUCTION-0-0-1x_U007emarketing-0-11-0-85-220.png/1024x1024bb.png"
                    alt="bKash"
                    className="h-full w-full object-contain"
                  />
                </div>

                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">bKash</p>

                  <p className="text-xs text-slate-400">Mobile payment</p>
                </div>

                <div
                  className={`h-4 w-4 rounded-full border ${paymentMethod === "bKash"
                      ? "border-slate-100 bg-[#B45A2A]"
                      : "border-slate-300"
                    }`}
                />
              </button>


              <button
                type="button"
                onClick={() => setPaymentMethod("Nagad")}
                className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${paymentMethod === "Nagad"
                    ? "border-slate-300 bg-[#B45A2A]/5"
                    : "border-slate-100 hover:bg-slate-50"
                  }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white p-1">
                  <img
                    src="https://download.logo.wine/logo/Nagad/Nagad-Logo.wine.png"
                    alt="Nagad"
                    className="h-full w-full object-contain"
                  />
                </div>

                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">Nagad</p>

                  <p className="text-xs text-slate-400">Mobile payment</p>
                </div>

                <div
                  className={`h-4 w-4 rounded-full border ${paymentMethod === "Nagad"
                      ? "border-slate-100 bg-[#B45A2A]"
                      : "border-slate-300"
                    }`}
                />
              </button>


              <button
                type="button"
                onClick={() => setPaymentMethod("Card")}
                className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${paymentMethod === "Card"
                    ? "border-slate-300 bg-[#B45A2A]/5"
                    : "border-slate-100 hover:bg-slate-50"
                  }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white p-1">
                  <img
                    src="https://toppng.com/public/uploads/preview/visa-logo-wihout-background-11661940036ogtgwnwtws.png"
                    alt="Visa and Mastercard"
                    className="h-full w-full object-contain"
                  />
                </div>

                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">Card</p>

                  <p className="text-xs text-slate-400">Debit / Credit card</p>
                </div>

                <div
                  className={`h-4 w-4 rounded-full border ${paymentMethod === "Card"
                      ? "border-slate-100 bg-[#B45A2A]"
                      : "border-slate-300"
                    }`}
                />
              </button>
            </div>


            <div className="mt-6 rounded-xl bg-[#F0EDE4] p-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Selected fees</span>

                <span className="font-medium text-slate-700">
                  {selectedFees.length}
                </span>
              </div>

              <div className="mt-3 flex justify-between">
                <span className="font-semibold text-slate-800">
                  Amount to pay
                </span>

                <span className="font-bold text-[#B45A2A]">
                  ৳ {formatAmount(totalAmount)}
                </span>
              </div>
            </div>


            <button
              type="button"
              disabled={selectedFees.length === 0 || submitting}
              onClick={() => setShowPaymentModal(true)}
              className="mt-5 w-full rounded-xl bg-[#111827] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {submitting ? "Processing..." : "Submit Payment Reference"}
            </button>

            <p className="mt-3 text-center text-xs text-slate-400">
              Your reference will be sent to an administrator for verification.
            </p>
          </section>
        </div>


        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Payment History
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                View your previous fee payments.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void Promise.all([loadFees(), loadPayments()])}
              disabled={loading}
              className="text-sm font-semibold text-[#B45A2A] hover:underline disabled:opacity-50"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {loading ? (
            <div className="py-10 text-center text-sm text-slate-400">
              Loading payment history...
            </div>
          ) : payments.length === 0 ? (
            <div className="rounded-xl bg-[#F0EDE4] px-5 py-10 text-center">
              <p className="font-semibold text-slate-700">
                No payment history found.
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Your payments will appear here after submission.
              </p>
            </div>
          ) : (
            <>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wider text-slate-400">
                      <th className="pb-4 font-semibold">Date</th>

                      <th className="pb-4 font-semibold">Description</th>

                      <th className="pb-4 font-semibold">Method</th>

                      <th className="pb-4 text-right font-semibold">Amount</th>

                      <th className="pb-4 text-right font-semibold">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {payments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="border-b border-slate-50 last:border-0"
                      >
                        <td className="py-5 text-sm text-slate-600">
                          {payment.date}
                        </td>

                        <td className="py-5 text-sm font-medium text-slate-800">
                          {payment.description}
                        </td>

                        <td className="py-5 text-sm text-slate-500">
                          {payment.method}
                        </td>

                        <td className="py-5 text-right text-sm font-semibold text-slate-800">
                          ৳ {formatAmount(payment.amount)}
                        </td>

                        <td className="py-5 text-right">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${payment.status === "Paid"
                                ? "bg-green-50 text-green-600"
                                : payment.status === "Failed"
                                  ? "bg-red-50 text-red-600"
                                  : "bg-yellow-50 text-yellow-600"
                              }`}
                          >
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>


              <div className="space-y-3 md:hidden">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="rounded-xl border border-slate-100 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-slate-800">
                          {payment.description}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {payment.date} • {payment.method}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${payment.status === "Paid"
                            ? "bg-green-50 text-green-600"
                            : payment.status === "Failed"
                              ? "bg-red-50 text-red-600"
                              : "bg-yellow-50 text-yellow-600"
                          }`}
                      >
                        {payment.status}
                      </span>
                    </div>

                    <p className="mt-4 text-sm font-bold text-slate-800">
                      ৳ {formatAmount(payment.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>


        {showPaymentModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
            <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F0EDE4] text-xl text-[#B45A2A]">
                ৳
              </div>

              <h2 className="mt-5 text-center text-xl font-bold text-slate-900">
                Submit Payment Reference
              </h2>

              <p className="mt-2 text-center text-sm text-slate-500">
                Record a payment already made outside this portal. An
                administrator will verify it. No money is transferred here.
              </p>

              <div className="mt-6 rounded-xl bg-slate-50 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Payment method</span>

                  <span className="font-semibold text-slate-700">
                    {paymentMethod}
                  </span>
                </div>

                <div className="mt-4 flex justify-between">
                  <span className="font-semibold text-slate-700">
                    Selected fees
                  </span>

                  <span className="font-semibold text-slate-700">
                    {selectedFees.length}
                  </span>
                </div>

                <div className="mt-4 flex justify-between">
                  <span className="font-semibold text-slate-700">Total</span>

                  <span className="font-bold text-[#B45A2A]">
                    ৳ {formatAmount(totalAmount)}
                  </span>
                </div>
              </div>

              {selectedFeeItems.map((fee) => (
                <label
                  key={fee.id}
                  className="mt-5 block text-sm font-semibold text-slate-700"
                >
                  {fee.name}: transaction reference
                  <input
                    required
                    maxLength={100}
                    value={references[fee.id] || ""}
                    onChange={(e) =>
                      setReferences((prev) => ({
                        ...prev,
                        [fee.id]: e.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#B45A2A] focus:ring-4 focus:ring-[#B45A2A]/10 disabled:cursor-not-allowed disabled:bg-slate-50 font-normal"
                  />
                </label>
              ))}
              {error && (
                <p role="alert" className="mt-3 text-red-700">
                  {error}
                </p>
              )}
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={handlePayment}
                  className="flex-1 rounded-xl bg-[#B45A2A] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#99491F] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
