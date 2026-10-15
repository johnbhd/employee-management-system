import assert from "node:assert/strict";

import { evaluatePayrollEligibility } from "../../src/server/payroll/payroll-eligibility.ts";

const eligible = evaluatePayrollEligibility({
  attendanceExists: true,
  employeeExists: true,
  processingComplete: true,
  finalVerificationStatus: "verified",
  hasFinalVerificationTimestamp: true,
  pendingCorrection: false,
  hasEffectiveTimeIn: true,
  hasEffectiveTimeOut: true,
  hasRequiredIdentifier: true,
  existingBatchReference: null,
});
assert.equal(eligible.eligible, true);
assert.deepEqual(eligible.reasons, []);

const blocked = evaluatePayrollEligibility({
  attendanceExists: true,
  employeeExists: true,
  processingComplete: true,
  finalVerificationStatus: "pending",
  hasFinalVerificationTimestamp: false,
  pendingCorrection: true,
  hasEffectiveTimeIn: true,
  hasEffectiveTimeOut: false,
  hasRequiredIdentifier: true,
  existingBatchReference: null,
});
assert.equal(blocked.status, "blocked");
assert.deepEqual(
  blocked.reasons.map((reason) => reason.code),
  ["NOT_FINAL_VERIFIED", "PENDING_CORRECTION", "MISSING_EFFECTIVE_TIME"],
);

const owned = evaluatePayrollEligibility({
  attendanceExists: true,
  employeeExists: true,
  processingComplete: true,
  finalVerificationStatus: "verified",
  hasFinalVerificationTimestamp: true,
  pendingCorrection: false,
  hasEffectiveTimeIn: true,
  hasEffectiveTimeOut: true,
  hasRequiredIdentifier: true,
  existingBatchReference: "PAY-20261001-ABC123",
});
assert.equal(owned.eligible, false);
assert.equal(owned.reasons[0]?.code, "ALREADY_IN_PAYROLL_BATCH");

console.log("Payroll eligibility assertions passed.");
