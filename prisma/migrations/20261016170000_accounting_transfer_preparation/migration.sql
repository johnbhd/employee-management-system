-- ACCOUNTING-017A: persist local Accounting preparation separately from
-- future external submission state.
ALTER TYPE "AccountingTransferStatus" ADD VALUE IF NOT EXISTS 'prepared';

ALTER TABLE "accounting_transfers"
  ADD COLUMN "prepared_by_user_id" UUID,
  ADD COLUMN "prepared_by_snapshot" JSONB,
  ADD COLUMN "prepared_at" TIMESTAMPTZ(3),
  ADD COLUMN "snapshot" JSONB,
  ADD COLUMN "source_mode" VARCHAR(80);

ALTER TABLE "accounting_transfers"
  ADD CONSTRAINT "accounting_transfers_prepared_by_user_id_fkey"
  FOREIGN KEY ("prepared_by_user_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "accounting_transfers_prepared_at_idx"
  ON "accounting_transfers"("prepared_at");

INSERT INTO "permissions" ("id", "key", "label", "description", "category", "created_at", "updated_at")
VALUES (
  gen_random_uuid(),
  'accounting.transfer.prepare',
  'Prepare Accounting Transfer',
  'Create a read-only Accounting transfer snapshot from an eligible Payroll Result.',
  'Accounting Integration',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "role_permissions" ("role_id", "permission_id", "version", "updated_at")
SELECT roles."id", permissions."id", 1, CURRENT_TIMESTAMP
FROM "application_roles" AS roles
JOIN "permissions" AS permissions ON permissions."key" = 'accounting.transfer.prepare'
WHERE roles."code" = 'accounting'::"ApplicationRoleCode"
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
