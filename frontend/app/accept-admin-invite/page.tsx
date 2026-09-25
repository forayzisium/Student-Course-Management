"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

export default function AcceptAdminInvitePage() {
  const [token, setToken] = useState("");
  const [ready, setReady] = useState(false);
  const [existing, setExisting] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const tokenRead = useRef(false);
  useEffect(() => {
    if (tokenRead.current) return;
    tokenRead.current = true;
    const value =
      new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "";
    // Read the browser-only secret after hydration, then remove it from the URL.
    setToken(value);
    setReady(true);
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  async function accept(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await apiFetch<{ message: string }>(
        "/admin-invitations/accept",
        {
          method: "POST",
          skipAuthRedirect: true,
          body: JSON.stringify({
            token,
            password,
            ...(existing ? {} : { name, username }),
          }),
        },
      );
      localStorage.removeItem("scm_token");
      localStorage.removeItem("scm_user");
      setMessage(result.message);
      setToken("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to accept invitation.",
      );
    } finally {
      setBusy(false);
      setPassword("");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#EAE6DC] p-5">
      <section className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium text-[#B45A2A]">
          SCM · Admin invitation
        </p>
        <h1 className="mt-2 font-serif text-3xl font-bold text-gray-900">
          Accept admin access
        </h1>
        {!ready ? (
          <p className="mt-4 text-gray-600">Loading invitation…</p>
        ) : message ? (
          <>
            <p role="status" className="mt-5 text-green-800">
              {message}
            </p>
            <a
              href="/login"
              className="mt-5 inline-block rounded-lg bg-[#B45A2A] px-5 py-3 text-white"
            >
              Sign in
            </a>
          </>
        ) : !/^[a-f0-9]{64}$/.test(token) ? (
          <p role="alert" className="mt-5 text-red-700">
            Open the complete invitation link from your email. If you refreshed
            this page, reopen the email link.
          </p>
        ) : (
          <>
            <p className="mt-3 text-sm text-gray-600">
              This grants access to SCM administration. If you already have a
              student or teacher account, accepting replaces that role with
              admin access.
            </p>
            <form onSubmit={accept} className="mt-5 space-y-4">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={existing}
                  onChange={(e) => {
                    setExisting(e.target.checked);
                    setPassword("");
                  }}
                  disabled={busy}
                />
                I already have an SCM account
              </label>
              {!existing && (
                <>
                  <label className="block text-sm text-gray-700">
                    Full name
                    <input
                      required
                      maxLength={100}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={busy}
                      autoComplete="name"
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5"
                    />
                  </label>
                  <label className="block text-sm text-gray-700">
                    Username
                    <input
                      required
                      pattern="[a-zA-Z0-9_]{3,40}"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={busy}
                      autoComplete="username"
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5"
                    />
                    <span className="text-xs text-gray-500">
                      3–40 letters, numbers or underscores.
                    </span>
                  </label>
                </>
              )}
              <label className="block text-sm text-gray-700">
                {existing ? "Your current SCM password" : "Choose a password"}
                <input
                  required
                  type="password"
                  minLength={existing ? 1 : 12}
                  maxLength={72}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={busy}
                  autoComplete={existing ? "current-password" : "new-password"}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5"
                />
                {!existing && (
                  <span className="text-xs text-gray-500">
                    Use at least 12 characters.
                  </span>
                )}
              </label>
              {error && (
                <p role="alert" className="text-sm text-red-700">
                  {error}
                </p>
              )}
              <button
                disabled={busy}
                className="w-full rounded-lg bg-[#B45A2A] px-4 py-3 font-semibold text-white disabled:opacity-50"
              >
                {busy ? "Accepting…" : "Accept invitation"}
              </button>
            </form>
          </>
        )}
        <Link
          href="/"
          className="mt-5 inline-block text-sm text-gray-600 underline"
        >
          Back to SCM
        </Link>
      </section>
    </main>
  );
}
