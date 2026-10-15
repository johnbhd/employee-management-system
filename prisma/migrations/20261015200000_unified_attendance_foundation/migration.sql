-- Extend the existing AttendanceRecord model into the Unified Attendance
-- foundation without creating a duplicate attendance master.

CREATE TYPE "UnifiedAttendanceTechnicalState" AS ENUM (
    'NO_EVENTS',
    'IN_PROGRESS',
    'COMPLETE',
    'MISSING_IN',
    'MISSING_OUT',
    'NEEDS_REVIEW'
);

CREATE TYPE "UnifiedAttendanceBusinessStatus" AS ENUM (
    'UNCLASSIFIED',
    'PRESENT',
    'LATE',
    'ABSENT'
);

ALTER TABLE "attendance_records"
    ADD COLUMN "employee_schedule_id" UUID,
    ADD COLUMN "schedule_snapshot" JSONB,
    ADD COLUMN "technical_state" "UnifiedAttendanceTechnicalState" NOT NULL DEFAULT 'IN_PROGRESS',
    ADD COLUMN "business_status" "UnifiedAttendanceBusinessStatus" NOT NULL DEFAULT 'UNCLASSIFIED',
    ADD COLUMN "processed_at" TIMESTAMPTZ(3),
    ADD COLUMN "processing_version" VARCHAR(80),
    ADD COLUMN "last_reprocessed_at" TIMESTAMPTZ(3),
    ADD COLUMN "requires_review" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "review_reason_code" VARCHAR(80);

-- Existing records already contain normalized IN/OUT state. Preserve their
-- legacy values while initializing the new technical state explicitly.
UPDATE "attendance_records"
SET "technical_state" = CASE
    WHEN "time_out" IS NULL THEN 'MISSING_OUT'::"UnifiedAttendanceTechnicalState"
    ELSE 'COMPLETE'::"UnifiedAttendanceTechnicalState"
END,
"processed_at" = COALESCE("updated_at", "created_at");

CREATE TABLE "attendance_bundy_evidence" (
    "id" UUID NOT NULL,
    "attendance_record_id" UUID NOT NULL,
    "bundy_raw_event_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_bundy_evidence_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "attendance_bundy_evidence_attendance_record_id_bundy_raw_event_id_key"
    ON "attendance_bundy_evidence"("attendance_record_id", "bundy_raw_event_id");
CREATE INDEX "attendance_bundy_evidence_bundy_raw_event_id_idx"
    ON "attendance_bundy_evidence"("bundy_raw_event_id");
CREATE INDEX "attendance_records_technical_state_attendance_date_idx"
    ON "attendance_records"("technical_state", "attendance_date");
CREATE INDEX "attendance_records_business_status_attendance_date_idx"
    ON "attendance_records"("business_status", "attendance_date");
CREATE INDEX "attendance_records_requires_review_attendance_date_idx"
    ON "attendance_records"("requires_review", "attendance_date");
CREATE INDEX "attendance_records_employee_schedule_id_idx"
    ON "attendance_records"("employee_schedule_id");

ALTER TABLE "attendance_records"
    ADD CONSTRAINT "attendance_records_employee_schedule_id_fkey"
    FOREIGN KEY ("employee_schedule_id") REFERENCES "employee_schedules"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "attendance_bundy_evidence"
    ADD CONSTRAINT "attendance_bundy_evidence_attendance_record_id_fkey"
    FOREIGN KEY ("attendance_record_id") REFERENCES "attendance_records"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "attendance_bundy_evidence_bundy_raw_event_id_fkey"
    FOREIGN KEY ("bundy_raw_event_id") REFERENCES "bundy_raw_events"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "attendance_bundy_evidence" ENABLE ROW LEVEL SECURITY;
