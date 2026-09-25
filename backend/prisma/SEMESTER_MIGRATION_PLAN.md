# Semester relation migration plan

## Phase 1: deploy the compatibility migration

1. Back up the database.
2. Deploy the backend containing the `Semester` model and dual-write course service.
3. Run `npx prisma migrate deploy` from `backend/`.
4. Run `npm run seed` if the standard Spring/Fall terms are desired.
5. Restart the backend and verify `GET /api/semesters` and `GET /api/courses`.

The migration creates one Semester row for every distinct legacy `courses.semester`
value. Blank values map to `Default Semester`. It then fills `courses.semesterId`,
makes it required, and adds a restrictive foreign key. Existing display text is
therefore preserved without orphaning courses.

During this phase, `semesterId` is authoritative. The deprecated `semester` text
column remains as a compatibility projection and is updated whenever a course is
created, moved, or its Semester is renamed.

## Phase 2: migrate consumers

- Send `semesterId` for all course creates and updates.
- Read `semesterRecord.name` for display.
- Use `?semesterId=<id>` when filtering course endpoints.
- Confirm no external client relies on the legacy `semester` property.

## Phase 3: remove the compatibility column

After all consumers are migrated, create a second Prisma migration that removes
`Course.semester` from the schema and drops `courses.semester`. Do not execute the
commented `DROP COLUMN` in the first migration during a rolling deployment.

## Rollback

Before Phase 3, rollback is safe because the original text column remains populated.
Drop the foreign key/index/`semesterId` and then the `semesters` table only after
restoring the pre-migration application version.
