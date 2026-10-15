# DB-ARCH-006 - Migration Architecture Index

## Executive summary

Current business persistence is server-side Firebase Admin + Cloud Firestore;
Firebase Authentication remains the credential authority, and PostgreSQL now
owns application identity and RBAC. The target is Firebase Authentication +
Next.js server/API/services + Supabase PostgreSQL for all business persistence.
Direct browser-to-PostgreSQL access is not part of the architecture, and Docker
is not required.

The repository audit found real Firestore repositories, lifecycle transactions,
and server-owned authorization. The architecture work was followed by a
server-only PostgreSQL foundation, the `DB-SCHEMA-008` initial business schema
migration, and the `DB-AUTH-BRIDGE-009` identity/RBAC cutover. Firestore
business repositories remain during the later repository migration and cutover
tasks.

## Documents

- [FIRESTORE-INVENTORY.md](./FIRESTORE-INVENTORY.md) - confirmed collections,
  document IDs, fields, owners, nested structures, and missing domains.
- [POSTGRES-ARCHITECTURE.md](./POSTGRES-ARCHITECTURE.md) - target ownership,
  proposed tables, keys, constraints, connection boundary, transactions, and
  RLS decision.
- [MIGRATION-MAP.md](./MIGRATION-MAP.md) - collection/field/type mapping and
  compatibility requirements.
- [FIRESTORE-READ-AUDIT.md](./FIRESTORE-READ-AUDIT.md) - read hotspots,
  full-collection scans, in-memory pagination, N+1 reads, and SQL replacements.
- [MIGRATION-PLAN.md](./MIGRATION-PLAN.md) - phased execution order,
  reconciliation, rollback, cutover, retirement criteria, and risks.
- [ERD.md](./ERD.md) - implemented Mermaid relational model.
- [SCHEMA-INVENTORY.md](./SCHEMA-INVENTORY.md) - deployed model/table,
  relationship, constraint, index, and historical behavior inventory.
- [REPOSITORY-MIGRATION-010.md](./REPOSITORY-MIGRATION-010.md) - parallel
  Prisma repository layer, migration matrix, query strategy, transaction
  boundaries, and cutover prerequisites.
- [ADMIN-BOOTSTRAP-011A.md](./ADMIN-BOOTSTRAP-011A.md) - controlled Admin-only
  PostgreSQL identity and RBAC bootstrap.

## Source-of-truth summary

```text
Current business database: Supabase PostgreSQL via Prisma
Application identity/RBAC database: Supabase PostgreSQL via Prisma
Target business database: Supabase PostgreSQL via Prisma (cut over)
Authentication: Firebase Authentication - retained
Backend/API: Next.js - retained
Direct browser PostgreSQL access: No
Docker required: No
DBeaver: Database administration only
Firestore business runtime: legacy/inactive; not part of normal application composition
Canonical integration identifier: employee_id
Employee ID type: text/string; leading zeros preserved
Raw Bundy data: Not implemented; future separate domain
HRPS CSV importer: Implemented by INTEGRATION-HRPS-013 at `/admin/hrps-integration`
Local Payroll calculation: Not allowed
```

## Confirmed blockers and limitations

- The legacy multi-identity Firebase/Firestore bootstrap was not applied
  because the configured project returned `8 RESOURCE_EXHAUSTED: Quota
  exceeded` for its historical Auth/Firestore reads. The Admin-only
  PostgreSQL bootstrap does not read Firestore and accepts an explicit real
  Firebase UID instead.
- The initial application PostgreSQL business schema is deployed through
  `prisma/migrations/20261014120000_initial_sia_schema`.
- External HRPS, Bundy, Payroll, and Accounting contracts are not available;
  simulated Payroll/Accounting adapters remain explicitly simulated.
- Exact retention, effective schedule history, multi-role assignment, and
  import-file storage requirements remain deferred to later tasks.

## Recommended next task

`DB-DATA-MIGRATION-011 - Firestore Business Data -> Supabase PostgreSQL`.

## DB-SUPABASE-007 and DB-PRISMA-007A implementation

The connection foundation is now implemented with Prisma 6.19.0. The
server-only `src/lib/prisma/server.ts` owns a development-safe Prisma Client
singleton, configuration validation, transaction support, and the minimal
tagged `SELECT 1` health probe. No Prisma Client import is used in browser code.

The `DATABASE_URL` environment variable remains server-only and points to the
Supabase pooler for the current runtime and CLI foundation. No `DIRECT_URL` was
added because the configured pooler successfully applied the initial schema;
a direct migration URL remains a future operational choice. `GET
/api/health/postgres` reports only configured/connected status and returns HTTP
503 when the database is not configured or cannot be reached. DBeaver remains
a separate administrator connection and its credentials are not stored in this
repository.

`DB-SCHEMA-008` added the Prisma 6.19.0 business schema, the reviewed
`initial_sia_schema` migration, server-only RLS without browser policies, and
canonical role/permission reference seeds. Business tables were verified
through Prisma with zero migrated employee, attendance, Payroll, or audit rows.
The `db:validate`, `db:generate`, `db:migrate:dev`, and `db:migrate:deploy`
scripts remain available. The repository layer was subsequently added by
`DB-REPO-MIGRATION-010`; `DB-CUTOVER-012` now composes normal business
services through the Prisma repositories. Firestore repositories remain only
as inactive migration/reference implementations; Firebase Authentication and
its Admin SDK remain required for credential and account operations.

See [CUTOVER-012.md](./CUTOVER-012.md) for the provider matrix, retirement
inventory, and verification limitations.

Do not begin destructive migration or delete Firestore until the retirement
criteria in `MIGRATION-PLAN.md` are satisfied.

## DB-CUTOVER-012 implementation

Normal Employees, schedules, attendance/QR, corrections, Payroll lifecycles,
payslips, Accounting transfers, audit events, runtime settings, monitoring,
and dashboard aggregate paths now use Prisma-backed repositories. The adapter
layer preserves existing service DTOs and lifecycle/authorization contracts;
PostgreSQL failure is propagated rather than falling back to Firestore.

Historical Firestore business data remains untouched. The intentionally clean
PostgreSQL business baseline remains valid, and the separate migration tooling
is retained as inactive administrative tooling.

## DB-REPO-MIGRATION-010 implementation

Server-only Prisma repositories now exist alongside the Firestore repositories
for employees, effective schedules, attendance/QR, corrections, Payroll batch
and handoff/result lifecycles, payslips, Accounting transfers, audit events,
runtime settings, and dashboard/monitoring aggregates. They use indexed,
filtered queries, database counts/grouping, deterministic bounded pagination,
explicit DTO mapping, Prisma transactions, and decimal-safe serialization.

At the time of `DB-REPO-MIGRATION-010`, live business reads and writes were
intentionally not switched. Firestore business data remains unchanged,
Firestore was not deleted, and no permanent dual-write or silent fallback was
introduced. The later cutover is documented in
`REPOSITORY-MIGRATION-010.md` and `CUTOVER-012.md`.
