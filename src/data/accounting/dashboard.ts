import type { Metric, StatusTone } from "@/types/ui";

export type AccountingPayrollBatch = {
  payrollPeriod: string;
  payrollReference: string;
  employeeCount: string;
  approvedAmount: string;
  approvalStatus: string;
  approvalTone: StatusTone;
  accountingStatus: string;
  accountingTone: StatusTone;
  transferReference: string;
  updatedAt: string;
  detail: string;
};

export type AccountingHealthItem = {
  name: string;
  detail: string;
  status: string;
  tone: StatusTone;
  lastChecked: string;
};

export type AccountingActivityItem = {
  time: string;
  event: string;
  detail: string;
  tone: StatusTone;
  icon: "check" | "clock" | "warning" | "info";
};

export const accountingSummaryMetrics: Metric[] = [
  {
    label: "Approved payroll",
    value: "4 batches",
    note: "Available from payroll",
    icon: "payroll",
    tone: "info",
  },
  {
    label: "Ready for transfer",
    value: "1 batch",
    note: "Awaiting accounting handoff",
    icon: "arrow",
    tone: "warning",
  },
  {
    label: "Successfully transferred",
    value: "2 batches",
    note: "Transfer history confirmed",
    icon: "check",
    tone: "success",
  },
  {
    label: "Integration issues",
    value: "1 batch",
    note: "Requires review",
    icon: "warning",
    tone: "danger",
  },
];

export const accountingPayrollBatches: AccountingPayrollBatch[] = [
  {
    payrollPeriod: "Aug 16–31, 2026",
    payrollReference: "PAY-2026-016",
    employeeCount: "86 employees",
    approvedAmount: "₱482,650.00",
    approvalStatus: "Approved",
    approvalTone: "success",
    accountingStatus: "Ready for Transfer",
    accountingTone: "info",
    transferReference: "Not transferred",
    updatedAt: "Today · 10:18 AM",
    detail: "Approved payroll is ready for the next accounting integration handoff.",
  },
  {
    payrollPeriod: "Aug 1–15, 2026",
    payrollReference: "PAY-2026-015",
    employeeCount: "85 employees",
    approvedAmount: "₱476,820.00",
    approvalStatus: "Approved",
    approvalTone: "success",
    accountingStatus: "Transferred",
    accountingTone: "success",
    transferReference: "ACC-TXN-1041",
    updatedAt: "Sep 30, 2026 · 4:20 PM",
    detail: "The transfer was accepted by the simulated accounting integration service.",
  },
  {
    payrollPeriod: "Jul 16–31, 2026",
    payrollReference: "PAY-2026-014",
    employeeCount: "84 employees",
    approvedAmount: "₱469,500.00",
    approvalStatus: "Approved",
    approvalTone: "success",
    accountingStatus: "Transferred",
    accountingTone: "success",
    transferReference: "ACC-TXN-1038",
    updatedAt: "Sep 16, 2026 · 3:06 PM",
    detail: "The approved payroll batch completed the simulated accounting transfer.",
  },
  {
    payrollPeriod: "Jul 1–15, 2026",
    payrollReference: "PAY-2026-013",
    employeeCount: "84 employees",
    approvedAmount: "₱465,900.00",
    approvalStatus: "Approved",
    approvalTone: "success",
    accountingStatus: "Transfer Failed",
    accountingTone: "danger",
    transferReference: "ACC-TXN-1035",
    updatedAt: "Sep 2, 2026 · 11:42 AM",
    detail: "The simulated transfer requires review because validation did not complete.",
  },
  {
    payrollPeriod: "Jun 16–30, 2026",
    payrollReference: "PAY-2026-012",
    employeeCount: "82 employees",
    approvedAmount: "₱451,200.00",
    approvalStatus: "Pending Approval",
    approvalTone: "warning",
    accountingStatus: "Pending",
    accountingTone: "warning",
    transferReference: "Not available",
    updatedAt: "Aug 30, 2026 · 2:15 PM",
    detail: "This batch is not eligible for accounting transfer until payroll approval is complete.",
  },
];

export const accountingHealth: AccountingHealthItem[] = [
  {
    name: "Existing Payroll System",
    detail: "Approved payroll source",
    status: "Connected · Simulated",
    tone: "info",
    lastChecked: "Today · 10:42 AM",
  },
  {
    name: "Accounting Integration Service",
    detail: "Transfer validation boundary",
    status: "Operational · Simulated",
    tone: "success",
    lastChecked: "Today · 10:42 AM",
  },
  {
    name: "Existing Accounting System",
    detail: "External destination",
    status: "Awaiting latest transfer",
    tone: "warning",
    lastChecked: "Today · 10:42 AM",
  },
  {
    name: "Last synchronization",
    detail: "Latest integration checkpoint",
    status: "Today · 10:42 AM",
    tone: "info",
    lastChecked: "No live connection",
  },
];

export const accountingActivities: AccountingActivityItem[] = [
  {
    time: "10:42 AM",
    event: "Payroll PAY-2026-015 transfer recorded",
    detail: "Accounting integration service accepted the simulated transfer.",
    tone: "success",
    icon: "check",
  },
  {
    time: "10:18 AM",
    event: "Payroll PAY-2026-016 marked ready",
    detail: "Approved payroll information is waiting for the next handoff.",
    tone: "info",
    icon: "clock",
  },
  {
    time: "9:55 AM",
    event: "Transfer ACC-TXN-1035 needs review",
    detail: "The simulated transfer did not pass validation.",
    tone: "danger",
    icon: "warning",
  },
  {
    time: "Yesterday",
    event: "Accounting synchronization completed",
    detail: "The latest deterministic integration snapshot was refreshed.",
    tone: "muted",
    icon: "info",
  },
];

export const latestApprovedPayroll = accountingPayrollBatches[0];
