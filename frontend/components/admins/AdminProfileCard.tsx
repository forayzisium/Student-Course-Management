"use client";

import { useState } from "react";

type AdminProfileCardProps = {
  name: string;
  username: string;
  email: string;
  role: string;
  loading?: boolean;
  saving?: boolean;
  onSave: (data: {
    name: string;
    username: string;
    email: string;
  }) => Promise<void>;
};

export default function AdminProfileCard({
  name,
  username,
  email,
  role,
  loading = false,
  saving = false,
  onSave,
}: AdminProfileCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
  });

  const [formError, setFormError] = useState("");

  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleEdit = () => {
    setFormData({
      name,
      username,
      email,
    });

    setFormError("");
    setIsEditing(true);
  };

  const handleChange = (
    field: "name" | "username" | "email",
    value: string,
  ) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleCancel = () => {
    setFormData({
      name,
      username,
      email,
    });

    setFormError("");
    setIsEditing(false);
  };

  const handleSubmit = async () => {
    setFormError("");

    if (!formData.name.trim()) {
      setFormError("Full name is required.");
      return;
    }

    if (!formData.username.trim()) {
      setFormError("Username is required.");
      return;
    }

    if (!formData.email.trim()) {
      setFormError("Email address is required.");
      return;
    }

    try {
      await onSave({
        name: formData.name.trim(),
        username: formData.username.trim(),
        email: formData.email.trim(),
      });

      setIsEditing(false);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to update profile.",
      );
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6 lg:p-8">
        <p className="text-sm text-gray-600">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-w-0 rounded-xl bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col items-center border-b border-gray-100 pb-6 sm:flex-row sm:items-center sm:gap-5">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-[#F0EDE4] text-2xl font-bold text-[#B45A2A]">
          {initials}
        </div>

        <div className="mt-4 min-w-0 text-center sm:mt-0 sm:text-left">
          <h2 className="break-words font-serif text-2xl font-bold text-[#333333]">
            {name}
          </h2>

          <p className="mt-1 break-all text-sm text-gray-500">@{username}</p>

          <span className="mt-3 inline-flex rounded-full bg-[#B45A2A]/10 px-3 py-1 text-xs font-medium text-[#B45A2A]">
            {role}
          </span>
        </div>
      </div>

      {formError && (
        <div className="mt-6 break-words rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {formError}
        </div>
      )}

      <div className="mt-6">
        <h3 className="font-serif text-lg font-bold text-[#333333]">
          Personal Information
        </h3>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div className="min-w-0">
            <label className="text-xs font-medium text-gray-500">
              Full Name
            </label>

            {isEditing ? (
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="mt-2 min-w-0 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-[#B45A2A] focus:ring-1 focus:ring-[#B45A2A]"
              />
            ) : (
              <p className="mt-2 break-words rounded-lg bg-[#F8F6F1] px-4 py-3 text-sm text-gray-700">
                {name}
              </p>
            )}
          </div>

          <div className="min-w-0">
            <label className="text-xs font-medium text-gray-500">
              Username
            </label>

            {isEditing ? (
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleChange("username", e.target.value)}
                className="mt-2 min-w-0 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-[#B45A2A] focus:ring-1 focus:ring-[#B45A2A]"
              />
            ) : (
              <p className="mt-2 break-all rounded-lg bg-[#F8F6F1] px-4 py-3 text-sm text-gray-700">
                {username}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 border-t border-gray-100 pt-6">
        <h3 className="font-serif text-lg font-bold text-[#333333]">
          Account Information
        </h3>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div className="min-w-0">
            <label className="text-xs font-medium text-gray-500">
              Email Address
            </label>

            {isEditing ? (
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="mt-2 min-w-0 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-[#B45A2A] focus:ring-1 focus:ring-[#B45A2A]"
              />
            ) : (
              <p className="mt-2 break-all rounded-lg bg-[#F8F6F1] px-4 py-3 text-sm text-gray-700">
                {email}
              </p>
            )}
          </div>

          <div className="min-w-0">
            <label className="text-xs font-medium text-gray-500">
              Account Role
            </label>

            <p className="mt-2 break-words rounded-lg bg-[#F8F6F1] px-4 py-3 text-sm text-gray-700">
              {role}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col justify-end gap-3 border-t border-gray-100 pt-6 sm:flex-row">
        {isEditing ? (
          <>
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="w-full rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="w-full rounded-lg bg-[#B45A2A] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#984A22] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleEdit}
            className="w-full rounded-lg bg-[#B45A2A] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#984A22] sm:w-auto"
          >
            Edit Profile
          </button>
        )}
      </div>
    </div>
  );
}
