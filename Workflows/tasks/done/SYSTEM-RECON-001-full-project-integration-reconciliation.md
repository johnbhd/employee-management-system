# SYSTEM-RECON-001 - Full Project Integration Reconciliation

## Status

Completed

## Completed

2026-10-14

## Scope and method

This record reconciles the repository as implemented. It inventories the App
Router pages, API route handlers, server services, repositories, integration
adapters, auth/RBAC boundaries, persisted collections, prototype paths, and
the relevant completed task records. It does not introduce a mass refactor or
claim that a UI-only page is full-stack merely because its route exists.

The audit distinguishes implementation state from verification state. The
repository is the source of truth for behavior; `Workflows/PROJECT.md` remains
older than the current implementation and `PROJECT-BRIEF.md` remains intent,
not proof of completion.

## A. Executive summary

The project is a **partially integrated application with several real
full-stack verticals and one major disconnected core workflow**. Identity,
session validation, role shells, QR attendance persistence, Payroll batch /
handoff / result persistence, Accounting projections and transfers, Admin
settings, Admin RBAC, Admin audit projection, and Admin monitoring are backed by
server services and Firestore repositories. Payroll and Accounting external
boundaries are deliberately deterministic simulated adapters, not live
providers.

The principal implementation gap is HR Final Verification. The Payroll
contract correctly requires persisted `attendance.hrVerification.status` to be
`verified`, but the current HR verification writer is the client-only
`src/components/layouts/hr/HrWorkflowContext.tsx`. Consequently a real seeded
attendance record cannot progress through HR verification into Payroll until a
server/API mutation is added. Employee correction submission is also missing;
the HR review side is persisted, but the employee-to-HR request flow is not
end-to-end.

Therefore the system is not integration-complete. It is safe to describe the
current state as **mostly integrated at the persistence and adapter-boundary
level, but still containing major disconnected workflows and verification
debt**.

## B. Current portal status

| Portal | UI | Backend | Auth | RBAC | Mock remaining | Overall |
|---|---|---|---|---|---|---|
| Employee | 9 routes | Attendance, profile, payslips and QR are real; dashboard/support/content remain mixed | Firebase session plus employee role | Own-data permission checks on core pages; lower-risk content/settings are role-only | Dashboard seed metrics/payslip, announcements, help/support form, settings/local QR demo | PARTIAL |
| HR | 7 routes | Directory, schedules, reports, attendance reads and correction review are real | Firebase session plus HR role | Sidebar is permission-aware; directory/schedules pages lack direct permission checks | Legacy workflow context and final verification remain client-only; some dashboard queues are unavailable | PARTIAL |
| Payroll | 6 routes | Firestore batches, handoffs, results, payslips and projections | Firebase session plus Payroll role | Page/API permissions and batch/handoff mutation guards | External Payroll adapter is deterministic simulated; verified queue is empty until HR writes verification | FULL-STACK / SIMULATED EXTERNAL |
| Accounting | 4 routes | Approved Payroll, transfer, history and dashboard projections are real | Firebase session plus Accounting role | Page/API permissions and transfer readiness guards | External Accounting adapter is deterministic simulated | FULL-STACK / SIMULATED EXTERNAL |
| IT Admin | 13 routes | New dashboard, monitoring, users, RBAC, audit and settings are real; seven legacy integration pages are not | Firebase session plus Admin role | New routes are permission-aware; legacy pages are role-only | Legacy integration pages consume static sample data | PARTIAL |

## Route and API inventory

The implemented page inventory is 39 portal routes plus the shared root and
scanner routes (41 page routes total):

- Employee: `/employee/announcements`, `/employee/attendance-history`,
  `/employee/attendance-qr`, `/employee/dashboard`,
  `/employee/help-support`, `/employee/my-attendance`,
  `/employee/payslips`, `/employee/profile`, `/employee/settings`.
- HR: `/hr/attendance-monitoring`, `/hr/attendance-reports`,
  `/hr/audit-history`, `/hr/correction-requests`, `/hr/dashboard`,
  `/hr/employee-directory`, `/hr/employee-schedules`.
- Payroll: `/payroll/batches`, `/payroll/dashboard`, `/payroll/handoff`,
  `/payroll/history`, `/payroll/results`, `/payroll/verified-attendance`.
- Accounting: `/accounting/approved-payroll`, `/accounting/dashboard`,
  `/accounting/integration-status`, `/accounting/transaction-history`.
- IT Admin: `/admin/accounting-integration`, `/admin/audit-logs`,
  `/admin/bundy-biometric-etl`, `/admin/dashboard`, `/admin/hrps-integration`,
  `/admin/integration-errors`, `/admin/integration-monitoring`,
  `/admin/payroll-integration`, `/admin/qr-attendance`,
  `/admin/roles-permissions`, `/admin/settings`,
  `/admin/unified-attendance`, `/admin/user-accounts`.
- Shared/public: `/` and `/scanner`.

API route handlers, grouped by domain and method, are:

- Auth/health/context: `GET,POST,DELETE /api/v1/auth/session`,
  `GET /api/v1/me`, `GET /api/v1/health`, and
  `GET /api/v1/health/firebase`.
- Employee attendance: `GET /api/v1/attendance/me/today`,
  `GET /api/v1/attendance/me/history`, `GET /api/v1/attendance/qr`, and
  `POST /api/v1/attendance/qr/resolve`.
- HR: `GET /api/v1/hr/dashboard/summary`,
  `GET /api/v1/hr/audit-history` (CSV format supported), and
  `POST /api/v1/hr/attendance-corrections/[requestId]`.
- Payroll: `GET,POST /api/v1/payroll/batches`,
  `PATCH /api/v1/payroll/batches/[batchId]`,
  `POST /api/v1/payroll/batches/[batchId]/items`,
  `DELETE /api/v1/payroll/batches/[batchId]/items/[employeePeriodId]`,
  `GET /api/v1/payroll/dashboard`, `GET,POST /api/v1/payroll/handoffs`,
  `GET /api/v1/payroll/handoffs/[transferId]`,
  `GET /api/v1/payroll/history`, `GET /api/v1/payroll/history/[batchId]`,
  `GET /api/v1/payroll/results`, `GET /api/v1/payroll/results/[resultId]`,
  and `GET /api/v1/payroll/verified-attendance`.
- Accounting: `GET /api/v1/accounting/approved-payroll`,
  `GET /api/v1/accounting/dashboard`,
  `GET /api/v1/accounting/transaction-history`,
  `GET /api/v1/accounting/transaction-history/[transferId]`,
  `GET /api/v1/accounting/transfers/[transferId]`, and
  `GET,POST /api/v1/accounting/transfers`.
- Admin: `GET /api/v1/admin/dashboard`,
  `GET /api/v1/admin/integration-monitoring`,
  `GET /api/v1/admin/audit-logs`, `GET /api/v1/admin/audit-logs/[auditId]`,
  `GET /api/v1/admin/roles-permissions`,
  `PUT /api/v1/admin/roles-permissions/[roleId]`,
  `GET,PATCH /api/v1/admin/settings`,
  `GET,POST /api/v1/admin/user-accounts`,
  `GET,PATCH,DELETE /api/v1/admin/user-accounts/[uid]`, and
  `POST /api/v1/admin/user-accounts/[uid]/disable` or `/enable`.

The protected domain APIs use server session/role/permission guards. Auth
session and health are intentionally public or session-establishing; `/me`
uses explicit session handling. No API exists for employee correction creation
or HR final-verification mutation.

## Service, repository, and adapter inventory

Server services are grouped as follows:

- Accounting: approved payroll, dashboard, integration adapter, readiness,
  transaction history, and transfer lifecycle.
- Admin: audit logs, dashboard, settings, settings registry, user accounts,
  integration monitoring, and roles/permissions.
- Attendance/Auth: attendance, attendance history, QR token/service, current
  user context, session, guards, and permission service.
- HR: correction requests, attendance monitoring/query, attendance reports/query,
  audit history/query, directory, schedules, and dashboard.
- Payroll: integration adapter, verified-attendance/query, dashboard, batches,
  handoff, history, result, and payslip.

Repositories cover `users`, `employees`, `employeeSchedules`, `attendance`,
`attendanceCorrectionRequests`, `auditEvents` plus legacy audit collections,
`adminAuditEvents`, `adminUserAccountAuditEvents`, `rolePermissions`,
`systemSettings/runtime`, `payrollPayslips`, `payrollBatches`,
`payrollBatchMembership`, `payrollHandoffs`, `payrollResults/items`,
`payrollResultAuditEvents`, `accountingTransfers`,
`accountingTransferMembership`, and `accountingTransferAuditEvents`.

The only external-boundary adapters in the active server tree are the
deterministic Payroll and Accounting simulated adapters. The HRPS, Bundy, and
other `src/server/integrations/*` directories contain no live adapter code.

## C. Full integration flow

| Stage | Status | Repository evidence and boundary |
|---|---|---|
| HRPS | PARTIAL | Employees and schedules are stored in Firestore and marked as HRPS/local development references. No live HRPS ingestion adapter exists. |
| Bundy | NOT CONFIGURED | No Bundy adapter or repository exists. Settings and monitoring truthfully expose this mode. |
| QR | CONNECTED | Signed QR generation/validation and scanner writes persist canonical `attendance/{employeeId}_{attendanceDate}` records. |
| Unified Attendance | PARTIAL | The canonical attendance repository is real, but `src/components/admin/pages/UnifiedAttendancePage.tsx` is still a static legacy view and is not a downstream transfer boundary. |
| Validation | CONNECTED | Server-side QR validation, employee resolution, Firestore transactions, request validation and source/status mapping are implemented. |
| Correction | PARTIAL | `attendanceCorrectionRequests` and HR approve/reject review are persisted; employee submission/create API and connected employee UI are missing. |
| HR Final Verification | MISSING | The permission and audit event are registered, but no server mutation persists `attendance.hrVerification`; the current writer is client memory. |
| Payroll Readiness | CONNECTED WITH EMPTY INPUT | Payroll reads only persisted HR-verified attendance and derives correction/readiness blockers without fabricating data. |
| Payroll Batch | CONNECTED | Firestore batch and membership repositories persist validated immutable employee-period snapshots and state transitions. |
| Payroll Handoff | CONNECTED / SIMULATED | Handoff snapshots and lifecycle state persist; the adapter returns deterministic simulated outcomes and synthetic references. |
| Payroll Result | CONNECTED / SIMULATED INPUT | Results and result items persist idempotently; result data is accepted from the configured simulated adapter. |
| Payslip | CONNECTED | Accepted result items upsert employee-owned `payrollPayslips`; Employee payslips reads the repository using the authenticated employee context. |
| Accounting Readiness | CONNECTED | Approved Payroll is a projection over ready Payroll Results and intentionally exposes only the available result contract. |
| Accounting Transfer | CONNECTED / SIMULATED | Transfer, membership and audit collections persist readiness, submission and acknowledgement state. |
| Accounting Acknowledgement | CONNECTED / SIMULATED | The Accounting adapter produces deterministic pending/failed/success outcomes; no live provider acknowledgement exists. |

## D. Identity model

The authoritative identity chain is:

`Firebase Auth UID` -> `users/{uid}` application profile -> `role` and
`status` -> optional `employeeId` -> `employees/{employeeId}` domain record.

The UID is the authentication key. The employee ID is the domain and
ownership key. `src/server/auth/session.ts` verifies the HttpOnly
`aujsc_session` cookie through Firebase Admin, resolves the active application
profile, and the current-user context validates the linked employee record.
The `/api/v1/me` route exposes the safe resolved context. The account service
enforces link uniqueness and lifecycle checks.

## E. Employee portal

| Route | Classification | Actual status |
|---|---|---|
| `/employee/dashboard` | PARTIAL | Server-backed today/history attendance; dashboard metrics, latest payslip and announcements still use static development data. |
| `/employee/announcements` | UI ONLY / PROTOTYPE | Reads `src/data/employee`; no announcement API or persisted source. |
| `/employee/attendance-history` | FULL-STACK | Reads authenticated employee attendance history through the server repository/API boundary. |
| `/employee/attendance-qr` | FULL-STACK | Uses authenticated employee context and real QR contract; no employee-selected ownership input. |
| `/employee/my-attendance` | FULL-STACK | Reads today's canonical attendance through the protected own-record endpoint. |
| `/employee/payslips` | FULL-STACK | Reads employee-owned persisted payroll payslips. |
| `/employee/profile` | FULL-STACK | Uses the authenticated user/employee context. |
| `/employee/settings` | UI ONLY / LOCAL | Saves personal preferences in `localStorage`; no server settings contract is intended for these preferences. |
| `/employee/help-support` | UI ONLY / PROTOTYPE | Static FAQs and routing; support submission returns a hardcoded local reference and does not contact a support system. |

Core employee ownership checks were not found to allow one employee to query
another employee's attendance or payslips. The local QR demo utility is not an
authoritative attendance writer, but it remains a misleading legacy path if it
is reachable from old components.

## F. HR portal

| Capability | Status |
|---|---|
| Attendance monitoring | PARTIAL: reads canonical persisted QR attendance, but final verification controls remain prototype/client-only. |
| Corrections | PARTIAL: HR review is persisted and audited; employee submission is missing. |
| Final verification | MISSING as a server workflow; `hr.attendance.verify` exists in the catalog without a server mutation. |
| Directory | FULL-STACK read-only Firestore projection, but direct page permission enforcement is missing. |
| Schedules | FULL-STACK read-only HRPS/local Firestore projection, but direct page permission enforcement is missing. |
| Audit history | PARTIAL: derives attendance/correction history; it does not receive a persisted final-verification event because no writer exists. |
| Dashboard | PARTIAL: real summary data, but pending correction/final-verification queues are honestly shown as unavailable/not connected. |

`HrWorkflowProvider` is still mounted by the HR shell and imports static HR
workflow data. Its correction and verification updates are React state only;
it is not a persistence layer.

## G. Payroll portal

| Capability | Status |
|---|---|
| Verified Attendance | FULL-STACK projection, but empty until persisted HR verification exists. |
| Batches | FULL-STACK Firestore batch and membership lifecycle with source/readiness validation. |
| Handoff | FULL-STACK persistence with a simulated external adapter. |
| Results | FULL-STACK persistence, result-item status handling and idempotent writes. |
| Payslips | FULL-STACK employee-owned result/payslip projection. |
| History | FULL-STACK read-only projection over batches, handoffs and results. |
| Dashboard | FULL-STACK aggregate over existing Payroll services and repositories. |

The Payroll side correctly preserves the distinction between HR verification,
Payroll processing, Payroll result acceptance, and payslip availability. It
does not calculate salary amounts locally.

## H. Accounting portal

| Route | Classification | Actual status |
|---|---|---|
| `/accounting/approved-payroll` | FULL-STACK | Projects ready Payroll Results; no amounts are invented where the result contract has none. |
| `/accounting/integration-status` | FULL-STACK / SIMULATED | Reads adapter mode and current persisted lifecycle status. |
| `/accounting/transaction-history` | FULL-STACK | Projects persisted transfer, result and audit state. |
| `/accounting/dashboard` | FULL-STACK | Aggregates the existing Accounting projections; no duplicate dashboard collection. |

Accounting transfer submission is server-authorized, readiness-checked, and
persisted. It is not a live accounting-provider integration.

## I. Admin portal

| Capability | Status |
|---|---|
| `/admin/dashboard` | FULL-STACK read model over monitoring, accounts, RBAC, audit and settings. |
| `/admin/integration-monitoring` | FULL-STACK projection with truthful simulated/not-configured modes. |
| `/admin/user-accounts` | FULL-STACK Firebase Auth plus application-profile lifecycle, including disable/enable/delete protections. |
| `/admin/roles-permissions` | FULL-STACK persistent role-permission assignments, versioning, dependencies and lockout protection. |
| `/admin/audit-logs` | FULL-STACK normalized projection over canonical and legacy audit collections. |
| `/admin/settings` | FULL-STACK validated runtime overrides and safe integration status projection. |
| `/admin/accounting-integration` | UI ONLY / LEGACY static sample integration workspace. |
| `/admin/bundy-biometric-etl` | UI ONLY / LEGACY sample Bundy rows; no file is imported at runtime. |
| `/admin/hrps-integration` | UI ONLY / LEGACY sample HRPS records and prototype sync notes. |
| `/admin/integration-errors` | UI ONLY / LEGACY mock queue; no live error feed. |
| `/admin/payroll-integration` | UI ONLY / LEGACY static Payroll/Accounting flow sample. |
| `/admin/qr-attendance` | UI ONLY / LEGACY sample QR events. |
| `/admin/unified-attendance` | UI ONLY / LEGACY standardized sample records; no downstream transfer. |

The new Admin routes and APIs are permission-aware. The seven legacy routes
are only protected by the Admin role layout, and their sidebar entries are not
mapped to catalog permissions.

## J. Authentication status

- Firebase Client Auth is used only for sign-in/sign-out and ID-token handoff.
- `POST /api/v1/auth/session` verifies the ID token through Firebase Admin,
  checks recent `auth_time`, resolves an active application user, and creates
  the HttpOnly `aujsc_session` cookie.
- Server session validation uses Firebase Admin with revocation checks.
- Role and permission guards run in server pages and API handlers. `proxy.ts`
  is only a coarse cookie-presence redirect for Admin, HR, Employee and
  Accounting; Payroll and Scanner are protected by their server layouts/pages.
- No second runtime legacy credential system was found. `src/data/prototype-auth.ts`
  is used by the development seed script, not production authentication.
- `/api/v1/me` returns the resolved session/application/employee context and
  returns explicit 401/403/503 outcomes.
- Environment blocker: Firebase Email/Password is disabled in the configured
  project, so authenticated browser and live persistence checks could not be
  performed.

## K. RBAC status

- The controlled registry contains 40 permissions across the five canonical
  roles: `admin`, `hr`, `employee`, `payroll`, and `accounting`.
- `rolePermissions/{roleId}` stores validated assignments with versioning and
  optimistic concurrency. Missing documents use controlled role defaults.
- `PermissionService` resolves persisted assignments and fails closed when
  resolution is unavailable.
- API handlers use role and permission guards; core page routes use page-level
  permission checks; sidebars filter navigation from the same permission keys.
- Employee own-data permissions are combined with server-derived employee
  ownership. Permission does not replace ownership.
- Direct page gaps remain in `/hr/employee-directory` and
  `/hr/employee-schedules`: their sidebars are permission-aware, but the page
  files call their services without a direct `hasPermission` check. The legacy
  Admin pages and Employee announcement/help/settings pages are also role-only.
- `POST /api/v1/attendance/qr/resolve` requires `hr` or `admin`; HR also needs
  `hr.attendance.scan`. Admin is role-authorized for scanner operations under
  the current design.

## L. User account integrity

Create, edit, disable, enable, and permanent delete are implemented through
Firebase Auth plus the Firestore application profile. Self-delete is blocked;
the final active Admin protection and reserved Admin permissions prevent the
system from being left without an administrator. Account audit events preserve
actor and target snapshots, and delete handling avoids cascading deletion of
domain history. The main remaining verification debt is live authenticated
testing of these rules.

## M. Audit status

`src/server/repositories/audit/audit.repository.ts` reads the canonical
`auditEvents` collection and normalizes legacy collections:

- `adminAuditEvents`
- `adminUserAccountAuditEvents`
- `payrollResultAuditEvents`
- `accountingTransferAuditEvents`

New shared events use `recordAuditEvent` and the canonical collection. Existing
domain writers remain in their historical collections and are projected by the
Admin audit service. This is an intentional compatibility bridge, but it is
still source fragmentation and a future consolidation task.

The registry covers correction, final verification, Payroll, Accounting,
Admin-user, RBAC and settings event types. The final-verification definition
exists, but no server writer emits it. Sensitive values such as passwords,
tokens, private keys, environment secrets and QR signing secrets are not
returned to the browser or written to settings audit metadata.

## N. Settings status

- Runtime-editable values are validated through the Admin settings registry and
  stored as versioned overrides at `systemSettings/runtime`.
- Environment/deployment-controlled values are read-only and safe-derived.
- Integration status is derived from actual repository/adapter capability:
  HRPS/local reference, Bundy not configured, QR signing status without the
  secret, Payroll simulated, Accounting simulated.
- Unsupported keys, unknown keys, invalid values and optimistic conflicts are
  handled server-side. Settings writes are audited canonically.
- Audit page-size consumption is connected to the persisted settings value.

## O. Integration mode table

| Integration | Mode | Configured? | Health source | Notes |
|---|---|---:|---|---|
| HRPS | Local Firestore reference | Partial | `employees` and `employeeSchedules` repository reads | Development seed or synchronized reference; no external HRPS adapter. |
| Bundy | Not configured | No | Explicit not-configured status | No ingestion adapter/repository. |
| QR | Implemented | Secret-dependent | Signed-token configuration plus canonical attendance writes | QR is the only real attendance source currently writing attendance. |
| Payroll | Simulated | No live provider | Deterministic Payroll adapter plus persisted batch/handoff/result state | Synthetic `SIM-*` references; failure/partial simulation modes are explicit. |
| Accounting | Simulated | No live provider | Deterministic Accounting adapter plus persisted transfer/history state | Synthetic `SIM-ACC-*` references; no live credentials. |

## P. Remaining prototype / mock logic

The following are production-relevant or reachable legacy paths, not merely
unused test fixtures:

- `src/components/admin/accounting-integration/AccountingIntegrationWorkspace.tsx`
  and `src/data/accounting-integration`: static integration sample and mock
  refresh messaging.
- `src/components/admin/integration-errors/IntegrationErrorsPage.tsx` and
  `src/data/integration-errors`: mock queue with no live error feed.
- `src/components/admin/pages/BundyBiometricEtlPage.tsx`,
  `HrpsIntegrationPage.tsx`, `PayrollAccountingFlowPage.tsx`,
  `QrAttendancePage.tsx`, and `UnifiedAttendancePage.tsx`: static sample
  integration workspaces.
- `src/components/layouts/hr/HrWorkflowContext.tsx` plus
  `src/data/hr-workflow.ts`, `src/data/hr.ts`,
  `src/data/hr-correction-requests.ts`, and
  `src/data/hr-attendance-audit.ts`: in-memory corrections/final verification
  and local audit objects.
- `src/components/employee/dashboard/EmployeeDashboardPage.tsx` plus
  `src/data/employee-dashboard.ts` and `src/data/employee.ts`: seeded
  dashboard metrics, latest payslip and announcements remain mixed into an
  otherwise real attendance page.
- `src/components/employee/announcements/EmployeeAnnouncementsPage.tsx` and
  `src/components/employee/help-support/EmployeeHelpSupportPage.tsx`:
  static content; `SupportRequestSection.tsx` returns the hardcoded
  `SUP-2026-00124` reference and explicitly says no external system is
  contacted.
- `src/components/employee/settings/EmployeeSettingsPage.tsx`: local-only
  personal preferences.
- `src/lib/employee/qr-demo-attendance.ts` and
  `src/hooks/useEmployeeQrDemoAttendance.ts`: localStorage QR demo utility;
  this must not be mistaken for the canonical scanner write path.
- Static `src/data/admin.ts` values remain as legacy/dead data used by older
  Admin components and navigation definitions; the real Admin dashboard does
  not use them.

Timers found in the scan are UI feedback/debounce/next-tick behavior, not
evidence of an async backend mock by themselves. No `Math.random` domain
simulation was found. `sessionStorage` in `src/lib/auth-flash-toast.ts` is a
flash-message mechanism, not domain persistence.

## Q. Direct client Firestore review

No production component calls the client Firestore export. `src/lib/firebase/
client/index.ts` exposes a client Firestore instance, but the repository has no
runtime call site using `getFirebaseFirestore`. Firestore reads and writes in
the implemented domains are server-only and use Firebase Admin repositories.
This is acceptable and is not a client-side data exposure finding.

## R. Status / type inconsistencies

1. Canonical Attendance persistence uses lower-case `present` and `completed`,
   while UI/prototype types display title-case `Present` and `Completed`; the
   HR prototype adds its own verification/status vocabulary.
2. Persisted HR verification uses the explicit lower-case status `verified`,
   while the legacy HR workflow uses display/status values such as `Verified`
   and `Pending Verification`.
3. Audit outcomes and legacy action names require normalization in the Audit
   repository; canonical and legacy event IDs also have different shapes
   (`id` versus `collection:id`).
4. `development-seed` / `synchronized` source values for HRPS references can
   look like external synchronization unless the UI preserves the source
   label; no live HRPS adapter is present.
5. Domain history uses Firestore timestamps for authoritative events, while
   page DTOs intentionally expose ISO strings and display-formatted dates.
   This is generally sound, but the mixed legacy display-string data remains
   a migration risk.
6. Payroll and Accounting intentionally use distinct lifecycle status sets;
   they should not be collapsed into one generic `status` enum. The
   reconciliation risk is at adapters and legacy UI labels, not in the
   persisted lifecycle separation.

No raw Firebase provider payload or raw Payroll/Accounting adapter payload was
found in the browser API contract; the implemented routes return normalized
DTOs.

## S. Security findings

- No P0 unauthorized destructive action, employee payslip ownership bypass,
  browser secret exposure, or uncontrolled cascade delete was found in the
  inspected implemented paths.
- Core API authorization is server-side and permission-aware. Navigation hiding
  is not treated as security.
- Direct HR page permission checks are missing for directory and schedules.
- Seven legacy Admin integration pages are Admin-role-only and show static
  prototype data without catalog permissions; this is an authorization and
  truthfulness consistency gap, not a discovered cross-role data leak.
- Employee localStorage demo/settings values are not authoritative server
  records, but their presence can mislead a user and cause stale UI state.
- Payroll and Accounting submission paths have persistent IDs, readiness
  checks, and state records. External live idempotency cannot be proven because
  the adapters are simulated.

## T. Environment / verification blockers

Observed or confirmed blockers:

1. Firebase Email/Password is disabled in the configured project, so no
   authenticated browser session, live Firestore mutation, cross-role API
   matrix, or persistence round-trip was run.
2. No live HRPS, Bundy, Payroll, or Accounting provider credentials/adapters
   exist in this repository. Their simulated/not-configured modes are
   implementation state, not a failed test.
3. No browser/device runner is available in this session. Visual, responsive,
   keyboard/accessibility, and authenticated route checks were not claimed.

Current repository verification for this reconciliation passed:

- `npm.cmd exec tsc -- --noEmit`
- `npm.cmd run lint` with zero errors and one pre-existing warning in
  `src/server/repositories/payroll/payslip.repository.ts:92`
- `npm.cmd run build` on Next.js 16.3.5 / Turbopack
- `git diff --check` (run after documentation edits as part of completion)

## U. Gap register

### GAP-001

- Area: HR -> Payroll
- Severity: P1
- Type: Core business-flow disconnect
- Finding: No server/API mutation persists HR final verification to
  `attendance.hrVerification`.
- Impact: Payroll Verified Attendance, batch readiness and downstream flow stay
  empty/unready even when HR uses the current client workflow.
- Evidence: `HrWorkflowContext.tsx` mutates React state; Payroll services and
  batch repository require persisted `hrVerification.status === "verified"`.
- Recommended action: Create `SYSTEM-FIX-002` for a server-authoritative HR
  verification command, permission enforcement, transition validation,
  canonical audit write, and UI/API integration tests.

### GAP-002

- Area: Employee -> HR corrections
- Severity: P1
- Type: Core business-flow disconnect
- Finding: Persisted HR correction review exists, but no employee submission
  endpoint and connected employee submission UI exist.
- Impact: The correction lifecycle cannot begin from the Employee portal.
- Evidence: `/api/v1/hr/attendance-corrections/[requestId]` handles review;
  `SupportRequestSection.tsx` explicitly says its form does not contact an
  external system.
- Recommended action: Add an employee-owned correction command and API,
  persist request source/actor, then connect HR review and audit transitions.

### GAP-003

- Area: HR direct-route authorization
- Severity: P1
- Type: RBAC enforcement gap
- Finding: `/hr/employee-directory` and `/hr/employee-schedules` render after
  the HR role layout without checking `hr.employee_directory.view` or
  `hr.schedule.view` in the page.
- Impact: Removing the permission hides navigation but does not deny a direct
  URL for an otherwise active HR user.
- Evidence: both `src/app/hr/*/page.tsx` files call their services directly;
  `HrSidebar.tsx` does filter those permissions.
- Recommended action: Add server page guards and unauthorized states, then
  cover direct navigation in the RBAC matrix.

### GAP-004

- Area: External attendance integration
- Severity: P2
- Type: Integration boundary
- Finding: Bundy/biometric ingestion is not configured and no adapter or
  repository exists.
- Impact: QR is the only real attendance writer; biometric source reconciliation
  is not available.
- Evidence: empty `src/server/integrations/bundy` boundary, settings registry,
  monitoring service, and static legacy Bundy page.
- Recommended action: Define the provider contract and ingestion ownership in
  a dedicated integration task before implementing the adapter.

### GAP-005

- Area: External HRPS integration
- Severity: P2
- Type: Architecture/truthfulness
- Finding: HRPS is represented by local Firestore employee/schedule references
  and seed metadata, not a live upstream synchronization adapter.
- Impact: The directory/schedule surfaces are real local projections but not
  externally synchronized HRPS data.
- Evidence: employee-schedule repository source values and empty HRPS adapter
  boundary.
- Recommended action: Keep the current label explicit; add live synchronization
  only after an authoritative HRPS contract exists.

### GAP-006

- Area: External Payroll and Accounting
- Severity: P2
- Type: Environment/integration boundary
- Finding: Both adapters are deterministic simulated implementations with
  synthetic external references.
- Impact: Lifecycle persistence is testable, but provider delivery and
  acknowledgement are not proven against real systems.
- Evidence: `payroll-integration-adapter.ts` and
  `accounting-integration.adapter.ts` return simulated modes and `SIM-*`
  references.
- Recommended action: Create provider-specific integration tasks; retain the
  simulated modes until credentials, contracts and idempotency behavior exist.

### GAP-007

- Area: Employee dashboard
- Severity: P2
- Type: Data-source inconsistency
- Finding: Attendance sections are server-backed but metrics, latest payslip and
  announcements still use development fixtures.
- Impact: The dashboard can present plausible but non-authoritative payroll and
  campus data beside real attendance.
- Evidence: `EmployeeDashboardPage.tsx` imports `getEmployeeDashboardData` and
  `getLatestAnnouncements`; `employee-dashboard.ts` contains hardcoded PHP
  amounts and employee IDs.
- Recommended action: Connect dashboard cards to canonical Payslip and an
  owned announcement source, or label these sections visibly as unavailable.

### GAP-008

- Area: HR prototype coexistence
- Severity: P2
- Type: Architecture/maintainability
- Finding: `HrWorkflowProvider` and static HR data remain mounted alongside
  server-backed HR pages.
- Impact: Future changes can update client-only verification while Payroll and
  Audit read different persisted truth.
- Evidence: `HrShell.tsx`, `HrWorkflowContext.tsx`, and `src/data/hr-*` files.
- Recommended action: Replace the provider with the persisted verification /
  correction commands in SYSTEM-FIX-002, then remove dead workflow data.

### GAP-009

- Area: Audit storage
- Severity: P2
- Type: Duplicate/legacy domain storage
- Finding: Canonical `auditEvents` coexists with four legacy domain-specific
  audit collections and several historical writers.
- Impact: Event coverage and query semantics require normalization and can
  drift until legacy writers are retired.
- Evidence: `src/server/repositories/audit/audit.repository.ts` and the legacy
  repository files.
- Recommended action: Define a migration/consolidation task after all domain
  writers use the canonical registry.

### GAP-010

- Area: Employee support/settings/demo routes
- Severity: P2
- Type: UI-only prototype behavior
- Finding: Announcements/help support, employee settings preferences and the QR
  demo utility use static/local state without backend contracts.
- Impact: Users may mistake local confirmation or preferences for enterprise
  persistence.
- Evidence: `SupportRequestSection.tsx`, `EmployeeSettingsPage.tsx`, and
  `qr-demo-attendance.ts`.
- Recommended action: Either scope them explicitly as local UX features or
  create focused backend tasks; do not silently merge them into attendance
  authority.

### GAP-011

- Area: Admin navigation and legacy pages
- Severity: P3
- Type: Cleanup/UX consistency
- Finding: Legacy Admin links have no permission mapping, and the sidebar copy
  says “Six connected services” while the current settings/monitoring model
  exposes five named integration boundaries.
- Impact: Navigation and copy can imply more implemented coverage than exists.
- Evidence: `AdminSidebar.tsx`, `src/data/admin.ts`, and the Admin legacy page
  components.
- Recommended action: Complete the legacy-page disposition and update nav copy
  in a cleanup task.

### GAP-012

- Area: Status/type/DTO cleanup
- Severity: P3
- Type: Consistency
- Finding: Legacy title-case status types and lower-case persisted states are
  both present, along with legacy audit action normalization.
- Impact: Mapping drift is possible in future changes, though current server
  mappers protect the active contracts.
- Evidence: Attendance repository types, HR workflow data, Payroll repository
  validation, and audit mapper.
- Recommended action: Establish shared domain status/value objects after the
  missing workflows are repaired.

## V. Gap summary

| Severity | Count | Summary |
|---|---:|---|
| P0 | 0 | No critical security/destructive data-integrity issue observed. |
| P1 | 3 | HR verification persistence, employee correction submission, HR direct-route permission enforcement. |
| P2 | 7 | Missing/live adapter boundaries, mixed Employee dashboard data, HR prototype coexistence, audit storage fragmentation, local-only Employee features. |
| P3 | 2 | Legacy Admin navigation/copy cleanup and status/type normalization. |

## W. Recommended follow-up tasks

1. **SYSTEM-FIX-002 - Persist HR Final Verification and Close the Payroll
   Readiness Boundary.** Add server command/API, permission and state
   transition validation, canonical audit event, HR UI integration, and
   Payroll readiness verification.
2. **HR-CORR-002 - Connect Employee Correction Submission.** Add an
   employee-owned create endpoint/UI and preserve the distinction between
   correction approval and final attendance verification.
3. **SYSTEM-SEC-004 - Complete Direct-Route RBAC Coverage.** Add page guards
   for HR directory/schedules and decide permission policy for legacy Admin and
   low-risk Employee routes.
4. **SYSTEM-CLEAN-002 - Prototype / Dead Code Cleanup.** Remove or explicitly
   quarantine legacy Admin and HR prototype paths after their replacement
   contracts are confirmed.
5. **SYSTEM-DATA-003 - Status / DTO / Type Consistency.** Consolidate active
   status mappings and plan legacy audit collection migration.
6. **SYSTEM-E2E-006 - Full Authenticated Integration Testing.** Enable the
   Firebase provider, seed test users, exercise every portal boundary, and
   perform browser/responsive/accessibility checks.
7. Provider-specific HRPS, Bundy, Payroll, and Accounting adapter tasks only
   after authoritative external contracts and credentials are available.

These follow-ups are recommendations only; they were not started by this
reconciliation task.

## X. Documentation updated

- `Workflows/STATE.md`: added the current reconciliation snapshot and the
  verified distinction between implemented full-stack verticals, simulated
  adapters, prototype paths, and P1/P2 gaps.
- `Workflows/context/HANDOFF.md`: kept at `No Active Handoff`; no unfinished
  implementation is being handed to the next session because the findings and
  exact follow-up tasks are recorded here.
- `Workflows/tasks/done/SYSTEM-RECON-001-full-project-integration-reconciliation.md`:
  this permanent evidence-backed completion record.
- `Workflows/tasks/CURRENT.md`: reset to `No Active Task` after the audit and
  documentation deliverables were completed.

## Verification record

- Passed: `npm.cmd exec tsc -- --noEmit`.
- Passed: `npm.cmd run lint`; zero errors and one pre-existing warning at
  `src/server/repositories/payroll/payslip.repository.ts:92`.
- Passed: `npm.cmd run build`; Next.js 16.3.5 / Turbopack compiled and emitted
  the inventoried protected pages and API routes.
- Passed: `git diff --check` after documentation changes.
- Not run: authenticated browser/API persistence and cross-role checks because
  Firebase Email/Password is disabled.
- Not run: visual, responsive, keyboard/accessibility and device checks because
  no browser/device runner was available in this session.
- Not run: live external provider checks because no live HRPS, Bundy, Payroll
  or Accounting adapter/credentials exist.

## Current system state

Employee: Core identity, attendance history/today, QR and payslip surfaces are
server-backed; dashboard/content/help/settings still contain local or seeded
behavior.

HR: Read-only attendance, reports, directory, schedules and correction review
are server-backed; employee correction submission and final verification are
not persisted end-to-end.

Payroll: Batches, handoffs, results, payslips and history are persistent and
server-authorized; external submission is simulated and Payroll readiness waits
for persisted HR verification.

Accounting: Approved Payroll, transfers, history and dashboard are persistent
and server-authorized; external submission/acknowledgement is simulated.

IT Admin: Dashboard, monitoring, user accounts, roles/permissions, audit and
settings are real; seven legacy integration pages remain static prototypes.

Authentication: Firebase Auth plus verified HttpOnly session cookie and active
Firestore application profile; no runtime legacy auth found.

RBAC: 40-key catalog, persisted role assignments, PermissionService, API/page
guards and permission-aware navigation; direct HR directory/schedule guards
remain incomplete.

Audit: Canonical `auditEvents` plus normalized legacy collections; final
verification is registered but not emitted by a server writer.

Settings: Validated persisted runtime overrides and safe read-only integration
status projection; no secrets exposed.

HRPS Integration: Local Firestore employee/schedule reference only; no live
upstream adapter.

Bundy Integration: Not configured; no adapter/repository.

QR Attendance: Implemented canonical signed QR write/read path.

Payroll Integration Mode: Deterministic simulated adapter.

Accounting Integration Mode: Deterministic simulated adapter.

Remaining Mock Logic: Legacy Admin pages, HR in-memory workflow context,
Employee dashboard fixtures, static announcements/help/support, local settings
preferences, and the local QR demo utility.

P0 Gaps: None observed.

P1 Gaps: Persist HR final verification; connect employee correction submission;
enforce direct HR directory/schedule page permissions.

Environment Blockers: Firebase Email/Password disabled; no live external
providers; no browser/device runner.

Verification Debt: Authenticated persistence/cross-role, browser, responsive,
accessibility, and live-provider checks remain outstanding.

Recommended Next Task: SYSTEM-FIX-002 - Persist HR Final Verification and close
the Payroll readiness boundary.

## Git reference

This completion record is included in the commit that completes
`SYSTEM-RECON-001`; the exact commit is reported in the session handoff.
