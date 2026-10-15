import assert from "node:assert/strict";

// @ts-expect-error Node's strip-types runner requires an explicit extension.
import { HrpsCsvError, parseCsv } from "../../src/server/hrps/hrps-csv.ts";

const parsed = parseCsv(`\uFEFFemployee_id,name,department\r\n001,"Doe, Jane",Admissions\r\n002,"O""Neil",Registrar\r\n003,"Line 1\nLine 2",Library\r\n`);

assert.deepEqual(parsed.headers, ["employee_id", "name", "department"]);
assert.equal(parsed.rows[0][0], "001");
assert.equal(parsed.rows[0][1], "Doe, Jane");
assert.equal(parsed.rows[1][1], 'O"Neil');
assert.equal(parsed.rows[2][1], "Line 1\nLine 2");

assert.throws(
  () => parseCsv("employee_id,name\n001,\"Unclosed\n"),
  (error: unknown) => error instanceof HrpsCsvError && error.code === "MALFORMED_CSV",
);

assert.throws(
  () => parseCsv("employee_id,Employee ID\n001,001\n"),
  (error: unknown) => error instanceof HrpsCsvError && error.code === "DUPLICATE_HEADERS",
);

console.log("HRPS CSV parser checks passed.");
