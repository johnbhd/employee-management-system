-- ACCOUNTING-017B: retain technical handoff attempt metadata on the
-- existing prepared Accounting transfer row.
ALTER TABLE "accounting_transfers"
  ADD COLUMN "last_attempt_at" TIMESTAMPTZ(3),
  ADD COLUMN "last_error" TEXT;

CREATE INDEX "accounting_transfers_last_attempt_at_idx"
  ON "accounting_transfers"("last_attempt_at");

INSERT INTO "permissions" ("id", "key", "label", "description", "category", "created_at", "updated_at")
VALUES (
  gen_random_uuid(),
  'accounting.transfer.acknowledge',
  'Check Accounting Acknowledgement',
  'Check and record the acknowledgement state returned by the Accounting adapter.',
  'Accounting Integration',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "role_permissions" ("role_id", "permission_id", "version", "updated_at")
SELECT roles."id", permissions."id", 1, CURRENT_TIMESTAMP
FROM "application_roles" AS roles
JOIN "permissions" AS permissions ON permissions."key" = 'accounting.transfer.acknowledge'
WHERE roles."code" = 'accounting'::"ApplicationRoleCode"
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
