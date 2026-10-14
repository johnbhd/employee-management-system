# SYSTEM-UI-CLEAN-003 — Production UI Wording Cleanup

## Status

Completed

## Completed

2026-10-14

## Original Goal

Remove obsolete prototype, demo, sample, mock, and developer-only wording from
the Employee, HR, Payroll, Accounting, Admin, and shared portal UI while
retaining truthful operational states such as simulated integrations,
unavailable data, pending work, read-only boundaries, and configuration gaps.

## Implementation Summary

- Rewrote the shared scanner manual fallback and camera error to describe
  manual entry and the real attendance validation flow without development-only
  wording.
- Reworded Payroll adapter failure/provider messages to retain the real
  simulated boundary without presenting it as a development implementation.
- Removed backend implementation commentary from Employee announcements,
  Payroll batches, Admin dashboard, Admin RBAC, and Admin account empty states.
- Removed the unused Admin dashboard `preview-strip` CSS and a stale source
  prototype comment from the login stylesheet.
- Preserved operational status language: `Simulated`, `Not Configured`,
  `Pending`, `Failed`, `Read-only`, `Unavailable`, and `Not yet available`.
- Preserved the seed-only `prototype-auth` naming and development seed markers;
  those are used by Firebase seed scripts and are not production UI.

## Files / Areas Changed

- `src/components/scanner/ScannerPage.tsx`
- `src/components/scanner/ScannerCamera.tsx`
- `src/server/payroll/integration/payroll-integration-adapter.ts`
- `src/components/admin/pages/AdminDashboardPage.tsx`
- `src/components/admin/pages/UserAccountsHrpsPage.tsx`
- `src/components/admin/roles-permissions/RolesPermissionsManager.tsx`
- `src/components/employee/announcements/EmployeeAnnouncementsPage.tsx`
- `src/components/employee/dashboard/EmployeeDashboardPage.tsx`
- `src/components/payroll/batches/PayrollBatchesPage.tsx`
- `src/app/styles/pages/admin/dashboard.css`
- `src/app/styles/pages/login.css`
- `Workflows/STATE.md`, `Workflows/context/HANDOFF.md`, and task state files

## Important Technical Decisions

- This was a wording and dead-style cleanup only; no route, API contract,
  persistence, authorization, integration mode, or business state was changed.
- `Simulated` remains visible in Payroll and Accounting surfaces because the
  configured external adapters are deterministic simulated adapters and no live
  provider credentials are configured.
- `Not yet available` remains for genuine Payroll payslip states, and
  `Not Configured` remains for genuine unavailable configuration boundaries.
- No new package, icon library, component abstraction, or visual redesign was
  introduced.

## Verification

- PASS — production UI term scan: `prototype`, `demo`, `sample`, `mock`,
  `testing`, `development`, `coming soon`, and `not yet implemented` each have
  zero matches under `src/app` and `src/components`.
- PASS — the three remaining `temporary` UI matches are password-provisioning
  security guidance; the six remaining `simulated` UI matches describe actual
  Payroll/Accounting adapter status.
- PASS — `git diff --check`.
- PASS — `npm.cmd run lint`; zero errors and one pre-existing warning for the
  unused `getNullableString` helper in
  `src/server/repositories/payroll/payslip.repository.ts:92`.
- PASS — `npm.cmd exec tsc -- --noEmit --pretty false`.
- PASS — `npm.cmd run build`; Next.js 16.3.5 compiled and generated the current
  application route graph.
- NOT AVAILABLE — browser, visual, responsive, keyboard, accessibility, and
  runtime smoke review; no browser/device runner was available in this turn.

## Known Limitations

The static `employee-html` reference and development seed files remain outside
the production UI scope. Firebase-authenticated behavior and live external
Payroll/Accounting provider behavior were not exercised during this wording
cleanup.

## Follow-Up

No unfinished implementation remains for this task. Existing project follow-up
is still `SYSTEM-FIX-002` for server-authoritative HR final verification and
Payroll readiness.

## Git Reference

`732f1f0 chore: clean production UI wording`
