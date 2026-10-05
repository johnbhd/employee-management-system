import assert from "node:assert/strict";

import { demoEmployeeSeedAccounts } from "../firebase/data/demo-employees";
import {
    createEmployeeQrPayloadWithSecret,
    verifyEmployeeQrPayloadWithSecret,
} from "../../src/server/attendance/qr/attendance-qr-token-core";
import { determineQrAttendanceAction } from "../../src/server/attendance/qr/qr-attendance-state";

const secret = "task-084-local-verification-secret";
const firstScanAt = new Date("2026-10-05T01:00:00.000Z");
const normalSecondScanAt = new Date(firstScanAt.getTime() + 6_000);
const completedScanAt = new Date(firstScanAt.getTime() + 12_000);

const qrValues = demoEmployeeSeedAccounts.map((employee) =>
    createEmployeeQrPayloadWithSecret(employee.employeeId, secret));

assert.equal(new Set(qrValues).size, demoEmployeeSeedAccounts.length);

for (const [index, employee] of demoEmployeeSeedAccounts.entries()) {
    const qrValue = qrValues[index];

    assert.equal(verifyEmployeeQrPayloadWithSecret(qrValue, secret), employee.employeeId);
    assert.equal(
        determineQrAttendanceAction(null, firstScanAt),
        "time_in",
    );

    const activeAttendance = {
        timeIn: firstScanAt,
        timeOut: null,
    };

    assert.equal(
        determineQrAttendanceAction(activeAttendance, new Date(firstScanAt.getTime() + 1_000)),
        "duplicate_scan",
    );
    assert.equal(
        determineQrAttendanceAction(activeAttendance, normalSecondScanAt),
        "time_out",
    );
    assert.equal(
        determineQrAttendanceAction(
            {
                timeIn: firstScanAt,
                timeOut: normalSecondScanAt,
            },
            completedScanAt,
        ),
        "already_completed",
    );
}

assert.throws(
    () => verifyEmployeeQrPayloadWithSecret("hello", secret),
);

const tamperedQr = `${qrValues[0].slice(0, -1)}${qrValues[0].endsWith("a") ? "b" : "a"}`;

assert.throws(
    () => verifyEmployeeQrPayloadWithSecret(tamperedQr, secret),
);

console.log(
    "QR attendance state verification passed for employees 001-010, including first scan, cooldown, time-out, completion, invalid QR, and tamper rejection.",
);
