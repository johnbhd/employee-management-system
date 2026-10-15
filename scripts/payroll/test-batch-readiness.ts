import assert from "node:assert/strict";

import { evaluatePayrollBatchReadiness } from "../../src/server/payroll/payroll-batch-readiness";

const eligibleRecord = {
  id: "attendance-1",
  employeeId: "employee-internal-1",
  attendanceDate: "2026-10-05",
  timeIn: "2026-10-05T08:00:00.000Z",
  timeOut: "2026-10-05T17:00:00.000Z",
  timeInSource: "BUNDY",
  timeOutSource: "BUNDY",
  attendanceStatus: "completed",
  hrVerificationStatus: "verified" as const,
  hrVerifiedAt: "2026-10-06T00:00:00.000Z",
  hrVerifiedBySnapshot: { displayName: "HR Reviewer" },
  technicalState: "COMPLETE",
  processedAt: "2026-10-05T18:00:00.000Z",
  requiresReview: false,
  businessStatus: "PRESENT",
  scheduleSnapshot: { scheduleId: "S-1", workStart: "08:00" },
};

function evaluate(overrides: Record<string, unknown> = {}) {
  return evaluatePayrollBatchReadiness({
    batchId: "PAY-20261005-TEST",
    status: "Draft",
    periodStart: "2026-10-01",
    periodEnd: "2026-10-15",
    items: [{
      id: "item-1",
      employeeId: "employee-internal-1",
      employeeIdSnapshot: "EMP-001",
      employeeNameSnapshot: "Test Employee",
      employeePeriodId: "EMP-001:2026-10-01",
      sourceAttendanceIds: ["attendance-1"],
      employeeExists: true,
      periodStart: "2026-10-01",
      periodEnd: "2026-10-15",
      sourceRecords: [eligibleRecord],
      pendingCorrectionIds: new Set<string>(),
      existingBatchReference: null,
      ...overrides,
    }],
  });
}

assert.equal(evaluate().ready, true);
assert.equal(evaluate().eligibleItems, 1);

const empty = evaluate({ sourceAttendanceIds: [], sourceRecords: [] });
assert.equal(empty.ready, false);
assert.equal(empty.items[0]?.ready, false);

const pending = evaluate({ pendingCorrectionIds: new Set(["attendance-1"]) });
assert.equal(pending.items[0]?.reasons.some((reason) => reason.code === "PENDING_CORRECTION"), true);

const notVerified = evaluate({
  sourceRecords: [{ ...eligibleRecord, hrVerificationStatus: "pending", hrVerifiedAt: null }],
});
assert.equal(notVerified.items[0]?.reasons.some((reason) => reason.code === "NOT_FINAL_VERIFIED"), true);

const outsidePeriod = evaluate({
  sourceRecords: [{ ...eligibleRecord, attendanceDate: "2026-10-20" }],
});
assert.equal(outsidePeriod.items[0]?.reasons.some((reason) => reason.code === "OUTSIDE_BATCH_PERIOD"), true);

const owned = evaluate({ existingBatchReference: "PAY-20260916-OTHER" });
assert.equal(owned.items[0]?.reasons.some((reason) => reason.code === "ALREADY_IN_PAYROLL_BATCH"), true);

const readyBatch = evaluatePayrollBatchReadiness({
  batchId: "PAY-20261005-READY",
  status: "Ready",
  periodStart: "2026-10-01",
  periodEnd: "2026-10-15",
  items: [],
});
assert.equal(readyBatch.ready, false);
assert.equal(readyBatch.reasons.some((reason) => reason.code === "BATCH_NOT_DRAFT"), true);

console.log("Payroll batch readiness assertions passed.");
