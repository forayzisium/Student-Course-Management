# Student section modernization

The student layout maintains one authenticated fetch-based SSE connection. The server sends invalidations after successful mutations; visible pages refresh their data. Reconnects, tab focus and a two-minute fallback recover missed events. Tokens are sent in the Authorization header, never in URLs. Streams reconnect through normal session validation every two minutes.

The event bus is process-local. A deployment with multiple backend instances needs a shared publisher such as Redis for immediate cross-instance updates; the fallback still reconciles records. Database changes made outside the API are detected by the fallback, not immediately.

Course progress is submitted active assignments divided by active assignments. The enrolled course hub scopes assignments, attendance and grades to the authenticated student. Missing descriptions and syllabus content are labeled as unpublished. Administrators can edit course metadata under Courses.

Results use stored credits and support semester filtering. Cumulative CGPA includes recorded course grades; the schema does not distinguish provisional from finalized grades or model retake replacement rules. Verify imported credits rather than assuming the existing three-credit default is academically correct. Late attendance counts as attended; on-time attendance is reported separately.

Payments are manual claims for transfers already made outside the portal. Each fee requires its own external reference. Claims remain PENDING until an administrator verifies them; no payment gateway or simulated settlement is enabled. Pending claims reserve the payable amount but do not reduce outstanding debt. Reusing an identical reference is idempotent, references cannot be reassigned, and fee-row locking protects concurrent claims. Approved payments determine the remaining balance.

The connected database already contained the new schema fields. Native varchar lengths and the transaction reference index mapping were aligned to that database; Prisma reported an empty schema diff. No database records were modified. Prisma Client was regenerated. For a separate environment, review its schema diff before deploying these fields.

Verification commands (from backend):

```
npm test
npm run build
npx prisma validate --config prisma7.config.ts
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script --config prisma7.config.ts
```

From frontend: `npx tsc --noEmit`, `npm run lint`, and `npm run build`.
