# DB-ARCH-006 - Firestore Read Audit

## Scope

This is a static repository audit. It identifies query shapes, fan-out, and
likely read pressure without scanning the configured Firestore project. That
choice is intentional: a targeted health read currently returns
`RESOURCE_EXHAUSTED (code 8): Quota exceeded`.

There are no browser `firebase/firestore` imports and no Firestore
`onSnapshot` listeners in `src/`. The `setInterval` calls found in client code
are campus-clock updates or attendance API polling; they are not direct
Firestore listeners. The expensive reads happen when those APIs/services run.

## High-risk read hotspots

| Priority | Page/API or service | Current query pattern | Why it is expensive | PostgreSQL replacement |
| --- | --- | --- | --- | --- |
| P0 | `/admin/dashboard`, `getAdminDashboardData` | Runs Integration Monitoring, User Account Summary, Roles & Permissions, Settings and Audit Logs concurrently. | A single dashboard request fans out into multiple full collection reads plus six audit queries. The `pageSize: 5` audit view does not reduce the underlying audit reads. | One server-side dashboard read model backed by indexed aggregate/count queries and a bounded recent-activity query. Cache or materialize only measured aggregates. |
| P0 | `/admin/integration-monitoring`, `getAdminIntegrationMonitoringData` | `listEmployees()`, schedules, all attendance when no filter, all Payroll handoffs, all Payroll results, all Accounting transfers. | Six collection-wide reads, then status/activity/issue filtering in Node. | SQL counts/grouping by date/status, latest timestamps, and bounded issue/activity queries. Do not load every row to produce cards. |
| P0 | `/admin/audit-logs`, `listAuditEvents` | Six collections, each `orderBy(occurredAt desc).limit(250)`, then merge, deduplicate, filter, summarize, and paginate in memory. | Up to 1,500 documents per request before the requested page is applied; legacy and canonical stores are all read. | One `audit_events` table with `(occurred_at desc)` and filter indexes; keyset/cursor pagination and SQL counts/options. |
| P0 | `/payroll/history`, `loadHistorySnapshot` | Reads all batches, handoffs, results, then reads `payrollResults/{id}/items` once per result. | Full-table fan-out plus an N+1 subcollection pattern. Filters are applied after all documents are loaded. | Join `payroll_batches`, `payroll_handoffs`, `payroll_results`, and aggregate/result items with server-side filters and page-limited detail queries. |
| P0 | `/accounting/*`, `getAccountingIntegrationStatusData` | Reads all Payroll results and all Accounting transfers, then derives an approved-payroll item for every result. | Full scans and per-result projection work on every page request; UI page size only limits final presentation. | SQL view/query over result and transfer lifecycle with indexed status/result joins and page-limited rows. |
| P0 | `/payroll/verified-attendance`, `getPayrollVerifiedAttendanceSourcesForPeriod` | Reads all employees, month-filtered attendance, and all correction requests; then `/payroll/verified-attendance` also reads all batches. | Attendance has a date range query, but corrections and batches are full reads; grouping and readiness are in memory. | Date/status/employee indexes, SQL aggregation by employee-period, pending-correction existence query, and batch membership join. |
| P1 | `/admin/user-accounts`, `buildAccounts` | Lists every Firebase Auth user page, PostgreSQL application profile, PostgreSQL identity Employee reference, and the legacy Firestore employee directory used for link selection. | Auth listing and current in-memory pagination still scale by account count; business Employee directory remains a legacy repository until later migration. | Auth remains external; application profiles and identity links now use indexed PostgreSQL tables. Apply search/filter/page in SQL during the repository migration. |
| P1 | `/admin/roles-permissions`, `getRolesPermissionsData` | Reads five PostgreSQL role assignments and all PostgreSQL application users to calculate member counts. | Fixed role reads are bounded, but member counts are still computed in memory. | Role rows plus `COUNT(*) GROUP BY role_id`; one bounded query during later optimization. |
| P1 | `/admin/settings`, `getAdminSettingsData` | Reads singleton settings plus all employees and schedules to report HRPS integration facts. | Employee/schedule full reads are unnecessary for a status/count card as data grows. | Singleton settings row plus SQL `COUNT(*)` and health metadata; integration facts should be bounded and derived. |
| P1 | HR dashboard | Reads all employees and attendance for one exact date. | Date filter is appropriate, but employee list is always full-read and attendance still returns all matching documents before mapping. | Aggregate active employee count and date attendance in SQL; join only the bounded recent rows. |
| P1 | HR attendance monitoring/reports | `listAttendanceForMonitoring` reads the full attendance collection when neither date nor employee filter is supplied; report uses date/month range then filters status in memory. | Unfiltered monitoring and broad monthly pages grow linearly with attendance history. | Require/compose server filters, use composite indexes, cursor pagination, and aggregate counts. |
| P1 | Employee attendance history | Employee-scoped `where(employeeId == ...)` query. | Bounded by employee but still returns all history for that employee and paginates/sorts in application code. | `WHERE employee_id = ? ORDER BY attendance_date DESC LIMIT/OFFSET or cursor`; count only when needed. |
| P1 | Employee payslips | Employee-scoped `where(employeeId == ...)` query. | Correct scope, but history grows without a server-side limit. | Indexed employee/period query with server pagination. |
| P2 | Correction requests | Reads the entire correction request collection for HR views and Payroll readiness; detail is a single document. | Full read and in-memory status/date filtering; approval transaction reads correction, attendance and employee. | Filter by status/date/employee in SQL; use row locks for approval and retain snapshots. |
| P2 | Payroll batches/results/handoffs | List methods read entire top-level collections for pages and read models. | Final UI pagination happens after full reads. | Indexed server-side filters and cursors; use separate item tables for joins. |

## Query-shape findings

### Full-collection reads

The following repository methods call `.get()` on a top-level collection with
no limiting filter: `listEmployees`, `listEmployeeScheduleReferences`,
`listAttendanceForMonitoring` without filters,
`listPayrollBatches`, `listPayrollHandoffs`, `listPayrollResults`,
`listAccountingTransfers`, `listAttendanceCorrectionRequests`, and
`listAuditEvents` per legacy collection. These methods are acceptable for
small seed datasets but are not scalable read models.

### In-memory pagination

Several services calculate `totalPages`, search, filters, summaries, and
options after loading all source records. This preserves current UI behavior
but means a page of five may still read thousands of documents. The migration
must move the filter, sort, count, and page boundary into SQL.

### N+1 child reads

`loadHistorySnapshot` reads all Payroll results and then calls
`listPayrollResultItems(resultId)` for each result. The target schema should
use a join/aggregate query for the list and a separate detail query for one
selected result.

### Transaction read sets

Firestore transactions are used for QR attendance, corrections, settings,
role permissions, Payroll batch membership/status, Payroll handoffs, Payslips,
and Accounting transfer claims/results. These are not read hotspots by
themselves, but they define the atomicity that the PostgreSQL repositories
must preserve with row locks and transactions.

### Client timers and polling

- Employee QR attendance polls the protected attendance API while the page is
  visible. It does not open a Firestore listener, but each poll reaches a
  server repository and can consume one document read.
- Employee/HR/Payroll/Accounting navbar intervals update display clocks only.
- Login calls `router.refresh()` after a successful session and does not create
  a persistent data listener.

## Recommended query replacements

```sql
-- Active employee count
SELECT count(*)
FROM employees
WHERE employment_status = 'active';

-- Attendance summary for a date
SELECT
  count(*) FILTER (WHERE time_in IS NOT NULL) AS timed_in,
  count(*) FILTER (WHERE status = 'completed') AS completed,
  count(*) FILTER (WHERE time_in IS NOT NULL AND time_out IS NULL) AS awaiting_time_out
FROM attendance_records
WHERE attendance_date = $1;

-- Recent audit page (keyset boundary shown conceptually)
SELECT id, event_type, action, module, actor_snapshot, target_snapshot,
       outcome, summary, metadata, occurred_at
FROM audit_events
WHERE occurred_at < $1
ORDER BY occurred_at DESC, id DESC
LIMIT $2;

-- Payroll status counts without loading every batch
SELECT status, count(*)
FROM payroll_batches
GROUP BY status;
```

These are architecture examples only. They do not prescribe SQL migration
syntax or authorize a schema implementation in DB-ARCH-006.

## DB-REPO-MIGRATION-010 reconciliation

Parallel Prisma repositories now implement the replacement query shapes:

- dashboard and integration monitoring use `count`, `groupBy`, and latest-row
  queries instead of collection scans;
- attendance, corrections, Payroll, payslips, Accounting, employees, and
  audit histories use server-side filters, stable ordering, and bounded pages;
- Payroll result details load their child rows through one relational query;
- audit pagination uses `occurred_at DESC, id DESC` and filters before paging;
- no Firestore listener was found, so no Supabase Realtime replacement was
  introduced.

The live services still use Firestore until `DB-DATA-MIGRATION-011` imports and
reconciles data. These repositories are readiness artifacts, not evidence that
the PostgreSQL tables contain business data.

## Measurement plan for DB-SUPABASE-007 and later

Before cutover, record per route/service:

1. number of source rows/documents returned;
2. number of queries and transaction retries;
3. response time and payload size;
4. page/filter parameters;
5. whether a query is a card aggregate, list page, or detail view;
6. SQL `EXPLAIN` plans and index usage after migration.

Do not estimate live document counts from the source code. Obtain them with
small, approved metadata/count operations after the Firebase quota issue is
resolved.
