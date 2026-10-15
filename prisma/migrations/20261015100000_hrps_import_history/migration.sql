-- CreateEnum
CREATE TYPE "HrpsImportStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'COMPLETED_WITH_ERRORS', 'FAILED');

-- CreateTable
CREATE TABLE "hrps_imports" (
    "id" UUID NOT NULL,
    "source_system" "EmployeeSourceSystem" NOT NULL DEFAULT 'HRPS',
    "filename" VARCHAR(255) NOT NULL,
    "content_hash" VARCHAR(64) NOT NULL,
    "initiated_by_user_id" UUID,
    "initiated_by_snapshot" JSONB NOT NULL,
    "started_at" TIMESTAMPTZ(3) NOT NULL,
    "completed_at" TIMESTAMPTZ(3),
    "status" "HrpsImportStatus" NOT NULL,
    "total_rows" INTEGER NOT NULL,
    "new_count" INTEGER NOT NULL,
    "updated_count" INTEGER NOT NULL,
    "unchanged_count" INTEGER NOT NULL,
    "invalid_count" INTEGER NOT NULL,
    "duplicate_count" INTEGER NOT NULL,
    "needs_review_count" INTEGER NOT NULL,
    "created_employees" INTEGER NOT NULL DEFAULT 0,
    "updated_employees" INTEGER NOT NULL DEFAULT 0,
    "schedules_created" INTEGER NOT NULL DEFAULT 0,
    "schedules_updated" INTEGER NOT NULL DEFAULT 0,
    "accounts_provisioned" INTEGER NOT NULL DEFAULT 0,
    "accounts_pending" INTEGER NOT NULL DEFAULT 0,
    "accounts_failed" INTEGER NOT NULL DEFAULT 0,
    "error_summary" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "hrps_imports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hrps_imports_started_at_id_idx" ON "hrps_imports"("started_at", "id");

-- CreateIndex
CREATE INDEX "hrps_imports_status_started_at_idx" ON "hrps_imports"("status", "started_at");

-- CreateIndex
CREATE INDEX "hrps_imports_content_hash_idx" ON "hrps_imports"("content_hash");

-- AddForeignKey
ALTER TABLE "hrps_imports" ADD CONSTRAINT "hrps_imports_initiated_by_user_id_fkey" FOREIGN KEY ("initiated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Application data is server-only; no browser policy is added.
ALTER TABLE "hrps_imports" ENABLE ROW LEVEL SECURITY;
