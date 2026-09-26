import type { IconName, Metric, StatusTone } from "@/types/ui";

export type PayrollRebuildStatus = {
  label: string;
  tone: StatusTone;
};

export type PayrollRebuildHealthItem = {
  label: string;
  detail: string;
  status: string;
  tone: StatusTone;
};

export type PayrollRebuildAttendanceRecord = {
  employeeId: string;
  employee: string;
  department: string;
  records: string;
  verification: PayrollRebuildStatus;
  readiness: PayrollRebuildStatus;
  transfer: PayrollRebuildStatus;
};

export type PayrollRebuildTransferEvent = {
  time: string;
  batch: string;
  records: string;
  operation: string;
  status: PayrollRebuildStatus;
  detail: string;
};

export type PayrollRebuildIssue = {
  title: string;
  detail: string;
  time: string;
  status: string;
  tone: Extract<StatusTone, "warning" | "danger">;
};

export type PayrollRebuildFlowNode = {
  label: string;
  detail: string;
  icon: IconName;
  status: string;
  tone: StatusTone;
};

export const payrollRebuildMetrics: readonly Metric[] = [
  {
    label: "Ready records",
    value: "232",
    note: "Verified for transfer",
    icon: "check",
    tone: "success",
  },
  {
    label: "Held records",
    value: "8",
    note: "Review before transfer",
    icon: "warning",
    tone: "warning",
  },
  {
    label: "Last transfer",
    value: "232",
    note: "Records acknowledged",
    icon: "payroll",
    tone: "info",
  },
  {
    label: "Transfer health",
    value: "98.4%",
    note: "Last 24 hours",
    icon: "monitoring",
    tone: "success",
  },
];

export const payrollRebuildHealth: readonly PayrollRebuildHealthItem[] = [
  {
    label: "Unified Attendance",
    detail: "Verified attendance source",
    status: "Ready",
    tone: "success",
  },
  {
    label: "Payroll payload",
    detail: "Attendance fields mapped for review",
    status: "Prepared",
    tone: "info",
  },
  {
    label: "Existing Payroll System",
    detail: "External downstream boundary",
    status: "Simulated",
    tone: "muted",
  },
];

export const payrollRebuildReadiness = [
  {
    label: "Attendance verification",
    value: "232 / 240 records",
    percent: 97,
    tone: "success" as const,
  },
  {
    label: "Employee ID matching",
    value: "238 / 240 records",
    percent: 99,
    tone: "success" as const,
  },
  {
    label: "Records cleared for transfer",
    value: "232 / 240 records",
    percent: 97,
    tone: "success" as const,
  },
  {
    label: "Held for review",
    value: "8 records",
    percent: 8,
    tone: "warning" as const,
  },
];

export const payrollRebuildFlow: readonly PayrollRebuildFlowNode[] = [
  {
    label: "Unified Attendance",
    detail: "Verified records",
    icon: "unified",
    status: "Ready",
    tone: "success",
  },
  {
    label: "Validation",
    detail: "Required fields",
    icon: "shield",
    status: "Checked",
    tone: "success",
  },
  {
    label: "Payroll payload",
    detail: "Mapped fields",
    icon: "file",
    status: "Prepared",
    tone: "info",
  },
  {
    label: "Existing Payroll",
    detail: "External system",
    icon: "payroll",
    status: "Simulated",
    tone: "muted",
  },
  {
    label: "Acknowledgement",
    detail: "Transfer result",
    icon: "check",
    status: "Tracked",
    tone: "info",
  },
];

export const payrollRebuildAttendance: readonly PayrollRebuildAttendanceRecord[] = [
  {
    employeeId: "AU-EMP-2026-001",
    employee: "John Benedict M. Villegas",
    department: "Information Technology",
    records: "22",
    verification: { label: "Verified", tone: "success" },
    readiness: { label: "Ready", tone: "success" },
    transfer: { label: "Queued", tone: "warning" },
  },
  {
    employeeId: "AU-EMP-2026-014",
    employee: "Maria Santos",
    department: "Human Resources",
    records: "20",
    verification: { label: "Verified", tone: "success" },
    readiness: { label: "Ready", tone: "success" },
    transfer: { label: "Acknowledged", tone: "success" },
  },
  {
    employeeId: "AU-EMP-2026-087",
    employee: "Robert Cruz",
    department: "Administration",
    records: "18",
    verification: { label: "Verified", tone: "success" },
    readiness: { label: "Ready", tone: "success" },
    transfer: { label: "Acknowledged", tone: "success" },
  },
  {
    employeeId: "AU-EMP-2026-233",
    employee: "Example Employee",
    department: "Office Support",
    records: "16",
    verification: { label: "Needs review", tone: "warning" },
    readiness: { label: "Held", tone: "warning" },
    transfer: { label: "Not sent", tone: "danger" },
  },
];

export const payrollRebuildIssues: readonly PayrollRebuildIssue[] = [
  {
    title: "Held records",
    detail: "Eight attendance records still require validation or correction review before transfer.",
    time: "Updated 10:42 AM",
    status: "Review required",
    tone: "warning",
  },
  {
    title: "Retry queue",
    detail: "One simulated batch acknowledgement is pending after a downstream connection timeout.",
    time: "Updated 10:40 AM",
    status: "Retry available",
    tone: "danger",
  },
];

export const payrollRebuildTransfers: readonly PayrollRebuildTransferEvent[] = [
  {
    time: "10:42 AM",
    batch: "PAY-2026-09-A",
    records: "232 records",
    operation: "Attendance transfer",
    status: { label: "Acknowledged", tone: "success" },
    detail: "Existing Payroll System acknowledgement received",
  },
  {
    time: "10:40 AM",
    batch: "PAY-2026-09-B",
    records: "16 records",
    operation: "Attendance transfer",
    status: { label: "Failed", tone: "danger" },
    detail: "Connection timeout · retry available",
  },
  {
    time: "10:35 AM",
    batch: "PAY-2026-09-C",
    records: "8 records",
    operation: "Payload validation",
    status: { label: "Pending", tone: "warning" },
    detail: "Held records remain outside the transfer payload",
  },
];
