import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  HrpsCsvError,
  canonicalizeHrpsHeaders,
  parseCsv,
  parseHrpsRows,
} from "../../src/server/hrps/hrps-csv";

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

const prototypeCsv = `employee_id,employee_number,first_name,middle_name,last_name,suffix,full_name,work_email,department,office_unit,position,employee_category,employment_type,employment_status,date_hired,assigned_office,work_location,work_days,shift,work_start_time,work_end_time,break_start_time,break_end_time,rest_day,schedule_effective_from,schedule_effective_to,sia_application_role,record_status,source_updated_at,birth_date,age,sex,civil_status,nationality,current_address,mobile_number,personal_email
001,AU-001,Jane,Marie,Doe,Jr.,"Doe, Jane Marie",jane@example.test,Admissions,AU-JSC,Registrar,Non-Teaching,Regular,active,2024-01-15,Main Campus,Office 101,Monday;Tuesday;Wednesday;Thursday;Friday,Regular,08:00,17:00,12:00,13:00,Saturday;Sunday,2024-01-01,2024-12-31,IT Administrator,active,2026-10-15,1990-01-01,36,F,Single,Filipino,"Address",09170000000,personal@example.test`;
const prototypeParsed = parseCsv(prototypeCsv);
const prototypeHeaders = canonicalizeHrpsHeaders(prototypeParsed.headers);
const prototypeRows = parseHrpsRows(prototypeHeaders, prototypeParsed.rows);
const prototypeRow = prototypeRows[0];

assert.ok(prototypeRow);
assert.deepEqual(prototypeRow.errors, []);
assert.equal(prototypeRow.employeeId, "001");
assert.equal(prototypeRow.input?.displayName, "Doe, Jane Marie");
assert.equal(prototypeRow.input?.schedule?.workStart, "08:00");
assert.equal(prototypeRow.input?.schedule?.workEnd, "17:00");
assert.equal(prototypeRow.input?.schedule?.breakStart, "12:00");
assert.equal(prototypeRow.input?.schedule?.breakEnd, "13:00");
assert.equal(prototypeRow.input?.schedule?.effectiveFrom, "2024-01-01");
assert.equal(prototypeRow.input?.schedule?.effectiveTo, "2024-12-31");
assert.equal(prototypeRow.input?.schedule?.scheduleId, "hrps:001");
assert.ok(prototypeRow.warnings.includes("sia_application_role is informational only and does not grant application access."));
assert.equal("role" in (prototypeRow.input ?? {}), false);
assert.deepEqual(prototypeHeaders.ignored, [
  "birth_date",
  "age",
  "sex",
  "civil_status",
  "nationality",
  "current_address",
  "mobile_number",
  "personal_email",
]);

const fullNameOnlyParsed = parseCsv("employee_id,full_name,department,employment_status\n004,Source Name,Registrar,active\n");
const fullNameOnlyRows = parseHrpsRows(canonicalizeHrpsHeaders(fullNameOnlyParsed.headers), fullNameOnlyParsed.rows);
assert.deepEqual(fullNameOnlyRows[0].errors, []);
assert.equal(fullNameOnlyRows[0].input?.displayName, "Source Name");

const structuredNameParsed = parseCsv(`employee_id,first_name,middle_name,last_name,suffix,department,employment_status
002,John,Paul,Smith,III,Registrar,active
`);
const structuredNameRows = parseHrpsRows(canonicalizeHrpsHeaders(structuredNameParsed.headers), structuredNameParsed.rows);
assert.equal(structuredNameRows[0].errors.length, 0);
assert.equal(structuredNameRows[0].input?.displayName, "John Paul Smith III");

const missingNameParsed = parseCsv("employee_id,department,employment_status\n003,Registrar,active\n");
const missingNameRows = parseHrpsRows(canonicalizeHrpsHeaders(missingNameParsed.headers), missingNameParsed.rows);
assert.equal(missingNameRows[0].input?.displayName, "");
assert.ok(missingNameRows[0].errors.includes("Name is required: provide full_name or both first_name and last_name."));

assert.doesNotThrow(() => canonicalizeHrpsHeaders(["employee_id", "full_name", "department", "employment_status"]));
assert.throws(
  () => canonicalizeHrpsHeaders(["employee_id", "department"]),
  (error: unknown) => error instanceof HrpsCsvError
    && error.message.includes("employmentStatus")
    && !error.message.includes("displayName"),
);

const serviceSource = readFileSync("src/server/hrps/hrps-import.service.ts", "utf8");
const previewStart = serviceSource.indexOf("export async function buildHrpsImportPreview");
const previewEnd = serviceSource.indexOf("function timeDate", previewStart);
const previewSource = serviceSource.slice(previewStart, previewEnd);
assert.match(serviceSource, /getPrismaClient/);
assert.doesNotMatch(serviceSource, /firestore/i);
assert.doesNotMatch(previewSource, /\.create\(|\.update\(|\.delete\(/);
assert.match(previewSource, /getExistingEmployees/);

console.log("HRPS CSV parser checks passed.");
