import type { AdminAuditOutcome } from "@/types/admin-audit-logs";

export type AuditEventDefinition = {
  eventType: string;
  action: string;
  module: string;
  defaultOutcome: AdminAuditOutcome;
};

export const auditEventRegistry: readonly AuditEventDefinition[] = [
  { eventType: "hr.correction.approved", action: "Attendance Correction Approved", module: "Correction Requests", defaultOutcome: "Successful" },
  { eventType: "hr.correction.rejected", action: "Attendance Correction Rejected", module: "Correction Requests", defaultOutcome: "Blocked" },
  { eventType: "hr.attendance.verified", action: "Attendance Final Verified", module: "Unified Attendance", defaultOutcome: "Successful" },
  { eventType: "payroll.batch.created", action: "Payroll Batch Created", module: "Payroll Batches", defaultOutcome: "Successful" },
  { eventType: "payroll.batch.updated", action: "Payroll Batch Updated", module: "Payroll Batches", defaultOutcome: "Successful" },
  { eventType: "payroll.handoff.submitted", action: "Payroll Handoff Submitted", module: "Payroll Integration", defaultOutcome: "Successful" },
  { eventType: "payroll.handoff.failed", action: "Payroll Handoff Failed", module: "Payroll Integration", defaultOutcome: "Failed" },
  { eventType: "payroll.handoff.acknowledged", action: "Payroll Handoff Acknowledged", module: "Payroll Integration", defaultOutcome: "Successful" },
  { eventType: "payroll.result.received", action: "Payroll Result Received", module: "Payroll Integration", defaultOutcome: "Successful" },
  { eventType: "accounting.transfer.created", action: "Accounting Transfer Created", module: "Accounting Integration", defaultOutcome: "Successful" },
  { eventType: "accounting.eligibility.evaluated", action: "Accounting Eligibility Evaluated", module: "Accounting Integration", defaultOutcome: "Successful" },
  { eventType: "accounting.transfer.preparation_blocked", action: "Accounting Transfer Preparation Blocked", module: "Accounting Integration", defaultOutcome: "Blocked" },
  { eventType: "accounting.transfer.prepared", action: "Accounting Transfer Prepared", module: "Accounting Integration", defaultOutcome: "Successful" },
  { eventType: "accounting.transfer.submitted", action: "Accounting Transfer Submitted", module: "Accounting Integration", defaultOutcome: "Successful" },
  { eventType: "accounting.transfer.acknowledged", action: "Accounting Acknowledged", module: "Accounting Integration", defaultOutcome: "Successful" },
  { eventType: "accounting.transfer.rejected", action: "Accounting Transfer Rejected", module: "Accounting Integration", defaultOutcome: "Blocked" },
  { eventType: "accounting.transfer.failed", action: "Accounting Transfer Failed", module: "Accounting Integration", defaultOutcome: "Failed" },
  { eventType: "admin.user.created", action: "User Account Created", module: "User Accounts", defaultOutcome: "Successful" },
  { eventType: "admin.user.profile_updated", action: "User Account Updated", module: "User Accounts", defaultOutcome: "Successful" },
  { eventType: "admin.user.role_changed", action: "User Role Changed", module: "User Accounts", defaultOutcome: "Successful" },
  { eventType: "admin.user.enabled", action: "User Account Enabled", module: "User Accounts", defaultOutcome: "Successful" },
  { eventType: "admin.user.disabled", action: "User Account Disabled", module: "User Accounts", defaultOutcome: "Successful" },
  { eventType: "admin.user.deleted", action: "User Account Deleted", module: "User Accounts", defaultOutcome: "Successful" },
  { eventType: "admin.role_permissions.updated", action: "Role Permissions Updated", module: "Roles & Permissions", defaultOutcome: "Successful" },
  { eventType: "admin.settings.updated", action: "System Settings Updated", module: "System Settings", defaultOutcome: "Successful" },
  { eventType: "employee.demo_attendance_settings.updated", action: "Employee Demo Attendance Settings Updated", module: "Employee Attendance", defaultOutcome: "Successful" },
  { eventType: "employee.demo_qr_attendance.reset", action: "Employee Demo QR Attendance Reset", module: "Employee Attendance", defaultOutcome: "Successful" },
  { eventType: "bundy.import.completed", action: "Bundy Import Completed", module: "Bundy Integration", defaultOutcome: "Successful" },
  { eventType: "bundy.import.failed", action: "Bundy Import Failed", module: "Bundy Integration", defaultOutcome: "Failed" },
  { eventType: "bundy.import.rolled_back", action: "Bundy Import Rolled Back", module: "Bundy Integration", defaultOutcome: "Successful" },
  { eventType: "bundy.import.rollback_blocked", action: "Bundy Import Rollback Blocked", module: "Bundy Integration", defaultOutcome: "Blocked" },
  { eventType: "bundy.import.rollback_failed", action: "Bundy Import Rollback Failed", module: "Bundy Integration", defaultOutcome: "Failed" },
];

export function getAuditEventDefinition(eventType: string) {
  return auditEventRegistry.find((event) => event.eventType === eventType) ?? null;
}
