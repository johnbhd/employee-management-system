-- Safe HRPS rollback ownership and lifecycle metadata.
ALTER TYPE "HrpsImportStatus" ADD VALUE 'ROLLING_BACK';
ALTER TYPE "HrpsImportStatus" ADD VALUE 'ROLLED_BACK';
ALTER TYPE "HrpsImportStatus" ADD VALUE 'ROLLBACK_FAILED';

ALTER TABLE "hrps_imports"
    ADD COLUMN "rollback_started_at" TIMESTAMPTZ(3),
    ADD COLUMN "rolled_back_at" TIMESTAMPTZ(3),
    ADD COLUMN "rolled_back_by_user_id" UUID,
    ADD COLUMN "rolled_back_by_snapshot" JSONB,
    ADD COLUMN "rollback_error_summary" TEXT,
    ADD COLUMN "rollback_summary" JSONB;

CREATE TYPE "HrpsImportRowStatus" AS ENUM ('PENDING', 'ROLLED_BACK', 'BLOCKED');

CREATE TABLE "hrps_import_rows" (
    "id" UUID NOT NULL,
    "import_id" UUID NOT NULL,
    "row_number" INTEGER NOT NULL,
    "employee_id" VARCHAR(64),
    "classification" VARCHAR(40) NOT NULL,
    "employee_record_id" UUID,
    "employee_created" BOOLEAN NOT NULL DEFAULT false,
    "employee_before" JSONB,
    "employee_after" JSONB,
    "schedule_ownership" JSONB NOT NULL DEFAULT '{}',
    "application_user_id" UUID,
    "application_user_created" BOOLEAN NOT NULL DEFAULT false,
    "firebase_uid" VARCHAR(128),
    "firebase_created" BOOLEAN NOT NULL DEFAULT false,
    "rollback_status" "HrpsImportRowStatus" NOT NULL DEFAULT 'PENDING',
    "rollback_message" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "hrps_import_rows_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "hrps_import_rows_import_id_fkey" FOREIGN KEY ("import_id") REFERENCES "hrps_imports"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "hrps_import_rows_import_id_row_number_key" ON "hrps_import_rows"("import_id", "row_number");
CREATE INDEX "hrps_import_rows_employee_id_idx" ON "hrps_import_rows"("employee_id");
CREATE INDEX "hrps_import_rows_employee_record_id_idx" ON "hrps_import_rows"("employee_record_id");
CREATE INDEX "hrps_import_rows_rollback_status_idx" ON "hrps_import_rows"("rollback_status");

ALTER TABLE "hrps_import_rows" ENABLE ROW LEVEL SECURITY;
