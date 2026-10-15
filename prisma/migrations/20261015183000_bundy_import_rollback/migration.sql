-- Add a controlled Bundy import rollback lifecycle while preserving import history.
ALTER TYPE "BundyImportStatus" ADD VALUE 'ROLLING_BACK';
ALTER TYPE "BundyImportStatus" ADD VALUE 'ROLLED_BACK';
ALTER TYPE "BundyImportStatus" ADD VALUE 'ROLLBACK_FAILED';

ALTER TABLE "bundy_imports"
    ADD COLUMN "rollback_started_at" TIMESTAMPTZ(3),
    ADD COLUMN "rolled_back_at" TIMESTAMPTZ(3),
    ADD COLUMN "rolled_back_by_user_id" UUID,
    ADD COLUMN "rolled_back_by_snapshot" JSONB,
    ADD COLUMN "rollback_error_summary" TEXT,
    ADD COLUMN "rollback_summary" JSONB;

CREATE INDEX "bundy_imports_status_rollback_started_at_idx"
    ON "bundy_imports"("status", "rollback_started_at");

ALTER TABLE "bundy_imports"
    ADD CONSTRAINT "bundy_imports_rolled_back_by_user_id_fkey"
    FOREIGN KEY ("rolled_back_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
