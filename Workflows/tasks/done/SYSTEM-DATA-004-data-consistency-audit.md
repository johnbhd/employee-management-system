# SYSTEM-DATA-004 — Status, DTO, Type, Identifier, API Contract, Mapper, Timestamp, Nullability, and Naming Consistency Audit

## A. Executive Summary

Completed a repository-backed consistency audit across the active Next.js App
Router application, Firebase/Firestore server repositories, HR attendance
workflow, Payroll handoff/results workflow, Accounting readiness/transfers
workflow, Admin monitoring/RBAC/settings workflow, and API route contracts.

The implementation made only low-risk, source-compatible normalizations. It
did not rename persisted Firestore fields, change persisted status values,
perform a destructive migration, add Payroll or Accounting business logic, or
collapse distinct workflow states.

## B. Canonical Status Inventory

| Domain | Canonical machine values | Notes |
| --- | --- | --- |
| Attendance | `present`, `completed` | QR-backed attendance machine status. HR display labels remain `Present` and `Completed`. |
| Attendance source | `QR` | `timeInSource` and `timeOutSource` preserve source semantics. |
| HR verification | `verified` | Optional attendance metadata; correction approval remains separate. |
| Correction | `pending`, `approved`, `rejected` | Approval is not HR final verification. |
| Payroll readiness | `ready`, `blocked` | Readiness remains a separate concept from batch and result state. |
| Payroll batch | `Draft`, `Ready`, `Submitted`, `Acknowledged`, `Blocked`, `Failed` | Persisted batch status. |
| Payroll transfer | `preparing`, `submitting`, `submitted`, `failed` | Handoff/transfer lifecycle. |
| Payroll acknowledgement | `pending`, `accepted`, `rejected`, `not_received` | Separate from transfer submission. |
| Payroll result | `processing`, `completed`, `completed_with_issues`, `partially_completed`, `rejected`, `failed` | Batch-level result status; now shares one registry with the external result boundary. |
| Payroll employee result | `processed`, `pending`, `rejected`, `failed` | Employee-level result status; not a batch result status. |
| Payslip result | `available`, `not_yet_available`, `unavailable` | Payslip availability remains separate from payroll processing. |
| Accounting readiness | `ready`, `blocked` | Derived from persisted Payroll Result data by the Accounting boundary. |
| Accounting transfer | `preparing`, `submitting`, `submitted`, `failed` | Persisted Accounting transfer status. |
| Approved Payroll transfer projection | `not_transferred` plus Accounting transfer values | `not_transferred` is projection-only and is not accepted as a persisted transfer record status. |
| Accounting acknowledgement | `pending`, `accepted`, `rejected`, `not_received` | Separate from Accounting transfer submission. |
| Integration health | `healthy`, `degraded`, `failed`, `pending`, `not_configured`, `unknown` | Admin monitoring health state. |
| Integration mode | `real`, `simulated`, `local`, `not_configured` | Admin monitoring/configuration mode. |
| Application account | `active`, `inactive`, `disabled` | Application profile status; Firebase Auth state remains an external Auth concern. |

## C. Role Inventory

The application role model remains the existing `ApplicationRole` definition
in `src/lib/auth/roles.ts` and its related permission definitions. No role
identifier was renamed. Historical or compatibility role values were not
silently rewritten.

## D. Permission Inventory

The canonical permission keys remain the domain-scoped values in
`src/types/permissions.ts`, including Employee self-service, HR attendance and
correction, Payroll handoff/results, Accounting transfer/history, Admin
monitoring/accounts/RBAC/settings, and audit-log access. No broad permission
or generic status type was introduced.

## E. Identifier Matrix

| Identifier | Current contract | Boundary |
| --- | --- | --- |
| Firebase UID | `uid` | Firebase Auth identity and application account key. |
| Application user ID | No separate persisted identifier was found; current application account DTOs use `uid`. | Retained as-is; a distinct ID must be introduced only if the backend contract later proves one exists. |
| Employee ID | `employeeId` | Institutional employee reference used by attendance, Payroll snapshots/results, and employee APIs. |
| Attendance record ID | `attendanceRecordId` or repository document ID `id` depending on DTO | Attendance/correction boundary; not renamed during audit. |
| Payroll batch ID | `batchId` | Persisted Payroll batch and lineage reference. |
| Payroll transfer/handoff ID | `transferId` | Payroll handoff identity; distinct from batch and result IDs. |
| Payroll result ID | `resultId` / `payrollResultId` at Accounting boundary | Payroll Result identity and Accounting lineage reference. |
| Payslip ID | `payslipId` | Employee-level payslip result reference. |
| Accounting transfer ID | `transferId` | Accounting transfer identity, scoped by its Accounting DTO/repository. |
| External reference | `externalPayrollReference`, `externalAccountingReference`, `externalResultReference` | Provider references remain explicit and are not conflated with internal IDs. |

Ambiguous generic `id` fields remain only where their enclosing DTO makes the
entity obvious or where the field is a UI row identity. No persisted field was
renamed to force a naming preference.

## F. DTO and Type Changes

- Added shared Payroll external processing, payslip, and result status arrays
  in `src/types/payroll-handoff.ts`.
- Reused the Payroll external result registry for `PayrollResultStatus` instead
  of maintaining a second literal list.
- Typed `PayrollHandoffBatchSummary.batchStatus` as `PayrollBatchStatus`.
- Split the UI-only `not-added` verified-attendance filter state into
  `PayrollVerifiedAttendanceBatchStatus`; it no longer contaminates the
  persisted `PayrollBatchStatus` type.
- Removed duplicate Accounting transfer and acknowledgement registries from
  `accounting-approved-payroll.ts`.
- Added the explicitly named
  `AccountingApprovedPayrollTransferStatus` projection type, which documents
  why `not_transferred` exists in Approved Payroll but not in persisted
  Accounting transfer records.
- Typed persisted `AccountingTransferRecord.payrollResultStatus` and the
  Accounting adapter/repository input as `PayrollResultStatus`.

Display-oriented DTOs that intentionally carry labels, formatted values, or
presentation status text were not renamed into machine-state fields. This
preserves the existing UI contract and keeps display labels separate from
server-owned state.

## G. API Contract Changes

The existing `ApiSuccessResponse<T>` / `ApiErrorResponse` envelope remains the
API contract. No route path or persisted field was renamed.

- Payroll Results query validation now reads the shared external processing
  status registry.
- Approved Payroll query validation now reads the explicit Approved Payroll
  transfer projection registry.
- Firestore Payroll batch, Payroll handoff, Payroll result, and Accounting
  transfer parsers validate persisted status values against their canonical
  registries before returning typed DTOs.
- Existing page/pageSize, total/totalPages/hasNext, nullable filter, and
  domain-specific response shapes remain unchanged.

## H. Nullability Changes

No broad nullability migration was performed. Existing distinctions remain:

- Nullable timestamps include `acknowledgedAt`, `failedAt`, `processedAt`,
  `completedAt`, `releasedAt`, and `updatedAt` fields where the lifecycle does
  not guarantee a value.
- Optional legacy Firestore fields continue to be accepted where the current
  repository parser defines them as optional.
- Missing required identifiers, timestamps, status values, and provider data
  continue to produce a typed data error rather than an invented default.

## I. Timestamp Changes

No timestamp storage format was changed. Firestore repositories continue to
read Firestore `Timestamp` values and expose ISO strings at the server/API
boundary. Campus display formatting remains a UI/service presentation concern;
formatted date/time strings are not used as authoritative persisted timestamps.

## J. Mapper Changes

- Status arrays are now reused by API query validators and repository parsers
  instead of repeating literal lists.
- Payroll verified-attendance mapping now carries the canonical batch status
  without the previous unsafe cast.
- Accounting lifecycle logic now consumes the named Approved Payroll transfer
  projection type.
- Existing Payroll/Accounting external adapters remain behind their current
  service boundaries. No raw provider payload was exposed to clients.

## K. Legacy Compatibility

No persisted aliases were added or removed. Existing Firestore field names,
collection names, status spellings, external reference names, and API route
paths remain intact. Development seed data and old static reference modules
were not treated as proof of active production behavior.

## L. Deferred Data Migrations

No data migration is required for this audit. A migration would be unsafe
without a verified inventory of deployed Firestore documents and a rollback
plan. Unknown persisted status values now fail repository parsing as invalid
data instead of being silently coerced.

## M. Unsafe Cast Cleanup

The verified-attendance batch status cast was removed. Remaining boundary casts
are narrow `unknown`-to-canonical-value checks performed immediately after
membership validation; no `any` cast was introduced to hide drift.

## N. Cross-Module Consistency

Attendance, Correction, Payroll Readiness, Payroll Batch, Payroll Handoff,
Payroll Result, Payslip, Accounting Readiness, Accounting Transfer, Accounting
Acknowledgement, Integration Health, Integration Mode, account, role, and
permission concepts remain distinct. In particular, the audit preserves:

- Correction Approval versus HR Final Verification.
- HR Final Verification versus Payroll Readiness.
- Payroll Readiness versus Payroll Processed.
- Payroll Batch versus Payroll Handoff.
- Handoff Submitted versus Handoff Acknowledged.
- Payroll Result versus Payslip.
- Accounting Transfer Submitted versus Accounting Acknowledged.

## O. Security-Relevant DTO Findings

The audit did not expose provider credentials, raw Firebase documents, or raw
adapter payloads. Existing server/API authorization boundaries were preserved.
The audit does not claim to complete the separate P1 work for server-owned HR
final verification, Employee correction submission, or direct HR directory and
schedule page guards.

## P. Tests

No test runner is configured in `package.json`, so no unit or integration test
suite was claimed. Verification performed for this task:

- TypeScript: `npm.cmd exec -- tsc --noEmit` — PASS.
- ESLint: `npm run lint` — PASS with one pre-existing warning for the unused
  `getNullableString` helper in `src/server/repositories/payroll/payslip.repository.ts`.
- Production build: `npm run build` — PASS.
- Diff whitespace check: `git diff --check` — PASS.

## Q. Verification

The production build compiled the complete current App Router route graph,
including Admin, HR, Payroll, Accounting, Employee, Scanner, and API routes.
No browser, visual, responsive, accessibility, authenticated Firebase, live
provider, or mutation smoke check was performed in this task.

## R. Environment Blockers

Authenticated Firebase lifecycle and browser/runtime interaction checks remain
unavailable in this environment because Firebase Email/Password is disabled in
the configured environment and prior runtime checks reported `spawn EPERM`.
The successful production build is the available runtime-adjacent verification;
it is not a substitute for authenticated browser QA.

## S. Remaining Inconsistencies

- Some dashboard and integration view models intentionally retain
  `status: string` because they carry human-readable display labels rather than
  persisted machine status. These should be revisited only as presentation DTO
  cleanup, not normalized into domain status unions blindly.
- The repository has no separate Application User ID distinct from Firebase
  UID. This remains an explicit contract finding, not an inferred rename.
- HR final verification is not yet a server-authoritative mutation boundary;
  this remains the next workflow fix rather than part of this data audit.
- Employee correction submission and direct HR directory/schedule page guards
  remain separate backlog work documented in project state.

## T. Files Changed

The implementation changed the canonical Payroll/Accounting type registries,
Payroll/Accounting repository parsers and adapter input, Payroll and
Accounting services, two API query validators, two UI/data mappers, and the
verified-attendance filter type. Project state, handoff, and this permanent
completion record were updated separately.

## U. Completion Record

SYSTEM-DATA-004 is complete. `CURRENT.md` is reset to `No Active Task` after
the implementation and verification above. The next recommended implementation
remains the server-authoritative HR final verification and Payroll-readiness
workflow fix, not an additional blind status rename.

Completion date: 2026-10-14.
