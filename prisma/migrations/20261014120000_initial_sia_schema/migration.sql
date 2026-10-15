-- CreateEnum
CREATE TYPE "ApplicationRoleCode" AS ENUM ('admin', 'hr', 'employee', 'payroll', 'accounting');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'inactive', 'disabled');

-- CreateEnum
CREATE TYPE "EmployeeEmploymentStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "EmployeeSourceSystem" AS ENUM ('HRPS');

-- CreateEnum
CREATE TYPE "AttendanceSource" AS ENUM ('QR', 'BUNDY');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('present', 'completed');

-- CreateEnum
CREATE TYPE "HrVerificationStatus" AS ENUM ('pending', 'verified');

-- CreateEnum
CREATE TYPE "PayrollReadinessStatus" AS ENUM ('ready', 'blocked');

-- CreateEnum
CREATE TYPE "AttendanceCorrectionStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "AttendanceCorrectionIssueType" AS ENUM ('Missing Time-In', 'Missing Time-Out', 'Incorrect Time-In', 'Incorrect Time-Out', 'Time In and Time Out Correction');

-- CreateEnum
CREATE TYPE "PayrollBatchStatus" AS ENUM ('Draft', 'Ready', 'Submitted', 'Acknowledged', 'Blocked', 'Failed');

-- CreateEnum
CREATE TYPE "PayrollTransferStatus" AS ENUM ('preparing', 'submitting', 'submitted', 'failed');

-- CreateEnum
CREATE TYPE "PayrollAcknowledgementStatus" AS ENUM ('pending', 'accepted', 'rejected', 'not_received');

-- CreateEnum
CREATE TYPE "PayrollExternalResultStatus" AS ENUM ('processing', 'completed', 'completed_with_issues', 'partially_completed', 'rejected', 'failed');

-- CreateEnum
CREATE TYPE "PayrollExternalProcessingStatus" AS ENUM ('processed', 'pending', 'rejected', 'failed');

-- CreateEnum
CREATE TYPE "PayrollExternalPayslipStatus" AS ENUM ('available', 'not_yet_available', 'unavailable');

-- CreateEnum
CREATE TYPE "PayslipStatus" AS ENUM ('released', 'in-progress');

-- CreateEnum
CREATE TYPE "AccountingTransferStatus" AS ENUM ('preparing', 'submitting', 'submitted', 'failed');

-- CreateEnum
CREATE TYPE "AccountingAcknowledgementStatus" AS ENUM ('pending', 'accepted', 'rejected', 'not_received');

-- CreateEnum
CREATE TYPE "AccountingReadinessStatus" AS ENUM ('ready', 'blocked');

-- CreateEnum
CREATE TYPE "AuditActorType" AS ENUM ('user', 'system', 'integration');

-- CreateEnum
CREATE TYPE "AuditOutcome" AS ENUM ('Successful', 'Failed', 'Blocked');

-- CreateTable
CREATE TABLE "application_roles" (
    "id" UUID NOT NULL,
    "code" "ApplicationRoleCode" NOT NULL,
    "label" VARCHAR(120) NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "application_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "key" VARCHAR(120) NOT NULL,
    "label" VARCHAR(160) NOT NULL,
    "description" TEXT NOT NULL,
    "category" VARCHAR(80) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updated_by_user_id" UUID,
    "updated_by_snapshot" JSONB,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "firebase_uid" VARCHAR(128) NOT NULL,
    "username" VARCHAR(80) NOT NULL,
    "display_name" VARCHAR(160) NOT NULL,
    "role_id" UUID NOT NULL,
    "employee_id" UUID,
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" UUID NOT NULL,
    "employee_id" VARCHAR(64) NOT NULL,
    "display_name" VARCHAR(160) NOT NULL,
    "department" VARCHAR(160) NOT NULL,
    "position" VARCHAR(160),
    "employment_status" "EmployeeEmploymentStatus" NOT NULL,
    "source_system" "EmployeeSourceSystem" NOT NULL DEFAULT 'HRPS',
    "data_source" VARCHAR(80),
    "source_updated_at" TIMESTAMPTZ(3),
    "synced_at" TIMESTAMPTZ(3),
    "legacy_firestore_id" VARCHAR(160),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_schedules" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "schedule_id" VARCHAR(120) NOT NULL,
    "work_start" TIME(0),
    "work_end" TIME(0),
    "break_start" TIME(0),
    "break_end" TIME(0),
    "shift_label" VARCHAR(120),
    "work_days" JSONB NOT NULL,
    "rest_days" JSONB NOT NULL,
    "work_location" VARCHAR(200),
    "source_system" "EmployeeSourceSystem" NOT NULL DEFAULT 'HRPS',
    "data_source" VARCHAR(80),
    "effective_from" DATE,
    "effective_to" DATE,
    "legacy_firestore_id" VARCHAR(160),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "employee_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "attendance_date" DATE NOT NULL,
    "time_in" TIMESTAMPTZ(3) NOT NULL,
    "time_out" TIMESTAMPTZ(3),
    "time_in_source" "AttendanceSource" NOT NULL,
    "time_out_source" "AttendanceSource",
    "time_in_source_reference" VARCHAR(160),
    "time_out_source_reference" VARCHAR(160),
    "status" "AttendanceStatus" NOT NULL,
    "time_in_operator_user_id" UUID,
    "time_out_operator_user_id" UUID,
    "time_in_actor_snapshot" JSONB NOT NULL,
    "time_out_actor_snapshot" JSONB,
    "hr_verification_status" "HrVerificationStatus" NOT NULL DEFAULT 'pending',
    "hr_verified_at" TIMESTAMPTZ(3),
    "hr_verified_by_user_id" UUID,
    "hr_verified_by_snapshot" JSONB,
    "payroll_readiness_status" "PayrollReadinessStatus" NOT NULL DEFAULT 'blocked',
    "payroll_readiness_reasons" JSONB,
    "correction_metadata" JSONB,
    "source_metadata" JSONB,
    "legacy_firestore_id" VARCHAR(160),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_corrections" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "attendance_record_id" UUID NOT NULL,
    "attendance_date" DATE NOT NULL,
    "issue_type" "AttendanceCorrectionIssueType" NOT NULL,
    "status" "AttendanceCorrectionStatus" NOT NULL,
    "reason" TEXT NOT NULL,
    "original_snapshot" JSONB,
    "requested_changes" JSONB NOT NULL,
    "resulting_snapshot" JSONB,
    "changed_fields" JSONB NOT NULL,
    "evidence" JSONB NOT NULL DEFAULT '[]',
    "submitted_by_user_id" UUID,
    "submitted_by_snapshot" JSONB NOT NULL,
    "reviewed_by_user_id" UUID,
    "reviewed_by_snapshot" JSONB,
    "submitted_at" TIMESTAMPTZ(3) NOT NULL,
    "reviewed_at" TIMESTAMPTZ(3),
    "review_note" TEXT,
    "legacy_firestore_id" VARCHAR(160),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "attendance_corrections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_batches" (
    "id" UUID NOT NULL,
    "batch_reference" VARCHAR(160) NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "period_label" VARCHAR(80) NOT NULL,
    "status" "PayrollBatchStatus" NOT NULL,
    "created_by_user_id" UUID,
    "created_by_snapshot" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "submitted_by_user_id" UUID,
    "submitted_by_snapshot" JSONB,
    "submitted_at" TIMESTAMPTZ(3),
    "record_count" INTEGER NOT NULL,
    "blocked_count" INTEGER NOT NULL,
    "notes" TEXT,
    "legacy_firestore_id" VARCHAR(160),

    CONSTRAINT "payroll_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_batch_items" (
    "id" UUID NOT NULL,
    "batch_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "employee_period_id" VARCHAR(160) NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "employee_id_snapshot" VARCHAR(64) NOT NULL,
    "employee_name_snapshot" VARCHAR(160) NOT NULL,
    "department_snapshot" VARCHAR(160) NOT NULL,
    "present_days" INTEGER NOT NULL,
    "late_count" INTEGER,
    "late_minutes" INTEGER,
    "undertime_minutes" INTEGER,
    "hr_verification_status" "HrVerificationStatus" NOT NULL DEFAULT 'verified',
    "payroll_readiness_status" "PayrollReadinessStatus" NOT NULL DEFAULT 'ready',
    "source_attendance_ids" JSONB NOT NULL,
    "snapshot_created_at" TIMESTAMPTZ(3) NOT NULL,
    "legacy_firestore_id" VARCHAR(160),

    CONSTRAINT "payroll_batch_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_handoffs" (
    "id" UUID NOT NULL,
    "batch_id" UUID NOT NULL,
    "transfer_reference" VARCHAR(160) NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "period_label" VARCHAR(80) NOT NULL,
    "submitted_by_user_id" UUID,
    "submitted_by_snapshot" JSONB NOT NULL,
    "ready_at" TIMESTAMPTZ(3) NOT NULL,
    "submitted_at" TIMESTAMPTZ(3) NOT NULL,
    "acknowledged_at" TIMESTAMPTZ(3),
    "failed_at" TIMESTAMPTZ(3),
    "transfer_status" "PayrollTransferStatus" NOT NULL,
    "acknowledgement_status" "PayrollAcknowledgementStatus" NOT NULL,
    "external_reference" VARCHAR(200),
    "provider" VARCHAR(120) NOT NULL,
    "failure_code" VARCHAR(120),
    "failure_summary" TEXT,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "batch_summary_snapshot" JSONB NOT NULL,
    "legacy_firestore_id" VARCHAR(160),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "payroll_handoffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_results" (
    "id" UUID NOT NULL,
    "batch_id" UUID NOT NULL,
    "handoff_id" UUID NOT NULL,
    "result_reference" VARCHAR(160) NOT NULL,
    "external_payroll_reference" VARCHAR(200) NOT NULL,
    "status" "PayrollExternalResultStatus" NOT NULL,
    "provider" VARCHAR(120) NOT NULL,
    "employee_count" INTEGER NOT NULL,
    "processed_count" INTEGER NOT NULL,
    "pending_count" INTEGER NOT NULL,
    "rejected_count" INTEGER NOT NULL,
    "failed_count" INTEGER NOT NULL,
    "payslip_available_count" INTEGER NOT NULL,
    "accounting_readiness_status" "AccountingReadinessStatus" NOT NULL DEFAULT 'blocked',
    "accounting_readiness_reasons" JSONB,
    "received_at" TIMESTAMPTZ(3) NOT NULL,
    "processed_at" TIMESTAMPTZ(3),
    "completed_at" TIMESTAMPTZ(3),
    "legacy_firestore_id" VARCHAR(160),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "payroll_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_result_items" (
    "id" UUID NOT NULL,
    "result_id" UUID NOT NULL,
    "employee_id" UUID,
    "employee_id_snapshot" VARCHAR(64) NOT NULL,
    "employee_name_snapshot" VARCHAR(160) NOT NULL,
    "department_snapshot" VARCHAR(160) NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "external_employee_reference" VARCHAR(200) NOT NULL,
    "external_payroll_reference" VARCHAR(200),
    "processing_status" "PayrollExternalProcessingStatus" NOT NULL,
    "payslip_status" "PayrollExternalPayslipStatus" NOT NULL,
    "external_payslip_id" VARCHAR(200),
    "issue_code" VARCHAR(120),
    "issue_summary" TEXT,
    "processed_at" TIMESTAMPTZ(3),
    "released_at" TIMESTAMPTZ(3),
    "legacy_firestore_id" VARCHAR(160),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "payroll_result_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_payslips" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "result_item_id" UUID,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "pay_frequency" VARCHAR(80) NOT NULL,
    "monthly_basic_salary" DECIMAL(18,2),
    "cutoff_basic_pay" DECIMAL(18,2),
    "reference_daily_rate" DECIMAL(18,2),
    "basic_pay" DECIMAL(18,2),
    "gross_pay" DECIMAL(18,2),
    "deductions" JSONB NOT NULL,
    "total_deductions" DECIMAL(18,2),
    "net_pay" DECIMAL(18,2),
    "status" "PayslipStatus" NOT NULL,
    "released_at" TIMESTAMPTZ(3),
    "source" VARCHAR(80) NOT NULL,
    "payroll_reference" VARCHAR(200) NOT NULL,
    "monthly_summary" JSONB NOT NULL,
    "legacy_firestore_id" VARCHAR(160),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "payroll_payslips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounting_transfers" (
    "id" UUID NOT NULL,
    "payroll_result_id" UUID NOT NULL,
    "payroll_batch_id" UUID NOT NULL,
    "payroll_handoff_id" UUID NOT NULL,
    "transfer_reference" VARCHAR(160) NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "period_label" VARCHAR(80) NOT NULL,
    "external_payroll_reference" VARCHAR(200) NOT NULL,
    "employee_count" INTEGER NOT NULL,
    "payroll_result_status" "PayrollExternalResultStatus" NOT NULL,
    "submitted_by_user_id" UUID,
    "submitted_by_snapshot" JSONB NOT NULL,
    "submitted_at" TIMESTAMPTZ(3) NOT NULL,
    "acknowledged_at" TIMESTAMPTZ(3),
    "failed_at" TIMESTAMPTZ(3),
    "transfer_status" "AccountingTransferStatus" NOT NULL,
    "acknowledgement_status" "AccountingAcknowledgementStatus" NOT NULL,
    "external_accounting_reference" VARCHAR(200),
    "provider" VARCHAR(120) NOT NULL,
    "failure_code" VARCHAR(120),
    "failure_summary" TEXT,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "legacy_firestore_id" VARCHAR(160),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "accounting_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" UUID NOT NULL,
    "event_type" VARCHAR(160) NOT NULL,
    "action" VARCHAR(160) NOT NULL,
    "module" VARCHAR(120) NOT NULL,
    "actor_type" "AuditActorType" NOT NULL,
    "actor_user_id" UUID,
    "actor_uid" VARCHAR(128),
    "actor_snapshot" JSONB NOT NULL,
    "target_type" VARCHAR(120) NOT NULL,
    "target_id" VARCHAR(160),
    "target_reference" VARCHAR(200) NOT NULL,
    "target_label" VARCHAR(200) NOT NULL,
    "target_snapshot" JSONB,
    "outcome" "AuditOutcome" NOT NULL,
    "summary" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "source_collection" VARCHAR(120),
    "legacy_document_id" VARCHAR(160),
    "occurred_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" UUID NOT NULL,
    "setting_key" VARCHAR(80) NOT NULL DEFAULT 'runtime',
    "overrides" JSONB NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 0,
    "updated_by_user_id" UUID,
    "updated_by_snapshot" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "application_roles_code_key" ON "application_roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_key_key" ON "permissions"("key");

-- CreateIndex
CREATE INDEX "role_permissions_permission_id_idx" ON "role_permissions"("permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_firebase_uid_key" ON "users"("firebase_uid");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_employee_id_idx" ON "users"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "employees_employee_id_key" ON "employees"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "employees_legacy_firestore_id_key" ON "employees"("legacy_firestore_id");

-- CreateIndex
CREATE INDEX "employees_department_idx" ON "employees"("department");

-- CreateIndex
CREATE INDEX "employees_employment_status_idx" ON "employees"("employment_status");

-- CreateIndex
CREATE UNIQUE INDEX "employee_schedules_legacy_firestore_id_key" ON "employee_schedules"("legacy_firestore_id");

-- CreateIndex
CREATE INDEX "employee_schedules_employee_id_effective_from_idx" ON "employee_schedules"("employee_id", "effective_from");

-- CreateIndex
CREATE UNIQUE INDEX "employee_schedules_employee_id_schedule_id_key" ON "employee_schedules"("employee_id", "schedule_id");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_legacy_firestore_id_key" ON "attendance_records"("legacy_firestore_id");

-- CreateIndex
CREATE INDEX "attendance_records_attendance_date_status_idx" ON "attendance_records"("attendance_date", "status");

-- CreateIndex
CREATE INDEX "attendance_records_attendance_date_time_in_source_idx" ON "attendance_records"("attendance_date", "time_in_source");

-- CreateIndex
CREATE INDEX "attendance_records_hr_verification_status_payroll_readiness_idx" ON "attendance_records"("hr_verification_status", "payroll_readiness_status", "attendance_date");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_employee_id_attendance_date_key" ON "attendance_records"("employee_id", "attendance_date");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_corrections_legacy_firestore_id_key" ON "attendance_corrections"("legacy_firestore_id");

-- CreateIndex
CREATE INDEX "attendance_corrections_status_submitted_at_idx" ON "attendance_corrections"("status", "submitted_at");

-- CreateIndex
CREATE INDEX "attendance_corrections_employee_id_attendance_date_idx" ON "attendance_corrections"("employee_id", "attendance_date");

-- CreateIndex
CREATE INDEX "attendance_corrections_attendance_record_id_idx" ON "attendance_corrections"("attendance_record_id");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_batches_batch_reference_key" ON "payroll_batches"("batch_reference");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_batches_legacy_firestore_id_key" ON "payroll_batches"("legacy_firestore_id");

-- CreateIndex
CREATE INDEX "payroll_batches_updated_at_id_idx" ON "payroll_batches"("updated_at", "id");

-- CreateIndex
CREATE INDEX "payroll_batches_period_start_status_idx" ON "payroll_batches"("period_start", "status");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_batch_items_legacy_firestore_id_key" ON "payroll_batch_items"("legacy_firestore_id");

-- CreateIndex
CREATE INDEX "payroll_batch_items_employee_id_period_start_idx" ON "payroll_batch_items"("employee_id", "period_start");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_batch_items_employee_id_period_start_key" ON "payroll_batch_items"("employee_id", "period_start");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_batch_items_batch_id_employee_period_id_key" ON "payroll_batch_items"("batch_id", "employee_period_id");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_handoffs_batch_id_key" ON "payroll_handoffs"("batch_id");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_handoffs_transfer_reference_key" ON "payroll_handoffs"("transfer_reference");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_handoffs_legacy_firestore_id_key" ON "payroll_handoffs"("legacy_firestore_id");

-- CreateIndex
CREATE INDEX "payroll_handoffs_transfer_status_updated_at_idx" ON "payroll_handoffs"("transfer_status", "updated_at");

-- CreateIndex
CREATE INDEX "payroll_handoffs_acknowledgement_status_updated_at_idx" ON "payroll_handoffs"("acknowledgement_status", "updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_results_handoff_id_key" ON "payroll_results"("handoff_id");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_results_result_reference_key" ON "payroll_results"("result_reference");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_results_legacy_firestore_id_key" ON "payroll_results"("legacy_firestore_id");

-- CreateIndex
CREATE INDEX "payroll_results_batch_id_idx" ON "payroll_results"("batch_id");

-- CreateIndex
CREATE INDEX "payroll_results_status_updated_at_idx" ON "payroll_results"("status", "updated_at");

-- CreateIndex
CREATE INDEX "payroll_results_accounting_readiness_status_updated_at_idx" ON "payroll_results"("accounting_readiness_status", "updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_result_items_legacy_firestore_id_key" ON "payroll_result_items"("legacy_firestore_id");

-- CreateIndex
CREATE INDEX "payroll_result_items_employee_id_period_end_idx" ON "payroll_result_items"("employee_id", "period_end");

-- CreateIndex
CREATE INDEX "payroll_result_items_processing_status_payslip_status_idx" ON "payroll_result_items"("processing_status", "payslip_status");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_result_items_result_id_employee_id_snapshot_key" ON "payroll_result_items"("result_id", "employee_id_snapshot");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_payslips_payroll_reference_key" ON "payroll_payslips"("payroll_reference");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_payslips_legacy_firestore_id_key" ON "payroll_payslips"("legacy_firestore_id");

-- CreateIndex
CREATE INDEX "payroll_payslips_employee_id_period_end_idx" ON "payroll_payslips"("employee_id", "period_end");

-- CreateIndex
CREATE INDEX "payroll_payslips_status_released_at_idx" ON "payroll_payslips"("status", "released_at");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_payslips_employee_id_period_start_period_end_key" ON "payroll_payslips"("employee_id", "period_start", "period_end");

-- CreateIndex
CREATE UNIQUE INDEX "accounting_transfers_payroll_result_id_key" ON "accounting_transfers"("payroll_result_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounting_transfers_transfer_reference_key" ON "accounting_transfers"("transfer_reference");

-- CreateIndex
CREATE UNIQUE INDEX "accounting_transfers_legacy_firestore_id_key" ON "accounting_transfers"("legacy_firestore_id");

-- CreateIndex
CREATE INDEX "accounting_transfers_transfer_status_updated_at_idx" ON "accounting_transfers"("transfer_status", "updated_at");

-- CreateIndex
CREATE INDEX "accounting_transfers_acknowledgement_status_updated_at_idx" ON "accounting_transfers"("acknowledgement_status", "updated_at");

-- CreateIndex
CREATE INDEX "audit_events_occurred_at_id_idx" ON "audit_events"("occurred_at", "id");

-- CreateIndex
CREATE INDEX "audit_events_module_occurred_at_idx" ON "audit_events"("module", "occurred_at");

-- CreateIndex
CREATE INDEX "audit_events_actor_uid_occurred_at_idx" ON "audit_events"("actor_uid", "occurred_at");

-- CreateIndex
CREATE INDEX "audit_events_target_type_target_id_idx" ON "audit_events"("target_type", "target_id");

-- CreateIndex
CREATE UNIQUE INDEX "audit_events_source_collection_legacy_document_id_key" ON "audit_events"("source_collection", "legacy_document_id");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_setting_key_key" ON "system_settings"("setting_key");

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "application_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "application_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_schedules" ADD CONSTRAINT "employee_schedules_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_time_in_operator_user_id_fkey" FOREIGN KEY ("time_in_operator_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_time_out_operator_user_id_fkey" FOREIGN KEY ("time_out_operator_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_hr_verified_by_user_id_fkey" FOREIGN KEY ("hr_verified_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_corrections" ADD CONSTRAINT "attendance_corrections_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_corrections" ADD CONSTRAINT "attendance_corrections_attendance_record_id_fkey" FOREIGN KEY ("attendance_record_id") REFERENCES "attendance_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_corrections" ADD CONSTRAINT "attendance_corrections_submitted_by_user_id_fkey" FOREIGN KEY ("submitted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_corrections" ADD CONSTRAINT "attendance_corrections_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_batches" ADD CONSTRAINT "payroll_batches_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_batches" ADD CONSTRAINT "payroll_batches_submitted_by_user_id_fkey" FOREIGN KEY ("submitted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_batch_items" ADD CONSTRAINT "payroll_batch_items_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "payroll_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_batch_items" ADD CONSTRAINT "payroll_batch_items_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_handoffs" ADD CONSTRAINT "payroll_handoffs_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "payroll_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_handoffs" ADD CONSTRAINT "payroll_handoffs_submitted_by_user_id_fkey" FOREIGN KEY ("submitted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_results" ADD CONSTRAINT "payroll_results_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "payroll_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_results" ADD CONSTRAINT "payroll_results_handoff_id_fkey" FOREIGN KEY ("handoff_id") REFERENCES "payroll_handoffs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_result_items" ADD CONSTRAINT "payroll_result_items_result_id_fkey" FOREIGN KEY ("result_id") REFERENCES "payroll_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_result_items" ADD CONSTRAINT "payroll_result_items_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_payslips" ADD CONSTRAINT "payroll_payslips_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_payslips" ADD CONSTRAINT "payroll_payslips_result_item_id_fkey" FOREIGN KEY ("result_item_id") REFERENCES "payroll_result_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_transfers" ADD CONSTRAINT "accounting_transfers_payroll_result_id_fkey" FOREIGN KEY ("payroll_result_id") REFERENCES "payroll_results"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_transfers" ADD CONSTRAINT "accounting_transfers_payroll_batch_id_fkey" FOREIGN KEY ("payroll_batch_id") REFERENCES "payroll_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_transfers" ADD CONSTRAINT "accounting_transfers_payroll_handoff_id_fkey" FOREIGN KEY ("payroll_handoff_id") REFERENCES "payroll_handoffs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounting_transfers" ADD CONSTRAINT "accounting_transfers_submitted_by_user_id_fkey" FOREIGN KEY ("submitted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Protect invariants that cannot be expressed in the Prisma data model.
ALTER TABLE "attendance_records"
  ADD CONSTRAINT "attendance_records_time_order_check"
  CHECK ("time_out" IS NULL OR "time_out" >= "time_in");

ALTER TABLE "employee_schedules"
  ADD CONSTRAINT "employee_schedules_effective_date_check"
  CHECK ("effective_to" IS NULL OR "effective_from" IS NULL OR "effective_to" >= "effective_from");

ALTER TABLE "attendance_corrections"
  ADD CONSTRAINT "attendance_corrections_review_state_check"
  CHECK (
    ("status" = 'pending' AND "reviewed_at" IS NULL)
    OR ("status" IN ('approved', 'rejected') AND "reviewed_at" IS NOT NULL)
  );

ALTER TABLE "payroll_batches"
  ADD CONSTRAINT "payroll_batches_counts_check"
  CHECK ("record_count" >= 0 AND "blocked_count" >= 0 AND "blocked_count" <= "record_count");

ALTER TABLE "payroll_handoffs"
  ADD CONSTRAINT "payroll_handoffs_attempt_count_check"
  CHECK ("attempt_count" >= 0);

ALTER TABLE "payroll_results"
  ADD CONSTRAINT "payroll_results_counts_check"
  CHECK (
    "employee_count" >= 0
    AND "processed_count" >= 0
    AND "pending_count" >= 0
    AND "rejected_count" >= 0
    AND "failed_count" >= 0
    AND "payslip_available_count" >= 0
  );

ALTER TABLE "accounting_transfers"
  ADD CONSTRAINT "accounting_transfers_attempt_count_check"
  CHECK ("attempt_count" >= 0);

-- Application tables are server-only. RLS is enabled without browser policies;
-- the server-side Prisma role remains the only application data path.
ALTER TABLE "application_roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "permissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "role_permissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "employees" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "employee_schedules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "attendance_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "attendance_corrections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payroll_batches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payroll_batch_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payroll_handoffs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payroll_results" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payroll_result_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payroll_payslips" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "accounting_transfers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "system_settings" ENABLE ROW LEVEL SECURITY;

-- Canonical role and permission reference data is safe schema-level seed data;
-- no employees, attendance, Payroll, Accounting, or audit business rows are
-- inserted here.
INSERT INTO "application_roles" ("id", "code", "label", "description", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'admin', 'IT Administrator', 'Technical integration administration and application access control.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'hr', 'HR / Attendance Staff', 'Attendance operations, employee references, and HR review workflows.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'employee', 'Employee', 'Self-service access to personal attendance, profile, and payslip views.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'payroll', 'Payroll Staff', 'Payroll readiness, batch, handoff, result, and history workflows.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'accounting', 'Accounting Staff', 'Approved Payroll review and Accounting transfer workflows.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "permissions" ("id", "key", "label", "description", "category", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'employee.dashboard.view', 'View Employee Dashboard', 'Open the signed-in employee dashboard.', 'Employee Self-Service', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'employee.attendance.view_own', 'View Own Attendance', 'Review the signed-in employee attendance summary.', 'Employee Self-Service', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'employee.attendance.history.view_own', 'View Own Attendance History', 'Review personal attendance records and details.', 'Employee Self-Service', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'employee.attendance_qr.view_own', 'View Own Attendance QR', 'View the signed-in employee attendance QR code.', 'Employee Self-Service', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'employee.payslip.view_own', 'View Own Payslip', 'View payroll snapshots belonging to the signed-in employee.', 'Employee Self-Service', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'employee.profile.view_own', 'View Own Profile', 'Review the signed-in employee profile reference.', 'Employee Self-Service', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'hr.dashboard.view', 'View HR Dashboard', 'Open the HR attendance operations dashboard.', 'HR & Attendance', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'hr.attendance.view', 'View Attendance Monitoring', 'Review persisted attendance records across employees.', 'HR & Attendance', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'hr.attendance.reports.view', 'View Attendance Reports', 'Generate read-only attendance reports.', 'HR & Attendance', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'hr.correction.view', 'View Correction Requests', 'Review submitted attendance correction requests.', 'HR & Attendance', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'hr.correction.review', 'Review Correction Requests', 'Approve or reject attendance correction requests.', 'HR & Attendance', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'hr.attendance.verify', 'Verify Attendance', 'Perform final HR attendance verification for payroll readiness.', 'HR & Attendance', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'hr.attendance.scan', 'Scan Attendance QR', 'Use the authorized attendance scanner for HR operations.', 'HR & Attendance', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'hr.employee_directory.view', 'View Employee Directory', 'Review read-only Employee/HRPS references.', 'HR & Attendance', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'hr.schedule.view', 'View Employee Schedules', 'Review read-only employee schedule references.', 'HR & Attendance', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'hr.schedule.manage', 'Manage Employee Schedules', 'Manage supported employee schedule references.', 'HR & Attendance', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'hr.audit_history.view', 'View HR Audit History', 'Review persisted HR attendance and correction activity.', 'HR & Attendance', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'payroll.dashboard.view', 'View Payroll Dashboard', 'Open the Payroll Staff dashboard.', 'Payroll Integration', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'payroll.verified_attendance.view', 'View Verified Attendance', 'Review HR-verified attendance ready for payroll.', 'Payroll Integration', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'payroll.batch.view', 'View Payroll Batches', 'Review Payroll handoff batches.', 'Payroll Integration', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'payroll.batch.manage', 'Manage Payroll Batches', 'Create, edit, and transition eligible Payroll batches.', 'Payroll Integration', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'payroll.handoff.view', 'View Payroll Handoff', 'Review Payroll transfer and acknowledgement status.', 'Payroll Integration', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'payroll.handoff.submit', 'Submit Payroll Handoff', 'Submit eligible Payroll batches to the configured adapter.', 'Payroll Integration', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'payroll.result.view', 'View Payroll Results', 'Review Payroll results returned by the configured adapter.', 'Payroll Integration', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'payroll.history.view', 'View Payroll History', 'Review read-only Payroll lifecycle history.', 'Payroll Integration', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'accounting.dashboard.view', 'View Accounting Dashboard', 'Open the Accounting Staff dashboard.', 'Accounting Integration', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'accounting.approved_payroll.view', 'View Approved Payroll', 'Review Payroll results prepared for Accounting.', 'Accounting Integration', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'accounting.transfer.view', 'View Accounting Transfers', 'Review Accounting transfer and acknowledgement status.', 'Accounting Integration', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'accounting.transfer.submit', 'Submit Accounting Transfer', 'Submit eligible Payroll results to the Accounting adapter.', 'Accounting Integration', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'accounting.history.view', 'View Accounting History', 'Review read-only Accounting transfer history.', 'Accounting Integration', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'admin.dashboard.view', 'View Admin Dashboard', 'Open the IT Administrator integration control center.', 'Integration Monitoring', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'admin.integration_monitoring.view', 'View Integration Monitoring', 'Review source and downstream integration health.', 'Integration Monitoring', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'admin.integration_monitoring.retry', 'Retry Integration Errors', 'Run an authorized retry for eligible technical integration errors.', 'Integration Monitoring', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'admin.user_accounts.view', 'View User Accounts', 'Review Firebase identities and application profiles.', 'User Administration', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'admin.user_accounts.manage', 'Manage User Accounts', 'Create and manage application accounts and role assignments.', 'User Administration', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'admin.roles_permissions.view', 'View Roles & Permissions', 'Review the controlled role and permission catalog.', 'Security & Permissions', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'admin.roles_permissions.manage', 'Manage Roles & Permissions', 'Update persisted role-permission assignments.', 'Security & Permissions', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'admin.audit_logs.view', 'View Audit Logs', 'Review application audit activity.', 'Audit & Logs', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'admin.settings.view', 'View System Settings', 'Review application settings.', 'System Settings', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'admin.settings.manage', 'Manage System Settings', 'Update supported application settings.', 'System Settings', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "role_permissions" ("role_id", "permission_id", "version", "updated_at")
SELECT roles."id", permissions."id", 1, CURRENT_TIMESTAMP
FROM "application_roles" AS roles
JOIN "permissions" AS permissions
  ON permissions."key" LIKE CASE roles."code"
    WHEN 'admin'::"ApplicationRoleCode" THEN 'admin.%'
    WHEN 'hr'::"ApplicationRoleCode" THEN 'hr.%'
    WHEN 'employee'::"ApplicationRoleCode" THEN 'employee.%'
    WHEN 'payroll'::"ApplicationRoleCode" THEN 'payroll.%'
    WHEN 'accounting'::"ApplicationRoleCode" THEN 'accounting.%'
  END
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
