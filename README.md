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

## Project Scope

The current application is a frontend prototype with deterministic mock data
and UI-only interactions. Backend services, persistence, authentication,
attendance policy enforcement, and live HRPS, biometric, QR, payroll, and
accounting integrations are not connected yet. The repository is now
structured at the root so backend services can be added alongside the Next.js
application later.
