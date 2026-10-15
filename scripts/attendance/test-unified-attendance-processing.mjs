import assert from "node:assert/strict";

import {
  buildUnifiedAttendanceWorkPlan,
  dateKeyIsValid,
} from "../../src/server/attendance/unified-attendance-work-plan.ts";

assert.equal(dateKeyIsValid("2026-10-15"), true);
assert.equal(dateKeyIsValid("2026-02-30"), false);

const employees = [
  {
    internalId: "employee-record-1",
    employeeId: "001",
    displayName: "Jane Doe",
    schedules: [{
      internalId: "schedule-1",
      scheduleId: "weekday",
      workDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      effectiveFrom: "2026-01-01",
      effectiveTo: null,
    }],
  },
  {
    internalId: "employee-record-2",
    employeeId: "002",
    displayName: "John Smith",
    schedules: [{
      internalId: "schedule-2",
      scheduleId: "saturday",
      workDays: ["Saturday"],
      effectiveFrom: "2026-10-01",
      effectiveTo: "2026-10-31",
    }],
  },
];

const plan = buildUnifiedAttendanceWorkPlan({
  dateFrom: "2026-10-16",
  dateTo: "2026-10-18",
  employees,
});

assert.deepEqual(plan.map((item) => `${item.employeeId}:${item.attendanceDate}`), [
  "001:2026-10-16",
  "002:2026-10-17",
]);

const expired = buildUnifiedAttendanceWorkPlan({
  dateFrom: "2026-11-01",
  dateTo: "2026-11-07",
  employees,
});
assert.equal(expired.some((item) => item.employeeId === "002"), false);

console.log("Unified Attendance processing work-plan checks passed.");
