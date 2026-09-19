# Admin access

The dashboard contains Admin Access for the existing owner. Superadmin is an explicit database permission (`User.isSuperAdmin`), not an email comparison. Ordinary admins cannot invite admins or revoke access. The old direct-create endpoints return 410.

## Setup

From `backend`:

```powershell
npx prisma db push --config prisma7.config.ts
npx prisma generate --config prisma7.config.ts
npx tsx scripts/setup-admin-access.ts admin@scm.com
```

The setup script only marks an existing active ADMIN as the owner; it will not create a user or choose a password. It refuses to replace a different existing superadmin. Restart the backend after generating Prisma. The dashboard checks current permissions, so the owner does not need to clear browser storage.

Set these backend environment variables without exposing them to frontend code:

```dotenv
RESEND_API_KEY=your-resend-api-key
ADMIN_INVITE_FROM=SCM <invitations@your-verified-domain.com>
FRONTEND_URL=http://localhost:3000
```

Use a verified Resend sender and an HTTPS frontend origin in production. `FRONTEND_URL` must be an origin without a path, query or fragment. A public deployment needs a public URL accessible to recipients. Email delivery uses the [Resend HTTP API](https://resend.com/docs/api-reference/emails/send-email) through Node's built-in fetch; no additional npm packages are required. Failed delivery invalidates the invitation and reports an error rather than exposing a usable link in the dashboard.

## Behavior

- The superadmin enters a Gmail address and confirms their current password. The link expires in 24 hours and is single-use.
- Possession of the emailed secret verifies access to the invited mailbox. This is email-link verification, not Google OAuth or MFA.
- New recipients choose a username and a password of at least 12 characters (at most 72 UTF-8 bytes). Existing active recipients must enter their existing password. An existing account is promoted to ADMIN; its student/teacher profile records are preserved but the old role is replaced.
- Tokens are generated with 256 bits of randomness. Only SHA-256 hashes are stored. The link carries its token in a URL fragment; the acceptance page removes the fragment and sends the secret only in the POST body. Reopening the email link is necessary after a refresh.
- Revocation disables an admin account and increments its session version. Middleware checks current role, status and version on every authenticated request. It is not possible to revoke the superadmin in this interface.
- Inactive accounts cannot accept invitations. Restoring a revoked admin requires a separate reviewed administrative operation; this UI does not silently reactivate accounts.
- Creation, acceptance, delivery failure and revocation are recorded in an audit table. The UI shows the latest 100 invitations and 50 audit entries; records remain in the database.
- Password confirmation attempts and invitation acceptance have bounded per-process rate limits. For multiple replicas, configure a shared rate limiter at the gateway. Do not enable untrusted proxy forwarding globally.

## Validation

```powershell
npx tsc --noEmit
```

Before production, verify email delivery with your provider and require MFA through an identity provider. MFA and Google sign-in are not implemented by this change. Never log request bodies for invitation acceptance or password confirmation.
