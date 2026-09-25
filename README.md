# Student Course Management System

A full-stack course administration platform with separate student, teacher, and administrator experiences. It supports course and semester management, enrollment and fee tracking, assignments and file submissions, attendance, grades, payments, role-based authentication, admin invitations, activity updates, and an optional AI study assistant.

## Tech stack

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- Backend: Node.js, Express 5, TypeScript
- Database: MySQL-compatible database, Prisma 7, MariaDB driver adapter
- Authentication: bearer JWTs and bcrypt password hashing
- Optional services: Google Gemini and Resend

## Repository layout

```text
Student-Course-Mngment/
├── backend/                 Express API, Prisma schema and migrations
│   ├── prisma/              Schema, migration history and seed utilities
│   ├── scripts/             Administrative setup utilities
│   └── src/                 API source code
├── frontend/                Next.js application
│   ├── app/                 App Router pages and layouts
│   ├── components/          Shared and role-specific UI
│   └── lib/                 API, authentication and domain helpers
└── README.md
```

## Prerequisites

- Node.js 20.19 or newer (Node.js 22 LTS is recommended)
- npm
- A MySQL-compatible database

## Local setup

### Backend

```bash
cd backend
npm ci
cp .env.example .env
npm run prisma:generate
npm run prisma:validate
```

Edit `backend/.env` with local credentials. For a new development database, create and review a migration with Prisma rather than using production commands blindly:

```bash
npx prisma migrate dev --config prisma7.config.ts
npm run dev
```

The API starts at `http://localhost:5000` by default. `GET /` is a process health endpoint and `GET /api/health/db` checks database connectivity.

### Frontend

```bash
cd frontend
npm ci
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. By default the browser calls same-origin `/api` routes, and Next.js proxies them to `BACKEND_URL`.

## Environment variables

Never commit real `.env` files. Use the checked-in examples only as templates.

### Backend

| Name | Required | Purpose |
| --- | --- | --- |
| `NODE_ENV` | Yes | Use `production` in deployment. |
| `PORT` | Platform-provided | HTTP port; defaults to `5000` locally. |
| `DATABASE_URL` | Yes | MySQL URL used by Prisma validation and migrations. |
| `DB_HOST` | Yes | Runtime database host. |
| `DB_PORT` | Yes | Runtime database port, normally `3306`. |
| `DB_USER` | Yes | Runtime database user. |
| `DB_PASSWORD` | Yes | Runtime database password. |
| `DB_NAME` | Yes | Runtime database name. |
| `JWT_SECRET` | Yes | Long random JWT signing secret. |
| `FRONTEND_URL` | Yes | Exact allowed frontend origin and invitation-link origin. |
| `GEMINI_API_KEY` | For AI features | Google Gemini API key. |
| `RESEND_API_KEY` | For invitations | Resend API key. |
| `ADMIN_INVITE_FROM` | For invitations | Verified sender address. |

`FRONTEND_URL` must be a single origin such as `https://scm.example.com`, without a path. Localhost origins are allowed automatically only outside production.

### Frontend

| Name | Required | Purpose |
| --- | --- | --- |
| `BACKEND_URL` | Yes | Server-side backend origin, such as `https://scm-api.onrender.com`. |
| `NEXT_PUBLIC_API_URL` | No | Public backend `/api` URL if intentionally bypassing the same-origin proxy. |

Prefer `BACKEND_URL` and the same-origin proxy. If `NEXT_PUBLIC_API_URL` is set, it is embedded into browser code and its origin must be accepted by the backend CORS policy.

## Database and Prisma

The schema is in `backend/prisma/schema.prisma`; committed migrations are in `backend/prisma/migrations`. Keep both under version control.

Useful backend commands:

```bash
npm run prisma:generate
npm run prisma:validate
npm run db:migrate:deploy
```

Use `npm run db:migrate:deploy` for production. It applies committed migrations without creating new ones. Do not run `prisma migrate reset` against an existing or production database.

The seed scripts create known demonstration accounts and overwrite matching demo passwords. Run them only in disposable development/demo databases, never as an automatic production deployment step.

## Development and verification

Run commands from the relevant application directory.

| Application | Command | Purpose |
| --- | --- | --- |
| Backend | `npm run dev` | Start the API with file watching. |
| Backend | `npm run build` | Generate Prisma Client and compile TypeScript. |
| Backend | `npm start` | Start `dist/server.js`. |
| Backend | `npm run format:check` | Check formatting. |
| Frontend | `npm run dev` | Start Next.js development mode. |
| Frontend | `npm run lint` | Run ESLint. |
| Frontend | `npm run build` | Create a production build. |
| Frontend | `npm start` | Serve the production build. |

No automated unit/integration test script is currently defined in either package.

## Production deployment

### Frontend on Vercel

- Root directory: `frontend`
- Install command: `npm ci`
- Build command: `npm run build`
- Output: Next.js (auto-detected)
- Environment variable: `BACKEND_URL=https://<render-service-host>`

Redeploy the frontend after changing `BACKEND_URL`.

### Backend on Render

- Runtime: Node
- Root directory: `backend`
- Node version: 22 LTS (or any version satisfying `>=20.19`)
- Build command: `npm ci && npm run build`
- Pre-deploy command: `npm run db:migrate:deploy`
- Start command: `npm start`
- Health-check path: `/`

Configure every required backend variable in Render. Keep the database credentials and API keys secret. `PORT` is supplied by Render.

### Hosted MySQL

Create a production database and a least-privilege application user. Configure both `DATABASE_URL` and the `DB_*` variables for that same database, ensure the provider accepts connections from Render, back it up, then run the non-destructive production migration command.

### Uploaded assignment files

Submissions are currently stored under `backend/uploads/`. Render's default filesystem is ephemeral, so files can disappear during deploys or restarts. Attach a persistent disk mounted at the service's `backend/uploads` path before enabling submissions in production. For horizontal scaling, move this feature to object storage (for example, S3-compatible storage) before running multiple backend instances.

## Security notes

- `.env` files, generated Prisma Client code, dependencies, builds, logs, and uploads are ignored by Git.
- Use a unique, high-entropy `JWT_SECRET` in each environment and rotate it if exposed.
- Development-only diagnostic routes are disabled unless `NODE_ENV=development`.
- JWTs are stored by the current frontend in browser local storage. Continue to treat any script injection issue as security-critical.
- Demo seed credentials are public by design; never seed them into production.
- Configure HTTPS origins in production and restrict database network access.

See [backend/ADMIN_ACCESS.md](backend/ADMIN_ACCESS.md) for administrator invitation configuration.

## Troubleshooting

- **CORS rejection:** make sure `FRONTEND_URL` exactly matches the deployed browser origin, including `https://` and excluding a trailing slash/path.
- **Frontend API errors:** confirm Vercel's `BACKEND_URL` points to the Render origin without `/api`; the rewrite adds `/api`.
- **Prisma generation errors:** use a supported Node.js version and run `npm ci` before `npm run prisma:generate`.
- **Database migration errors:** confirm `DATABASE_URL` is a valid MySQL URL and review migration status before retrying.
- **Files disappear:** verify a persistent disk is mounted for `backend/uploads` or migrate uploads to object storage.
