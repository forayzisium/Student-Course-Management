"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type Admin = {
  id: number;
  name: string;
  email: string;
  status: string;
  isSuperAdmin: boolean;
};
type Invitation = {
  id: string;
  email: string;
  status: string;
  expiresAt: string;
};
type Audit = {
  id: number;
  actorId: number;
  email: string;
  action: string;
  createdAt: string;
};
type AccessData = {
  admins: Admin[];
  invitations: Invitation[];
  audit: Audit[];
  emailConfigured: boolean;
};
type Action = { path: string; label: string; email: string; invite?: boolean };

export default function AdminAccessSection() {
  const { token } = useAuth();
  const [canManage, setCanManage] = useState(false);
  const [data, setData] = useState<AccessData | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [action, setAction] = useState<Action | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    const capability = await apiFetch<{ canManage: boolean }>(
      "/admin-access/capabilities",
      {
        token,
        skipAuthRedirect: true,
      },
    );
    const access = capability.canManage
      ? await apiFetch<AccessData>("/admin-access", {
          token,
          skipAuthRedirect: true,
        })
      : null;
    return { canManage: capability.canManage, access };
  }, [token]);

  useEffect(() => {
    let active = true;
    load()
      .then((result) => {
        if (active && result) {
          setCanManage(result.canManage);
          setData(result.access);
        }
      })
      .catch(() => {
        if (active)
          setError("Unable to load admin access. Please refresh to retry.");
      });
    return () => {
      active = false;
    };
  }, [load]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!action || !token || busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await apiFetch<{ message: string }>(action.path, {
        method: "POST",
        token,
        skipAuthRedirect: true,
        body: JSON.stringify({
          currentPassword: password,
          ...(action.invite ? { email: action.email } : {}),
        }),
      });
      setMessage(result.message);
      setAction(null);
      setEmail("");
      const resultData = await load();
      if (resultData) {
        setCanManage(resultData.canManage);
        setData(resultData.access);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "The action failed.");
      const resultData = await load().catch(() => undefined);
      if (resultData) {
        setCanManage(resultData.canManage);
        setData(resultData.access);
      }
    } finally {
      setBusy(false);
      setPassword("");
    }
  }

  function choose(next: Action) {
    setAction(next);
    setPassword("");
    setError("");
    setMessage("");
  }

  if (!canManage)
    return error ? (
      <p role="alert" className="my-5 text-sm text-red-700">
        {error}
      </p>
    ) : null;

  return (
    <section
      id="admin-access"
      className="my-8 min-w-0 rounded-2xl bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-serif text-2xl font-bold text-[#333333]">
            Admin Access
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Invite a Gmail address to manage SCM. Only the superadmin can change
            access.
          </p>
        </div>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
          Superadmin only
        </span>
      </div>
      {message && (
        <p
          role="status"
          className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800"
        >
          {message}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {!data ? (
        <p className="mt-4 text-sm text-gray-500">Loading access details…</p>
      ) : (
        <>
          {!data.emailConfigured && (
            <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              Email invitations are not set up yet. Ask the server administrator
              to configure email delivery. You can still review and revoke
              access below.
            </p>
          )}
          <form
            className="mt-5 flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
            onSubmit={(event) => {
              event.preventDefault();
              choose({
                path: "/admin-access/invitations",
                label: "Send invitation",
                email: email.trim().toLowerCase(),
                invite: true,
              });
            }}
          >
            <label className="min-w-0 flex-1 text-sm font-medium text-gray-700">
              Gmail address
              <input
                type="email"
                required
                pattern="[a-zA-Z0-9][a-zA-Z0-9.+_\-]*@gmail\.com"
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value.toLowerCase())}
                placeholder="name@gmail.com"
                disabled={busy}
                className="mt-2 block w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-[#B45A2A]"
              />
            </label>
            <button
              disabled={!data.emailConfigured || busy}
              className="w-full rounded-lg bg-[#B45A2A] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto"
            >
              Invite admin
            </button>
          </form>
          <p className="mt-2 break-words text-xs text-gray-500">
            Invitations expire in 24 hours. Accepting gives full ordinary admin
            access and replaces any existing student or teacher role.
          </p>

          {action && (
            <form
              onSubmit={submit}
              className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4"
            >
              <h3 className="break-words font-semibold text-gray-900">
                {action.label}: {action.email}
              </h3>
              <p className="mt-1 break-words text-sm text-gray-700">
                {action.invite
                  ? "The recipient must verify their email by accepting the invitation."
                  : "This takes effect immediately. Revoking admin access also signs the account out."}
              </p>
              <label className="mt-3 block text-sm font-medium text-gray-700">
                Your superadmin password
                <input
                  autoFocus
                  type="password"
                  autoComplete="current-password"
                  required
                  maxLength={256}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={busy}
                  className="mt-2 block w-full max-w-md rounded-lg border border-gray-300 bg-white px-3 py-2"
                />
              </label>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button
                  disabled={busy}
                  className="w-full rounded-lg bg-[#B45A2A] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto"
                >
                  {busy ? "Please wait…" : action.label}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setAction(null);
                    setPassword("");
                  }}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <h3 className="mt-7 font-semibold text-gray-900">Current admins</h3>
          <div className="mt-2 divide-y divide-gray-100">
            {data.admins.map((admin) => (
              <div
                key={admin.id}
                className="flex flex-wrap items-center justify-between gap-3 py-4"
              >
                <div className="min-w-0">
                  <p className="break-words font-medium text-gray-800">
                    {admin.name}
                  </p>
                  <p className="break-all text-sm text-gray-500">
                    {admin.email}
                  </p>
                </div>
                <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:justify-end">
                  <span className="break-words text-xs text-gray-600">
                    {admin.isSuperAdmin
                      ? "Superadmin · Protected"
                      : admin.status === "ACTIVE"
                        ? "Active admin"
                        : "Access revoked"}
                  </span>
                  {!admin.isSuperAdmin && admin.status === "ACTIVE" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        choose({
                          path: `/admin-access/admins/${admin.id}/revoke`,
                          label: "Revoke access",
                          email: admin.email,
                        })
                      }
                      className="w-full rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50 sm:w-auto"
                    >
                      Revoke access
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <h3 className="mt-6 font-semibold text-gray-900">Invitations</h3>
          {!data.invitations.length && (
            <p className="mt-2 text-sm text-gray-500">No invitations yet.</p>
          )}
          <div className="mt-2 divide-y divide-gray-100">
            {data.invitations.map((invite) => (
              <div
                key={invite.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="break-all text-sm font-medium text-gray-800">
                    {invite.email}
                  </p>
                  <p className="break-words text-xs text-gray-500">
                    Expires {new Date(invite.expiresAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:justify-end">
                  <span className="break-words text-xs text-gray-600">
                    {invite.status.replaceAll("_", " ")}
                  </span>
                  {invite.status === "PENDING" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        choose({
                          path: `/admin-access/invitations/${invite.id}/revoke`,
                          label: "Revoke invitation",
                          email: invite.email,
                        })
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs disabled:opacity-50 sm:w-auto"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <details className="mt-6 border-t border-gray-100 pt-4">
            <summary className="cursor-pointer text-sm font-semibold text-gray-800">
              Recent access activity
            </summary>
            {!data.audit.length && (
              <p className="mt-3 text-sm text-gray-500">
                No access changes recorded yet.
              </p>
            )}
            <ul className="mt-3 space-y-3">
              {data.audit.map((entry) => (
                <li
                  key={entry.id}
                  className="break-words text-xs text-gray-600"
                >
                  <span className="font-medium">
                    {entry.action.replaceAll("_", " ")}
                  </span>{" "}
                  · <span className="break-all">{entry.email}</span> · User #
                  {entry.actorId}
                  <br />
                  {new Date(entry.createdAt).toLocaleString()}
                </li>
              ))}
            </ul>
          </details>
        </>
      )}
    </section>
  );
}
