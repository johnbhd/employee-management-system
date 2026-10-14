# DB-ARCH-006 - Target PostgreSQL Architecture

## DB-SCHEMA-008 implementation status

The target relational schema is now implemented in `prisma/schema.prisma` and
deployed by `prisma/migrations/20261014120000_initial_sia_schema`. The live
schema contains the identity/RBAC, HRPS reference, attendance, correction,
Payroll, payslip, Accounting, audit, and controlled settings tables described
below. HRPS/Bundy import tables remain future work because their source
contracts are not approved.

## Decision summary

The recommended target is:

```text
Firebase Authentication
        |
        | Firebase UID / verified session
        v
Next.js App Router + Route Handlers
        |
        v
Server services + authorization + validation
        |
        v
Repository interfaces
        |
        v
Supabase PostgreSQL
```

Firebase Authentication remains in place. Supabase PostgreSQL becomes the
authoritative business database only after repository migration and validation.
The browser must not connect directly to PostgreSQL. DBeaver is an
administration/inspection client, not an application runtime dependency.
Docker is not required by this design.

## Proposed relational domains

### Identity and RBAC

| Table | Purpose | Key decisions |
| --- | --- | --- |
| `application_roles` | The five canonical application roles. | Seed `admin`, `hr`, `employee`, `payroll`, `accounting`; keep stable role codes. |
| `permissions` | The controlled permission catalog currently defined in `src/lib/auth/permissions.ts`. | Seed stable permission keys; do not allow arbitrary browser-created keys. |
| `role_permissions` | Persistent role-to-permission assignment and optimistic version. | Composite primary key `(role_id, permission_id)` plus assignment version/update actor fields; enforce dependency and admin lockout rules in the service. |
| `users` | Application profile mapped to Firebase Auth. | Internal UUID primary key; unique `firebase_uid`; nullable `employee_id` FK; one current `role_id`; status and timestamps. Never store passwords. |

The current application has one role per profile. Use `users.role_id` first;
do not create `user_roles` until multi-role assignment is a confirmed
requirement. Keep Firebase UID separate from the internal user UUID and from
the employee integration ID.

### HRPS and attendance

| Table | Purpose | Key decisions |
| --- | --- | --- |
| `employees` | Synchronized HRPS employee reference. | Internal UUID plus unique textual `employee_id`; preserve leading zeros; store source system/provenance and synchronized timestamps. |
| `employee_schedules` | Schedule snapshots with optional effective dates. | FK to `employees`; retain work/rest day arrays as JSONB initially because the current Firestore model stores arrays; add `effective_from`/`effective_to` before importing schedule history. |
| `attendance_records` | Standardized daily attendance. | FK to employee; unique `(employee_id, attendance_date)` for the current daily model; separate source, time-in, time-out, processing, correction, HR verification, and Payroll readiness state. Preserve actor snapshots for historical display. |
| `attendance_corrections` | Employee correction request and HR decision. | FK to employee and attendance record; separate request status from final HR verification; keep original/resulting snapshots and requested changes as JSONB for compatibility. |
| `attendance_correction_evidence` (conditional) | Searchable evidence metadata. | Add only if evidence needs retention, independent permissions, or listing; otherwise keep the current small metadata array in JSONB. No binary files in PostgreSQL. |
| `bundy_import_batches` (future) | Import execution metadata. | Not part of current Firestore migration; needed before Bundy CSV/device ingestion. |
| `bundy_raw_events` (future) | Immutable raw Bundy events. | Keep distinct from `attendance_records`; preserve source row/device identifiers and raw payload metadata. Do not store biometric templates. |

HRPS remains the official employee source. PostgreSQL stores the integrated
reference, source identifiers, `source_updated_at`, `synced_at`, and import
lineage; it does not become an ungoverned HR master.

### Payroll and Accounting

| Table | Purpose | Key decisions |
| --- | --- | --- |
| `payroll_batches` | Batch header and lifecycle. | Internal UUID; retain external/legacy batch reference; period, status, actors, counts, notes, and timestamps. |
| `payroll_batch_items` | Immutable employee-period batch snapshots. | FK to batch and employee; unique `(employee_id, period_start)` while the current rule permits one batch per employee-period; store employee/department/attendance snapshot columns and source attendance IDs JSONB. |
| `payroll_handoffs` | Submission/acknowledgement lifecycle for a batch. | Unique `batch_id` and `transfer_id`; preserve provider, external reference, attempts, failure information, actor, and timestamps. |
| `payroll_results` | Returned Payroll result header. | Unique result/external references; FK to batch/handoff; preserve external status/counts and lifecycle timestamps. |
| `payroll_result_items` | Returned employee-level result lines. | FK to result and employee where resolvable; preserve external employee/payroll references, processing/payslip statuses, and issue fields. |
| `payroll_payslips` | External Payroll payslip snapshots. | FK to employee and optional result item; retain monetary fields exactly as received; no local salary/tax/net-pay calculation. |
| `payroll_monthly_summaries` (recommended if queried) | Employee monthly aggregate supplied by Payroll. | Separate relation if monthly summaries are listed/filtered; otherwise retain a compatibility JSONB snapshot in the payslip row for the first migration. |
| `accounting_transfers` | Payroll Result to Accounting transfer lifecycle. | Unique `payroll_result_id` while one result has one current transfer; preserve handoff/batch lineage, provider, external reference, attempts, acknowledgement and failure fields. |
| `integration_attempts` (optional later) | Repeatable attempts for technical history. | Do not add until retry/reconciliation requirements need more than the current attempt count and audit records. |

Payroll Batch, Handoff, Result, Payslip, and Accounting Transfer remain
distinct. A successful external adapter response is not a locally calculated
Payroll result.

### Administration and audit

| Table | Purpose | Key decisions |
| --- | --- | --- |
| `audit_events` | Canonical append-only application audit log. | Store typed event/action/module/outcome, actor identity snapshot, target snapshot, safe JSONB metadata, occurred/created timestamps, and `source_collection` during migration. |
| `system_settings` | Versioned runtime settings singleton. | One controlled row (`runtime`) with validated JSONB overrides, version, update actor, and timestamps. Keep changes in `audit_events`; do not make settings a general arbitrary key/value store. |
| `import_batches` (future generalized form) | Common import execution lineage. | Prefer a generic batch header plus typed HRPS/Bundy rows only after import requirements are approved. |

Integration Monitoring remains a derived service/read model over these domain
tables. It should not be copied into a dashboard table merely to make cards
fast.

## Identity and authorization flow

```text
Firebase sign-in
  -> Firebase ID token
  -> Next.js verifies token / session cookie
  -> users.firebase_uid lookup
  -> active application user + role_id
  -> role_permissions lookup
  -> server-side permission check
  -> service business-state and ownership checks
  -> repository transaction
```

The database FK from `users.employee_id` to `employees.id` is nullable because
the current Admin, Payroll, Accounting, and some HR accounts need not be
employee-linked. The application must continue to reject employee-role
accounts without a valid employee link where that rule applies.

## Key and timestamp strategy

- Use PostgreSQL UUIDs for internal row identity and foreign keys.
- Preserve Firestore document IDs in `legacy_firestore_id` on migrated rows
  where they are used in audit references, external reconciliation, or rollback.
- Keep `employee_id` as `text`/`varchar`, with a unique constraint on active
  HRPS identity. Never cast `001` to integer `1`.
- Use `timestamptz` for Firestore timestamps and external lifecycle timestamps.
- Use `date` for attendance and payroll period boundaries.
- Use `time` only for schedule-of-day values such as `work_start`.
- Keep campus display conversion (`Asia/Manila`) in server presentation logic;
  do not store formatted UI strings as the authoritative time.

## Constraints and indexes

The first schema task should define constraints at the database boundary and
repeat authoritative validation in server services.

Recommended initial indexes:

```text
users(firebase_uid unique)
users(employee_id)
employees(employee_id unique)
employees(employment_status)
employee_schedules(employee_id, effective_from)
attendance_records(employee_id, attendance_date desc)
attendance_records(attendance_date, status)
attendance_records(attendance_date, time_in_source)
attendance_corrections(status, submitted_at desc)
attendance_corrections(employee_id, attendance_date)
payroll_batch_items(employee_id, period_start)
payroll_batches(updated_at desc)
payroll_handoffs(transfer_id unique)
payroll_results(transfer_id unique)
payroll_result_items(result_id, employee_id)
payroll_payslips(employee_id, period_end desc)
accounting_transfers(payroll_result_id unique)
accounting_transfers(updated_at desc)
audit_events(occurred_at desc)
audit_events(module, occurred_at desc)
audit_events(actor_uid, occurred_at desc)
```

Add date/status/search indexes only from measured query plans. Do not recreate
the current full-table/in-memory filtering behavior as a SQL design.

## Transaction boundaries

- Attendance QR write: insert/update the daily record and enforce the daily
  uniqueness constraint in one transaction.
- Correction approval: lock the request and attendance row, verify the
  original snapshot, update the attendance record, update the request, and
  append the audit event atomically or through an outbox-safe transaction.
- Payroll batch item add/remove: update batch header and item membership in one
  transaction; use a unique employee-period constraint for idempotency.
- Payroll handoff and Accounting transfer claims: lock the current lifecycle
  row, enforce status and retry rules, then persist the new attempt state.
- Role permission/settings updates: use version checks and audit the accepted
  change. Never allow a partial admin lockout update.

## Supabase connection boundary

The application connection foundation uses:

1. use a server-only `DATABASE_URL` or equivalent secret;
2. use SSL and a Supabase pooler appropriate for serverless request lifetimes;
3. keep credentials out of `NEXT_PUBLIC_*`, client components, logs, and API
   responses;
4. expose a server-only Prisma Client helper rather than importing a database
   client throughout UI code;
5. provide explicit transaction support through Prisma `$transaction`;
6. use Prisma's typed query API, with tagged parameterized SQL only for the
   minimal health probe;
7. document a separate DBeaver connection method without reusing application
   secrets in source control.

The selected access layer is Prisma 6.19.0. The server-only module at
`src/lib/prisma/server.ts` creates a development-safe `PrismaClient` singleton,
validates the server-only `DATABASE_URL`, exposes transaction support, and
does not create any browser database bundle. `prisma/schema.prisma` now owns
the implemented business models and `initial_sia_schema` is the first versioned
migration.

`DATABASE_URL` is the only application connection variable currently used and
must remain server-only. `GET /api/health/postgres` runs only a static tagged
`SELECT 1` query and reports safe `configured`/`connected` state without
returning the URL, raw Prisma errors, or Supabase metadata. The current
runtime/CLI foundation uses the same reachable Supabase pooler URL. The
migration was applied through that configured pooler; a separate direct
migration URL remains an operational option for future migrations.

## RLS and authorization decision

The target runtime is browser -> Next.js -> PostgreSQL. Therefore business
tables are server-only and authorization remains in the existing Next.js
guards/services. The initial migration enables Row Level Security on every
application table without adding browser policies, so anonymous and
authenticated PostgREST access receives no application data or write path.
The server-side Prisma role is the only application data path; database and
migration credentials remain server/admin-only.

## Non-goals

This document does not replace repositories, migrate data, migrate Firebase
Authentication, implement HRPS/Bundy import, add Payroll calculations, or
delete Firestore. Repository cutover and data migration remain later tasks.
