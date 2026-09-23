import type { Metric, NavigationItem } from "@/types/ui";

export const adminNavigation: NavigationItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/admin/dashboard", icon: "dashboard" },
  { id: "integration-monitoring", label: "Integration Monitoring", href: "/admin/integration-monitoring", icon: "monitoring" },
  { id: "hrps-integration", label: "HRPS Integration", href: "/admin/hrps-integration", icon: "hrps" },
  { id: "bundy-biometric-etl", label: "Bundy / Biometric ETL", href: "/admin/bundy-biometric-etl", icon: "bundy" },
  { id: "qr-attendance", label: "QR Attendance", href: "/admin/qr-attendance", icon: "qr" },
  { id: "unified-attendance", label: "Unified Attendance", href: "/admin/unified-attendance", icon: "unified" },
  { id: "payroll-integration", label: "Payroll Integration", href: "/admin/payroll-integration", icon: "payroll" },
  { id: "accounting-integration", label: "Accounting Integration", href: "/admin/accounting-integration", icon: "accounting" },
  { id: "integration-errors", label: "Integration Errors", href: "/admin/integration-errors", icon: "errors" },
  { id: "user-accounts", label: "User Accounts", icon: "users" },
  { id: "roles-permissions", label: "Roles & Permissions", icon: "roles" },
  { id: "audit-logs", label: "Audit Logs", icon: "audit" },
  { id: "system-settings", label: "System Settings", icon: "settings" },
];

export const dashboardMetrics: Metric[] = [
  { label: "Connected Systems", value: "5 / 6", note: "Systems Online", icon: "monitoring", tone: "info" },
  { label: "Successful Syncs", value: "1,248", note: "Successful records", icon: "check", tone: "success" },
  { label: "Failed Transfers", value: "3", note: "Needs Attention", icon: "warning", tone: "danger" },
  { label: "Pending Syncs", value: "14", note: "Waiting", icon: "clock", tone: "warning" },
  { label: "Integration Errors", value: "2", note: "Open Issues", icon: "errors", tone: "danger" },
  { label: "Active Users", value: "86", note: "Currently Active", icon: "users", tone: "info" },
];

export const integrationHealth = [
  { name: "HRPS", purpose: "Official employee information source", detail: "Employee Master Data", status: "Online", tone: "success", lastSync: "2 minutes ago" },
  { name: "Bundy / Biometric ETL", purpose: "Attendance source ingestion", detail: "Attendance Log Import", status: "Online", tone: "success", lastSync: "5 minutes ago" },
  { name: "QR Attendance", purpose: "Additional attendance source", detail: "Additional Attendance Source", status: "Online", tone: "success", lastSync: "Live" },
  { name: "Unified Attendance", purpose: "Standardized internal attendance data", detail: "Standardized Attendance Records", status: "Online", tone: "success", lastSync: "1 minute ago" },
  { name: "Existing Payroll System", purpose: "External downstream system", detail: "Verified Attendance Transfer", status: "Warning", tone: "warning", lastSync: "18 minutes ago" },
  { name: "Existing Accounting System", purpose: "External downstream system", detail: "Approved Payroll Synchronization", status: "Online", tone: "success", lastSync: "12 minutes ago" },
] as const;

export const synchronizationEvents = [
  { time: "10:42 AM", source: "Bundy ETL", destination: "Unified Attendance", operation: "Attendance logs imported", records: "84 records", duration: "1.8s", status: "Success", tone: "success" },
  { time: "10:38 AM", source: "HRPS", destination: "Integration Layer", operation: "Employee data synchronization", records: "12 records", duration: "0.9s", status: "Success", tone: "success" },
  { time: "10:31 AM", source: "Unified Attendance", destination: "Existing Payroll", operation: "Verified attendance transfer", records: "42 records", duration: "—", status: "Failed", tone: "danger" },
  { time: "10:25 AM", source: "QR Attendance", destination: "Unified Attendance", operation: "QR attendance synchronization", records: "18 records", duration: "0.5s", status: "Success", tone: "success" },
  { time: "10:18 AM", source: "Integration Layer", destination: "Unified Attendance", operation: "Validation queue", records: "3 records", duration: "—", status: "Pending", tone: "warning" },
] as const;

export const adminIssues = [
  { title: "Payroll Integration", message: "Connection timeout while sending verified attendance.", time: "10:31 AM", status: "Failed", tone: "danger" },
  { title: "Bundy / Biometric ETL", message: "3 attendance records could not be matched to HRPS IDs.", time: "09:58 AM", status: "Warning", tone: "warning" },
  { title: "Integration Layer", message: "One pending audit event has exceeded its processing window.", time: "09:44 AM", status: "Pending", tone: "warning" },
] as const;

export const auditEvents = [
  { event: "Administrator retried Payroll synchronization.", actor: "IT Administrator", time: "10:34 AM" },
  { event: "Role permission updated for Attendance Staff.", actor: "IT Administrator", time: "10:12 AM" },
  { event: "Bundy ETL completed with 326 records.", actor: "Integration Layer", time: "09:58 AM" },
  { event: "User account activated.", actor: "IT Administrator", time: "09:41 AM" },
] as const;

export const activityEvents = [
  { time: "10:42 AM", source: "Bundy ETL", destination: "Unified Attendance", operation: "Attendance Import", records: "84", duration: "1.8s", status: "Success", tone: "success" },
  { time: "10:38 AM", source: "HRPS", destination: "Integration Layer", operation: "Employee Sync", records: "12", duration: "0.9s", status: "Success", tone: "success" },
  { time: "10:31 AM", source: "Unified Attendance", destination: "Existing Payroll", operation: "Verified Attendance Transfer", records: "42", duration: "—", status: "Failed", tone: "danger" },
  { time: "10:25 AM", source: "QR Attendance", destination: "Unified Attendance", operation: "Attendance Sync", records: "18", duration: "0.5s", status: "Success", tone: "success" },
  { time: "10:18 AM", source: "Integration Layer", destination: "Unified Attendance", operation: "Validation Queue", records: "3", duration: "—", status: "Pending", tone: "warning" },
  { time: "09:58 AM", source: "Bundy ETL", destination: "Integration Layer", operation: "Employee ID Match Review", records: "3", duration: "0.7s", status: "Warning", tone: "warning" },
] as const;

export const hrpsEmployees = [
  { id: "AU-EMP-2026-001", employee: "John Benedict M. Villegas", department: "Information Technology", position: "Office Staff", employment: "Active", result: "Updated", time: "10:38 AM" },
  { id: "AU-EMP-2026-014", employee: "Maria Santos", department: "Human Resources", position: "HR Staff", employment: "Active", result: "No Change", time: "10:38 AM" },
  { id: "AU-EMP-2026-087", employee: "Robert Cruz", department: "Administration", position: "Office Support", employment: "Inactive", result: "Updated", time: "10:38 AM" },
  { id: "AU-EMP-2026-233", employee: "Example Employee", department: "Office Support", position: "—", employment: "Active", result: "Needs Review", time: "10:38 AM" },
] as const;

export const bundyLogs = [
  { timestamp: "Sep 15, 2026 7:24 AM", deviceId: "EMP-00418", employeeId: "AU-EMP-2026-0418", device: "Main Office Device", event: "Time In", match: "Matched", processing: "Processed" },
  { timestamp: "Sep 15, 2026 7:31 AM", deviceId: "EMP-00194", employeeId: "AU-EMP-2026-0194", device: "Main Office Device", event: "Time In", match: "Matched", processing: "Processed" },
  { timestamp: "Sep 15, 2026 7:36 AM", deviceId: "TEMP-091", employeeId: "—", device: "Main Office Device", event: "Time In", match: "Unmatched", processing: "Needs Review" },
  { timestamp: "Sep 15, 2026 7:32 AM", deviceId: "EMP-00014", employeeId: "AU-EMP-2026-0014", device: "Main Office Device", event: "Time In", match: "Duplicate", processing: "Needs Review" },
  { timestamp: "Sep 15, 2026 8:02 AM", deviceId: "EMP-00271", employeeId: "AU-EMP-2026-0271", device: "Administration Device", event: "Time Out", match: "Matched", processing: "Failed" },
] as const;

export const qrEvents = [
  { time: "7:24 AM", employeeId: "AU-EMP-2026-0418", employee: "John Benedict M. Villegas", station: "QR-STATION-01", event: "Time In", validation: "Valid", processing: "Processed" },
  { time: "7:31 AM", employeeId: "AU-EMP-2026-0194", employee: "Maria Santos", station: "QR-STATION-01", event: "Time In", validation: "Valid", processing: "Processed" },
  { time: "7:42 AM", employeeId: "AU-EMP-2026-0332", employee: "Robert Cruz", station: "QR-STATION-02", event: "Time In", validation: "Duplicate", processing: "Needs Review" },
  { time: "7:46 AM", employeeId: "UNKNOWN", employee: "—", station: "QR-STATION-02", event: "Scan", validation: "Invalid QR", processing: "Rejected" },
  { time: "7:49 AM", employeeId: "AU-EMP-2026-0087", employee: "Inactive Employee", station: "QR-STATION-03", event: "Time In", validation: "Inactive Employee", processing: "Rejected" },
] as const;

export const unifiedRecords = [
  { employeeId: "AU-EMP-2026-0418", employee: "John Benedict M. Villegas", date: "Sep 16, 2026", timeIn: "7:24 AM", timeOut: "5:03 PM", source: "Bundy", validation: "Valid", processing: "Processed" },
  { employeeId: "AU-EMP-2026-0194", employee: "Maria Santos", date: "Sep 16, 2026", timeIn: "7:31 AM", timeOut: "5:08 PM", source: "QR", validation: "Valid", processing: "Processed" },
  { employeeId: "AU-EMP-2026-0332", employee: "Robert Cruz", date: "Sep 16, 2026", timeIn: "7:42 AM", timeOut: "—", source: "QR", validation: "Missing Time-Out", processing: "Needs Review" },
  { employeeId: "AU-EMP-2026-0177", employee: "Ana Reyes", date: "Sep 16, 2026", timeIn: "—", timeOut: "5:04 PM", source: "Bundy", validation: "Missing Time-In", processing: "Needs Review" },
  { employeeId: "AU-EMP-2026-0087", employee: "Inactive Employee", date: "Sep 16, 2026", timeIn: "7:49 AM", timeOut: "—", source: "Bundy", validation: "Inactive Employee", processing: "Not Ready" },
] as const;
