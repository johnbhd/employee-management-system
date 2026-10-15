-- Keep one active correction request per canonical attendance record.
-- Historical approved and rejected corrections remain preserved.
CREATE UNIQUE INDEX "attendance_corrections_one_pending_per_record_idx"
ON "attendance_corrections"("attendance_record_id")
WHERE "status" = 'pending';
