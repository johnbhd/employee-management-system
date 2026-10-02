import type { Metric, StatusTone, IconName } from "@/types/ui";

export type AccountingIntegrationFlowStep = {
  label: string;
  detail: string;
  icon: IconName;
  tone: StatusTone;
  highlighted?: boolean;
};

export type AccountingConnectionStatus = {
  system: string;
  status: string;
  tone: StatusTone;
  lastSync: string;
  details: string;
};

export type AccountingAttentionTransfer = {
  transactionReference: string;
  payrollReference: string;
  period: string;
  date: string;
  time: string;
  amount: string;
  error: string;
  status: string;
  tone: StatusTone;
};

export type AccountingSynchronizationRecord = {
  dateTime: string;
  transactionReference: string;
  payrollReference: string;
  records: string;
  amount: string;
  result: string;
  resultTone: StatusTone;
  acknowledgment: string;
};

export const accountingIntegrationMetrics: Metric[] = [
  {
    label: "Connection status",
    value: "Online",
    note: "All systems connected",
    icon: "activity",
    tone: "info",
  },
  {
    label: "Successful transfers",
    value: "24",
    note: "Completed transfers",
    icon: "check",
    tone: "success",
  },
  {
    label: "Pending records",
    value: "3",
    note: "Awaiting synchronization",
    icon: "clock",
    tone: "warning",
  },
  {
    label: "Failed transfers",
    value: "2",
    note: "Needs attention",
    icon: "warning",
    tone: "danger",
  },
  {
    label: "Last synchronization",
    value: "10:42 AM",
    note: "Today",
    icon: "refresh",
    tone: "info",
  },
  {
    label: "Integration errors",
    value: "2",
    note: "Open issues",
    icon: "errors",
    tone: "danger",
  },
];

export const accountingIntegrationFlow: AccountingIntegrationFlowStep[] = [
  {
    label: "Existing Payroll System",
    detail: "Source of approved payroll information",
    icon: "payroll",
    tone: "info",
  },
  {
    label: "Approved Payroll Information",
    detail: "Verified and approved data",
    icon: "file",
    tone: "info",
  },
  {
    label: "Accounting Integration Service",
    detail: "Transforms and validates data",
    icon: "settings",
    tone: "success",
  },
  {
    label: "Validation",
    detail: "Data validation and mapping",
    icon: "check",
    tone: "info",
    highlighted: true,
  },
  {
    label: "Transfer",
    detail: "Sends data to accounting system",
    icon: "refresh",
    tone: "info",
  },
  {
    label: "Existing Accounting System",
    detail: "Receives payroll transactions",
    icon: "building",
    tone: "muted",
  },
];

export const accountingConnectionStatuses: AccountingConnectionStatus[] = [
  {
    system: "Existing Payroll System",
    status: "Connected · Simulated",
    tone: "success",
    lastSync: "Today, 10:42 AM",
    details: "Last successful transfer – 24 records (₱482,650.00)",
  },
  {
    system: "Accounting Integration Service",
    status: "Operational · Simulated",
    tone: "success",
    lastSync: "Today, 10:42 AM",
    details: "Processing normally",
  },
  {
    system: "Existing Accounting System",
    status: "Connected · Simulated",
    tone: "success",
    lastSync: "Today, 10:42 AM",
    details: "Last successful receipt – 24 records (₱482,650.00)",
  },
];

export const accountingAttentionTransfers: AccountingAttentionTransfer[] = [
  {
    transactionReference: "ACC-TXN-1042",
    payrollReference: "PAY-2024-074",
    period: "Aug 16–31, 2026",
    date: "Sep 1, 2026",
    time: "9:50 AM",
    amount: "₱823,650.00",
    error: "Validation mismatch",
    status: "Failed",
    tone: "danger",
  },
  {
    transactionReference: "ACC-TXN-1039",
    payrollReference: "PAY-2024-073",
    period: "Jul 1–15, 2026",
    date: "Jul 18, 2026",
    time: "2:18 PM",
    amount: "₱462,900.00",
    error: "No acknowledgment",
    status: "Failed",
    tone: "danger",
  },
];

export const accountingSynchronizationHistory: AccountingSynchronizationRecord[] = [
  {
    dateTime: "Sep 1, 2026 – 10:42 AM",
    transactionReference: "ACC-TXN-1041",
    payrollReference: "PAY-2026-016",
    records: "24",
    amount: "₱482,650.00",
    result: "Success",
    resultTone: "success",
    acknowledgment: "Received by accounting system",
  },
  {
    dateTime: "Sep 1, 2026 – 9:55 AM",
    transactionReference: "ACC-TXN-1042",
    payrollReference: "PAY-2026-016",
    records: "24",
    amount: "₱432,550.00",
    result: "Failed",
    resultTone: "danger",
    acknowledgment: "No acknowledgment",
  },
  {
    dateTime: "Aug 18, 2026 – 2:18 PM",
    transactionReference: "ACC-TXN-1039",
    payrollReference: "PAY-2026-013",
    records: "22",
    amount: "₱462,900.00",
    result: "Failed",
    resultTone: "danger",
    acknowledgment: "No acknowledgment",
  },
  {
    dateTime: "Aug 12, 2026 – 10:24 AM",
    transactionReference: "ACC-TXN-1038",
    payrollReference: "PAY-2026-013",
    records: "20",
    amount: "₱415,200.00",
    result: "Success",
    resultTone: "success",
    acknowledgment: "Received by accounting system",
  },
  {
    dateTime: "Aug 5, 2026 – 11:03 AM",
    transactionReference: "ACC-TXN-1037",
    payrollReference: "PAY-2026-012",
    records: "24",
    amount: "₱498,300.00",
    result: "Success",
    resultTone: "success",
    acknowledgment: "Received by accounting system",
  },
];
