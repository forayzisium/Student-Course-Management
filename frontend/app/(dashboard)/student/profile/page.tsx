"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";

type Profile = {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
};

type StudentProfileResponse = {
  success: boolean;
  data: {
    id: number;
    name: string;
    username: string;
    email: string;
    studentProfile: {
      id: number;
      studentId: string;
      department: string;
      year: string;
      phone?: string | null;
      address?: string | null;
    };
  };
};

type UpdateProfileResponse = {
  success: boolean;
  message?: string;
  data?: {
    id: number;
    name: string;
    email: string;
    studentProfile: {
      id: number;
      studentId: string;
      department: string;
      year: string;
      phone?: string | null;
      address?: string | null;
    };
  };
};

const initialProfile: Profile = {
  firstName: "",
  lastName: "",
  phone: "",
  address: "",
};

export default function StudentProfile() {
  const { refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState<Profile>(initialProfile);

  const [formData, setFormData] = useState<Profile>(initialProfile);

  const [studentId, setStudentId] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");


  useEffect(() => {
    async function loadProfile() {
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

        const fullName = data.name?.trim() || "Student";

        const nameParts = fullName.split(" ");

        const firstName = nameParts.shift() || "";

        const lastName = nameParts.join(" ") || "";

        const loadedProfile: Profile = {
          firstName,
          lastName,
          phone: data.studentProfile?.phone || "",
          address: data.studentProfile?.address || "",
        };

        setProfile(loadedProfile);
        setFormData(loadedProfile);

        setStudentId(data.studentProfile?.studentId || "");

        setDepartment(data.studentProfile?.department || "");

        setYear(data.studentProfile?.year || "");

        setEmail(data.email || "");
        setUsername(data.username || "");
      } catch (err) {
        console.error("Failed to load student profile:", err);

        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    }

    void loadProfile();
  }, []);


  const handleEdit = () => {
    setFormData(profile);
    setIsEditing(true);
    setSaved(false);
    setError("");
  };


  const handleCancel = () => {
    setFormData(profile);
    setIsEditing(false);
    setSaved(false);
    setError("");
  };


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setSaved(false);
    setError("");
  };


  const handleSave = async () => {
    if (!formData.firstName.trim()) {
      setError("First name is required.");
      return;
    }

    if (!formData.lastName.trim()) {
      setError("Last name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSaved(false);

      const token = localStorage.getItem("scm_token");

      if (!token) {
        throw new Error("Authentication required");
      }

      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;

      const response = await apiFetch<UpdateProfileResponse>("/students/me", {
        method: "PUT",
        token,
        body: JSON.stringify({
          name: fullName,
          phone: formData.phone.trim(),
          address: formData.address.trim(),
        }),
      });

      if (!response.success)
        throw new Error(response.message || "Profile update failed");
      await refreshUser();
      const updatedUser = response.data;

      if (updatedUser?.name) {
        const nameParts = updatedUser.name.trim().split(" ");

        const updatedFirstName = nameParts.shift() || "";

        const updatedLastName = nameParts.join(" ") || "";

        const updatedProfile: Profile = {
          ...formData,
          firstName: updatedFirstName,
          lastName: updatedLastName,
        };

        setProfile(updatedProfile);

        setFormData(updatedProfile);
      } else {
        setProfile(formData);
      }

      if (updatedUser?.email) {
        setEmail(updatedUser.email);
      }

      setIsEditing(false);
      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 3000);
    } catch (err) {
      console.error("Failed to update student profile:", err);

      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const initials =
    `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase() ||
    "S";


  if (loading) {
    return (
      <main className="min-h-screen bg-[#EAE6DC] p-5 sm:p-8">
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#B45A2A]/20 border-t-[#B45A2A]" />

            <p className="mt-4 font-serif text-sm text-slate-500">
              Loading your profile...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#EAE6DC] p-5 sm:p-8">
      <div className="mb-8">
        <p className="font-serif text-sm text-[#B45A2A]">Student Portal</p>

        <h1 className="mt-1 font-serif text-3xl font-bold text-[#333333]">
          Profile
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Manage your student profile and account information.
        </p>
      </div>

      {saved && (
        <div className="mb-5 rounded-xl border border-green-100 bg-green-50 px-5 py-4 text-sm font-medium text-green-700">
          Profile updated successfully.
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#B45A2A] font-serif text-3xl font-bold text-white shadow-md">
              {initials}
            </div>
          </div>

          <div className="flex-1">
            <h2 className="font-serif text-2xl font-bold text-slate-800">
              {profile.firstName} {profile.lastName}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Student • {department || "Department not available"}
            </p>

            <p className="mt-1 text-sm text-slate-400">
              @{username || "username"}
            </p>

            <p className="mt-1 text-sm text-slate-400">
              {studentId || "Student ID unavailable"}
            </p>
          </div>

          {!isEditing && (
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
            Your personal and academic information.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">
              First Name
            </label>

            <input
              name="firstName"
              value={formData.firstName}
              disabled={!isEditing}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition disabled:bg-slate-50 disabled:text-slate-500 focus:border-[#B45A2A]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">
              Last Name
            </label>

            <input
              name="lastName"
              value={formData.lastName}
              disabled={!isEditing}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition disabled:bg-slate-50 disabled:text-slate-500 focus:border-[#B45A2A]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">
              Email
            </label>

            <input
              value={email}
              disabled
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 outline-none"
            />

            <p className="mt-1 text-xs text-slate-400">
              Email is managed by your account.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">
              Phone
            </label>

            <input
              name="phone"
              value={formData.phone}
              disabled={!isEditing}
              onChange={handleChange}
              placeholder="Enter phone number"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition disabled:bg-slate-50 disabled:text-slate-500 focus:border-[#B45A2A]"
            />

            <p className="mt-1 text-xs text-slate-400">
              Phone storage will be connected to the backend later.
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-600">
              Address
            </label>

            <input
              name="address"
              value={formData.address}
              disabled={!isEditing}
              onChange={handleChange}
              placeholder="Enter address"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition disabled:bg-slate-50 disabled:text-slate-500 focus:border-[#B45A2A]"
            />

            <p className="mt-1 text-xs text-slate-400">
              Address storage will be connected to the backend later.
            </p>
          </div>
        </div>

        {isEditing && (
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-[#B45A2A] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#9f4d24] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </section>

      <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="font-serif text-xl font-bold text-[#333333]">
            Academic Information
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Information provided by the university.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">
              Student ID
            </p>

            <p className="mt-2 font-medium text-slate-700">
              {studentId || "Not available"}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">
              Department
            </p>

            <p className="mt-2 font-medium text-slate-700">
              {department || "Not available"}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">
              Academic Year
            </p>

            <p className="mt-2 font-medium text-slate-700">
              {year || "Not available"}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">
              University Email
            </p>

            <p className="mt-2 font-medium text-slate-700">
              {email || "Not available"}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
