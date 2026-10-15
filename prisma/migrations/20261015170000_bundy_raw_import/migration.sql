-- CreateEnum
CREATE TYPE "BundyImportStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'COMPLETED_WITH_ERRORS', 'FAILED');

-- CreateEnum
CREATE TYPE "BundyEventType" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "BundyMatchStatus" AS ENUM ('MATCHED', 'UNMATCHED', 'EMPLOYEE_INACTIVE');

-- CreateEnum
CREATE TYPE "BundyValidationStatus" AS ENUM ('VALID', 'INVALID');

-- CreateEnum
CREATE TYPE "BundyDuplicateStatus" AS ENUM ('UNIQUE', 'DUPLICATE_SCAN');

-- CreateTable
CREATE TABLE "bundy_imports" (
    "id" UUID NOT NULL,
    "filename" VARCHAR(255) NOT NULL,
    "content_hash" VARCHAR(64) NOT NULL,
    "initiated_by_user_id" UUID,
    "initiated_by_snapshot" JSONB NOT NULL,
    "started_at" TIMESTAMPTZ(3) NOT NULL,
    "completed_at" TIMESTAMPTZ(3),
    "status" "BundyImportStatus" NOT NULL,
    "total_rows" INTEGER NOT NULL,
    "in_count" INTEGER NOT NULL,
    "out_count" INTEGER NOT NULL,
    "matched_count" INTEGER NOT NULL,
    "unmatched_count" INTEGER NOT NULL,
    "inactive_count" INTEGER NOT NULL,
    "duplicate_scan_count" INTEGER NOT NULL,
    "already_imported_count" INTEGER NOT NULL,
    "invalid_count" INTEGER NOT NULL,
    "source_conflict_count" INTEGER NOT NULL,
    "imported_count" INTEGER NOT NULL,
    "devices" JSONB NOT NULL,
    "source_batches" JSONB NOT NULL,
    "error_summary" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "bundy_imports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bundy_raw_events" (
    "id" UUID NOT NULL,
    "import_id" UUID NOT NULL,
    "source_log_id" VARCHAR(160) NOT NULL,
    "device_employee_id" VARCHAR(64) NOT NULL,
    "employee_id" UUID,
    "source_timestamp" VARCHAR(40) NOT NULL,
    "occurred_at" TIMESTAMPTZ(3) NOT NULL,
    "event" "BundyEventType" NOT NULL,
    "device_id" VARCHAR(120) NOT NULL,
    "source_batch" VARCHAR(160),
    "source_processing_status" VARCHAR(80),
    "source_matched_hrps_employee_id" VARCHAR(64),
    "match_status" "BundyMatchStatus" NOT NULL,
    "validation_status" "BundyValidationStatus" NOT NULL,
    "duplicate_status" "BundyDuplicateStatus" NOT NULL,
    "anomaly_codes" JSONB NOT NULL DEFAULT '[]',
    "imported_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bundy_raw_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bundy_imports_started_at_id_idx" ON "bundy_imports"("started_at", "id");
CREATE INDEX "bundy_imports_status_started_at_idx" ON "bundy_imports"("status", "started_at");
CREATE INDEX "bundy_imports_content_hash_idx" ON "bundy_imports"("content_hash");
CREATE UNIQUE INDEX "bundy_raw_events_source_log_id_key" ON "bundy_raw_events"("source_log_id");
CREATE INDEX "bundy_raw_events_device_employee_id_occurred_at_idx" ON "bundy_raw_events"("device_employee_id", "occurred_at");
CREATE INDEX "bundy_raw_events_employee_id_occurred_at_idx" ON "bundy_raw_events"("employee_id", "occurred_at");
CREATE INDEX "bundy_raw_events_match_status_occurred_at_idx" ON "bundy_raw_events"("match_status", "occurred_at");
CREATE INDEX "bundy_raw_events_duplicate_status_occurred_at_idx" ON "bundy_raw_events"("duplicate_status", "occurred_at");
CREATE INDEX "bundy_raw_events_import_id_occurred_at_idx" ON "bundy_raw_events"("import_id", "occurred_at");

-- AddForeignKey
ALTER TABLE "bundy_imports" ADD CONSTRAINT "bundy_imports_initiated_by_user_id_fkey" FOREIGN KEY ("initiated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bundy_raw_events" ADD CONSTRAINT "bundy_raw_events_import_id_fkey" FOREIGN KEY ("import_id") REFERENCES "bundy_imports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bundy_raw_events" ADD CONSTRAINT "bundy_raw_events_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Application data is server-only; no browser policy is added.
ALTER TABLE "bundy_imports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bundy_raw_events" ENABLE ROW LEVEL SECURITY;
