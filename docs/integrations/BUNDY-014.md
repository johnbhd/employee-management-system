# INTEGRATION-BUNDY-014 — Bundy CSV Raw Attendance ETL

## Boundary

The initial Bundy integration accepts UTF-8 CSV files through the Admin
`/admin/bundy-etl` workspace. The browser sends the file to guarded Next.js
Route Handlers; server services parse and match rows, and the shared Prisma
singleton persists to PostgreSQL/Supabase. Firebase Authentication remains the
credential provider. Firestore and Supabase Auth are not used.

## Source contract

Required headers:

```text
bundy_log_id,device_employee_id,timestamp,event,device_id
```

Optional source metadata is retained when supplied:

```text
import_batch,processing_status,matched_hrps_employee_id
```

`timestamp` uses `YYYY-MM-DD HH:mm:ss` and is interpreted in the AU-JSC
`Asia/Manila` context. `event` is normalized to `IN` or `OUT`.

## Matching and classification

The server matches `device_employee_id` as text to the HRPS-owned PostgreSQL
`employees.employee_id` value, preserving leading zeros. Unknown IDs remain
unmatched and do not create Employees. Existing inactive Employees are linked
with an `EMPLOYEE_INACTIVE` status rather than treated as unknown.

The source `processing_status` and `matched_hrps_employee_id` values are
reference metadata only. The application independently computes its match.

Rapid duplicate scans are marked when the same device Employee ID, event
direction, and device recur within 60 seconds. The later raw event is retained.
Missing-IN/Missing-OUT day patterns and source-match conflicts are technical
anomaly metadata, not final attendance statuses.

## Persistence and idempotency

`bundy_imports` stores safe import history and counts. `bundy_raw_events` stores
immutable source evidence with the source log ID, original timestamp, parsed
timestamp, device, source batch, nullable Employee link, computed statuses, and
anomaly codes. `source_log_id` is unique, so re-importing a confirmed source
event does not create a second raw event. A changed source row with the same
log ID is reported as `SOURCE_CONFLICT` and does not overwrite the original.

Preview performs reads only. Confirm re-uploads and revalidates the file and
matching state before bounded batches of raw-event writes. Invalid rows and
source conflicts remain visible in the preview/history counts; valid unmatched
rows can still be stored for technical review.

## API surface

- `POST /api/admin/bundy/preview` — Admin integration-view permission; zero writes.
- `POST /api/admin/bundy/import` — Admin integration-retry permission; confirms raw import.
- `GET /api/admin/bundy/imports` — Admin integration-view permission; paginated history and raw events.

The task deliberately does not create `AttendanceRecord` rows, calculate
Present/Late/Absent/Undertime/Overtime, verify attendance, modify Employees or
schedules, or create Payroll/Accounting records. Those belong to later unified
attendance work.
