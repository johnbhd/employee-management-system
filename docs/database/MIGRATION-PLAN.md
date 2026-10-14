# DB-ARCH-006 - Migration Plan and Cutover Criteria

## Scope

This plan moves business persistence from Firestore to Supabase PostgreSQL
while retaining Firebase Authentication. It does not authorize a production
migration, collection deletion, authentication rewrite, or HRPS/Bundy importer.

## Phase 0 - Protect and measure the current system

Before creating a target schema:

1. Resolve the current Firebase Firestore `RESOURCE_EXHAUSTED` quota condition
   and confirm that the intended project is backed up and reachable.
2. Rotate any exposed service-account credential before enabling seed or export
   writes.
3. Record safe collection counts, document ID samples, status distributions,
   timestamp ranges, and known legacy/canonical audit overlap. Do not download
   entire collections just to explore them.
4. Capture current repository behavior and the transaction invariants listed in
   `POSTGRES-ARCHITECTURE.md`.
5. Add migration observability: source/target batch ID, row counts, error
   quarantine, checksum or field-level reconciliation, and duration.

Exit condition: a read-only source inventory and backup exist; no writes or
deletes are required for this phase.

## Phase 1 - Supabase connection foundation (`DB-SUPABASE-007`)

Add a server-only PostgreSQL connection boundary without changing application
repositories yet.

- Use a secret `DATABASE_URL`/pooler configuration outside `NEXT_PUBLIC_*`.
- Add SSL, connection timeout, query timeout, and transaction helpers.
- Confirm local Next.js, Vercel/serverless, and DBeaver connection procedures.
- Add a health check that returns safe status only and does not run broad data
  queries.
- Keep Firebase repositories as the only business-data authority during this
  phase.

Exit condition: connection health, a rollback-safe no-op transaction, and
credential redaction checks pass without changing user-facing behavior.

## Phase 2 - Schema and constraints (`DB-SCHEMA-008`)

Create the relational schema in dependency order:

1. roles, permissions, role permissions;
2. employees and schedules;
3. users and Firebase UID bridge;
4. attendance and corrections;
5. Payroll batches/items, handoffs, results/items, payslips;
6. Accounting transfers;
7. settings and audit events;
8. future import metadata only when the import contract is approved.

Add constraints, indexes, foreign keys, status checks, uniqueness guards, and
`legacy_firestore_id`/source metadata where needed. Do not expose direct
browser access and do not drop or rename Firestore data.

Exit condition: migrations apply to an empty target and a disposable restored
sample; invalid references and duplicate employee-period claims fail safely.

## Phase 3 - Firebase Auth bridge (`DB-AUTH-BRIDGE-009`)

Keep Firebase Auth as the identity authority and populate PostgreSQL `users`:

```text
Firebase Auth UID -> users.firebase_uid -> employees.id (nullable) -> role
```

- Reconcile Auth identities with application profiles by UID.
- Validate one unique application profile per UID.
- Preserve non-employee staff accounts with a null employee link.
- Do not copy passwords, service-account credentials, or Auth tokens.
- Keep existing session-cookie and server authorization behavior while the
  bridge is verified.

Exit condition: every in-scope active profile has an explicit mapping state:
linked, intentionally unlinked, disabled, or quarantined.

## Phase 4 - Read-only data migration and reconciliation (`DB-DATA-MIGRATION-011`)

Migrate in dependency order with repeatable, idempotent batches:

1. roles/permissions and controlled settings;
2. employees and schedules;
3. users/profile links;
4. attendance records;
5. correction requests and snapshots;
6. Payroll batches/items, handoffs, results/items, payslips;
7. Accounting transfers and membership lineage;
8. canonical and legacy audit collections.

For each batch, persist an external migration manifest outside the business
tables containing source collection, source ID, target ID, source hash,
target hash, status, error/quarantine reason, and timestamps. Re-running a
batch must not create duplicates.

Validation must include:

- source/target counts by entity and lifecycle status;
- unique employee IDs including leading zeros;
- Firebase UID/profile/employee/role mappings;
- attendance employee/date and time invariants;
- correction original/resulting snapshot consistency;
- Payroll Batch -> Handoff -> Result -> Payslip lineage;
- Payroll Result -> Accounting Transfer lineage;
- audit actor/target/time preservation;
- monetary values copied exactly as external outputs, never recalculated.

Exit condition: reconciliation is accepted for every migrated entity, and all
unmatched/invalid rows are quarantined with a reason rather than silently
dropped.

## Phase 5 - Repository migration (`DB-REPO-MIGRATION-010`)

Introduce repository interfaces so services and UI contracts do not need a
second rewrite. For each repository:

1. implement a PostgreSQL adapter behind the existing service contract;
2. keep the Firestore adapter available behind a feature flag;
3. compare read models in a non-user-visible shadow path where safe;
4. migrate writes only after transaction tests and idempotency checks pass;
5. preserve API authorization, ownership checks, validation, and safe errors.

Do not move business rules into Route Handlers or client components to make the
cutover easier.

## Phase 6 - Controlled cutover (`DB-CUTOVER-012`)

Use an explicit feature flag by environment and, if needed, by portal/domain:

```text
read source: Firestore | PostgreSQL
write source: Firestore | PostgreSQL
dual-write: disabled | shadow | enabled
```

Recommended sequence:

1. switch a read-only admin/reporting projection first;
2. verify attendance and identity reads;
3. switch controlled writes with idempotency and audit checks;
4. switch Payroll/Accounting lifecycle writes only after external lineage is
   reconciled;
5. monitor error rate, latency, transaction conflicts, row counts, and audit
   coverage;
6. freeze the feature flag before each irreversible decision.

Avoid unconstrained dual writes. If a write must be mirrored, define the
source-of-truth response, retry/outbox behavior, divergence alert, and manual
reconciliation path first.

## Rollback strategy

Rollback is a feature-flag change only while both adapters and source data are
consistent. Before switching writes:

- take a verified Firestore backup/export;
- snapshot the target migration watermark;
- record all writes after the last reconciliation checkpoint;
- define how PostgreSQL-only writes are replayed or reversed in Firestore;
- stop new writes before reversing a divergent lifecycle state.

Do not delete PostgreSQL or Firestore data as a rollback shortcut. Failed rows
remain quarantined and must be repaired or explicitly excluded with approval.

## Firestore retirement criteria

Firestore business persistence may be retired only when all are true:

- target schema and indexes are deployed;
- source data and required history are migrated and backed up;
- counts, IDs, relationships, lifecycle statuses, snapshots, and audit events
  reconcile;
- all application repositories use PostgreSQL for business reads/writes;
- no active business route reads Firestore;
- new writes have used PostgreSQL through an agreed observation window;
- Payroll/Accounting external references reconcile;
- authenticated, role-specific, mutation, failure, and recovery tests pass;
- backups and a documented recovery procedure remain available;
- product/data owners approve retirement.

Only then should Firestore business collections be archived or removed under a
separate explicitly approved destructive task. Firebase Authentication remains.

## Future HRPS import boundary (`INTEGRATION-HRPS-013`)

The target architecture supports, but this task does not implement:

```text
CSV/file metadata
  -> import batch
  -> validated row/quarantine records
  -> employee_id match
  -> transactional upsert of HRPS employee/schedule reference
  -> audit + import result
```

The importer must preserve Employee ID as text, distinguish new/updated/
unchanged/invalid rows, record source provenance, and never make a partial
employee update appear successful. It must not provide HR business editing or
write official Payroll/Accounting data.

## Future Bundy boundary

Bundy ingestion requires a separate raw-event model and contract. It must not
write directly into a finalized attendance record without employee matching,
duplicate handling, normalization, source lineage, and policy validation.

## Risk register

| Priority | Risk | Control |
| --- | --- | --- |
| P0 | Employee ID leading zeros are lost or matched to the wrong person. | Text type, unique constraint, exact-match validation, reconciliation samples. |
| P0 | Firebase UID maps to the wrong application user/employee. | UID uniqueness, explicit mapping report, quarantine ambiguous links, preserve Auth. |
| P0 | Historical Payroll or Accounting records are replaced by live joins. | Snapshot columns/items, immutable source values, lineage validation. |
| P0 | Credentials or tokens enter client bundles/logs. | Server-only secrets, secret scan, redaction tests, no direct browser DB. |
| P1 | Partial batch/handoff/result migration breaks lifecycle. | Dependency order, idempotent manifests, FK constraints, transaction tests. |
| P1 | Audit history disappears when an account is deleted. | Append-only audit target with actor snapshots and legacy-source mapping. |
| P1 | Firestore and PostgreSQL diverge during dual-write. | Feature flag, outbox/retry design, reconciliation watermark, rollback plan. |
| P2 | SQL repeats current full-collection scans. | Query inventory, indexes, server pagination, aggregate plans, EXPLAIN review. |
| P2 | External provider contracts are assumed to be live. | Preserve simulated adapter labels and no local Payroll calculations. |
| P3 | Future import schema overcommits before requirements. | Add import tables only with approved HRPS/Bundy contract. |

## Recommended task order

```text
DB-SUPABASE-007
  -> DB-SCHEMA-008
  -> DB-AUTH-BRIDGE-009
  -> DB-DATA-MIGRATION-011
  -> DB-REPO-MIGRATION-010
  -> DB-CUTOVER-012
  -> INTEGRATION-HRPS-013
```

The data and repository work may be developed in parallel only after the
schema/contracts are stable; production cutover remains sequential.
