-- Track the one-time password change required by HRPS-provisioned accounts.
ALTER TABLE "users"
    ADD COLUMN "must_change_password" BOOLEAN NOT NULL DEFAULT false;
