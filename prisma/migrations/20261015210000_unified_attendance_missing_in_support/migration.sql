-- Unified Attendance may preserve an OUT-only or no-event processing result.
-- Existing QR records already contain non-null IN values, so this is a
-- backwards-compatible relaxation rather than a data rewrite.
ALTER TABLE "attendance_records"
    ALTER COLUMN "time_in" DROP NOT NULL,
    ALTER COLUMN "time_in_source" DROP NOT NULL,
    ALTER COLUMN "time_in_actor_snapshot" DROP NOT NULL;
