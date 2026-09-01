"use client";

import { FormEvent, useState } from "react";

type UserType = "student" | "teacher";

export default function RegisterPage() {
  const [userType, setUserType] = useState<UserType>("student");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // Basic validation
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
      // await fetch("/api/register", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     ...formData,
      //     userType,
      //   }),
      // });

      console.log({
        ...formData,
        userType,
      });

      // Temporary delay for testing the loading state
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f3f0e7] px-4 py-10 font-sans font-medium text-gray-600 sm:py-14">
      {/* Background Decorations */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-[#bc5828]/10 blur-3xl" />

      <div className="pointer-events-none absolute -right-40 top-1/4 h-[28rem] w-[28rem] rounded-full bg-[#d99a78]/15 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-48 left-1/3 h-[30rem] w-[30rem] rounded-full bg-[#e8c9a8]/25 blur-3xl" />

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

      <div className="relative mx-auto w-full max-w-3xl">
        {/* Page Header */}
        <div className="mb-8 text-center">
          {/* Logo / Brand */}
          <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#bc5828] text-xl text-white shadow-lg shadow-[#bc5828]/20">
            🎓
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-gray-800 sm:text-4xl">
            Create Account
          </h1>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
            Set up your account and begin your journey with us.
          </p>
        </div>

        {/* Registration Card */}
        <div className="rounded-3xl border border-white/80 bg-white/95 p-6 shadow-[0_20px_60px_rgba(80,50,30,0.08)] backdrop-blur-sm sm:p-8">
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
                className={`group rounded-2xl border p-4 text-left transition-all duration-200 ${
                  userType === "student"
                    ? "border-[#bc5828] bg-[#bc5828] text-white shadow-md shadow-[#bc5828]/15"
                    : "border-[#eadfd9] bg-white text-gray-600 hover:border-[#bc5828]/50 hover:bg-[#fffaf7]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg ${
                      userType === "student"
                        ? "bg-white/15"
                        : "bg-[#f8eee9]"
                    }`}
                  >
                    🎓
                  </div>

                  <div>
                    <p className="font-bold">Student</p>
                    <p
                      className={`mt-0.5 text-xs ${
                        userType === "student"
                          ? "text-white/70"
                          : "text-gray-400"
                      }`}
                    >
                      Register as a student
                    </p>
                  </div>
                </div>
              </button>

              {/* Teacher */}
              <button
                type="button"
                onClick={() => setUserType("teacher")}
                aria-pressed={userType === "teacher"}
                className={`group rounded-2xl border p-4 text-left transition-all duration-200 ${
                  userType === "teacher"
                    ? "border-[#bc5828] bg-[#bc5828] text-white shadow-md shadow-[#bc5828]/15"
                    : "border-[#eadfd9] bg-white text-gray-600 hover:border-[#bc5828]/50 hover:bg-[#fffaf7]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg ${
                      userType === "teacher"
                        ? "bg-white/15"
                        : "bg-[#f8eee9]"
                    }`}
                  >
                    👨‍🏫
                  </div>

                  <div>
                    <p className="font-bold">Teacher</p>
                    <p
                      className={`mt-0.5 text-xs ${
                        userType === "teacher"
                          ? "text-white/70"
                          : "text-gray-400"
                      }`}
                    >
                      Register as a teacher
                    </p>
                  </div>
                </div>
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
            <div>
              <label
                htmlFor="fullName"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Full Name <span className="text-red-500">*</span>
              </label>

              <input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                autoComplete="name"
                placeholder="Enter your full name"
                required
                className="w-full rounded-xl border border-[#dfe3e8] bg-white px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 outline-none transition focus:border-[#bc5828] focus:ring-4 focus:ring-[#bc5828]/10"
              />
            </div>

            {/* Student / Teacher ID */}
            <div>
              <label
                htmlFor="userId"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                {userType === "student" ? "Student ID" : "Teacher ID"}{" "}
                <span className="text-red-500">*</span>
              </label>

              <input
                id="userId"
                name="userId"
                type="text"
                value={formData.userId}
                onChange={handleChange}
                autoComplete="off"
                placeholder={
                  userType === "student"
                    ? "Enter your student ID"
                    : "Enter your teacher ID"
                }
                required
                className="w-full rounded-xl border border-[#dfe3e8] bg-white px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 outline-none transition focus:border-[#bc5828] focus:ring-4 focus:ring-[#bc5828]/10"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Email Address <span className="text-red-500">*</span>
              </label>

              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                placeholder="you@example.com"
                required
                className="w-full rounded-xl border border-[#dfe3e8] bg-white px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 outline-none transition focus:border-[#bc5828] focus:ring-4 focus:ring-[#bc5828]/10"
              />
            </div>

            {/* Department */}
            <div>
              <label
                htmlFor="department"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Department <span className="text-red-500">*</span>
              </label>

              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                className={`w-full rounded-xl border border-[#dfe3e8] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#bc5828] focus:ring-4 focus:ring-[#bc5828]/10 ${
                  formData.department ? "text-gray-700" : "text-gray-700"
                }`}
              >
                <option value="" disabled>
                  Select Department
                </option>
                <option value="cse">
                  Computer Science & Engineering
                </option>
                <option value="eee">
                  Electrical & Electronic Engineering
                </option>
                <option value="civil">Civil Engineering</option>
                <option value="bba">Business Administration</option>
                <option value="eco">Economics</option>
                <option value="eng">English</option>
                <option value="law">Law</option>
              </select>
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Phone Number{" "}
                <span className="font-normal text-gray-400">(Optional)</span>
              </label>

              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                autoComplete="tel"
                placeholder="+880 1XXX-XXXXXX"
                className="w-full rounded-xl border border-[#dfe3e8] bg-white px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 outline-none transition focus:border-[#bc5828] focus:ring-4 focus:ring-[#bc5828]/10"
              />
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
                    onClick={() => setShowPassword(!showPassword)}
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
                      setShowConfirmPassword(!showConfirmPassword)
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

            {/* Terms and Conditions */}
            <div className="flex items-start gap-3">
              <input
                id="terms"
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
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
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#bc5828] py-3.5 font-semibold text-white shadow-sm shadow-[#bc5828]/20 transition hover:bg-[#a94d22] hover:shadow-md active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Creating Account...
                </span>
              ) : (
                `Create ${userType === "student" ? "Student" : "Teacher"} Account`
              )}
            </button>
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
            className="font-semibold text-[#bc5828] hover:underline">
            Terms and Conditions
          </button>
  .
</div>
      </div>
    </main>
  );
}
