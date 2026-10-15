# INTEGRATION-HRPS-013 — HRPS CSV synchronization

## Boundary

The Admin route `/admin/hrps-integration` accepts UTF-8 `.csv` exports from
the existing HRPS. HRPS remains authoritative for employee ID, name,
department, position, employment status, and supplied work schedules. The
browser never connects directly to PostgreSQL and no Supabase Auth flow is
introduced.

The server parses and validates the upload, compares employee IDs in bounded
PostgreSQL queries, and returns a preview without business writes. Confirmation
re-uploads the same file and requires its SHA-256 preview token to match before
short, sequential Prisma transactions synchronize eligible rows.

## CSV contract

Required headers are `employee_id`, `name`, `department`, and
`employment_status`. `position` is optional. Structured schedule columns are
optional as a group: `schedule_id`, `work_days`, `rest_days`, `work_start`,
`work_end`, `break_start`, `break_end`, `shift_label`, `work_location`,
`effective_from`, and `effective_to`.

Header aliases are centralized in
`src/server/hrps/hrps-import.service.ts`; aliases include `employee id`,
`display_name`, `employee_name`, `dept`, `job_title`, `status`, `start_time`,
and `end_time`. Employee IDs remain strings, so values such as `001` retain
their leading zeros.

## Synchronization behavior

Preview classifications are `NEW`, `UPDATED`, `UNCHANGED`, `INVALID`,
`DUPLICATE`, and `NEEDS_REVIEW`. Duplicate IDs are rejected as a group.
Invalid, duplicate, and review rows never write Employee or schedule data.
Only HRPS-owned Employee fields are updated; missing CSV rows are not deleted.
Structured schedules are validated, compared before writing, and persisted
through the existing effective-dated schedule model.

Import history is stored in the PostgreSQL `hrps_imports` table. Raw CSV
content is not persisted. Confirmed imports and Employee row changes create
Prisma audit events with minimized metadata.

## Safe rollback

Confirmed imports also create `hrps_import_rows` ownership records. Each
changed row records its classification, Employee ID/database ID, whether the
Employee was created, minimal HRPS-owned before/after values, schedule
created/updated snapshots, and explicit Application User/Firebase ownership
flags. The importer currently creates neither new Application Users nor
Firebase identities, so existing linked identities are never rollback targets.

`GET /api/admin/hrps/imports/:id/rollback-preview` is read-only and checks
ownership, downstream Employee relationships, later HRPS rows, schedule
state, and protected account activity. `POST /api/admin/hrps/imports/:id/rollback`
re-runs those checks, claims the import with a conditional status transition,
and then performs a bounded PostgreSQL transaction. A successful rollback
preserves the import and original audit events, marks it `ROLLED_BACK`, and
appends a rollback audit event. Attendance, corrections, Payroll, payslips,
and account activity block deletion of import-created Employees. A later HRPS
import or changed owned state also blocks rollback. Firebase cleanup is kept
outside the PostgreSQL transaction and any external/database failure is
recorded as `ROLLBACK_FAILED`; credentials and raw CSV data are never stored.

The rollback migration is
`prisma/migrations/20261015113000_hrps_import_rollback/migration.sql`.

## Account provisioning policy

Existing Employee-to-Application User links are preserved and reported. The
current HRPS contract does not provide an approved unique email field or a
secure initial credential/onboarding policy. Therefore a new imported Employee
is marked `pending_onboarding`; the importer does not create a Firebase user,
invent a Firebase UID, assign a privileged role, or generate a predictable
password. Account creation remains available through the existing Admin User
Accounts workflow after an approved onboarding policy is supplied.

## Verification limitations

TypeScript, ESLint, and the production build are the normal implementation
checks. The focused `test:hrps` command is present for CSV parser coverage;
on this Windows environment, `tsx`/Prisma child-process execution may be
blocked by `EPERM`. The versioned migration is
`prisma/migrations/20261015100000_hrps_import_history/migration.sql`; deploy
it through the normal Prisma migration process before using the runtime route.
