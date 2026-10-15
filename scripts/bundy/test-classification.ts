import assert from "node:assert/strict";

import { classifyBundyRows } from "../../src/server/bundy/bundy-classification";
import { parseBundyCsv } from "../../src/server/bundy/bundy-csv";

const source = [
  "bundy_log_id,device_employee_id,timestamp,event,device_id,import_batch,processing_status,matched_hrps_employee_id",
  "BND-0027A,027,2026-10-05 08:07:48,IN,BUNDY-JSC-01,BATCH-20261005,Matched,027",
  "BND-0027B,027,2026-10-05 08:08:23,IN,BUNDY-JSC-01,BATCH-20261005,Duplicate,027",
  "BND-0027C,027,2026-10-05 08:08:30,OUT,BUNDY-JSC-01,BATCH-20261005,Matched,027",
  "BND-0091,091,2026-10-06 08:00:00,IN,BUNDY-JSC-02,BATCH-20261006,Unmatched,",
  "BND-0040,040,2026-10-10 08:00:00,OUT,BUNDY-JSC-02,BATCH-20261010,Matched,040",
].join("\n");

const parsed = parseBundyCsv(source);
const employees = new Map([
  ["027", { id: "employee-027", employeeId: "027", displayName: "Employee 027", department: "Operations", employmentStatus: "active" as const }],
  ["040", { id: "employee-040", employeeId: "040", displayName: "Employee 040", department: "Operations", employmentStatus: "inactive" as const }],
]);
const rows = classifyBundyRows(parsed.rows, employees);

assert.equal(rows[0]?.deviceEmployeeId, "027");
assert.equal(rows[1]?.duplicateStatus, "DUPLICATE_SCAN");
assert.equal(rows[2]?.duplicateStatus, "UNIQUE");
assert.equal(rows[3]?.matchStatus, "UNMATCHED");
assert.equal(rows[4]?.matchStatus, "EMPLOYEE_INACTIVE");
assert.equal(rows[3]?.employee, null);
assert.equal(rows[4]?.employee?.employeeId, "040");
assert.equal(rows[4]?.anomalyCodes.includes("MISSING_IN_PATTERN"), true);

console.log("Bundy matching and classification assertions passed.");
