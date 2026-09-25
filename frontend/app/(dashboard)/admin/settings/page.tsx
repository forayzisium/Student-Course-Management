"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type AdminProfile = {
  id: number;
  name: string;
  username: string;
  email: string;
  role?: string;
};

type AdminProfileResponse = {
  success: boolean;
  data: AdminProfile;
};

type UpdateProfileResponse = {
  success: boolean;
  message?: string;
  data: AdminProfile;
};

type PasswordResponse = {
  success: boolean;
  message?: string;
};

export default function AdminSettingsPage() {
  const [profile, setProfile] = useState<AdminProfile | null>(null);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setProfileError("");

        const token = localStorage.getItem("scm_token");

        if (!token) {
          throw new Error("Authentication token not found.");
        }

        const response = await apiFetch<AdminProfileResponse>("/admin/me", {
          method: "GET",
          token,
        });

        const data = response.data;

        setProfile(data);
        setName(data.name);
        setUsername(data.username);
        setEmail(data.email);
      } catch (error) {
        setProfileError(
          error instanceof Error
            ? error.message
            : "Failed to load account information.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleProfileSave = async () => {
    try {
      setSavingProfile(true);
      setProfileError("");
      setProfileSuccess("");

      if (!name.trim()) {
        throw new Error("Full name is required.");
      }

      if (!username.trim()) {
        throw new Error("Username is required.");
      }

      if (!email.trim()) {
        throw new Error("Email address is required.");
      }

      const token = localStorage.getItem("scm_token");

      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const response = await apiFetch<UpdateProfileResponse>("/admin/me", {
        method: "PUT",
        token,
        body: JSON.stringify({
          name: name.trim(),
          username: username.trim(),
          email: email.trim(),
        }),
      });

      setProfile(response.data);

      setName(response.data.name);
      setUsername(response.data.username);
      setEmail(response.data.email);

      setProfileSuccess(
        response.message || "Account information updated successfully.",
      );

      /*
       * Keep locally stored user information synchronized.
       */
      try {
        const storedUserData = localStorage.getItem("scm_user");

        const storedUser = storedUserData ? JSON.parse(storedUserData) : {};

        localStorage.setItem(
          "scm_user",
          JSON.stringify({
            ...storedUser,
            ...response.data,
          }),
        );
      } catch {
        // Local storage sync failure should not
        // affect the successful backend update.
      }

      setTimeout(() => {
        setProfileSuccess("");
      }, 3000);
    } catch (error) {
      setProfileError(
        error instanceof Error
          ? error.message
          : "Failed to update account information.",
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const resetPasswordForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
    setPasswordSuccess("");
    setShowPasswordForm(false);
  };

  const handlePasswordChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword.trim()) {
      setPasswordError("Please enter your current password.");
      return;
    }

    if (!newPassword.trim()) {
      setPasswordError("Please enter a new password.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError(
        "New password must be different from your current password.",
      );
      return;
    }

    try {
      setChangingPassword(true);

      const token = localStorage.getItem("scm_token");

      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const response = await apiFetch<PasswordResponse>(
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

      setPasswordSuccess(response.message || "Password changed successfully.");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        setPasswordSuccess("");
        setShowPasswordForm(false);
      }, 2000);
    } catch (error) {
      setPasswordError(
        error instanceof Error ? error.message : "Failed to change password.",
      );
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#EAE6DC] p-4 font-inter sm:p-6 lg:p-8">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="rounded-xl bg-white px-4 py-5 shadow-sm sm:px-8 sm:py-6">
            <p className="text-sm text-gray-600">Loading settings...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#EAE6DC] p-4 font-inter sm:p-6 lg:p-8">
      <div className="mb-8">
        <p className="mb-1 text-sm font-medium text-[#B45A2A]">Account</p>

        <h1 className="font-serif text-3xl font-bold text-[#333333]">
          Settings
        </h1>

        <p className="mt-2 text-sm text-gray-600">
          Manage your administrator account and security.
        </p>
      </div>

      <div className="mx-auto max-w-4xl space-y-6">
        <section className="rounded-xl bg-white shadow-sm">
          <div className="border-b border-gray-100 p-4 sm:p-6">
            <h2 className="font-serif text-xl font-bold text-[#333333]">
              Account Information
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Your administrator account details.
            </p>
          </div>

          {profileError && (
            <div className="mx-4 mt-4 break-words rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600 sm:mx-6 sm:mt-6 sm:px-4 sm:py-3">
              {profileError}
            </div>
          )}

          {profileSuccess && (
            <div className="mx-4 mt-4 break-words rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-700 sm:mx-6 sm:mt-6 sm:px-4 sm:py-3">
              {profileSuccess}
            </div>
          )}

          <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-gray-500">
                Full Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-[#B45A2A] focus:ring-1 focus:ring-[#B45A2A]"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500">
                Username
              </label>

              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                pattern="[a-zA-Z0-9_]{3,40}"
                minLength={3}
                maxLength={40}
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-[#B45A2A] focus:ring-1 focus:ring-[#B45A2A]"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500">
                Email Address
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-[#B45A2A] focus:ring-1 focus:ring-[#B45A2A]"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500">Role</label>

              <input
                type="text"
                value={
                  profile?.role === "ADMIN"
                    ? "Administrator"
                    : profile?.role || "Administrator"
                }
                disabled
                className="mt-2 w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-gray-500"
              />
            </div>
          </div>

          <div className="flex justify-end border-t border-gray-100 p-4 sm:p-6">
            <button
              type="button"
              onClick={handleProfileSave}
              disabled={savingProfile}
              className="w-full rounded-lg bg-[#B45A2A] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#984A22] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {savingProfile ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </section>

        <section className="rounded-xl bg-white shadow-sm">
          <div className="border-b border-gray-100 p-4 sm:p-6">
            <h2 className="font-serif text-xl font-bold text-[#333333]">
              Security
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Manage your account password.
            </p>
          </div>

          <div className="p-4 sm:p-6">
            {passwordSuccess && (
              <div className="mb-4 break-words rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-700 sm:mb-6 sm:px-4 sm:py-3">
                {passwordSuccess}
              </div>
            )}

            {!showPasswordForm ? (
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-700">Password</p>

                  <p className="mt-1 text-sm text-gray-500">
                    Keep your administrator account secure.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPasswordError("");
                    setPasswordSuccess("");
                    setShowPasswordForm(true);
                  }}
                  className="w-full rounded-lg border border-[#B45A2A] px-5 py-2.5 text-sm font-medium text-[#B45A2A] transition hover:bg-[#B45A2A] hover:text-white lg:w-auto lg:shrink-0"
                >
                  Change Password
                </button>
              </div>
            ) : (
              <form onSubmit={handlePasswordChange} className="space-y-5">
                {passwordError && (
                  <div className="break-words rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600 sm:px-4 sm:py-3">
                    {passwordError}
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-gray-500">
                    Current Password
                  </label>

                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    autoComplete="current-password"
                    className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#B45A2A] focus:ring-1 focus:ring-[#B45A2A]"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500">
                    New Password
                  </label>

                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    autoComplete="new-password"
                    className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#B45A2A] focus:ring-1 focus:ring-[#B45A2A]"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500">
                    Confirm New Password
                  </label>

                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#B45A2A] focus:ring-1 focus:ring-[#B45A2A]"
                  />
                </div>

                <div className="flex flex-col-reverse justify-end gap-3 border-t border-gray-100 pt-5 sm:flex-row">
                  <button
                    type="button"
                    onClick={resetPasswordForm}
                    disabled={changingPassword}
                    className="w-full rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="w-full rounded-lg bg-[#B45A2A] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#984A22] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {changingPassword ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
