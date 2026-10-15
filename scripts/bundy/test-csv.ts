import assert from "node:assert/strict";

// @ts-expect-error Node's native TypeScript runner requires the source extension.
import { BundyCsvError, parseBundyCsv, parseBundyEvent, parseBundyTimestamp } from "../../src/server/bundy/bundy-csv.ts";

const source = [
  "bundy_log_id,device_employee_id,timestamp,event,device_id,import_batch,processing_status,matched_hrps_employee_id",
  "BND-0001,001,2026-10-05 07:37:15,IN,BUNDY-JSC-01,BATCH-20261005,Matched,001",
  "BND-0002,001,2026-10-05 17:01:00,OUT,BUNDY-JSC-02,BATCH-20261005,Matched,001",
  "BND-0003,091,2026-10-06 08:00:00,IN,BUNDY-JSC-01,BATCH-20261006,Unmatched,",
  "BND-0004,040,2026-10-10 08:00:00,start,BUNDY-JSC-02,BATCH-20261010,Invalid,040",
].join("\n");

const parsed = parseBundyCsv(source);
assert.equal(parsed.rows.length, 4);
assert.equal(parsed.rows[0]?.deviceEmployeeId, "001");
assert.equal(parsed.rows[0]?.event, "IN");
assert.equal(parsed.rows[0]?.occurredAt?.toISOString(), "2026-10-04T23:37:15.000Z");
assert.equal(parsed.rows[2]?.deviceEmployeeId, "091");
assert.equal(parsed.rows[3]?.event, null);
assert.match(parsed.rows[3]?.errors.join(" ") ?? "", /use IN or OUT/);
assert.equal(parseBundyEvent(" out "), "OUT");
assert.equal(parseBundyEvent("START"), null);
assert.equal(parseBundyTimestamp("2026-10-10 08:00:00")?.toISOString(), "2026-10-10T00:00:00.000Z");
assert.equal(parseBundyTimestamp("2026-02-30 08:00:00"), null);

assert.throws(
  () => parseBundyCsv("bundy_log_id,device_employee_id,timestamp,event\nBND-1,001,2026-10-05 08:00:00,IN"),
  (error: unknown) => error instanceof BundyCsvError && error.code === "MISSING_REQUIRED_HEADERS",
);

assert.throws(
  () => parseBundyCsv("bundy_log_id,bundy_log_id,device_employee_id,timestamp,event,device_id\nBND-1,BND-1,001,2026-10-05 08:00:00,IN,DEVICE"),
  (error: unknown) => error instanceof BundyCsvError && error.code === "DUPLICATE_HEADERS",
);

console.log("Bundy CSV parser assertions passed.");
