import { AccessError } from "./security";

export function mailConfiguration() {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.ADMIN_INVITE_FROM;
  const origin = process.env.FRONTEND_URL;
  if (!key || !from || !origin) return null;
  try {
    const url = new URL(origin);
    if (
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== "/"
    )
      return null;
    if (
      url.protocol !== "https:" &&
      !(
        url.protocol === "http:" &&
        ["localhost", "127.0.0.1"].includes(url.hostname)
      )
    )
      return null;
    return { key, from, origin: url.origin };
  } catch {
    return null;
  }
}

export async function sendInvitation(email: string, token: string, id: string) {
  const config = mailConfiguration();
  if (!config)
    throw new AccessError(
      503,
      "Email invitations are not configured. Configure RESEND_API_KEY, ADMIN_INVITE_FROM and FRONTEND_URL on the server.",
    );
  // A fragment keeps the secret out of URL request logs and Referer headers.
  const link = `${config.origin}/accept-admin-invite#token=${token}`;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.key}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `admin-invite-${id}`,
      },
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({
        from: config.from,
        to: [email],
        subject: "Your SCM admin invitation",
        text: `You have been invited to become an SCM admin. Accept within 24 hours:\n\n${link}\n\nThis link is private and can be used once. If you already have an SCM account, you must also enter its current password. If you did not expect this invitation, ignore it.`,
      }),
    });
    if (!response.ok) throw new Error("Delivery rejected");
  } catch {
    throw new AccessError(
      502,
      "Email could not be sent. Check the email provider configuration and send a new invitation.",
    );
  }
}
