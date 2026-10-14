# SYSTEM-API-005 — Remove `/v1` From Internal API Routes

## Status

Completed.

## Completed

2026-10-14.

## A. Executive Summary

The active application now uses one canonical internal API namespace:
`/api/...`. The physical Next.js Route Handler tree moved from
`src/app/api/v1/` to `src/app/api/`, and all active browser/API consumers and
current README endpoint references were updated. No parallel `/api/v1` route
handlers, redirect aliases, compatibility proxies, or version negotiation were
left behind.

This was a route migration only. Authentication, RBAC, ownership validation,
request validation, response DTOs, Firebase boundaries, and external adapter
responsibilities were preserved.

## B. Route Migration Count

| Measure | Result |
| --- | --- |
| Route Handler files inspected | 40 |
| Route Handler files migrated | 40 |
| Route Handler files unchanged | 0 |
| API method implementations migrated | All methods in the 40 handlers |
| External callbacks found | None |
| Compatibility exceptions | None |
| Existing destination collisions | None; `src/app/api` contained only `v1` |

## C. Old → New Route Matrix

Every listed route moved by removing only the internal `v1` segment.

| Old | New |
| --- | --- |
| `/api/v1/me` | `/api/me` |
| `/api/v1/auth/session` | `/api/auth/session` |
| `/api/v1/health` | `/api/health` |
| `/api/v1/health/firebase` | `/api/health/firebase` |
| `/api/v1/attendance/me/today` | `/api/attendance/me/today` |
| `/api/v1/attendance/me/history` | `/api/attendance/me/history` |
| `/api/v1/attendance/qr` | `/api/attendance/qr` |
| `/api/v1/attendance/qr/resolve` | `/api/attendance/qr/resolve` |
| `/api/v1/hr/dashboard/summary` | `/api/hr/dashboard/summary` |
| `/api/v1/hr/audit-history` | `/api/hr/audit-history` |
| `/api/v1/hr/attendance-corrections/[requestId]` | `/api/hr/attendance-corrections/[requestId]` |
| `/api/v1/payroll/dashboard` | `/api/payroll/dashboard` |
| `/api/v1/payroll/verified-attendance` | `/api/payroll/verified-attendance` |
| `/api/v1/payroll/batches` | `/api/payroll/batches` |
| `/api/v1/payroll/batches/[batchId]` | `/api/payroll/batches/[batchId]` |
| `/api/v1/payroll/batches/[batchId]/items` | `/api/payroll/batches/[batchId]/items` |
| `/api/v1/payroll/batches/[batchId]/items/[employeePeriodId]` | `/api/payroll/batches/[batchId]/items/[employeePeriodId]` |
| `/api/v1/payroll/handoffs` | `/api/payroll/handoffs` |
| `/api/v1/payroll/handoffs/[transferId]` | `/api/payroll/handoffs/[transferId]` |
| `/api/v1/payroll/history` | `/api/payroll/history` |
| `/api/v1/payroll/history/[batchId]` | `/api/payroll/history/[batchId]` |
| `/api/v1/payroll/results` | `/api/payroll/results` |
| `/api/v1/payroll/results/[resultId]` | `/api/payroll/results/[resultId]` |
| `/api/v1/accounting/approved-payroll` | `/api/accounting/approved-payroll` |
| `/api/v1/accounting/dashboard` | `/api/accounting/dashboard` |
| `/api/v1/accounting/transaction-history` | `/api/accounting/transaction-history` |
| `/api/v1/accounting/transaction-history/[transferId]` | `/api/accounting/transaction-history/[transferId]` |
| `/api/v1/accounting/transfers` | `/api/accounting/transfers` |
| `/api/v1/accounting/transfers/[transferId]` | `/api/accounting/transfers/[transferId]` |
| `/api/v1/admin/dashboard` | `/api/admin/dashboard` |
| `/api/v1/admin/integration-monitoring` | `/api/admin/integration-monitoring` |
| `/api/v1/admin/audit-logs` | `/api/admin/audit-logs` |
| `/api/v1/admin/audit-logs/[auditId]` | `/api/admin/audit-logs/[auditId]` |
| `/api/v1/admin/roles-permissions` | `/api/admin/roles-permissions` |
| `/api/v1/admin/roles-permissions/[roleId]` | `/api/admin/roles-permissions/[roleId]` |
| `/api/v1/admin/settings` | `/api/admin/settings` |
| `/api/v1/admin/user-accounts` | `/api/admin/user-accounts` |
| `/api/v1/admin/user-accounts/[uid]` | `/api/admin/user-accounts/[uid]` |
| `/api/v1/admin/user-accounts/[uid]/disable` | `/api/admin/user-accounts/[uid]/disable` |
| `/api/v1/admin/user-accounts/[uid]/enable` | `/api/admin/user-accounts/[uid]/enable` |

## D. Employee APIs

No `/api/v1/employee/...` handlers existed in the repository. Employee-facing
attendance APIs were migrated under the existing shared `/api/attendance/...`
boundary. No new `/api/employee` routes were invented merely for symmetry.

## E. HR APIs

Migrated dashboard summary, audit-history/CSV, and attendance-correction
decision routes under `/api/hr/...`. Their existing HR role and permission
guards remain in the handlers.

## F. Payroll APIs

Migrated dashboard, verified attendance, batches and nested item mutations,
handoffs and detail, history and batch detail, and results and detail under
`/api/payroll/...`. Payroll validation and simulated adapter boundaries were not
changed.

## G. Accounting APIs

Migrated approved-payroll, dashboard, transaction-history and detail, and
transfers and detail under `/api/accounting/...`. Accounting authorization,
readiness validation, transfer persistence, acknowledgement handling, and
simulated adapter behavior were not changed.

## H. Admin APIs

Migrated dashboard, integration monitoring, audit logs and detail,
roles-permissions and detail, settings, and user accounts with detail,
disable, and enable actions under `/api/admin/...`.

## I. Shared/Auth APIs

Migrated current-user, auth session, health, Firebase health, and the existing
attendance/QR routes under `/api/...` and `/api/attendance/...`.

## J. Client Consumers Updated

Updated the active request paths in:

- `src/lib/auth/client-session.ts`.
- `src/components/scanner/ScannerPage.tsx`.
- Employee attendance QR.
- HR correction requests and audit-history export.
- Payroll dashboard, verified attendance, batches, handoff, history, and
  results pages.
- Accounting approved payroll, dashboard, integration status, and transaction
  history pages.
- Admin dashboard, integration monitoring, audit logs, roles/permissions,
  settings, and user accounts pages.

No API base constant, generated client, hook, server-side fetch helper, test
fixture, or environment variable containing the old internal prefix was found.
The existing `apiRequest` helper remains path-agnostic.

## K. Middleware/Security Updates

No middleware or authorization helper needed a route-prefix change. The root
`proxy.ts` protects portal page areas only; it does not act as an API allowlist.
Every migrated protected handler retains its existing session, role,
permission, ownership, and domain validation. The route move did not add public
access or weaken RBAC.

`next.config.ts` contains only the existing `/hr/scanner` page redirect and no
API rewrite or redirect. No CORS, CSRF, callback, or external-origin rule
referenced the old internal prefix.

## L. External `/v1` URLs Retained

None found. No provider-owned versioned URL, `API_VERSION` constant, external
base URL, or live callback URL was present in the repository. Payroll and
Accounting integrations remain deterministic internal adapters, not external
HTTP URL contracts.

## M. External Callback Review

No webhook or externally consumed callback Route Handler was found. Therefore
there is no provider configuration to update and no compatibility callback to
retain. The migration changed only internal browser-to-Next.js routes.

## N. Remaining `/api/v1` Search Results

- Active production source: 0.
- Current README/source documentation: 0.
- Tests/fixtures/helpers: 0 found; no test runner or API fixture suite is
  configured in `package.json`.
- Historical completion records: old paths remain intentionally as historical
  evidence of the routes that existed when those tasks were completed. They
  are not active code or current architecture guidance.
- The active task specification contained example old paths while this task was
  in progress; `CURRENT.md` is reset after completion.

## O. Remaining Broad `/v1/` Search Results

No provider-owned or active source `/v1/` references remain. Historical task
records retain prior internal route names for accurate historical evidence.

## P. Route Collisions

No collisions were found. Before the move, `src/app/api` contained only the
`v1` directory. The build route manifest now lists the canonical `/api/...`
routes and no `/api/v1/...` routes.

## Q. Tests Updated

No tests were configured or changed. Static route inventory and live HTTP smoke
checks were used instead.

## R. Documentation Updated

- `README.md` now documents `src/app/api/` and canonical health/attendance/HR
  endpoint paths.
- This permanent record documents the full migration matrix and search results.
- `STATE.md`, `HANDOFF.md`, and `CURRENT.md` were updated during completion.
- Historical done records were not rewritten.

## S. Verification

| Check | Result | Evidence |
| --- | --- | --- |
| TypeScript before build | Stale generated `.next/types/validator.ts` referenced deleted `/api/v1` files | Regenerated by build; no source error was indicated. |
| TypeScript after build | PASS | `npm.cmd exec -- tsc --noEmit` |
| Lint | PASS with one pre-existing warning | `npm run lint`; unused `getNullableString` in `src/server/repositories/payroll/payslip.repository.ts`. |
| Production build | PASS | `npm run build`; route manifest listed 40 `/api/...` handlers. |
| Route search | PASS | No active source/README `/api/v1` or standalone `/v1/` matches. |
| Canonical health smoke | PASS | `GET /api/health` returned HTTP 200. |
| Removed health smoke | PASS | `GET /api/v1/health` returned HTTP 404. |
| Unauthorized regression smoke | PASS | Unauthenticated `/api/me`, `/api/admin/settings`, and `/api/payroll/batches` returned HTTP 401. |
| Browser/network inspection | Not run | No browser session was available; live HTTP checks covered the route boundary. |

## T. Environment Blockers

No route-migration blocker remained. Authenticated Firebase role-specific
browser checks and external-provider checks were not performed because no
authenticated browser session or live Payroll/Accounting provider contract is
configured. These are not caused by the namespace migration.

## U. Files Changed

- Moved all 40 Route Handler files from `src/app/api/v1/` to `src/app/api/`.
- Updated active API consumers across authentication, Employee attendance,
  HR, Payroll, Accounting, Admin, and Scanner components.
- Updated `README.md` endpoint documentation.
- Updated workflow state and completion files.

## V. Completion Record

This record: `Workflows/tasks/done/SYSTEM-API-005-api-namespace-migration.md`.
The implementation commit is recorded after completion documentation is staged.

## Final Source-of-Truth Summary

```text
SYSTEM-API-005 RESULT

Canonical internal API base:
/api

Versioned internal API base:
/api/v1
REMOVED FROM ACTIVE PRODUCTION

Current-user route:
/api/me

Employee API namespace:
No dedicated /api/employee handlers currently exist; employee attendance uses /api/attendance.

HR API namespace:
/api/hr

Payroll API namespace:
/api/payroll

Accounting API namespace:
/api/accounting

Admin API namespace:
/api/admin

Active production /api/v1 references:
0

External /v1 references retained:
None

External callback exceptions:
None

Route collisions:
None

Authentication regression:
NO — unauthenticated canonical protected routes returned 401.

RBAC regression:
NO — existing handler guards were preserved; authenticated role matrix was not browser-tested.

Ownership regression:
NO — no ownership logic changed.

Domain-validation regression:
NO — no service/repository/domain validation changed.

Typecheck:
PASS after build regenerated Next.js route types.

Lint:
PASS with one pre-existing warning.

Build:
PASS.

Environment blockers:
No authenticated browser or live external provider verification.

Recommended Next Task:
SYSTEM-SEC-006 — Authentication + RBAC + Authorization Audit.
```
