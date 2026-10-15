# DB-CUTOVER-012 — Prisma/PostgreSQL Business Persistence Cutover

## Status

Implementation complete; live database verification is partially blocked by
the Supabase pooler session-capacity response documented below.

## Final architecture

```text
Firebase Authentication
        ↓
Next.js server/API
        ↓
PostgreSQL application identity/RBAC via Prisma
        ↓
Prisma-backed business repositories
        ↓
Supabase PostgreSQL
```

Firebase Authentication remains the credential provider. Supabase Auth,
direct browser database access, and Supabase Realtime were not introduced.

## Runtime provider matrix

| Domain | Normal runtime provider | PostgreSQL model(s) | Firestore status |
| --- | --- | --- | --- |
| Employees | Prisma repository adapter | `Employee` | inactive legacy reference |
| Employee schedules | Prisma repository adapter | `EmployeeSchedule` | inactive legacy reference |
| Attendance / QR | Prisma repository adapter | `AttendanceRecord` | inactive legacy reference |
| Corrections / HR verification | Prisma repository adapter | `AttendanceCorrection`, `AttendanceRecord` | inactive legacy reference |
| Payroll readiness / batches | Prisma repository adapter | `PayrollBatch`, `PayrollBatchItem` | inactive legacy reference |
| Payroll handoff / results | Prisma repository adapter | `PayrollHandoff`, `PayrollResult`, `PayrollResultItem` | inactive legacy reference |
| Payslips | Prisma repository adapter | `PayrollPayslip` | inactive legacy reference |
| Accounting | Prisma repository adapter | `AccountingTransfer` | inactive legacy reference |
| Audit | Prisma repository adapter | `AuditEvent` | inactive legacy reference |
| Settings | Prisma repository adapter | `SystemSetting` | inactive legacy reference |
| Admin/HR/Payroll/Accounting monitoring | Prisma repositories and aggregate queries | related PostgreSQL models | inactive legacy reference |

The existing service import contracts are preserved through the cutover
adapters. They fail closed when PostgreSQL is unavailable; there is no
Prisma-to-Firestore fallback and no normal-runtime dual write.

## Firestore retirement inventory

- `src/server/repositories/**` legacy implementations remain in place for
  migration/reference history but are unreachable from the normal provider
  paths after the cutover adapters return Prisma data.
- `scripts/migration/firestore-to-postgres/**` remains administrative,
  inactive tooling and was not invoked by normal application requests.
- Firebase Authentication/Admin Auth remains active and is not classified as
  a business Firestore dependency.
- `src/app/api/health/firebase/**` remains a separate Firebase/Firestore
  infrastructure health check; it is not a business persistence path.

Historical Firestore collections and documents were not deleted or modified.

## Baseline and safety decisions

- Existing clean PostgreSQL business baseline remains empty; no fake employees,
  schedules, attendance, Payroll, payslip, Accounting, or audit rows were
  created.
- Firebase Authentication, PostgreSQL identity/RBAC, ownership checks, and
  lifecycle distinctions remain unchanged.
- Prisma 6.19.0 and the existing pooler/TLS configuration were preserved.
- No schema migration or destructive database operation was required.
- The existing payslip presentation contract is retained while Prisma keeps
  database monetary values in fixed-decimal form at its repository boundary.

## Verification

Passed:

- `npm.cmd run db:validate`
- `npm.cmd exec prisma migrate status` — database schema reported up to date
- `npm.cmd exec tsc -- --noEmit`
- `npm.cmd run lint`
- `npm.cmd run build` — Next.js production build completed all application
  routes successfully
- `git diff --check`

Blocked or not run:

- `npm.cmd exec prisma generate` — local Windows `EPERM` while renaming the
  Prisma query-engine DLL in `node_modules`.
- Direct Prisma identity/count smoke query — Supabase returned
  `EMAXCONNSESSION: max clients reached in session mode; max clients are
  limited to pool_size: 15`. This is a connection-capacity/environment
  blocker, not a schema or application query failure.
- `/api/health/postgres`, authenticated browser verification, route/runtime,
  responsive, visual, accessibility, and cross-device checks were not run in
  this environment.

## Follow-up

Release the exhausted Supabase pooler sessions or use the approved operational
connection configuration, then run the direct identity/count smoke query and
`GET /api/health/postgres`. After that, verify normal Firebase login →
`/api/me` → `/admin/dashboard` without bypassing authentication. Do not seed
business fixtures or migrate historical Firestore data as part of this
follow-up.
