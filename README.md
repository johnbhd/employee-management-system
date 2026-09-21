# AU Employee Management System

A Next.js frontend prototype for an employee management system at Angeles University (AU). The application provides a branded login experience, an employee dashboard, and an IT Administrator workspace for monitoring attendance and external-system integrations.

## Included Areas

- AU-branded login page
- Employee dashboard and responsive employee navigation
- Administrator dashboard
- HRPS integration monitoring
- Bundy / biometric ETL monitoring
- QR attendance monitoring
- Unified attendance processing and review views
- Shared responsive layouts, UI components, status badges, tables, and flow diagrams

## Technology

- Next.js 16 with the App Router
- React 19 and TypeScript
- CSS modules by feature area and shared design tokens
- Font Awesome icons
- Yarn 4

## Run Locally

```bash
cd frontend
yarn install
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in a browser.

## Project Scope

This repository currently contains a frontend prototype with mock data and UI-only interactions. Backend services, persistence, attendance policy enforcement, and live HRPS, biometric, QR, and other external integrations are not connected yet.
