-- Add the immutable Payroll freeze metadata and attendance snapshot payloads.
-- Existing rows remain readable; only a successful Draft -> Ready transition
-- populates the new snapshot fields.
ALTER TABLE "payroll_batches"
  ADD COLUMN "frozen_by_user_id" UUID,
  ADD COLUMN "frozen_by_snapshot" JSONB,
  ADD COLUMN "frozen_at" TIMESTAMPTZ(3);

ALTER TABLE "payroll_batch_items"
  ADD COLUMN "attendance_snapshot" JSONB,
  ADD COLUMN "schedule_snapshot" JSONB,
  ADD COLUMN "verification_snapshot" JSONB;

CREATE INDEX "payroll_batches_frozen_by_user_id_idx"
  ON "payroll_batches"("frozen_by_user_id");

ALTER TABLE "payroll_batches"
  ADD CONSTRAINT "payroll_batches_frozen_by_user_id_fkey"
  FOREIGN KEY ("frozen_by_user_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
