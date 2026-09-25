"use client";

import Button from "@/components/Button";
import Input from "@/components/Input";
import PasswordVisibilityToggle from "@/components/PasswordVisibilityToggle";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type UserType = "student" | "teacher";

const departments = [
  { value: "cse", label: "Computer Science & Engineering" },
  { value: "eee", label: "Electrical & Electronic Engineering" },
  { value: "civil", label: "Civil Engineering" },
  { value: "bba", label: "Business Administration" },
  { value: "eco", label: "Economics" },
  { value: "eng", label: "English" },
  { value: "law", label: "Law" },
];

export default function RegisterPage() {
  const router = useRouter();

  const [userType, setUserType] = useState<UserType>("student");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [departmentOpen, setDepartmentOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");

  const departmentRef = useRef<HTMLDivElement>(null);
  const usernameTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emailTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    studentId: "",
    email: "",
    department: "",
    year: "",
    qualification: "",
    experience: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const isGmail = (email: string) =>
    email.trim().toLowerCase().endsWith("@gmail.com");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) {
      setError("");
    }

    if (success) {
      setSuccess("");
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(e);

    if (usernameTimeoutRef.current) {
      clearTimeout(usernameTimeoutRef.current);
    }

    usernameTimeoutRef.current = setTimeout(() => {
      checkUsername(e.target.value);
    }, 500);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(e);

    if (emailTimeoutRef.current) {
      clearTimeout(emailTimeoutRef.current);
    }

    emailTimeoutRef.current = setTimeout(() => {
      checkEmail(e.target.value);
    }, 500);
  };

  const checkUsername = async (username: string) => {
    if (!username.trim()) {
      setUsernameError("");
      return;
    }

    try {
      const response = await apiFetch<{
        available: boolean;
      }>("/auth/check-username", {
        method: "POST",
        body: JSON.stringify({
          username: username.trim(),
        }),
      });

      if (!response.available) {
        setUsernameError("This username is already taken");
      } else {
        setUsernameError("");
      }
    } catch {
    }
  };

  const checkEmail = async (email: string) => {
    if (!email.trim()) {
      setEmailError("");
      return;
    }
    if (!isGmail(email)) {
      setEmailError("Please use a Gmail address ending with @gmail.com");
      return;
    }

    try {
      const response = await apiFetch<{
        available: boolean;
      }>("/auth/check-email", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
        }),
      });

      if (!response.available) {
        setEmailError("This email is already registered");
      } else {
        setEmailError("");
      }
    } catch {
    }
  };

  const handleDepartmentSelect = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      department: value,
    }));

    setDepartmentOpen(false);

    if (error) {
      setError("");
    }

    if (success) {
      setSuccess("");
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const name = formData.fullName.trim();
    const username = formData.username.trim();
    const email = formData.email.trim().toLowerCase();
    const department = formData.department.trim();
    const password = formData.password;

    if (
      !name ||
      !username ||
      !email ||
      !department ||
      !password ||
      !formData.confirmPassword
    ) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!isGmail(email)) {
      setError("Please use a Gmail address ending with @gmail.com");
      return;
    }

    if (userType === "student" && !formData.studentId.trim()) {
      setError("Student ID is required.");
      return;
    }

    if (userType === "student" && !formData.year.trim()) {
      setError("Please select your academic year.");
      return;
    }

    if (userType === "teacher" && !formData.qualification.trim()) {
      setError("Qualification is required for teacher registration.");
      return;
    }

    if (userType === "teacher" && !formData.experience.trim()) {
      setError("Experience is required for teacher registration.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!agreedToTerms) {
      setError("Please agree to the Terms and Conditions.");
      return;
    }

    setLoading(true);

    try {
      if (userType === "student") {
        await apiFetch("/auth/register", {
          method: "POST",
          body: JSON.stringify({
            name,
            username,
            email,
            password,
            studentId: formData.studentId.trim(),
            department,
            year: formData.year.trim(),
          }),
        });

        setSuccess(
          "Student account created successfully. Redirecting you to login...",
        );
      } else {
        await apiFetch("/auth/register/teacher", {
          method: "POST",
          body: JSON.stringify({
            name,
            username,
            email,
            password,
            department,
            qualification: formData.qualification.trim(),
            experience: formData.experience.trim(),
          }),
        });

        setSuccess(
          "Teacher registration submitted successfully. Your account is waiting for admin approval. Redirecting you to login...",
        );
      }

      setTimeout(() => {
        router.push("/login");
      }, 1800);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!departmentOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        departmentRef.current &&
        !departmentRef.current.contains(event.target as Node)
      ) {
        setDepartmentOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [departmentOpen]);

  const selectedDepartment = departments.find(
    (department) => department.value === formData.department,
  );

  const userTypeStyles = (selected: boolean) =>
    `rounded-2xl border p-4 text-left transition-all duration-200 ${
      selected
        ? "border-[#bc5828] bg-[#bc5828] text-white shadow-md shadow-[#bc5828]/15"
        : "border-[#dfe3e8] bg-white text-gray-600 hover:border-[#bc5828]/50 hover:bg-[#fffaf7]"
    }`;

  const helperTextStyles = (selected: boolean) =>
    `mt-0.5 text-xs ${selected ? "text-white/70" : "text-gray-400"}`;

  return (
    <>
      <main className="relative min-h-screen overflow-hidden px-4 py-10 font-sans font-medium text-gray-600 sm:py-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            backgroundImage: `
              linear-gradient(rgba(188, 88, 40, 0.025) 1px, transparent 1px),
              linear-gradient(90deg, rgba(188, 88, 40, 0.025) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative mx-auto w-full max-w-3xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-800 sm:text-4xl">
              Create Account
            </h1>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              Set up your account and begin your journey with us.
            </p>
          </div>

          <div className="group relative rounded-[2rem] border border-white/80 bg-white/95 p-6 shadow-[0_8px_20px_rgba(80,50,30,0.05),0_20px_45px_rgba(80,50,30,0.08),0_35px_90px_rgba(188,88,40,0.08)] ring-1 ring-white/60 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_25px_rgba(80,50,30,0.06),0_28px_55px_rgba(80,50,30,0.10),0_40px_100px_rgba(188,88,40,0.10)] sm:p-8">
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />

            <div className="mb-7">
              <label className="mb-3 block text-sm font-semibold text-gray-700">
                Register as
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setUserType("student");
                    setError("");
                    setSuccess("");
                  }}
                  aria-pressed={userType === "student"}
                  className={userTypeStyles(userType === "student")}
                >
                  <p className="font-bold">Student</p>

                  <p className={helperTextStyles(userType === "student")}>
                    Register as a student
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUserType("teacher");
                    setError("");
                    setSuccess("");
                  }}
                  aria-pressed={userType === "teacher"}
                  className={userTypeStyles(userType === "teacher")}
                >
                  <p className="font-bold">Teacher</p>

                  <p className={helperTextStyles(userType === "teacher")}>
                    Register as a teacher
                  </p>
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium leading-6 text-green-700"
              >
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                id="fullName"
                name="fullName"
                type="text"
                label="Full Name"
                value={formData.fullName}
                onChange={handleChange}
                autoComplete="name"
                placeholder="Enter your full name"
                required
              />

              <Input
                id="username"
                name="username"
                type="text"
                label="Username"
                value={formData.username}
                onChange={handleUsernameChange}
                autoComplete="username"
                placeholder="Choose a unique username"
                required
              />
              {usernameError && (
                <p className="mt-1 text-xs text-red-500">{usernameError}</p>
              )}

              {userType === "student" && (
                <Input
                  id="studentId"
                  name="studentId"
                  type="text"
                  label="Student ID"
                  value={formData.studentId}
                  onChange={handleChange}
                  autoComplete="off"
                  placeholder="Enter your student ID"
                  required
                />
              )}

              <Input
                id="email"
                name="email"
                type="email"
                label="Email Address"
                value={formData.email}
                onChange={handleEmailChange}
                autoComplete="email"
                placeholder="you@example.com"
                required
              />
              {emailError && (
                <p className="mt-1 text-xs text-red-500">{emailError}</p>
              )}

              <div ref={departmentRef} className="relative">
                <label
                  htmlFor="department"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Department <span className="text-red-500">*</span>
                </label>

                <div className="relative w-full">
                  <button
                    type="button"
                    id="department"
                    aria-haspopup="listbox"
                    aria-expanded={departmentOpen}
                    onClick={() => setDepartmentOpen((prev) => !prev)}
                    className={`flex w-full items-center justify-between bg-white px-4 py-3 text-left text-sm text-gray-700 outline-none transition ${
                      departmentOpen
                        ? "rounded-t-xl rounded-b-none border border-[#bc5828] ring-4 ring-[#bc5828]/10"
                        : "rounded-xl border border-[#dfe3e8] hover:border-[#dfe3e8] focus:border-[#bc5828] focus:ring-4 focus:ring-[#bc5828]/10"
                    }`}
                  >
                    <span
                      className={
                        formData.department ? "text-gray-700" : "text-gray-400"
                      }
                    >
                      {selectedDepartment?.label || "Select Department"}
                    </span>

                    <span
                      className={`mr-1 shrink-0 text-gray-700 transition-transform duration-200 ${
                        departmentOpen ? "rotate-180" : ""
                      }`}
                    >
                      ⮟
                    </span>
                  </button>

                  {departmentOpen && (
                    <div
                      role="listbox"
                      aria-labelledby="department"
                      className="absolute left-0 top-full z-50 w-full overflow-hidden rounded-b-xl border border-t-0 border-[#dfe3e8] bg-white shadow-lg"
                    >
                      <div className="max-h-72 overflow-y-auto px-1 pb-2 pt-1">
                        {departments.map((department) => (
                          <button
                            key={department.value}
                            type="button"
                            role="option"
                            aria-selected={
                              formData.department === department.value
                            }
                            onClick={() =>
                              handleDepartmentSelect(department.value)
                            }
                            className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm transition ${
                              formData.department === department.value
                                ? "bg-[#fff7f2] font-medium text-[#bc5828]"
                                : "text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            {department.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {userType === "student" ? (
                <div>
                  <label
                    htmlFor="year"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Academic Year <span className="text-red-500">*</span>
                  </label>

                  <select
                    id="year"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-[#dfe3e8] bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-[#bc5828] focus:ring-4 focus:ring-[#bc5828]/10"
                  >
                    <option value="">Select Academic Year</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input
                    id="qualification"
                    name="qualification"
                    type="text"
                    label="Qualification"
                    value={formData.qualification}
                    onChange={handleChange}
                    placeholder="e.g. MSc in Computer Science"
                    required
                  />

                  <Input
                    id="experience"
                    name="experience"
                    type="text"
                    label="Experience"
                    value={formData.experience}
                    onChange={handleChange}
                    placeholder="e.g. 5 years"
                    required
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Phone Number{" "}
                  <span className="font-normal text-gray-400">(Optional)</span>
                </label>

                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="+880 1XXX-XXXXXX"
                  className="w-full rounded-xl border border-[#dfe3e8] bg-white px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 outline-none transition focus:border-[#bc5828] focus:ring-4 focus:ring-[#bc5828]/10"
                />

                <p className="mt-2 text-xs text-gray-400">
                  Example: +880 1712-345678
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Password <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                      autoComplete="new-password"
                      placeholder="Create a password"
                      minLength={8}
                      required
                      className="w-full rounded-xl border border-[#dfe3e8] bg-white px-4 py-3 pr-12 text-sm text-gray-700 placeholder:text-gray-400 outline-none transition focus:border-[#bc5828] focus:ring-4 focus:ring-[#bc5828]/10"
                    />

                    <PasswordVisibilityToggle
                      visible={showPassword}
                      onChange={setShowPassword}
                      label={showPassword ? "Hide password" : "Show password"}
                    />
                  </div>

                  <p className="mt-2 text-xs text-gray-400">
                    At least 8 characters.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Confirm Password <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      autoComplete="new-password"
                      placeholder="Confirm your password"
                      minLength={8}
                      required
                      className="w-full rounded-xl border border-[#dfe3e8] bg-white px-4 py-3 pr-12 text-sm text-gray-700 placeholder:text-gray-400 outline-none transition focus:border-[#bc5828] focus:ring-4 focus:ring-[#bc5828]/10"
                    />

                    <PasswordVisibilityToggle
                      visible={showConfirmPassword}
                      onChange={setShowConfirmPassword}
                      label={
                        showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                    />
                  </div>
                </div>
              </div>

              {formData.confirmPassword && (
                <div
                  className={`-mt-2 text-xs font-medium ${
                    formData.password === formData.confirmPassword
                      ? "text-green-600"
                      : "text-red-500"
                  }`}
                >
                  {formData.password === formData.confirmPassword
                    ? "✓ Passwords match"
                    : "✕ Passwords do not match"}
                </div>
              )}

              <div className="flex items-start gap-3">
                <input
                  id="terms"
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => {
                    setAgreedToTerms(e.target.checked);

                    if (error) {
                      setError("");
                    }
                  }}
                  className="mt-1 h-4 w-4 cursor-pointer accent-[#bc5828]"
                />

                <label
                  htmlFor="terms"
                  className="cursor-pointer text-sm text-gray-600"
                >
                  I agree to the{" "}
                  <button
                    type="button"
                    className="font-semibold text-[#bc5828] hover:underline"
                  >
                    Terms and Conditions
                  </button>
                </label>
              </div>

              <Button
                type="submit"
                loading={loading}
                fullWidth
                disabled={!agreedToTerms}
              >
                Create {userType === "student" ? "Student" : "Teacher"} Account
              </Button>
            </form>

            <div className="mt-6 border-t border-[#eeeeee] pt-6 text-center text-sm text-gray-500">
              Already have an account?{" "}
              <a
                href="/login"
                className="font-semibold text-[#bc5828] transition hover:text-[#a94d22] hover:underline"
              >
                Login
              </a>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-gray-400">
            By creating an account, you agree to our{" "}
            <button
              type="button"
              className="font-semibold text-[#bc5828] hover:underline"
            >
              Terms and Conditions
            </button>
            .
          </div>
        </div>
      </main>
    </>
  );
}
