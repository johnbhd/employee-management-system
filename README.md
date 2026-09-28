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

The current UI remains a frontend prototype, but the repository now has a
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

The only API route currently implemented is the safe application-level
health check at `GET /api/v1/health`. The API response types live under
`src/types/api/`, and the browser-safe base client uses native `fetch` from
`src/lib/api/client.ts`. Existing pages continue to use their deterministic
mock data; no page has been migrated to a non-existent backend endpoint.

Firebase dependencies and initialization are intentionally not included yet.
The `src/lib/firebase/client/` and `src/lib/firebase/server/` directories mark
the future client/server boundary. Firebase Admin must remain server-only,
and private server variables must never use the `NEXT_PUBLIC_` prefix. The
root `.env.example` contains names only and separates client configuration
from server credentials; real `.env` files remain ignored.

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
