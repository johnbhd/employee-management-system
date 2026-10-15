import assert from "node:assert/strict";

import { normalizeAttendanceEvidence } from "../../src/server/attendance/unified-attendance-normalizer.ts";

function evidence(sourceRecordId, timestamp, direction, source) {
    return {
        sourceRecordId,
        source,
        timestamp: new Date(timestamp),
        direction,
        sourceReference: sourceRecordId,
    };
}

const mixed = normalizeAttendanceEvidence([
    evidence("qr-in", "2026-10-05T00:00:00.000Z", "IN", "QR"),
    evidence("bundy-out", "2026-10-05T09:00:00.000Z", "OUT", "BUNDY"),
]);
assert.equal(mixed.firstIn?.source, "QR");
assert.equal(mixed.lastOut?.source, "BUNDY");
assert.equal(mixed.technicalState, "COMPLETE");

const duplicateScans = normalizeAttendanceEvidence([
    evidence("late-in", "2026-10-05T00:40:35.000Z", "IN", "BUNDY"),
    evidence("first-in", "2026-10-05T00:40:00.000Z", "IN", "BUNDY"),
    evidence("out", "2026-10-05T09:00:00.000Z", "OUT", "BUNDY"),
]);
assert.equal(duplicateScans.evidence.length, 3);
assert.equal(duplicateScans.firstIn?.sourceRecordId, "first-in");

const missingOut = normalizeAttendanceEvidence([
    evidence("in", "2026-10-05T00:40:00.000Z", "IN", "BUNDY"),
]);
assert.equal(missingOut.technicalState, "MISSING_OUT");
assert.equal(missingOut.requiresReview, true);

const missingIn = normalizeAttendanceEvidence([
    evidence("out", "2026-10-05T09:00:00.000Z", "OUT", "BUNDY"),
]);
assert.equal(missingIn.technicalState, "MISSING_IN");
assert.equal(missingIn.firstIn, null);

const sourceConflict = normalizeAttendanceEvidence([
    evidence("out-first", "2026-10-05T00:30:00.000Z", "OUT", "BUNDY"),
    evidence("in-later", "2026-10-05T00:40:00.000Z", "IN", "BUNDY"),
]);
assert.equal(sourceConflict.technicalState, "NEEDS_REVIEW");
assert.equal(sourceConflict.reviewReasons.includes("UNUSUAL_SCAN_PATTERN"), true);

const noEvents = normalizeAttendanceEvidence([]);
assert.equal(noEvents.technicalState, "NO_EVENTS");
assert.equal(noEvents.requiresReview, false);

console.log("Unified Attendance normalizer checks passed.");
