# ADMIN-INTEGRATION-NAV-005 — Admin Integration Navigation and Detail Pages

## Status

Completed

## Completed

2026-10-14

## A. Executive Summary

The IT Administrator portal now has centralized Workspace, Integrations, and
Administration navigation plus six dedicated technical integration detail
routes. The pages reuse the existing Admin integration-monitoring read model,
permission boundary, status vocabulary, and Admin visual components.

## B. Sidebar Before / After

The sidebar now presents:

- Workspace: Dashboard
- Integrations: Integration Monitoring, HRPS Integration, Bundy / Biometric
  ETL, QR Attendance, Unified Attendance, Payroll Integration, Accounting
  Integration
- Administration: User Accounts, Roles & Permissions, Audit Logs, System &
  Settings

The existing responsive, scrollable Admin sidebar remains the navigation
container, and active state is based on the canonical route.

## C. Routes Added

- `/admin/hrps-integration`
- `/admin/bundy-etl`
- `/admin/qr-attendance`
- `/admin/unified-attendance`
- `/admin/payroll-integration`
- `/admin/accounting-integration`

Existing Admin routes were preserved. No duplicate route was created.

## D. Dashboard and Monitoring Changes

Admin Dashboard integration health rows now link to their dedicated detail
pages. Dashboard configuration links and System & Settings integration cards
also use the domain-specific destinations. Integration Monitoring remains the
cross-system overview and its system cards/issues link to the relevant detail
page where one exists.

## E. Detail Page Coverage

All six pages use the shared `AdminIntegrationDetailPage` component with:

- current health, mode, provider, pending-operation, issue, and last-success
  values from the existing server read model;
- source/configuration boundary information;
- technical responsibility and ownership notes;
- persisted activity and technical issue tables;
- truthful loading, error, empty, not-configured, and unauthorized states;
- a refresh action that reuses `/api/admin/integration-monitoring`.

HRPS shows the existing employee/schedule reference boundary and reserves an
Import Source destination. Bundy reports its current not-configured state and
does not fake an ETL result. QR shows persisted QR write activity where
available. Unified Attendance shows the persisted standardized attendance
boundary without adding HR final verification. Payroll shows handoff and
returned-result status from the simulated adapter boundary. Accounting shows
transfer and acknowledgement status from the existing transfer boundary.

Full HRPS import, Bundy ETL/import, Payroll calculation, Accounting ERP,
journal, debit/credit, and General Ledger functionality were not implemented.

## F. Authorization and Architecture

Each route reuses `requireRoleContext("admin")` and the existing
`admin.integration_monitoring.view` permission. No new permission key, API
route, database boundary, or direct browser Firestore access was added. Route
files remain thin server loaders; interactive refresh and presentation live in
the shared client component.

## G. Files / Areas Changed

- centralized Admin navigation data and section rendering;
- Admin sidebar and layout styles;
- Admin Dashboard and System & Settings destination links;
- integration monitoring read-model detail links;
- six Admin route files and six loading files;
- shared Admin integration detail/loading components;
- Admin integration detail styles and global style import;
- `Workflows/STATE.md`, `Workflows/context/HANDOFF.md`, and this record.

## H. Data Integrity

- No mock integration records introduced.
- No fake success state introduced.
- No localStorage business source of truth introduced.
- Missing data remains Unknown, Not Configured, Unavailable, or an explicit
  empty state according to the existing read model.

## I. Verification

- PASS — `npm.cmd exec -- tsc --noEmit`
- PASS — `npm.cmd run lint` with one pre-existing warning in
  `src/server/repositories/payroll/payslip.repository.ts`
- PASS — `npm.cmd run build`; all six new Admin routes appear in the App Router
  route manifest
- PASS — `git diff --check`
- PASS — unauthenticated smoke check returned `307` for each new route,
  confirming the existing login redirect guard
- NOT RUN — authenticated browser interaction, visual inspection, keyboard
  walkthrough, and responsive viewport checks

## J. Environment Limitations

No authenticated Firebase session or browser/device verification was available
in this environment. The implementation does not claim visual, responsive,
accessibility, or authenticated runtime coverage beyond static semantic review,
lint, build, and unauthenticated route smoke results.

## K. Follow-Up

`INTEGRATION-HRPS-006` — implement the real HRPS employee import and
synchronization workflow within the prepared technical page boundary.

## Git Reference

Not committed yet.

## Final Source-of-Truth Summary

```text
ADMIN-INTEGRATION-NAV-005 RESULT

Admin integration navigation: COMPLETE
HRPS Integration page: COMPLETE — real HRPS reference read model and import boundary prepared
Bundy / Biometric ETL page: COMPLETE — truthful not-configured technical boundary
QR Attendance page: COMPLETE — persisted QR write monitoring
Unified Attendance page: COMPLETE — persisted standardized attendance monitoring
Payroll Integration page: COMPLETE — handoff and result technical monitoring
Accounting Integration page: COMPLETE — transfer and acknowledgement monitoring
Dashboard detail links: COMPLETE
Integration Monitoring detail links: COMPLETE
Mock data introduced: NO
HR business CRUD added to Admin: NO
Payroll calculations added: NO
Accounting ERP functionality added: NO
Typecheck: PASS
Lint: PASS with one pre-existing warning
Build: PASS
Environment blockers: no authenticated browser/device verification
Next Task: INTEGRATION-HRPS-006
```
