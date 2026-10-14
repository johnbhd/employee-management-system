# SYSTEM-CLEAN-002 — Confirmed Prototype and Dead-Code Cleanup

## Status

Completed

## Completed

2026-10-14

## Original Goal

Remove only the prototype, static fixture, obsolete local-state, dead route,
dead component, and stale navigation code that SYSTEM-RECON-001 proved was not
part of the real integrated AU-JSC workflows. Preserve server authority,
historical data, seed data, and approved Payroll/Accounting simulation.

## Implementation Summary

- Removed seven legacy Admin integration page routes: HRPS Integration, Bundy /
  Biometric ETL, QR Attendance, Unified Attendance, Payroll Integration,
  Accounting Integration, and Integration Errors.
- Removed their static workspaces, sample tables, prototype data modules,
  obsolete page styles, and the now-unused `FilterableTable` component.
- Reduced Admin navigation to the real dashboard, monitoring, accounts, RBAC,
  audit, and settings routes. Monitoring/settings deep links now target the
  real Integration Monitoring boundary.
- Removed the unused HR `HrWorkflowProvider`, client-only verification/audit
  records, obsolete HR static data modules, and the unused verification dialog.
  The active HR pages remain server-backed; HR final verification itself remains
  a follow-up implementation task.
- Removed the unused Employee QR demo hook/storage utility.
- Removed seeded Employee dashboard metrics, static payslip values, and static
  announcement cards from the dashboard. Unsupported dashboard content now
  shows truthful unavailable guidance. The announcements route remains as a
  truthful no-source state rather than rendering stale static notices.
- Removed the fake Employee support submission form and hardcoded support
  reference. Help & Support is now guidance-only and explicitly says that no
  external ticket is submitted.
- Kept Employee settings localStorage because it stores non-authoritative,
  device-only preferences; removed its simulated next-tick delay.
- Preserved Firebase seed employee data, development seed accounts, server
  repositories/services, canonical audit/RBAC/settings, and deterministic
  Payroll/Accounting integration adapters.

## Files / Areas Changed

45 obsolete/prototype files were deleted and 26 application/workflow files were
updated, with one new HR dashboard UI type module. Changes cover Admin legacy
routes and styles, HR static workflow remnants, Employee dashboard/help/settings
surfaces, shared navigation copy, Admin monitoring/settings links, and current
workflow/state records.

## Important Technical Decisions

- Static Admin pages were safe to remove because their routes, navigation links,
  components, and data were isolated and SYSTEM-RECON-001 identified them as
  reachable sample workspaces with no live source or mutation contract.
- HRPS employee seed data was retained because Firebase seed scripts import it;
  it is development seed data, not a production fallback.
- Device-local Employee preferences were retained as explicitly non-authoritative
  UX state. Authentication, roles, permissions, attendance, Payroll, Accounting,
  and audit data remain server-authoritative.
- No P1 workflow was implemented inside cleanup. HR final verification,
  Employee correction submission, and HR direct-route guards remain separate
  follow-up tasks.

## Verification

- PASS — `npm.cmd exec tsc -- --noEmit`.
- PASS — `npm.cmd run build`; Next.js 16.3.5 compiled and emitted the reduced
  route graph without the removed Admin routes.
- PASS — `npm.cmd run lint`; zero errors and one pre-existing warning for the
  unused `getNullableString` helper in
  `src/server/repositories/payroll/payslip.repository.ts:92`.
- PASS — `git diff --check`.
- PASS — repository reference scans found no imports or source links to the
  removed legacy Admin routes, HR workflow provider, Employee QR demo, or
  removed static data modules.
- NOT RUN — authenticated Firebase persistence and cross-role API checks;
  Email/Password is disabled in the configured Firebase project.
- NOT AVAILABLE — browser, visual, responsive, keyboard/accessibility, device,
  and live external HRPS/Bundy/Payroll/Accounting provider checks.

## Known Limitations

The application is not integration-complete. Server-authoritative HR final
verification, Employee correction submission, and direct HR directory/schedule
permission checks remain unresolved from SYSTEM-RECON-001. Payroll and
Accounting external adapters remain intentionally simulated, HRPS remains a
local Firestore reference boundary, and Bundy remains not configured.

## Follow-Up

Start with `SYSTEM-FIX-002` to persist HR final verification and close the
Payroll readiness boundary. Then complete `HR-CORR-002`, `SYSTEM-SEC-004`, and
the later status/DTO consistency work.

## Git Reference

`chore: remove confirmed prototype residue` (final commit recorded in Git history)
