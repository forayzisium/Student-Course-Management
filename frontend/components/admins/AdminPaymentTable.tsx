"use client";

export type AdminPayment = {
  id: number;
  studentName: string;
  studentId: string;
  department: string;
  feeType: string;
  transactionId?: string | null;
  channel?: string | null;
  amount: number;
  paymentDate: string;
  method: "Cash" | "Card" | "Bank" | "Mobile Banking";
  status: "Paid" | "Pending" | "Failed" | "Cancelled";
};

type AdminPaymentTableProps = {
  payments: AdminPayment[];
  onStatusChange: (id: number, status: AdminPayment["status"]) => void;
};

export default function AdminPaymentTable({
  payments,
  onStatusChange,
}: AdminPaymentTableProps) {
  if (payments.length === 0) {
    return (
      <div className="rounded-xl bg-white p-10 text-center shadow-sm">
        <p className="text-gray-500">No payment records found.</p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl bg-white shadow-sm xl:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
            <thead className="border-b border-gray-200 bg-[#F8F6F1]">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-700 lg:px-6 lg:py-4 lg:text-sm lg:normal-case">
                  Student
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-700 lg:px-6 lg:py-4 lg:text-sm lg:normal-case">
                  Fee Type
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-700 lg:px-6 lg:py-4 lg:text-sm lg:normal-case">
                  Amount
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-700 lg:px-6 lg:py-4 lg:text-sm lg:normal-case">
                  Date
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-700 lg:px-6 lg:py-4 lg:text-sm lg:normal-case">
                  Method
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-700 lg:px-6 lg:py-4 lg:text-sm lg:normal-case">
                  Status
                </th>

                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-700 lg:px-6 lg:py-4 lg:text-sm lg:normal-case">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {payments.map((payment) => (
                <tr key={payment.id} className="transition hover:bg-[#FAF8F3]">
                  <td className="px-4 py-4 lg:px-6 lg:py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F0EDE4] text-xs font-semibold text-[#B45A2A] lg:h-10 lg:w-10 lg:text-sm">
                        {payment.studentName
                          .split(" ")
                          .map((word) => word[0])
                          .slice(0, 2)
                          .join("")}
                      </div>

                      <div className="min-w-0">
                        <p className="break-words font-semibold text-[#333333]">
                          {payment.studentName}
                        </p>

                        <p className="mt-1 break-words text-xs text-gray-500">
                          {payment.studentId}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4 lg:px-6 lg:py-5">
                    <p className="break-words text-sm font-medium text-gray-700">
                      {payment.feeType}
                      <span className="mt-1 block text-xs text-gray-500">
                        {payment.channel || payment.method} - Reference:{" "}
                        {payment.transactionId || "Not supplied"}
                      </span>
                    </p>

                    <p className="mt-1 break-words text-xs text-gray-500">
                      {payment.department}
                    </p>
                  </td>

                  <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-gray-800 lg:px-6 lg:py-5">
                    ৳{payment.amount.toLocaleString()}
                  </td>

                  <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600 lg:px-6 lg:py-5">
                    {payment.paymentDate}
                  </td>

                  <td className="px-4 py-4 text-sm text-gray-600 lg:px-6 lg:py-5">
                    {payment.method}
                  </td>

                  <td className="px-4 py-4 lg:px-6 lg:py-5">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                        payment.status === "Paid"
                          ? "bg-green-100 text-green-700"
                          : payment.status === "Pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : payment.status === "Failed"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {payment.status}
                    </span>
                  </td>

                  <td className="px-4 py-4 lg:px-6 lg:py-5">
                    <select
                      value={payment.status}
                      onChange={(e) =>
                        onStatusChange(
                          payment.id,
                          e.target.value as AdminPayment["status"],
                        )
                      }
                      className="w-full min-w-[110px] rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-[#B45A2A] lg:px-3 lg:py-2"
                    >
                      <option value="Paid">Paid</option>
                      <option value="Pending">Pending</option>
                      <option value="Failed">Failed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3 xl:hidden">
        {payments.map((payment) => (
          <div key={payment.id} className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F0EDE4] text-sm font-semibold text-[#B45A2A]">
                  {payment.studentName
                    .split(" ")
                    .map((word) => word[0])
                    .slice(0, 2)
                    .join("")}
                </div>

                <div className="min-w-0">
                  <p className="break-words font-semibold text-[#333333]">
                    {payment.studentName}
                  </p>

                  <p className="mt-0.5 break-words text-xs text-gray-500">
                    {payment.studentId}
                  </p>
                </div>
              </div>

              <span
                className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                  payment.status === "Paid"
                    ? "bg-green-100 text-green-700"
                    : payment.status === "Pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : payment.status === "Failed"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-700"
                }`}
              >
                {payment.status}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-gray-400">
                  Fee Type
                </p>
                <p className="mt-0.5 break-words font-medium text-gray-700">
                  {payment.feeType}
                  <span className="mt-1 block text-xs text-gray-500">
                    {payment.channel || payment.method} - Reference:{" "}
                    {payment.transactionId || "Not supplied"}
                  </span>
                </p>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-wide text-gray-400">
                  Amount
                </p>
                <p className="mt-0.5 font-semibold text-gray-800">
                  ৳{payment.amount.toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-wide text-gray-400">
                  Date
                </p>
                <p className="mt-0.5 text-gray-600">{payment.paymentDate}</p>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-wide text-gray-400">
                  Method
                </p>
                <p className="mt-0.5 text-gray-600">{payment.method}</p>
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-[11px] uppercase tracking-wide text-gray-400">
                Update Status
              </label>
              <select
                value={payment.status}
                onChange={(e) =>
                  onStatusChange(
                    payment.id,
                    e.target.value as AdminPayment["status"],
                  )
                }
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#B45A2A]"
              >
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
