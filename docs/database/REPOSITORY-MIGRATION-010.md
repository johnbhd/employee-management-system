# DB-REPO-MIGRATION-010 - Prisma Repository Readiness

## Status

The Prisma/PostgreSQL repository layer is implemented in parallel with the
existing Firestore repositories. This task does not migrate business rows,
switch live services, delete Firestore, or create permanent dual writes.

The later `DB-DATA-MIGRATION-011` task must import and reconcile data before
`DB-CUTOVER-012` can make any repository authoritative in production.

## Repository migration matrix

| Domain | Current Firestore repository | Prisma repository | Implemented | Tested | Data migrated | Live cutover |
| --- | --- | --- | --- | --- | --- | --- |
| Employees | `employees/employee.repository.ts` | `employees/prisma-employee.repository.ts` | Yes | Typechecked | No | No |
| Employee schedules | `employee-schedules/employee-schedule.repository.ts` | `employee-schedules/prisma-employee-schedule.repository.ts` | Yes | Typechecked | No | No |
| Attendance / QR | `attendance/attendance.repository.ts` | `attendance/prisma-attendance.repository.ts` | Yes | Typechecked | No | No |
| Corrections / HR verification | `attendance-corrections/attendance-correction.repository.ts` | `attendance-corrections/prisma-attendance-correction.repository.ts` | Yes | Typechecked | No | No |
| Payroll batches | `payroll-batches/payroll-batch.repository.ts` | `payroll-batches/prisma-payroll-batch.repository.ts` | Yes | Typechecked | No | No |
| Payroll handoffs | `payroll-handoffs/payroll-handoff.repository.ts` | `payroll-handoffs/prisma-payroll-handoff.repository.ts` | Yes | Typechecked | No | No |
| Payroll results | `payroll-results/payroll-result.repository.ts` | `payroll-results/prisma-payroll-result.repository.ts` | Yes | Typechecked | No | No |
| Payslips | `payroll/payslip.repository.ts` | `payroll/prisma-payslip.repository.ts` | Yes | Typechecked | No | No |
| Accounting transfers | `accounting-transfers/accounting-transfer.repository.ts` | `accounting-transfers/prisma-accounting-transfer.repository.ts` | Yes | Typechecked | No | No |
| Canonical and legacy audit | `audit/audit.repository.ts`, `admin-audit/*`, `admin-user-account-audit/*` | `audit/prisma-audit.repository.ts` | Yes | Typechecked | No | No |
| Runtime settings | `settings/settings.repository.ts` | `settings/prisma-settings.repository.ts` | Yes | Typechecked | No | No |
| Dashboard / monitoring reads | service fan-out over Firestore repositories | `dashboard/prisma-dashboard.repository.ts` | Yes | Typechecked | No | No |
| Application identity / RBAC | PostgreSQL after `DB-AUTH-BRIDGE-009` | Existing Prisma identity repositories | Already complete | Prior task | No business data | Yes for identity only |

No raw Bundy collection/model exists in the current repository. The schema and
repository layer retain `AttendanceSource.BUNDY` for future ingestion, but CSV
parsing and import are intentionally deferred.

## Consumer and method inventory

The Firestore repositories were inventoried from their exports and import
sites. Their current consumers remain unchanged for the safe parallel phase:

| Repository area | Current read/write methods | Confirmed consumers |
| --- | --- | --- |
| Employees / schedules | `getEmployeeById`, `listEmployees`, `getEmployeeScheduleById`, `listEmployeeScheduleReferences` | QR resolution, HR employee directory/schedules, HR dashboard/reports, Admin settings and integration monitoring, Payroll projections |
| Attendance / QR | record lookup, employee/date lookup, employee/date/report/monitoring lists, `recordQrAttendance` | Employee attendance APIs, scanner/QR service, HR monitoring/reports/dashboard, Payroll verified-attendance/readiness, audit history, Admin monitoring |
| Corrections | get/list requests, approval/rejection transaction | Employee correction flow, HR correction requests, HR audit history, Payroll readiness |
| Payroll batch / handoff / result | batch CRUD/status, handoff claim/result, result upsert/detail/items/audit | Payroll batches, handoff, history, results, verified attendance; Accounting approved-payroll/transaction history; Admin monitoring |
| Payslips | employee list, result upsert | Employee payslips and Payroll result ingestion |
| Accounting | transfer list/detail/claim/result/audit | Accounting dashboard, approved Payroll, transfer history/status |
| Audit | canonical append, merged legacy list/detail | Admin audit logs, HR audit history, Payroll/Accounting lifecycle events, settings and account services |
| Settings | runtime get/versioned update | Admin settings and Admin audit-log defaults |

No browser module imports a Firestore client and no `onSnapshot` listener was
found. Client intervals are campus-clock updates or short-lived QR API
polling. The new repository functions are not wired into those consumers until
data migration/reconciliation authorizes a later cutover.

## Query and contract decisions

- Employee lookups preserve the text `employee_id`, including leading zeros;
  internal UUIDs are used only for relational joins.
- Schedules use `effective_from`/`effective_to` when selecting the effective
  schedule; they are not inferred from creation order.
- Attendance, corrections, audit, Payroll history, payslips, and Accounting
  list methods use database filters, deterministic ordering, counts, and
  bounded pages. The dashboard uses `count` and `groupBy` aggregates rather
  than loading complete tables.
- Payroll batch, handoff, result, and Accounting transfer records remain
  separate lifecycle objects. Historical names and departments remain snapshot
  columns rather than live-only joins.
- Corrections update the attendance snapshot on approval but do not set HR
  final verification or Payroll readiness. Those are separate state changes.
- Audit records preserve actor snapshots and support `occurred_at DESC, id DESC`
  pagination. Legacy source collection/document IDs have dedicated fields for
  reconciliation.
- Payslip monetary values are read as fixed decimal strings. The repository
  does not convert PostgreSQL `numeric` values to JavaScript floating point.
- Settings persist only validated runtime overrides. Credentials, provider
  secrets, Firebase private keys, and `DATABASE_URL` remain environment-owned.

## Transaction boundaries

Prisma transactions cover QR time-in/time-out, correction approval, Payroll
batch creation/item changes/status transitions, Payroll handoff claim/result,
Payroll result header/items, and Accounting transfer claim/result. Unique
constraints replace Firestore membership documents for Payroll batch and
Accounting transfer idempotency.

## Realtime and polling inventory

No `onSnapshot` listener exists in `src/`. Existing browser timers are campus
clock updates or short-lived QR API polling. The new repositories do not add
Supabase Realtime or aggressive polling; normal API refresh remains the
intended cutover behavior.

## Cutover prerequisites and blockers

1. Run the controlled Firestore-to-PostgreSQL data migration and reconciliation.
2. Compare counts, legacy IDs, relationships, statuses, timestamps, snapshots,
   and monetary values for each domain.
3. Restore Firebase quota/access and complete the identity bootstrap blocker
   from `DB-AUTH-BRIDGE-009`; the last live attempt returned
   `8 RESOURCE_EXHAUSTED: Quota exceeded`.
4. Verify an enabled PostgreSQL IT Administrator mapping before authenticated
   repository testing.
5. Switch one domain at a time with an explicit rollback/feature-flag plan.

Until those prerequisites are complete, Firestore business repositories remain
available as migration evidence only and remain the current live authority.
