# DB-ARCH-006 - Migration Architecture Index

## Executive summary

Current business persistence is server-side Firebase Admin + Cloud Firestore;
Firebase Authentication is a separate identity authority. The recommended
target is Firebase Authentication + Next.js server/API/services + Supabase
PostgreSQL for business persistence. Direct browser-to-PostgreSQL access is
not part of the architecture, and Docker is not required.

The repository audit found real Firestore repositories, lifecycle transactions,
and server-owned authorization. The architecture work was followed by a
server-only PostgreSQL foundation; the application business schema and data
migration remain deferred.

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
- [ERD.md](./ERD.md) - proposed Mermaid relational model.

## Source-of-truth summary

```text
Current business database: Cloud Firestore
Target business database: Supabase PostgreSQL
Authentication: Firebase Authentication - retained
Backend/API: Next.js - retained
Direct browser PostgreSQL access: No
Docker required: No
DBeaver: Database administration only
Canonical integration identifier: employee_id
Employee ID type: text/string; leading zeros preserved
Raw Bundy data: Not implemented; future separate domain
HRPS CSV importer: Not implemented by DB-ARCH-006
Local Payroll calculation: Not allowed
```

## Confirmed blockers and limitations

- Live Firestore counts and sample exports were not collected because the
  configured project currently returns `8 RESOURCE_EXHAUSTED: Quota exceeded`
  for a targeted Firestore health read.
- No application PostgreSQL business schema or migration history is present in
  the repository yet.
- External HRPS, Bundy, Payroll, and Accounting contracts are not available;
  simulated Payroll/Accounting adapters remain explicitly simulated.
- Exact retention, effective schedule history, multi-role assignment, and
  import-file storage requirements remain deferred to later tasks.

## Recommended next task

`DB-SCHEMA-008 - PostgreSQL Schema, Constraints, Relationships, Indexes &
Migration Foundation`.

## DB-SUPABASE-007 and DB-PRISMA-007A implementation

The connection foundation is now implemented with Prisma 6.19.0. The
server-only `src/lib/prisma/server.ts` owns a development-safe Prisma Client
singleton, configuration validation, transaction support, and the minimal
tagged `SELECT 1` health probe. No Prisma Client import is used in browser code.

The `DATABASE_URL` environment variable remains server-only and points to the
Supabase pooler for the current runtime and CLI foundation. No `DIRECT_URL` was
added because this task creates no migration and the configured runtime URL is
currently reachable; DB-SCHEMA-008 must evaluate a direct migration URL before
applying production migrations. `GET /api/health/postgres` reports only
configured/connected status and returns HTTP 503 when the database is not
configured or cannot be reached. DBeaver remains a separate administrator
connection and its credentials are not stored in this repository.

The foundation includes `prisma/schema.prisma` with only the PostgreSQL
datasource and Prisma Client generator, plus `db:validate`, `db:generate`,
`db:migrate:dev`, and `db:migrate:deploy` scripts. No PostgreSQL business
schema, business write, repository migration, Firebase Auth change, or
Firestore change is part of this foundation.

Do not begin destructive migration or delete Firestore until the retirement
criteria in `MIGRATION-PLAN.md` are satisfied.
