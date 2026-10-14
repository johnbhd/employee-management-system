# DB-DATA-MIGRATION-011 - Firestore to Supabase PostgreSQL

This runbook covers the controlled migration CLI at
`scripts/migration/firestore-to-postgres/`. It migrates business data only;
Firebase Authentication remains the credential authority, Firestore remains
the live application authority, and no cutover is performed by this command.

## Prerequisites

- `DATABASE_URL` points to the intended Supabase PostgreSQL database.
- The Prisma 6.19.0 client and reviewed schema are generated and deployed.
- Firebase Admin variables are configured for the source project.
- Firestore quota/access is available for a controlled read-only export.
- The operator has reviewed the source-to-target mapping and rollback plan.

The CLI performs a PostgreSQL health check before reading Firestore. It reads
each top-level collection in ordered chunks, uses a paginated collection-group
read for nested Payroll result items, and never writes to or deletes from
Firestore.

## Dry Run

The default is validation only:

```text
npm run db:migrate:firestore -- --dry-run
npm run db:migrate:firestore -- --dry-run --domain employees,schedules,identity
npm run db:migrate:firestore -- --self-check
```

Reports and manifests are written to `.migration-reports/`, which is ignored
by Git. They contain counts, hashes, IDs, statuses, and conflict reasons, not
full source documents or credentials.

## Review and Execute

Resolve all P0/P1 findings before executing. Live writes require the explicit
`--apply` or `--execute` flag:

```text
npm run db:migrate:firestore -- --apply --run-id db-data-011-20261014
```

The migration order is roles, employees, schedules, identity, attendance,
corrections, Payroll lineage, payslips, Accounting, audit history, and
controlled runtime settings. Each row is reconciled by its Firestore legacy ID
and then by a documented business key; conflicting unique keys are quarantined
in the report rather than blindly overwritten.

## Resume and Reconciliation

Rerun the same run safely after resolving an operational interruption:

```text
npm run db:migrate:firestore -- --apply --resume db-data-011-20261014
```

The target schema's unique constraints and `legacy_firestore_id` fields make
the rerun idempotent. The report records source counts, inserted/updated/
invalid/failed counts, status distributions, target counts, verified legacy
reads, orphan/duplicate fields, and the external source-to-target manifest.
Representative Prisma reads and final count reconciliation must be reviewed
before any later cutover task.

## Rollback and Retirement

This task has no Firestore rollback writes because Firestore is preserved and
read-only. If a target conflict or failed transaction occurs, stop, retain the
report, correct the source/target issue, and rerun. Do not delete Firestore,
disable Firebase Auth, enable Supabase Auth, switch live repositories, or add
dual writes as part of this task.

After a successful run:

```text
Firestore source: PRESERVED
Firestore deletions: NONE
PostgreSQL business data: POPULATED
Live application authority: NOT YET SWITCHED
```
