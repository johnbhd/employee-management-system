# DB-SEED-011A — PostgreSQL Initial IT Administrator Bootstrap

## Purpose

The PostgreSQL identity/RBAC schema is ready for one deliberate application
identity: the initial IT Administrator. Firebase Authentication remains the
credential provider. Prisma/PostgreSQL stores the application user, role,
permission resolution, enabled state, and optional Employee link.

This bootstrap does not migrate legacy Firestore data and does not create
employees, schedules, attendance, corrections, Payroll, Payslips, Accounting,
or historical Audit rows.

## Command

The command is dry-run by default and has no public browser/API route:

```text
npm.cmd run db:bootstrap-admin -- --dry-run
npm.cmd run db:bootstrap-admin -- --apply
```

Provide these local server-only values through the environment or explicit CLI
options:

```text
ADMIN_FIREBASE_UID=<real Firebase Authentication UID>
ADMIN_USERNAME=<controlled application username>
ADMIN_DISPLAY_NAME=<controlled application display name>
```

The local `DATABASE_URL` must retain the configured Supabase pooler host,
port `5432`, and database `postgres`. URL-encode reserved password characters
inside the URI (for example `@` as `%40`) and include
`?sslmode=require` (or append `&sslmode=require` when query parameters already
exist). Never print or commit the real connection string.

The command does not request or store a Firebase password, token, private key,
or Supabase Auth credential. It does not read Firestore, so the historical
Firestore quota issue does not block this PostgreSQL-only operation.

## Safety behavior

- `--apply` is required before creating the PostgreSQL `users` row.
- The existing `admin` role and its persisted RolePermission mappings are
  validated; the command does not grant permissions or create roles.
- Unknown permissions, non-technical permissions, and missing required Admin
  lockout permissions fail safely.
- An existing matching user is validated as active, assigned to IT
  Administrator, linked to no Employee, and consistent with the supplied
  username/display name.
- Wrong-role, disabled/inactive, Employee-linked, duplicate-username, and
  conflicting-identity cases fail without repair or silent privilege changes.
- The command is idempotent: a second run with the same identity validates and
  performs no duplicate insert.
- A transaction protects the create path from a concurrent identity change.
- Before/after counts verify that no business baseline table grows.

## Verification

Run the local logic checks without database or Firebase access:

```text
npm.cmd run db:bootstrap-admin -- --self-check
```

For a real run, first use dry-run, review its safe summary, then repeat with
`--apply`. The output masks the Firebase UID and reports only configured/matched
status. Runtime `/api/me`, Firebase login, and Admin-route verification remain
separate checks and are blocked when the configured Firebase Authentication
runtime is unavailable.

## Baseline decision

The legacy Firestore prototype/business history is intentionally not required
for this target baseline. The migration tooling from DB-DATA-MIGRATION-011 is
retained for auditability but is not executed by this task. Future Employee
records and employee-linked accounts belong to the HRPS provisioning flow.
