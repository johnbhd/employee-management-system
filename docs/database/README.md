# DB-ARCH-006 - Migration Architecture Index

## Executive summary

Current business persistence is server-side Firebase Admin + Cloud Firestore;
Firebase Authentication is a separate identity authority. The recommended
target is Firebase Authentication + Next.js server/API/services + Supabase
PostgreSQL for business persistence. Direct browser-to-PostgreSQL access is
not part of the architecture, and Docker is not required.

The repository audit found real Firestore repositories, lifecycle transactions,
and server-owned authorization. It found no PostgreSQL driver/schema/migration
implementation. This task therefore produced planning documents only.

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
- No production PostgreSQL credentials, schema, driver, or migration runner
  are present in the repository.
- External HRPS, Bundy, Payroll, and Accounting contracts are not available;
  simulated Payroll/Accounting adapters remain explicitly simulated.
- Exact retention, effective schedule history, multi-role assignment, and
  import-file storage requirements remain deferred to later tasks.

## Recommended next task

`DB-SUPABASE-007 - Supabase PostgreSQL Connection Foundation`.

## DB-SUPABASE-007 implementation

The initial connection foundation is now implemented with the server-only
`pg` package. `src/lib/postgres/server.ts` owns lazy pool creation, SSL,
connection/query timeouts, parameterized query execution, transaction support,
safe error normalization, and the minimal `SELECT 1` health probe. The pool is
cached on `globalThis` for local hot reload reuse and serverless instance reuse.

The `DATABASE_URL` environment variable is server-only and should point to the
Supabase pooler for deployed/serverless use. `GET /api/health/postgres` reports
only configured/connected status and returns HTTP 503 when the database is not
configured or cannot be reached. DBeaver may use a separate administrator
connection; its credentials are not stored in this repository.

No PostgreSQL schema, business write, repository migration, Firebase Auth
change, or Firestore change is part of this foundation.

Do not begin destructive migration or delete Firestore until the retirement
criteria in `MIGRATION-PLAN.md` are satisfied.
