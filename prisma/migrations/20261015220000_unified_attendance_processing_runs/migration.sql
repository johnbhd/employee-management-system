-- Persist bounded Unified Attendance processing runs and employee/date items.
-- Source evidence and employee data remain owned by their existing tables.
CREATE TYPE "UnifiedAttendanceProcessingRunStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'COMPLETED_WITH_ERRORS',
    'FAILED'
);

CREATE TYPE "UnifiedAttendanceProcessingItemStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'FAILED'
);

CREATE TYPE "UnifiedAttendanceProcessingRunType" AS ENUM (
    'INITIAL',
    'REPROCESS'
);

CREATE TYPE "UnifiedAttendanceProcessingOperation" AS ENUM (
    'CREATED',
    'UPDATED',
    'UNCHANGED'
);

CREATE TABLE "unified_attendance_processing_runs" (
    "id" UUID NOT NULL,
    "run_type" "UnifiedAttendanceProcessingRunType" NOT NULL DEFAULT 'INITIAL',
    "date_from" DATE NOT NULL,
    "date_to" DATE NOT NULL,
    "status" "UnifiedAttendanceProcessingRunStatus" NOT NULL,
    "initiated_by_user_id" UUID,
    "initiated_by_snapshot" JSONB NOT NULL,
    "started_at" TIMESTAMPTZ(3) NOT NULL,
    "completed_at" TIMESTAMPTZ(3),
    "total_items" INTEGER NOT NULL,
    "pending_items" INTEGER NOT NULL DEFAULT 0,
    "processing_items" INTEGER NOT NULL DEFAULT 0,
    "completed_items" INTEGER NOT NULL DEFAULT 0,
    "failed_items" INTEGER NOT NULL DEFAULT 0,
    "created_count" INTEGER NOT NULL DEFAULT 0,
    "updated_count" INTEGER NOT NULL DEFAULT 0,
    "unchanged_count" INTEGER NOT NULL DEFAULT 0,
    "needs_review_count" INTEGER NOT NULL DEFAULT 0,
    "error_summary" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "unified_attendance_processing_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "unified_attendance_processing_items" (
    "id" UUID NOT NULL,
    "run_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "employee_reference" VARCHAR(64) NOT NULL,
    "employee_name" VARCHAR(160) NOT NULL,
    "attendance_date" DATE NOT NULL,
    "attendance_record_id" UUID,
    "status" "UnifiedAttendanceProcessingItemStatus" NOT NULL,
    "operation" "UnifiedAttendanceProcessingOperation",
    "technical_state" "UnifiedAttendanceTechnicalState",
    "business_status" "UnifiedAttendanceBusinessStatus",
    "requires_review" BOOLEAN NOT NULL DEFAULT FALSE,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "error_code" VARCHAR(80),
    "error_message" TEXT,
    "started_at" TIMESTAMPTZ(3),
    "completed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "unified_attendance_processing_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "unified_attendance_processing_items_run_id_employee_id_attendance_date_key"
    ON "unified_attendance_processing_items"("run_id", "employee_id", "attendance_date");
CREATE INDEX "unified_attendance_processing_runs_started_at_id_idx"
    ON "unified_attendance_processing_runs"("started_at", "id");
CREATE INDEX "unified_attendance_processing_runs_status_started_at_idx"
    ON "unified_attendance_processing_runs"("status", "started_at");
CREATE INDEX "unified_attendance_processing_items_run_id_status_attendance_date_idx"
    ON "unified_attendance_processing_items"("run_id", "status", "attendance_date");
CREATE INDEX "unified_attendance_processing_items_employee_id_attendance_date_idx"
    ON "unified_attendance_processing_items"("employee_id", "attendance_date");
CREATE INDEX "unified_attendance_processing_items_attendance_record_id_idx"
    ON "unified_attendance_processing_items"("attendance_record_id");

ALTER TABLE "unified_attendance_processing_runs"
    ADD CONSTRAINT "unified_attendance_processing_runs_initiated_by_user_id_fkey"
    FOREIGN KEY ("initiated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "unified_attendance_processing_items"
    ADD CONSTRAINT "unified_attendance_processing_items_run_id_fkey"
    FOREIGN KEY ("run_id") REFERENCES "unified_attendance_processing_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "unified_attendance_processing_items"
    ADD CONSTRAINT "unified_attendance_processing_items_employee_id_fkey"
    FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "unified_attendance_processing_items"
    ADD CONSTRAINT "unified_attendance_processing_items_attendance_record_id_fkey"
    FOREIGN KEY ("attendance_record_id") REFERENCES "attendance_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;
