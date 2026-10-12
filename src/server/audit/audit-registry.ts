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
  { eventType: "accounting.transfer.submitted", action: "Accounting Transfer Submitted", module: "Accounting Integration", defaultOutcome: "Successful" },
  { eventType: "accounting.transfer.acknowledged", action: "Accounting Acknowledged", module: "Accounting Integration", defaultOutcome: "Successful" },
  { eventType: "accounting.transfer.rejected", action: "Accounting Transfer Rejected", module: "Accounting Integration", defaultOutcome: "Blocked" },
  { eventType: "accounting.transfer.failed", action: "Accounting Transfer Failed", module: "Accounting Integration", defaultOutcome: "Failed" },
  { eventType: "admin.user.created", action: "User Account Created", module: "User Accounts", defaultOutcome: "Successful" },
  { eventType: "admin.user.profile_updated", action: "User Account Updated", module: "User Accounts", defaultOutcome: "Successful" },
  { eventType: "admin.user.enabled", action: "User Account Enabled", module: "User Accounts", defaultOutcome: "Successful" },
  { eventType: "admin.user.disabled", action: "User Account Disabled", module: "User Accounts", defaultOutcome: "Successful" },
  { eventType: "admin.role_permissions.updated", action: "Role Permissions Updated", module: "Roles & Permissions", defaultOutcome: "Successful" },
];

export function getAuditEventDefinition(eventType: string) {
  return auditEventRegistry.find((event) => event.eventType === eventType) ?? null;
}
