"use client";

import Button from "@/components/Button";
import Input from "@/components/Input";
import { FormEvent, useEffect, useRef, useState } from "react";




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
  const [userType, setUserType] = useState<UserType>("student");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [departmentOpen, setDepartmentOpen] = useState(false);

  const departmentRef = useRef<HTMLDivElement>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    userId: "",
    email: "",
    department: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  useEffect(() => {
    if (!departmentOpen) return;

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




  const handleDepartmentSelect = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      department: value,
    }));

    setDepartmentOpen(false);

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (
      !formData.fullName ||
      !formData.userId ||
      !formData.email ||
      !formData.department ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!agreedToTerms) {
      setError("Please agree to the Terms and Conditions.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // TODO:
      // Send formData to your backend/API here.
      //
      // Example:
      //
      // await fetch("/api/register", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({
      //     ...formData,
      //     userType,
      //   }),
      // });

      console.log({
        ...formData,
        userType,
      });

      // Temporary delay for testing loading state.
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectedDepartment = departments.find(
    (department) => department.value === formData.department
  );

  return (
    <>


      <main className="relative min-h-screen overflow-hidden  px-4 py-10 font-sans font-medium text-gray-600 sm:py-14">
        {/* Subtle Grid */}
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

        {/* Main Content */}
        <div className="relative mx-auto w-full max-w-3xl">
          {/* Page Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-800 sm:text-4xl">
              Create Account
            </h1>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              Set up your account and begin your journey with us.
            </p>
          </div>

          {/* Registration Card */}
          <div
            className="group relative rounded-[2rem] border border-white/80 bg-white/95 p-6 shadow-[0_8px_20px_rgba(80,50,30,0.05),0_20px_45px_rgba(80,50,30,0.08),0_35px_90px_rgba(188,88,40,0.08)] ring-1 ring-white/60 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_25px_rgba(80,50,30,0.06),0_28px_55px_rgba(80,50,30,0.10),0_40px_100px_rgba(188,88,40,0.10)] sm:p-8"
          >
            {/* Tiny Top Highlight */}
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
            {/* Register As */}
            <div className="mb-7">
              <label className="mb-3 block text-sm font-semibold text-gray-700">
                Register as
              </label>

              <div className="grid grid-cols-2 gap-3">
                {/* Student */}
                <button
                  type="button"
                  onClick={() => setUserType("student")}
                  aria-pressed={userType === "student"}
                  className={`rounded-2xl border p-4 text-left transition-all duration-200 ${userType === "student"
                    ? "border-[#bc5828] bg-[#bc5828] text-white shadow-md shadow-[#bc5828]/15"
                    : "border-[#dfe3e8] bg-white text-gray-600 hover:border-[#bc5828]/50 hover:bg-[#fffaf7]"
                    }`}
                >
                  <p className="font-bold">Student</p>

                  <p
                    className={`mt-0.5 text-xs ${userType === "student"
                      ? "text-white/70"
                      : "text-gray-400"
                      }`}
                  >
                    Register as a student
                  </p>
                </button>

                {/* Teacher */}
                <button
                  type="button"
                  onClick={() => setUserType("teacher")}
                  aria-pressed={userType === "teacher"}
                  className={`rounded-2xl border p-4 text-left transition-all duration-200 ${userType === "teacher"
                    ? "border-[#bc5828] bg-[#bc5828] text-white shadow-md shadow-[#bc5828]/15"
                    : "border-[#dfe3e8] bg-white text-gray-600 hover:border-[#bc5828]/50 hover:bg-[#fffaf7]"
                    }`}
                >
                  <p className="font-bold">Teacher</p>

                  <p
                    className={`mt-0.5 text-xs ${userType === "teacher"
                      ? "text-white/70"
                      : "text-gray-400"
                      }`}
                  >
                    Register as a teacher
                  </p>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div
                role="alert"
                className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
              >
                {error}
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
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

              {/* Student / Teacher ID */}
              <Input
                id="userId"
                name="userId"
                type="text"
                label={userType === "student" ? "Student ID" : "Teacher ID"}
                value={formData.userId}
                onChange={handleChange}
                autoComplete="off"
                placeholder={
                  userType === "student"
                    ? "Enter your student ID"
                    : "Enter your teacher ID"
                }
                required
              />

              {/* Email */}
              <Input
                id="email"
                name="email"
                type="email"
                label="Email Address"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                placeholder="you@example.com"
                required
              />

              {/* Department */}
              <div ref={departmentRef} className="relative">
                <label
                  htmlFor="department"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Department <span className="text-red-500">*</span>
                </label>

                <div className="relative w-full">
                  {/* Dropdown Button */}
                  <button
                    type="button"
                    id="department"
                    aria-haspopup="listbox"
                    aria-expanded={departmentOpen}
                    onClick={() => setDepartmentOpen((prev) => !prev)}
                    className={`flex w-full items-center justify-between bg-white px-4 py-3 text-left text-sm text-gray-700 outline-none transition ${departmentOpen
                      ? "rounded-t-xl rounded-b-none border border-[#bc5828] ring-4 ring-[#bc5828]/10"
                      : "rounded-xl border border-[#dfe3e8] hover:border-[#dfe3e8] focus:border-[#bc5828] focus:ring-4 focus:ring-[#bc5828]/10"
                      }`}
                  >
                    <span
                      className={
                        formData.department
                          ? "text-gray-700"
                          : "text-gray-400"
                      }
                    >
                      {selectedDepartment?.label || "Select Department"}
                    </span>

                    <span
                      className={`mr-1 shrink-0 text-gray-700 transition-transform duration-200 ${departmentOpen ? "rotate-180" : ""
                        }`}
                    >
                      ⮟
                    </span>
                  </button>

                  {/* Dropdown Menu */}
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
                            className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm transition ${formData.department === department.value
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

              {/* Phone */}
              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Phone Number{" "}
                  <span className="font-normal text-gray-400">
                    (Optional)
                  </span>
                </label>

                <input
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

              {/* Password Section */}
              <div className="grid gap-5 sm:grid-cols-2">
                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Password <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <input
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

                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>

                  <p className="mt-2 text-xs text-gray-400">
                    At least 8 characters.
                  </p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Confirm Password <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <input
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

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword((prev) => !prev)
                      }
                      aria-label={
                        showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Match Indicator */}
              {formData.confirmPassword && (
                <div
                  className={`-mt-2 text-xs font-medium ${formData.password === formData.confirmPassword
                    ? "text-green-600"
                    : "text-red-500"
                    }`}
                >
                  {formData.password === formData.confirmPassword
                    ? "✓ Passwords match"
                    : "✕ Passwords do not match"}
                </div>
              )}

              {/* Terms and Conditions */}
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

              {/* Create Account */}
              <Button
                type="submit"
                loading={loading}
                fullWidth
              >
                Create{" "}
                {userType === "student" ? "Student" : "Teacher"} Account
              </Button>
            </form>

            {/* Login Link */}
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

          {/* Terms and Conditions */}
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
