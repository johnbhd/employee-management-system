# DB-ARCH-006 - Firestore to PostgreSQL Mapping

## DB-SCHEMA-008 and DB-AUTH-BRIDGE-009 status

The target tables in this map are now implemented by Prisma 6.19.0 and the
`20261014120000_initial_sia_schema` migration is applied to Supabase
PostgreSQL. The identity/RBAC bridge is also implemented: application users,
role assignments, permission resolution, and explicit application-user
Employee links now use PostgreSQL via Prisma. This document remains a future
Firestore business-data migration map: no attendance, Payroll, Accounting,
settings, or audit records were copied, and no legacy collections were deleted.

This map describes a safe target shape. It is not a migration script and does
not authorize a destructive delete. Firestore document IDs and field names are
the source compatibility evidence; PostgreSQL names are the implemented
canonical names for later schema/repository tasks.

## Identifier rules

| Current identity | Target identity | Rule |
| --- | --- | --- |
| Firebase Auth UID | `users.firebase_uid` | Text, unique, retained as the authentication bridge. Do not use employee ID as the Auth key. |
| `employees/{employeeId}` | `employees.id` plus `employees.employee_id` | Internal UUID plus unique text integration identifier. Preserve leading zeros. Store the original Firestore ID in `legacy_firestore_id`. |
| `employeeSchedules/{employeeId}` | `employee_schedules.id` plus `employee_id` FK | Current document ID is the employee ID; future schedule history needs an internal row ID and effective dates. |
| `attendance/{employeeId}_{attendanceDate}` | `attendance_records.id` plus unique employee/date key | Store legacy document ID; enforce one current record per employee/date. |
| `payrollBatches/{batchId}` | `payroll_batches.id` | Use UUID internally, retain `legacy_firestore_id` and a stable batch reference. |
| `payrollBatchMembership/{encodedEmployeePeriodId}` | Unique constraint on `payroll_batch_items(employee_id, period_start)` | The membership document is a concurrency/idempotency guard, not a separate business object. Keep a legacy mapping during migration. |
| `payrollHandoffs/{batchId}` | `payroll_handoffs.id` | Preserve unique batch ID, transfer ID, provider and external references. |
| `payrollResults/{resultId}` | `payroll_results.id` | Preserve result ID and external reference; link to batch/handoff. |
| `payrollResults/{resultId}/items/{employeeId}` | `payroll_result_items.id` | Child rows with unique `(result_id, employee_id)` and employee/result lineage. |
| `accountingTransfers/{transferId}` | `accounting_transfers.id` | Preserve transfer, Payroll result, batch, handoff, external reference, and attempt lineage. |
| `rolePermissions/{role}` | `application_roles` + `role_permissions` | Convert the current permission array to rows; retain source version and update actor. |
| `systemSettings/runtime` | `system_settings` singleton | Keep validated overrides JSONB, version, update actor and timestamps. |
| Audit collection IDs | `audit_events.id` | Preserve source collection and legacy ID in migration metadata; normalize actors, targets, outcomes, and metadata. |

## Collection mapping matrix

| Firestore collection/path | Target table(s) | Field and relationship mapping | Constraints / migration notes |
| --- | --- | --- | --- |
| `users` | `users` | `uid -> firebase_uid`; `username`; `displayName -> display_name`; `role -> role_id`; `employeeId -> employee_id` FK through text lookup; `status`; timestamps. | Resolve employee links by exact text `employee_id`; reject ambiguous/missing links according to current service rules. Do not copy passwords. |
| `employees` | `employees` | `employeeId -> employee_id`; display/dept/position/status; add `source_system = HRPS`, `data_source`, `source_updated_at`, `synced_at` as migration/source metadata. | Text unique key. Preserve null position. HRPS remains source of truth. |
| `employeeSchedules` | `employee_schedules` | `scheduleId`, employee FK, `workStart/workEnd/breakStart/breakEnd`, `shiftLabel`, `workDays/restDays` JSONB, `workLocation`, `sourceSystem`, `dataSource`. | Preserve current snapshot; do not invent effective dates for old rows. New schema may require them nullable. |
| `attendance` | `attendance_records` | Employee FK, date, time-in/out `timestamptz`, sources, status, actor snapshots JSONB, created/updated timestamps, correction/verification references and metadata. | Keep source/status separate. Preserve `QR`; future Bundy records must be distinguishable. Validate time-out >= time-in. |
| `attendanceCorrectionRequests` | `attendance_corrections` plus optional `attendance_correction_evidence` | Request ID, employee/attendance FKs, date, issue/status/reason, submitted/reviewed actor snapshots, original/resulting/requested/changed structures. | Preserve original snapshots even after approval. Do not merge correction approval with HR final verification. |
| `payrollPayslips` | `payroll_payslips` plus optional `payroll_monthly_summaries` | Employee FK, period, external Payroll reference, status, source, released time, monetary values, deductions JSONB, monthly summary. | Treat money as external output. Preserve null/zero distinctions. No local calculation. |
| `payrollBatches` | `payroll_batches` + `payroll_batch_items` | Header period/status/actors/timestamps/counts/notes; each `includedRecords[]` becomes an item snapshot row with employee/dept/period/attendance summary and source IDs JSONB. | The item snapshot is historical and must not be replaced by current employee values. |
| `payrollBatchMembership` | `payroll_batch_items` unique key / optional migration map | `batchId`, `employeePeriodId`, created time. | Use a unique employee-period constraint and transaction locking. Do not duplicate a second authoritative membership table without need. |
| `payrollHandoffs` | `payroll_handoffs` | `transferId`, `batchId` FK, period, actors, batch summary snapshot, lifecycle statuses/timestamps, provider, external ref, attempts/failure. | One current handoff per batch in current behavior; preserve failed/retry states. |
| `payrollResults` | `payroll_results` | Result header fields, batch/handoff FKs, external refs/status/provider/counts/timestamps. | Validate result links before import; preserve returned status distinct from handoff status. |
| `payrollResults/{id}/items` | `payroll_result_items` | Result FK, employee ID/reference, employee/dept snapshots, period, external refs, processing/payslip statuses, issue data, timestamps. | Employee may be unresolved during quarantine; final promotion requires a valid integration ID. |
| `payrollResultAuditEvents` | `audit_events` | Map system actor, action, result/batch/transfer/employee/payslip IDs into target metadata/target fields. | Mark `source_collection` and original ID; deduplicate deterministic event IDs. |
| `accountingTransfers` | `accounting_transfers` | Transfer ID, Payroll result/batch/handoff FKs, period, refs, status/ack/provider/attempt/failure/timestamps. | Unique current transfer per Payroll result; retain failed retry lineage. |
| `accountingTransferMembership` | `accounting_transfers` unique `payroll_result_id` | Map result-to-transfer and created time. | Use a database unique constraint to replace the idempotency guard. |
| `accountingTransferAuditEvents` | `audit_events` | Map action/actor/transfer/result/batch/reference/failure metadata. | Preserve legacy source identity during reconciliation. |
| `rolePermissions` | `application_roles`, `permissions`, `role_permissions` | The identity bridge now reads and writes the seeded PostgreSQL rows; the legacy Firestore array is retained only as migration evidence. | Seed all canonical roles/catalog keys first. Do not use the Firestore role document as an authorization fallback. |
| `systemSettings/runtime` | `system_settings` | `overrides` JSONB, version, updated actor/time. | Only registered runtime keys may be imported; unknown/sensitive keys are quarantined. |
| `auditEvents` | `audit_events` | Directly map canonical event/actor/target/outcome/summary/metadata/timestamps. | Append-only import; keep original event ID where collision-free. |
| `adminAuditEvents` | `audit_events` | Normalize legacy role-permission action, module, actor, target, metadata. | Preserve legacy event source; do not discard because it predates canonical audit. |
| `adminUserAccountAuditEvents` | `audit_events` | Normalize account action, actor/target identity, changes array, timestamps. | Preserve account lifecycle events even if the account is later deleted. |

## Type conversions

| Firestore value | PostgreSQL target |
| --- | --- |
| Firestore `Timestamp` | `timestamptz` in UTC; format for campus display only at the service/UI boundary. |
| Date key `YYYY-MM-DD` | `date`; retain the original string during validation. |
| Period object `{ start, end, label }` | `period_start date`, `period_end date`, `period_label text`; use JSONB only for external snapshot compatibility. |
| Actor object | FK to `users` where resolvable plus immutable `actor_snapshot jsonb`. System/integration actors may not have a user FK. |
| Arrays of schedule days, attendance IDs, permission lists | Relational child rows when independently queried; JSONB for small immutable snapshots such as source attendance IDs or evidence metadata. |
| Nested employee/department names in Payroll records | Snapshot columns on batch/result item, not a live-only join. |
| `null` vs absent | Preserve semantic nullability; do not turn unavailable external values into zero or empty strings. |
| Monetary numeric values | PostgreSQL `numeric` with explicit scale selected in the schema task; copy external values only. |

## Compatibility requirements

The first repository migration should support a read-only compatibility period:

1. import a row with its legacy Firestore ID and source collection;
2. compare key counts, IDs, relationships, statuses, timestamps and snapshot
   hashes;
3. keep old Firestore reads available behind a feature flag until all affected
   repositories pass reconciliation;
4. switch new writes only after PostgreSQL transaction behavior is verified;
5. retain a backup/export and an explicit rollback flag before retiring any
   Firestore business read.

No document should be deleted as part of DB-ARCH-006.
