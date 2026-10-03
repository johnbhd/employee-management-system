# AU Employee Management System

A monorepo-ready Next.js application for integrating HRPS, Bundy / biometric,
QR attendance, payroll, and accounting workflows for Arellano University.

## Included Areas

- AU-branded login and employee self-service pages
- HR attendance monitoring and verification workflows
- Administrator integration monitoring workspaces
- HRPS, Bundy / biometric, QR, payroll, and accounting views
- Unified attendance, correction, audit, roles, settings, and account views
- Shared responsive shells, UI components, status badges, tables, and flow diagrams

## Technology

- Next.js 16 with the App Router
- React 19 and TypeScript
- Tailwind CSS 4 through PostCSS with project CSS under `src/app/styles/`
- Font Awesome icons through a shared `Icon` component
- Yarn 4

## Run Locally

```bash
yarn install
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in a browser.

## Repository Layout

- `src/` — Next.js routes, components, data, and types
- `public/` — static assets
- `Workflows/` — local project workflow and task context

## Full-Stack Architecture Preparation

The current UI remains a frontend prototype, and the repository now has a
clear boundary for gradual full-stack development:

```text
React UI
    ↓
src/lib/api/ client functions
    ↓
src/app/api/v1/ Route Handlers
    ↓
src/server/services/ business logic
    ↓
src/server/repositories/ data access
    ↓
src/lib/firebase/server/ Firebase Admin boundary
    ↓
Firestore / Firebase Authentication / Firebase Storage
```

The API boundary includes safe health checks, authenticated current-user
context, and the employee QR identity/scanner endpoints. The API response
types live under `src/types/api/`, and the browser-safe base client uses native
`fetch` from `src/lib/api/client.ts`. Existing feature pages continue to use
their deterministic mock data unless a task explicitly migrates them.

Firebase foundation initialization is now available under
`src/lib/firebase/client/` and `src/lib/firebase/server/`. The browser module
provides lazy singleton accessors for the Firebase App, Auth, and Firestore
services. The server module is protected by `server-only`, uses lazy singleton
Firebase Admin initialization, and keeps Admin credentials out of browser
code. Existing feature pages still use their deterministic mock data; no page
has been migrated to a Firebase-backed endpoint.

## Firebase Foundation Setup

Copy the example environment file before running Firebase-dependent checks:

```bash
cp .env.example .env.local
```

Fill the `NEXT_PUBLIC_FIREBASE_*` values with the Firebase Web App
configuration. These values are safe for browser configuration but still must
be configured for the intended Firebase project. Fill `FIREBASE_PROJECT_ID`,
`FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` with server-only service
account values. Never use the `NEXT_PUBLIC_` prefix for Admin credentials.

When entering `FIREBASE_PRIVATE_KEY` as a single Vercel or local environment
value, preserve escaped newline characters (`\\n`); the server initializer
normalizes them before creating the Admin credential. Configure the same
variables in Vercel under Project Settings → Environment Variables.

The existing health contract remains available at `GET /api/v1/health`. The
Firebase foundation check is available at `GET /api/v1/health/firebase` and
returns a safe `503` error response when server configuration is missing or
Firestore cannot be reached. It never returns credentials, stack traces, or
service-account details. The Firestore check reads the reserved
`_system/health` document without creating or modifying it.

The employee-specific QR identity flow uses a separate server-only HMAC secret.
Set `QR_ATTENDANCE_SIGNING_SECRET` in `.env.local` to a unique random value;
for example, generate one locally with `openssl rand -base64 32`. Never reuse
the Firebase private key, expose the value with `NEXT_PUBLIC_`, or commit the
real secret. Employees receive a QR from `/employee/attendance-qr`; HR staff
use `/hr/scanner`, and administrators use `/scanner`. The scanner
validates the QR through the server and shows safe employee identity
information without writing attendance records.

## Firebase Development Seeder

The repository includes a development-only Firebase Admin seeder that prepares
the current prototype account and HRPS employee reference data without changing
the application login flow. It is the Firebase equivalent of a small,
non-destructive `db:seed` command:

```bash
yarn firebase:seed --dry-run
yarn firebase:seed employees --dry-run
yarn firebase:seed users --dry-run
```

The default command runs `employees` before `users`. Selecting `users` also
runs the employee seeder first because seeded users may reference an employee.
The `employees` seeder writes deterministic `employees/{employeeId}` documents.
The `users` seeder reconciles Firebase Auth users with stable development UIDs
and writes matching `users/{uid}` documents. It never stores passwords in
Firestore, deletes records, or resets a collection. Re-running a write command
merges the same seed-owned fields instead of creating duplicates.

The prototype login remains unchanged. If a prototype password is shorter than
Firebase Email/Password Auth permits, the seed source uses a deterministic
development-only compatible variant for Auth creation; that password is never
stored in Firestore or printed by the seeder.

Dry-run mode is offline: it validates the local seed data and prints a summary
without connecting to or writing Firebase. A real write requires all of the
following server-only policy values in `.env.local`:

```text
FIREBASE_SEED_ENABLED=true
FIREBASE_SEED_ENVIRONMENT=development
FIREBASE_SEED_PROJECT_ID=<the intended Firebase project ID>
FIREBASE_SEED_CREDENTIAL_ROTATED=true
```

The final flag is an explicit safety gate because a previously exposed service
account key must be revoked and replaced before any seed write is enabled. Do
not set the write guard for production projects, and never commit `.env.local`
or service-account credentials. The seeder only prepares Firebase data; the
current prototype Login still does not read these Firebase users.

Before supplying environment values, create or select the Firebase project,
register the Web App, enable Cloud Firestore and the intended Authentication
provider, and create server credentials as needed. Transfer those values into
`.env.local` or Vercel manually. Firebase Hosting, Cloud Functions, open
Firestore rules, and feature-data migrations are outside this foundation task.

Server responsibilities are separated into `auth`, `services`,
`repositories`, `validators`, and external-system adapters under
`src/server/integrations/` for HRPS, Bundy, Payroll, and Accounting. These
directories are scaffolding only: no Firebase connection, production
authentication, Firestore collection, or external integration was added.

Future feature migration should follow this sequence:

```text
mock UI data → API contract → route handler → service → repository → Firebase
```

Server authentication, server-side authorization, input validation, safe API
errors, JSON-safe date serialization, and audit recording must be applied when
the corresponding backend feature is implemented. Browser role or identifier
values are never sufficient authorization. Passwords must belong to Firebase
Authentication rather than Firestore. Existing HRPS, Bundy, Payroll, and
Accounting systems remain external owners; Firebase is not their replacement.

## Project Scope

The current application is a frontend prototype with deterministic mock data
and UI-only interactions. Backend services, persistence, authentication,
attendance policy enforcement, and live HRPS, biometric, QR, payroll, and
accounting integrations are not connected yet. The repository is now
structured at the root so backend services can be added alongside the Next.js
application later.
