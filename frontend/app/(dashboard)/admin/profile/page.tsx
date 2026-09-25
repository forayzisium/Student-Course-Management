"use client";

import { useEffect, useState } from "react";
import AdminProfileCard from "@/components/admins/AdminProfileCard";
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

export default function AdminProfilePage() {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("scm_token");

        if (!token) {
          throw new Error("Authentication token not found.");
        }

        const response = await apiFetch<AdminProfileResponse>("/admin/me", {
          method: "GET",
          token,
        });

        const profileData = response.data;

        let storedUser: {
          role?: string;
        } | null = null;

        try {
          const storedUserData = localStorage.getItem("scm_user");

          if (storedUserData) {
            storedUser = JSON.parse(storedUserData);
          }
        } catch {
          storedUser = null;
        }

        setProfile({
          ...profileData,
          role: profileData?.role || storedUser?.role || "ADMIN",
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load admin profile.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSaveProfile = async (data: {
    name: string;
    username: string;
    email: string;
  }) => {
    const token = localStorage.getItem("scm_token");

    if (!token) {
      throw new Error("Authentication token not found.");
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await apiFetch<UpdateProfileResponse>("/admin/me", {
        method: "PUT",
        token,
        body: JSON.stringify({
          name: data.name,
          username: data.username,
          email: data.email,
        }),
      });

      const updatedProfile = response.data;

      let storedUser: {
        role?: string;
      } | null = null;

      try {
        const storedUserData = localStorage.getItem("scm_user");

        if (storedUserData) {
          storedUser = JSON.parse(storedUserData);
        }
      } catch {
        storedUser = null;
      }

      setProfile({
        ...updatedProfile,
        role:
          updatedProfile?.role || profile?.role || storedUser?.role || "ADMIN",
      });

      /*
       * Keep the locally stored user information
       * synchronized with the updated profile.
       */
      try {
        const existingUserData = localStorage.getItem("scm_user");

        const existingUser = existingUserData
          ? JSON.parse(existingUserData)
          : {};

        localStorage.setItem(
          "scm_user",
          JSON.stringify({
            ...existingUser,
            ...updatedProfile,
            role: updatedProfile?.role || existingUser?.role || "ADMIN",
          }),
        );
      } catch {
        // Local storage sync failure should not
        // prevent the profile update from succeeding.
      }

      setSuccess(response.message || "Profile updated successfully.");

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : "Failed to update profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#EAE6DC] p-4 font-inter sm:p-6 lg:p-8">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="rounded-xl bg-white px-4 py-5 shadow-sm sm:px-8 sm:py-6">
            <p className="text-sm text-gray-600">Loading profile...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error && !profile) {
    return (
      <main className="min-h-screen bg-[#EAE6DC] p-4 font-inter sm:p-6 lg:p-8">
        <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6 lg:p-8">
          <p className="mb-1 text-sm font-medium text-[#B45A2A]">Account</p>

          <h1 className="font-serif text-3xl font-bold text-[#333333]">
            Profile
          </h1>

          <p className="mt-3 break-words text-sm text-red-600">{error}</p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-[#EAE6DC] p-4 font-inter sm:p-6 lg:p-8">
        <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6 lg:p-8">
          <p className="text-sm text-gray-600">
            No profile information available.
          </p>
        </div>
      </main>
    );
  }

  const displayRole =
    profile.role === "ADMIN"
      ? "Administrator"
      : profile.role || "Administrator";

  return (
    <main className="min-h-screen bg-[#EAE6DC] p-4 font-inter sm:p-6 lg:p-8">
      <div className="mb-8">
        <p className="mb-1 text-sm font-medium text-[#B45A2A]">Account</p>

        <h1 className="font-serif text-3xl font-bold text-[#333333]">
          Profile
        </h1>

        <p className="mt-2 text-sm text-gray-600">
          Manage your administrator profile information.
        </p>
      </div>

      {success && (
        <div className="mx-auto mb-5 max-w-4xl break-words rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="mx-auto max-w-4xl">
        <AdminProfileCard
          name={profile.name}
          username={profile.username}
          email={profile.email}
          role={displayRole}
          loading={false}
          saving={saving}
          onSave={handleSaveProfile}
        />
      </div>
    </main>
  );
}
