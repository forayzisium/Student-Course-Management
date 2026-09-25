"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type StudentProfileResponse = {
  success: boolean;
  data: {
    user?: {
      id: number;
      name: string;
      username: string;
      email: string;
      status: string;
      createdAt: string;
    };
    name?: string;
    username?: string;
    email?: string;
    status?: string;
    createdAt?: string;
  };
};

type AccountInfo = {
  name: string;
  username: string;
  email: string;
  status: string;
};

type ChangePasswordResponse = {
  success: boolean;
  message: string;
};

export default function StudentSettingsPage() {
  const [account, setAccount] = useState<AccountInfo | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");

  const [newPassword, setNewPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [changingPassword, setChangingPassword] = useState(false);

  const [passwordError, setPasswordError] = useState("");

  const [passwordMessage, setPasswordMessage] = useState("");

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("scm_token");

        if (!token) {
          throw new Error("Authentication required");
        }

        const response = await apiFetch<StudentProfileResponse>(
          "/students/me",
          {
            token,
          },
        );

        const data = response.data;

        const user = data.user;

        setAccount({
          name: user?.name ?? data.name ?? "Unknown",

          username: user?.username ?? data.username ?? "",

          email: user?.email ?? data.email ?? "",

          status: user?.status ?? data.status ?? "ACTIVE",
        });
      } catch (error) {
        console.error("Failed to load account information:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load account information.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAccount();
  }, []);

  const openPasswordModal = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

    setPasswordError("");
    setPasswordMessage("");

    setShowPasswordModal(true);
  };

  const closePasswordModal = () => {
    if (changingPassword) {
      return;
    }

    setShowPasswordModal(false);

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

    setPasswordError("");
    setPasswordMessage("");
  };

  const handleChangePassword = async () => {
    try {
      setPasswordError("");
      setPasswordMessage("");

      if (!currentPassword) {
        throw new Error("Current password is required.");
      }

      if (!newPassword) {
        throw new Error("New password is required.");
      }

      if (!confirmPassword) {
        throw new Error("Please confirm your new password.");
      }

      if (newPassword.length < 8) {
        throw new Error("New password must be at least 8 characters.");
      }

      if (newPassword !== confirmPassword) {
        throw new Error("New passwords do not match.");
      }

      if (currentPassword === newPassword) {
        throw new Error(
          "New password must be different from current password.",
        );
      }

      const token = localStorage.getItem("scm_token");

      if (!token) {
        throw new Error("Authentication required.");
      }

      setChangingPassword(true);

      const response = await apiFetch<ChangePasswordResponse>(
        "/auth/change-password",
        {
          method: "PUT",
          token,
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        },
      );

      setPasswordMessage(response.message || "Password changed successfully.");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordMessage("");
      }, 1500);
    } catch (error) {
      console.error("Failed to change password:", error);

      setPasswordError(
        error instanceof Error ? error.message : "Failed to change password.",
      );
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#EAE6DC] px-5 py-6 sm:px-8 sm:py-8">
        <div className="mb-8">
          <p className="font-serif text-sm text-[#B45A2A]">Student Portal</p>

          <h1 className="mt-1 font-serif text-3xl font-bold text-[#333333]">
            Account
          </h1>

          <p className="mt-2 text-base text-[#59708F]">
            Manage your account and security settings.
          </p>
        </div>

        <div className="flex min-h-[300px] items-center justify-center rounded-2xl bg-white shadow-sm">
          <p className="text-sm text-slate-400">
            Loading account information...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#EAE6DC] px-5 py-6 sm:px-8 sm:py-8">
      <div className="mb-8">
        <p className="font-serif text-sm text-[#B45A2A]">Student Portal</p>

        <h1 className="mt-1 font-serif text-3xl font-bold text-[#333333]">
          Account
        </h1>

        <p className="mt-2 text-base text-[#59708F]">
          Manage your account and security settings.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <section className="rounded-2xl bg-white px-6 py-8 shadow-sm sm:px-9">
        <div className="mb-9">
          <h2 className="font-serif text-xl font-bold text-[#111827]">
            Account Information
          </h2>

          <p className="mt-1 text-base text-[#59708F]">Your account details.</p>
        </div>

        {account ? (
          <div>
            <div className="flex flex-col gap-2 border-b border-slate-100 py-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-base font-medium text-[#243B64]">Name</p>

                <p className="mt-1 text-sm text-[#8A9AB5]">Your display name</p>
              </div>

              <p className="break-words text-base text-[#3E526F] lg:max-w-[55%] lg:text-right">
                {account.name}
              </p>
            </div>

            <div className="flex flex-col gap-2 border-b border-slate-100 py-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-base font-medium text-[#243B64]">Username</p>

                <p className="mt-1 text-sm text-[#8A9AB5]">
                  Your unique account username
                </p>
              </div>

              <p className="break-words text-base text-[#3E526F] lg:max-w-[55%] lg:text-right">
                {account.username ? `@${account.username}` : "Not available"}
              </p>
            </div>

            <div className="flex flex-col gap-2 border-b border-slate-100 py-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-base font-medium text-[#243B64]">Email</p>

                <p className="mt-1 text-sm text-[#8A9AB5]">
                  Your registered email
                </p>
              </div>

              <p className="break-all text-base text-[#3E526F] lg:max-w-[55%] lg:text-right">
                {account.email}
              </p>
            </div>

            <div className="flex flex-col gap-2 py-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-base font-medium text-[#243B64]">
                  Account Status
                </p>

                <p className="mt-1 text-sm text-[#8A9AB5]">
                  Current account status
                </p>
              </div>

              <span
                className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${
                  account.status === "ACTIVE"
                    ? "bg-green-50 text-green-600"
                    : "bg-red-50 text-red-500"
                }`}
              >
                {account.status}
              </span>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-[#F7F9FB] p-5 text-center text-sm text-slate-400">
            Account information is unavailable.
          </div>
        )}
      </section>

      <section className="mt-6 rounded-2xl bg-white px-6 py-8 shadow-sm sm:px-9">
        <div className="mb-8">
          <h2 className="font-serif text-xl font-bold text-[#111827]">
            Security
          </h2>

          <p className="mt-1 text-base text-[#59708F]">
            Manage your password and account security.
          </p>
        </div>

        <div className="flex flex-col gap-5 rounded-xl border border-slate-100 bg-[#F7F9FB] p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 sm:gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
              <svg
                className="h-5 w-5 text-[#657A99]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="5" y="10" width="14" height="10" rx="2" />

                <path strokeLinecap="round" d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
            </div>

            <div className="min-w-0">
              <p className="text-base font-semibold text-[#243B64]">Password</p>

              <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                {showPassword ? (
                  <span className="break-words text-sm text-[#657A99]">
                    Your password is protected
                  </span>
                ) : (
                  <span className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm tracking-[3px] text-[#657A99]">
                    ••••••••••••
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setShowPassword((previous) => !previous)}
                  className="shrink-0 text-xs text-[#8A9AB5] transition hover:text-[#B45A2A]"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={openPasswordModal}
            className="w-full rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-[#243B64] transition hover:border-[#B45A2A] hover:text-[#B45A2A] lg:w-auto lg:shrink-0"
          >
            Change Password
          </button>
        </div>

        <p className="mt-4 text-xs text-slate-400">
          Use a strong password with at least 8 characters.
        </p>
      </section>

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#333333]">
                  Change Password
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Update your account password.
                </p>
              </div>

              <button
                type="button"
                onClick={closePasswordModal}
                disabled={changingPassword}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <div className="space-y-5 px-6 py-6">
              {passwordError && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {passwordError}
                </div>
              )}

              {passwordMessage && (
                <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-600">
                  {passwordMessage}
                </div>
              )}

              <div>
                <label
                  htmlFor="currentPassword"
                  className="mb-2 block text-sm font-medium text-slate-600"
                >
                  Current Password
                </label>

                <input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={changingPassword}
                  placeholder="Enter current password"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#B45A2A] focus:ring-2 focus:ring-[#B45A2A]/10 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label
                  htmlFor="newPassword"
                  className="mb-2 block text-sm font-medium text-slate-600"
                >
                  New Password
                </label>

                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={changingPassword}
                  placeholder="Minimum 8 characters"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#B45A2A] focus:ring-2 focus:ring-[#B45A2A]/10 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium text-slate-600"
                >
                  Confirm New Password
                </label>

                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={changingPassword}
                  placeholder="Confirm new password"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#B45A2A] focus:ring-2 focus:ring-[#B45A2A]/10 disabled:bg-slate-50"
                />
              </div>

              <p className="text-xs text-slate-400">
                New password must be at least 8 characters and different from
                your current password.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 px-6 py-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closePasswordModal}
                disabled={changingPassword}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="rounded-xl bg-[#B45A2A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#9F4D24] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {changingPassword ? "Updating..." : "Update Password"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
