# DB-SCHEMA-008 - PostgreSQL Schema Inventory

This inventory describes the schema deployed by
`20261014120000_initial_sia_schema`. It is structural only; business rows are
still owned by Firestore until the later migration and repository cutover
tasks.

| Prisma model / table | Purpose | Primary key and important foreign keys | Important constraints and indexes |
| --- | --- | --- | --- |
| `ApplicationRole` / `application_roles` | Five canonical application roles. | UUID `id`. | Unique `code`; seeded roles are `admin`, `hr`, `employee`, `payroll`, and `accounting`. |
| `Permission` / `permissions` | Controlled permission catalog. | UUID `id`. | Unique `key`; seeded from the current code catalog. |
| `RolePermission` / `role_permissions` | Persistent role-to-permission assignment. | Composite `(role_id, permission_id)`. | Assignment version, update actor snapshot, role/permission indexes; dependent join rows cascade with a role or permission. |
| `User` / `users` | Firebase application-profile bridge. | UUID `id`; `role_id` restricts role deletion; nullable `employee_id` sets null. | Unique `firebase_uid` and `username`; no password field. |
| `Employee` / `employees` | HRPS-synchronized employee reference. | UUID `id`. | Unique textual `employee_id`; department/status indexes; optional legacy Firestore ID. |
| `EmployeeSchedule` / `employee_schedules` | Structured schedule snapshots. | UUID `id`; `employee_id` restricts employee deletion. | Unique employee/schedule pair; employee/effective-date index; effective-date check. |
| `AttendanceRecord` / `attendance_records` | Unified daily attendance with QR/Bundy provenance. | UUID `id`; `employee_id` restricts deletion; nullable actor FKs set null. | Unique employee/date; date/status/source and verification/readiness indexes; time ordering check. |
| `AttendanceCorrection` / `attendance_corrections` | Correction request, decision, evidence, and immutable snapshots. | UUID `id`; employee/attendance FKs restrict deletion; actor FKs set null. | Status/submitted-time, employee/date, attendance indexes; pending/reviewed state check. |
| `PayrollBatch` / `payroll_batches` | Historical Payroll batch header. | UUID `id`; actor FKs set null. | Unique batch reference; period/status and stable updated-time indexes; count check. |
| `PayrollBatchItem` / `payroll_batch_items` | Immutable employee-period batch snapshot. | UUID `id`; batch cascades to dependent item; employee restricts deletion. | Unique employee/period claim and batch/employee-period membership; employee/period index. |
| `PayrollHandoff` / `payroll_handoffs` | Batch submission and acknowledgement lifecycle. | UUID `id`; unique batch FK; submitted actor sets null. | Unique batch and transfer reference; transfer/acknowledgement indexes; nonnegative attempt check. |
| `PayrollResult` / `payroll_results` | External Payroll result header. | UUID `id`; batch and handoff restrict deletion. | Unique handoff and result reference; status/readiness indexes; count check. |
| `PayrollResultItem` / `payroll_result_items` | External per-employee result snapshot. | UUID `id`; result cascades to child; nullable employee FK sets null. | Unique result/employee snapshot; employee/period and processing/payslip indexes. |
| `PayrollPayslip` / `payroll_payslips` | External Payroll payslip and monetary snapshot. | UUID `id`; employee restricts deletion; optional result item sets null. | Unique Payroll reference and employee/period; Decimal monetary fields; employee/period/status indexes. |
| `AccountingTransfer` / `accounting_transfers` | Payroll Result to Accounting transfer lifecycle. | UUID `id`; unique result FK; batch/handoff restrict deletion; actor sets null. | Unique result and transfer reference; transfer/acknowledgement indexes; nonnegative attempt check. |
| `AuditEvent` / `audit_events` | Append-only normalized audit history. | UUID `id`; nullable actor FK sets null. | Occurred-time, module, actor, target indexes; source collection/legacy ID uniqueness where present. |
| `SystemSetting` / `system_settings` | Controlled runtime override singleton. | UUID `id`; nullable update actor sets null. | Unique `setting_key` defaulting to `runtime`; optimistic `version`; JSON overrides. |

## Lifecycle enums

Separate enum domains are used for user status, employment status, attendance
source/status, HR verification, Payroll readiness, correction status and issue
type, Payroll batch/handoff/acknowledgement/result/item/payslip states,
Accounting transfer/acknowledgement/readiness states, and audit actor/outcome.
No universal status enum is used.

## Security and historical behavior

- Firebase Authentication remains external; `users.firebase_uid`, the internal
  user UUID, and textual `employees.employee_id` are distinct identifiers.
- No passwords, biometric templates, or browser database credentials are
  stored.
- All application tables have RLS enabled without permissive browser policies.
  Authorization remains in Next.js server guards/services and Prisma is
  server-only.
- Actor snapshots and Payroll/Accounting employee snapshots preserve history
  after a user or current employee reference changes.
- HRPS/Bundy import tables are intentionally not present until source contracts
  are approved.
