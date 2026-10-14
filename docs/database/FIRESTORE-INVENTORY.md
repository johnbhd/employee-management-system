# DB-ARCH-006 - Firestore Inventory

## Status and evidence

This document records the Firestore persistence that is confirmed by the
repository as of 2026-10-14. It is an architecture inventory, not a live data
dump. No collection-wide production read was performed for this document.

The application uses Firebase Admin SDK only from `src/server/` and Route
Handlers. The browser does not import the Firebase Firestore SDK. Firebase
Authentication remains a separate identity service and is not part of the
business-data migration.

The repository currently has no PostgreSQL schema, migration runner, SQL
directory, Prisma/Drizzle configuration, Supabase client, or PostgreSQL
dependency. Counts are therefore `not measured`; the configured project also
recently returned `8 RESOURCE_EXHAUSTED: Quota exceeded` for a targeted
Firestore health read.

## Confirmed persistence boundary

```text
Browser
  -> Next.js App Router pages/components
  -> Route Handlers
  -> server services
  -> Firebase Admin repositories
  -> Cloud Firestore

Firebase Authentication
  -> Firebase UID
  -> application users/{uid} profile
```

`Firebase UID` and institutional `employeeId` are different identifiers.
Employee IDs are already treated as strings, including values with leading
zeros such as `001`.

## Collection inventory

| Firestore path | Document ID | Confirmed shape and purpose | Readers / writers | History / priority |
| --- | --- | --- | --- | --- |
| `users` | Firebase Auth UID; stored `uid` must match | `username`, `displayName`, `role`, nullable `employeeId`, `status`, timestamps, and seed provenance. Application profile joined to Firebase Auth. | `user.repository`; auth session; Admin User Accounts; Roles & Permissions. Seeder and Admin User Accounts write it. | Current identity profile. Preserve audit history when a profile is deleted. P0/P1 migration. |
| `employees` | Institutional `employeeId` | `employeeId`, `displayName`, `department`, nullable `position`, `employmentStatus`. This is a read model/reference for HRPS-owned employee data. | Employee repository; HR, Employee, Payroll, Admin services. Development seeder writes it; no production HRPS importer exists yet. | Current HRPS reference. Keep `employee_id` textual and unique. P0/P1. |
| `employeeSchedules` | `employeeId`; stored `employeeId` must match | `scheduleId`, employee ID, `workStart`, `workEnd`, `breakStart`, `breakEnd`, `shiftLabel`, `workDays[]`, `restDays[]`, `workLocation`, `sourceSystem: HRPS`, `dataSource`. | Employee schedule repository; HR services; Admin settings/monitoring. Development seeder writes it. | Current schedule snapshot; no effective-date history is currently persisted. P1. |
| `attendance` | `${employeeId}_${attendanceDate}` | Employee/date, Firestore timestamps for time-in/out, `timeInSource`, `timeOutSource`, status, operator snapshots, created/updated timestamps, optional embedded correction metadata and HR verification metadata. Current writes are QR-based. | Attendance repository; Employee attendance; HR dashboards/reports/monitoring; Payroll verified attendance; correction transaction; Admin monitoring. | Operational attendance record. P0/P1. Raw Bundy events do not exist yet. |
| `attendanceCorrectionRequests` | Request `id`; stored `id` must match | Employee/date/attendance reference, issue type, status, reason, submitted actor, original/resulting attendance snapshots, requested changes, changed fields, evidence array, reviewer, review timestamps, note, updated timestamp. | Correction repository/service; Employee correction submission; HR review/audit; Payroll readiness. | Workflow history is partly represented by snapshots and canonical audit events. P1. |
| `payrollPayslips` | Payslip `id` | Employee and period keys, external Payroll reference, pay fields supplied by Payroll, deduction array, status, release time, source marker, and nested monthly summary with included payslip IDs. | Payslip repository; Employee payslip page; Payroll Result ingestion upsert. | External Payroll output snapshot; application must not calculate monetary values. P1. |
| `payrollBatches` | Generated `PAY-<period>-<random>` ID | Period object, lifecycle status, actor snapshots, timestamps, counts, notes, and `includedRecords[]` containing immutable employee-period attendance snapshots. | Payroll batch repository/service; Payroll dashboard, verified attendance, handoff, history; Admin monitoring; canonical audit events. | Historical batch snapshot. P0/P1. |
| `payrollBatchMembership` | Encoded `employeePeriodId` | `batchId`, `employeePeriodId`, `createdAt`; prevents an employee-period source from being placed in multiple batches. | Payroll batch transactions. | Current uniqueness/claim guard; target should be a database uniqueness constraint or equivalent. P1. |
| `payrollHandoffs` | `batchId`; stored batch ID must match | `transferId`, batch/period, actor and batch summary snapshots, submission/ready/ack/failure timestamps, transfer and acknowledgement statuses, provider, external reference, attempt count, safe failure fields, timestamps, derived timeline. | Payroll handoff repository/service; Payroll history; Admin monitoring; Accounting lineage. | One current handoff projection per batch. Preserve external lineage and attempts. P1. |
| `payrollResults` | `resultId`; stored result ID must match | Batch/transfer links, period, external Payroll reference, result status/provider, lifecycle counts, received/processed/completed timestamps, created/updated timestamps. | Payroll result repository/service; Payroll Results, History, Accounting, Admin monitoring. | External result header. P1. |
| `payrollResults/{resultId}/items` | Sanitized employee ID | Result/batch/transfer links, employee ID/name/department snapshot, period, external references, processing/payslip statuses, release/process times, issue code/summary. | Payroll result detail/results/history; payslip upsert; Accounting projection. | External result line snapshot. Migrate as a child table. P1. |
| `payrollResultAuditEvents` | Deterministic event ID | Result/batch/transfer references, employee/payslip references, action, system actor, timestamp, external reference. | Legacy audit adapter only; canonical audit reader. | Historical compatibility collection. Consolidate into `audit_events` with source metadata. P2. |
| `accountingTransfers` | `transferId`; stored ID must match | Payroll result/batch/handoff links, period, external Payroll reference, employee count, Payroll result status, actor, transfer/ack statuses, provider, external Accounting reference, attempt/failure fields, timestamps, derived timeline. | Accounting transfer repository/service; Accounting pages/history/dashboard; Admin monitoring; canonical/legacy audit. | Transfer lifecycle. P1. |
| `accountingTransferMembership` | Sanitized Payroll Result ID | `payrollResultId`, `transferId`, `createdAt`; idempotency/claim guard. | Accounting transfer transactions. | Current uniqueness guard; target should be a unique result-to-transfer relation. P1. |
| `accountingTransferAuditEvents` | Deterministic transfer event ID | Transfer/result/batch references, actor snapshot, action, external reference/failure information, timestamp. | Accounting transfer repository; canonical audit reader. | Historical compatibility collection. P2. |
| `rolePermissions` | Canonical application role (`admin`, `hr`, `employee`, `payroll`, `accounting`) | `roleId`, unique permission key array, optimistic `version`, updated timestamp, updated actor snapshot. Missing documents fall back to code defaults. | Role-permission repository/service; authorization service; Admin dashboard; canonical admin audit. | Controlled configuration. P0/P1. |
| `systemSettings` | Singleton `runtime` | `overrides` map, optimistic `version`, updated timestamp, updated actor snapshot. Only registered runtime settings are writable. | Settings repository/service; Admin Settings; Audit Logs defaults; Admin dashboard. | Current configuration, not a history table. Audit events preserve changes. P1. |
| `auditEvents` | Generated or deterministic canonical event ID | Event type/action/module, actor object, target object, outcome, summary, safe metadata map, occurred/created timestamps. | Central audit repository and all current feature services. Admin Audit Logs reads it. | Canonical append-only audit history. P0/P1. |
| `adminAuditEvents` | Auto-generated ID | Older roles/permissions audit shape: action/module/actor/target/metadata/timestamp. | Roles & Permissions writer; audit compatibility reader. | Legacy compatibility collection. P2. |
| `adminUserAccountAuditEvents` | Auto-generated ID | Account action, actor/target UID/display names/role, changes array, timestamps. | Admin User Accounts writer; audit compatibility reader. | Legacy compatibility collection; preserve before consolidation. P2. |

## Nested and embedded structures

- `payrollBatches.includedRecords[]` is an immutable batch snapshot, not a
  live join to the employee or attendance collection. It contains employee
  identity/display fields, department, period, attendance summary, HR
  verification, Payroll readiness, source attendance IDs, and snapshot time.
- `payrollResults/{resultId}/items` is a true subcollection and should become
  a relational child table rather than a JSON array if result-line filtering
  and reconciliation are required.
- Attendance embeds operator snapshots, correction metadata, and HR
  verification metadata. These preserve who performed an historical action;
  they should not be replaced only by a current user join.
- Correction requests embed original/resulting attendance snapshots,
  requested changes, changed fields, and evidence. The target should keep
  snapshots immutable; evidence can remain JSONB initially or become a child
  table if file metadata needs independent search/retention.
- Payslips embed deductions and a monthly summary. Monetary values are
  external Payroll outputs and not locally calculated values.
- Handoff and Accounting transfer timelines are derived from lifecycle fields;
  they are not separate persisted arrays in the current repositories.

## Ownership and missing domains

The repository confirms these ownership boundaries:

- HRPS owns official employee/schedule data. This application stores a
  synchronized reference, not a replacement HR master.
- Bundy ingestion and raw biometric events are not implemented. No Bundy
  collection should be invented during this architecture task.
- QR writes standardized attendance records with `QR` source values.
- Payroll and Accounting remain external owners. Local records represent
  handoffs, returned results, payslips, and Accounting transfer acknowledgements.
- Integration Monitoring is a derived read model; no monitoring collection is
  confirmed.
- There is no import/synchronization history collection in the current code.
  HRPS/Bundy import batches are future domain additions, not current data.

## Live inventory limits

No document counts, index export, or full collection scan was performed. The
repository evidence is sufficient to design the migration model, but the next
data-migration task must obtain safe collection counts and sample validation
records after Firestore quota/connectivity is restored. It must not use a
full-database download as an exploratory shortcut.
