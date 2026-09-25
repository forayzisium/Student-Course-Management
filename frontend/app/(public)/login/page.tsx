"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, type UserRole } from "@/lib/auth-context";
import PasswordVisibilityToggle from "@/components/PasswordVisibilityToggle";

const roles: UserRole[] = ["STUDENT", "TEACHER", "ADMIN"];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [role, setRole] = useState<UserRole>("STUDENT");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const authenticatedUser = await login(
        email.trim().toLowerCase(),
        password,
        role,
      );

      const redirects = {
        STUDENT: "/student/dashboard",
        TEACHER: "/teacher/dashboard",
        ADMIN: "/admin/dashboard",
      };

      router.push(redirects[authenticatedUser.role]);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Invalid email or password.",
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <main className="flex flex-1 items-center justify-center bg-[#EAE6DC] px-4 py-6 font-inter">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="mt-4 font-serif text-3xl font-bold text-[#333333]">
            SC<span className="text-[#B45A2A]">M</span>
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            Student Course <span className="text-[#B45A2A]/70">Management</span>
          </p>
        </div>

        <div className="group relative rounded-[2rem] border border-white/80 bg-white/95 p-6 shadow-[0_8px_20px_rgba(80,50,30,0.05),0_20px_45px_rgba(80,50,30,0.08),0_35px_90px_rgba(188,88,40,0.08)] ring-1 ring-white/60 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_25px_rgba(80,50,30,0.06),0_28px_55px_rgba(80,50,30,0.10),0_40px_100px_rgba(188,88,40,0.10)] sm:p-8">
          <div className="mb-6">
            <h2 className="font-serif text-2xl font-bold text-[#333333]">
              Welcome back
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Sign in to access your account.
            </p>
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Login as
            </label>

            <div className="grid grid-cols-3 gap-2 rounded-xl bg-[#F8F6F1] p-1">
              {roles.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={role === item}
                  onClick={() => {
                    setRole(item);
                    setError("");
                  }}
                  className={`rounded-lg px-3 py-2.5 text-sm font-medium capitalize transition ${
                    role === item
                      ? "bg-[#B45A2A] text-white shadow-sm"
                      : "text-gray-600 hover:bg-white"
                  }`}
                >
                  {item.charAt(0) + item.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email"
                required
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#B45A2A] focus:ring-2 focus:ring-[#B45A2A]/10"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>

                <button
                  type="button"
                  className="text-xs font-medium text-[#B45A2A] hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 pr-12 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#B45A2A] focus:ring-2 focus:ring-[#B45A2A]/10"
                />

                <PasswordVisibilityToggle
                  visible={showPassword}
                  onChange={setShowPassword}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#B45A2A] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#984A22] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 border-t border-gray-100 pt-6 text-center">
            <p className="text-sm text-gray-500">Don&apos;t have an account?</p>

            <Link
              href="/register"
              className="mt-1 inline-block text-sm font-semibold text-[#B45A2A] hover:underline"
            >
              Create an account
            </Link>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-[#B45A2A]/20 bg-white/60 p-4">
          <p className="text-center text-xs font-semibold text-gray-600">
            Demo Credentials
          </p>

          <div className="mt-3 space-y-1 text-center text-xs text-gray-500">
            <p>Student: john@scm.com / student123</p>

            <p>Teacher: jane@scm.com / teacher123</p>
          </div>
        </div>
      </div>
    </main>
  );
}
