"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import ProfileAvatar from "@/components/ui/ProfileAvatar";

type Profile = {
  name: string;
  username: string;
  email: string;
  department: string;
  phone: string;
};

type TeacherProfileResponse = {
  success: boolean;
  data: {
    id: number;
    name: string;
    username: string;
    email: string;
    profileImage?: string | null;
    status: string;
    createdAt: string;
    teacherProfile?: {
      id: number;
      department: string;
      qualification: string;
      experience: string;
      phone?: string | null;
    } | null;
    courses?: unknown[];
  };
};

type ProfileImageResponse = {
  success: boolean;
  message?: string;
  user: { profileImage?: string | null };
};

const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024;
const PROFILE_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const initialProfile: Profile = {
  name: "",
  username: "",
  email: "",
  department: "",
  phone: "",
};

export default function TeacherProfilePage() {
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState<Profile>(initialProfile);

  const [formData, setFormData] = useState<Profile>(initialProfile);

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");

  const [newPassword, setNewPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("scm_token");

        if (!token) {
          setError("Authentication required. Please log in again.");
          return;
        }

        const response = await apiFetch<TeacherProfileResponse>(
          "/teachers/me",
          {
            token,
          },
        );

        const data = response.data;

        const user = data;
        const teacherProfile = data?.teacherProfile;

        const loadedProfile: Profile = {
          name: user?.name ?? "",
          username: user?.username ?? "",
          email: user?.email ?? "",
          department: teacherProfile?.department ?? "",
          phone: teacherProfile?.phone ?? "",
        };

        setProfile(loadedProfile);
        setFormData(loadedProfile);
        setProfileImage(user?.profileImage ?? null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load profile.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const clearPhotoSelection = () => {
    setSelectedPhoto(null);
    setPhotoPreview(null);
  };

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    setMessage("");
    setError("");

    if (!file) return;
    if (!PROFILE_IMAGE_TYPES.has(file.type)) {
      clearPhotoSelection();
      setError("Choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_PROFILE_IMAGE_SIZE) {
      clearPhotoSelection();
      setError("Profile photo must be 5 MB or smaller.");
      return;
    }

    setSelectedPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handlePhotoUpload = async () => {
    if (!selectedPhoto) {
      setError("Choose a photo before uploading.");
      return;
    }

    const token = localStorage.getItem("scm_token");
    if (!token) {
      setError("Authentication required. Please log in again.");
      return;
    }

    try {
      setUploadingPhoto(true);
      setMessage("");
      setError("");
      const body = new FormData();
      body.append("image", selectedPhoto);
      const response = await apiFetch<ProfileImageResponse>(
        "/auth/me/profile-image",
        { method: "PUT", token, body },
      );

      setProfileImage(response.user.profileImage ?? null);
      clearPhotoSelection();
      await refreshUser();
      setMessage("Profile photo updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload photo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleEdit = () => {
    setFormData(profile);
    setEditing(true);
    setMessage("");
    setError("");
  };

  const handleCancel = () => {
    setFormData(profile);
    setEditing(false);
    setMessage("");
    setError("");
    clearPhotoSelection();
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!formData.name.trim()) {
      setError("Full name is required.");
      return;
    }

    if (!formData.username.trim()) {
      setError("Username is required.");
      return;
    }

    if (!formData.email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!formData.department.trim()) {
      setError("Department is required.");
      return;
    }

    const token = localStorage.getItem("scm_token");

    if (!token) {
      setError("Authentication required. Please log in again.");
      return;
    }

    setSaving(true);

    try {
      const response = await apiFetch<TeacherProfileResponse>("/teachers/me", {
        method: "PUT",
        token,
        body: JSON.stringify({
          name: formData.name.trim(),
          username: formData.username.trim(),
          email: formData.email.trim(),
          department: formData.department.trim(),
          phone: formData.phone.trim(),
        }),
      });

      const updatedUser = response.data;

      const updatedTeacherProfile = response.data?.teacherProfile;

      const updatedProfile: Profile = {
        name: updatedUser?.name ?? formData.name,

        username: updatedUser?.username ?? formData.username,

        email: updatedUser?.email ?? formData.email,

        department: updatedTeacherProfile?.department ?? formData.department,

        phone: updatedTeacherProfile?.phone ?? "",
      };

      setProfile(updatedProfile);
      setFormData(updatedProfile);

      setEditing(false);

      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!currentPassword.trim()) {
      setError("Enter your current password.");
      return;
    }

    if (!newPassword.trim()) {
      setError("Enter a new password.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    const token = localStorage.getItem("scm_token");

    if (!token) {
      setError("Authentication required. Please log in again.");
      return;
    }

    setChangingPassword(true);

    try {
      await apiFetch("/auth/change-password", {
        method: "PUT",
        token,
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setMessage("Password changed successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to change password. Please try again.",
      );
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#EAE6DC]">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#B45A2A] border-t-transparent" />

          <p className="mt-4 text-sm text-slate-500">Loading profile...</p>
        </div>
      </main>
    );
  }

  const displayedProfile = editing ? formData : profile;

  return (
    <main className="min-h-screen bg-[#EAE6DC] p-5 sm:p-8">
      <div className="mb-8">
        <p className="font-serif text-sm text-[#B45A2A]">Teacher Portal</p>

        <h1 className="mt-1 font-serif text-3xl font-bold text-[#333333]">
          Profile
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Manage your teacher profile and account information.
        </p>
      </div>

      {message && (
        <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative flex flex-col items-start gap-3">
            <ProfileAvatar
              name={displayedProfile.name || "Teacher"}
              profileImage={photoPreview || profileImage}
              className="h-24 w-24 text-3xl shadow-md"
            />
            {editing && (
              <div className="flex flex-wrap gap-2">
                <label className="cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
                  {selectedPhoto ? "Change Photo" : "Choose Photo"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoChange}
                    disabled={uploadingPhoto}
                    className="sr-only"
                  />
                </label>
                {selectedPhoto && (
                  <button
                    type="button"
                    onClick={() => void handlePhotoUpload()}
                    disabled={uploadingPhoto}
                    className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {uploadingPhoto ? "Uploading..." : "Upload Photo"}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex-1">
            <h2 className="font-serif text-2xl font-bold text-slate-800">
              {profile.name || "Teacher"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Teacher
              {profile.department ? ` • ${profile.department}` : ""}
            </p>

            <p className="mt-1 text-sm text-slate-400">{profile.email}</p>
          </div>

          {!editing && (
            <button
              type="button"
              onClick={handleEdit}
              className="rounded-xl bg-[#B45A2A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#9f4d24]"
            >
              Edit Profile
            </button>
          )}
        </div>
      </section>

      <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="font-serif text-xl font-bold text-[#333333]">
            Account
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Your personal and professional information.
          </p>
        </div>

        <form onSubmit={handleSave}>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-slate-600"
              >
                Full Name
              </label>

              <input
                id="name"
                name="name"
                value={formData.name}
                disabled={!editing || saving}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition disabled:bg-slate-50 disabled:text-slate-500 focus:border-[#B45A2A]"
              />
            </div>

            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-medium text-slate-600"
              >
                Username
              </label>

              <input
                id="username"
                name="username"
                value={formData.username}
                disabled={!editing || saving}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition disabled:bg-slate-50 disabled:text-slate-500 focus:border-[#B45A2A]"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-600"
              >
                Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                disabled={!editing || saving}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition disabled:bg-slate-50 disabled:text-slate-500 focus:border-[#B45A2A]"
              />
            </div>

            <div>
              <label
                htmlFor="department"
                className="mb-2 block text-sm font-medium text-slate-600"
              >
                Department
              </label>

              <input
                id="department"
                name="department"
                value={formData.department}
                disabled={!editing || saving}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition disabled:bg-slate-50 disabled:text-slate-500 focus:border-[#B45A2A]"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-medium text-slate-600"
              >
                Phone
              </label>

              <input
                id="phone"
                name="phone"
                value={formData.phone}
                disabled={!editing || saving}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition disabled:bg-slate-50 disabled:text-slate-500 focus:border-[#B45A2A]"
              />
            </div>
          </div>

          {editing && (
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving || uploadingPhoto}
                className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving || uploadingPhoto}
                className="rounded-xl bg-[#B45A2A] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#9f4d24] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </form>
      </section>

      <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="font-serif text-xl font-bold text-[#333333]">
            Password
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Update your password to keep your account secure.
          </p>
        </div>

        <form onSubmit={handlePasswordChange} className="max-w-2xl space-y-4">
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Current password"
            disabled={changingPassword}
            autoComplete="current-password"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#B45A2A] disabled:bg-slate-50"
          />

          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            disabled={changingPassword}
            autoComplete="new-password"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#B45A2A] disabled:bg-slate-50"
          />

          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            disabled={changingPassword}
            autoComplete="new-password"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#B45A2A] disabled:bg-slate-50"
          />

          <button
            type="submit"
            disabled={changingPassword}
            className="rounded-xl border border-[#B45A2A] px-5 py-3 text-sm font-semibold text-[#B45A2A] transition hover:bg-[#B45A2A] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {changingPassword ? "Changing..." : "Change Password"}
          </button>
        </form>
      </section>
    </main>
  );
}
