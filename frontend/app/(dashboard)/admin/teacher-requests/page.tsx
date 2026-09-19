"use client";

import TeacherRequestCard from "@/components/admins/TeacherRequestCard";
import TeacherMetricCard from "@/components/teachers/TeacherMetricCard";
import { apiFetch } from "@/lib/api";
import { useCallback, useEffect, useMemo, useState } from "react";

type RequestStatus = "Pending" | "Approved" | "Rejected";

type BackendTeacherRequest = {
  id: number;
  name: string;
  username: string;
  email: string;
  status: "ACTIVE" | "PENDING" | "REJECTED" | "INACTIVE";
  createdAt: string;
  teacherProfile: {
    department: string;
    qualification: string;
    experience: string;
  } | null;
};

type TeacherRequest = {
  id: number;
  name: string;
  email: string;
  department: string;
  qualification: string;
  experience: string;
  submittedDate: string;
  status: RequestStatus;
};

export default function TeacherRequestsPage() {
  const [requests, setRequests] = useState<TeacherRequest[]>([]);
  const [search, setSearch] = useState("");

  const [filter, setFilter] = useState<"All" | RequestStatus>("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);

  const convertStatus = useCallback(
    (status: BackendTeacherRequest["status"]): RequestStatus => {
      switch (status) {
        case "ACTIVE":
          return "Approved";

        case "REJECTED":
          return "Rejected";

        case "PENDING":
          return "Pending";

        default:
          return "Rejected";
      }
    },
    [],
  );

  const convertTeacherRequest = useCallback(
    (teacher: BackendTeacherRequest): TeacherRequest => {
      return {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        department:
          teacher.teacherProfile?.department ?? "Department not specified",

        qualification:
          teacher.teacherProfile?.qualification ??
          "Qualification not specified",

        experience:
          teacher.teacherProfile?.experience ?? "Experience not specified",

        submittedDate: new Date(teacher.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),

        status: convertStatus(teacher.status),
      };
    },
    [convertStatus],
  );

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("scm_token");

      if (!token) {
        setError("Authentication required.");
        return;
      }

      const response = await apiFetch<{
        success: boolean;
        teachers: BackendTeacherRequest[];
      }>("/admin/teacher-requests", {
        token,
      });

      setRequests(
        response.teachers
          .filter(
            (teacher) =>
              teacher.status === "PENDING" ||
              teacher.status === "ACTIVE" ||
              teacher.status === "REJECTED",
          )
          .map(convertTeacherRequest),
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load teacher requests.",
      );
    } finally {
      setLoading(false);
    }
  }, [convertTeacherRequest]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadRequests();
    }, 0);

    return () => clearTimeout(timeout);
  }, [loadRequests]);

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const term = search.toLowerCase().trim();

      const matchesSearch =
        request.name.toLowerCase().includes(term) ||
        request.email.toLowerCase().includes(term) ||
        request.department.toLowerCase().includes(term);

      const matchesFilter = filter === "All" || request.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [requests, search, filter]);

  const pendingCount = requests.filter(
    (request) => request.status === "Pending",
  ).length;

  const approvedCount = requests.filter(
    (request) => request.status === "Approved",
  ).length;

  const rejectedCount = requests.filter(
    (request) => request.status === "Rejected",
  ).length;

  const handleRequest = async (id: number, action: "approve" | "reject") => {
    try {
      setError("");
      setProcessingId(id);

      const token = localStorage.getItem("scm_token");

      if (!token) {
        setError("Authentication required.");
        return;
      }

      await apiFetch(`/admin/teacher-requests/${id}/${action}`, {
        method: "PATCH",
        token,
      });

      /*
       * Refresh the list from the database
       * so the displayed status always matches
       * the backend.
       */
      await loadRequests();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : `Failed to ${action} teacher request.`,
      );
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#EAE6DC] px-4 py-6 sm:p-8">
      <div className="mb-8">
        <p className="font-serif text-sm text-[#B45A2A]">SCM Administration</p>

        <h1 className="mt-1 font-serif text-3xl font-bold text-[#333333]">
          Teacher Requests
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Review teacher applications and decide who can join the teaching team.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <TeacherMetricCard
          label="Pending"
          value={loading ? "..." : pendingCount}
          icon="pending"
          description="Awaiting review"
        />

        <TeacherMetricCard
          label="Approved"
          value={loading ? "..." : approvedCount}
          icon="passed"
          description="Accepted applications"
        />

        <TeacherMetricCard
          label="Rejected"
          value={loading ? "..." : rejectedCount}
          icon="absent"
          description="Declined applications"
        />
      </div>

      <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />

              <path strokeLinecap="round" d="m20 20-4-4" />
            </svg>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search teacher requests..."
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#B45A2A] focus:ring-2 focus:ring-[#B45A2A]/10"
            />
          </div>

          <div className="grid w-full grid-cols-2 rounded-xl bg-[#F0EDE4] p-1 sm:flex sm:w-auto sm:flex-wrap">
            {(["All", "Pending", "Approved", "Rejected"] as const).map(
              (item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition sm:px-4 ${
                    filter === item
                      ? "bg-white text-[#B45A2A] shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {item}
                </button>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="font-serif text-xl font-bold text-[#333333]">
              Applications
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              {loading
                ? "Loading requests..."
                : `${filteredRequests.length} request${
                    filteredRequests.length !== 1 ? "s" : ""
                  } found`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white px-4 py-10 text-center shadow-sm sm:p-12">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#F0EDE4]">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#B45A2A] border-t-transparent" />
            </div>

            <h3 className="mt-4 font-semibold text-slate-700">
              Loading requests...
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              Getting the latest teacher applications.
            </p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="rounded-2xl bg-white px-4 py-10 text-center shadow-sm sm:p-12">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#F0EDE4] text-slate-400">
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />

                <path strokeLinecap="round" d="m20 20-4-4" />
              </svg>
            </div>

            <h3 className="mt-4 font-semibold text-slate-700">
              No requests found
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              Try changing your search or filter.
            </p>
          </div>
        ) : (
          <div className="grid gap-5">
            {filteredRequests.map((request) => (
              <div key={request.id} className="relative">
                <TeacherRequestCard
                  name={request.name}
                  email={request.email}
                  department={request.department}
                  qualification={request.qualification}
                  experience={request.experience}
                  submittedDate={request.submittedDate}
                  status={request.status}
                  onApprove={() => handleRequest(request.id, "approve")}
                  onReject={() => handleRequest(request.id, "reject")}
                />

                {processingId === request.id && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/70 p-4 backdrop-blur-[1px]">
                    <div className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#B45A2A] shadow">
                      Processing...
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
