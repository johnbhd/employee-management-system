import type { Metric, StatusTone } from "@/types/ui";

export type PayrollBatchStatus = "Draft" | "Ready" | "Transferred" | "Blocked";

export type PayrollBatchBreakdown = {
  department: string;
  records: number;
};

export type PayrollBatchRecord = {
  id: string;
  period: string;
  records: number;
  departments: number;
  createdBy: string;
  createdAt: string;
  status: PayrollBatchStatus;
  submittedToday?: boolean;
  breakdown?: readonly number[];
  notes?: string;
};

export const payrollBatchPeriods = [
  "Sep 1–15, 2026",
  "Aug 16–31, 2026",
] as const;

export const payrollBatchDepartments = [
  "Information Technology",
  "Operations",
  "Facilities",
  "Registrar",
  "Human Resources",
  "Accounting",
  "Administration",
  "Library",
  "Guidance Office",
  "Maintenance",
] as const;

export const initialPayrollBatches: readonly PayrollBatchRecord[] = [
  {
    id: "PAY-2026-0915-A",
    period: "Sep 1–15, 2026",
    records: 48,
    departments: 7,
    createdBy: "Maria Santos",
    createdAt: "Sep 15, 2026, 02:30 PM",
    status: "Transferred",
    submittedToday: true,
  },
  {
    id: "PAY-2026-0915-B",
    period: "Sep 1–15, 2026",
    records: 31,
    departments: 5,
    createdBy: "Maria Santos",
    createdAt: "Sep 16, 2026, 10:24 AM",
    status: "Draft",
    breakdown: [8, 6, 5, 4, 3, 3, 2],
  },
  {
    id: "PAY-2026-0915-C",
    period: "Sep 1–15, 2026",
    records: 17,
    departments: 3,
    createdBy: "Maria Santos",
    createdAt: "Sep 16, 2026, 11:10 AM",
    status: "Ready",
  },
  {
    id: "PAY-2026-0901-A",
    period: "Aug 16–31, 2026",
    records: 52,
    departments: 8,
    createdBy: "Maria Santos",
    createdAt: "Aug 31, 2026, 03:15 PM",
    status: "Transferred",
  },
  {
    id: "PAY-2026-0901-B",
    period: "Aug 16–31, 2026",
    records: 12,
    departments: 2,
    createdBy: "Maria Santos",
    createdAt: "Aug 31, 2026, 09:40 AM",
    status: "Blocked",
  },
  {
    id: "PAY-2026-0915-D",
    period: "Sep 1–15, 2026",
    records: 36,
    departments: 6,
    createdBy: "Maria Santos",
    createdAt: "Sep 16, 2026, 12:05 PM",
    status: "Draft",
  },
  {
    id: "PAY-2026-0915-E",
    period: "Sep 1–15, 2026",
    records: 29,
    departments: 4,
    createdBy: "Maria Santos",
    createdAt: "Sep 16, 2026, 01:20 PM",
    status: "Draft",
  },
  {
    id: "PAY-2026-0901-C",
    period: "Aug 16–31, 2026",
    records: 22,
    departments: 4,
    createdBy: "Maria Santos",
    createdAt: "Aug 31, 2026, 11:30 AM",
    status: "Ready",
  },
];

export function getPayrollBatchTone(status: PayrollBatchStatus): StatusTone {
  switch (status) {
    case "Draft":
      return "warning";
    case "Ready":
      return "info";
    case "Transferred":
      return "success";
    case "Blocked":
      return "danger";
  }
}

export function getPayrollBatchBreakdown(batch: PayrollBatchRecord): readonly PayrollBatchBreakdown[] {
  if (batch.breakdown && batch.breakdown.reduce((total, records) => total + records, 0) === batch.records) {
    return batch.breakdown.map((records, index) => ({
      department: payrollBatchDepartments[index],
      records,
    }));
  }

  const departmentCount = Math.max(1, Math.min(batch.departments, payrollBatchDepartments.length));
  const base = Math.floor(batch.records / departmentCount);
  const remainder = batch.records % departmentCount;

  return payrollBatchDepartments.slice(0, departmentCount).map((department, index) => ({
    department,
    records: base + (index < remainder ? 1 : 0),
  }));
}

export function getPayrollBatchSummaryMetrics(batches: readonly PayrollBatchRecord[]): Metric[] {
  const draftBatches = batches.filter((batch) => batch.status === "Draft");

  return [
    {
      label: "Draft batches",
      value: String(draftBatches.length),
      note: "In preparation",
      icon: "file",
      tone: "info",
    },
    {
      label: "Ready to submit",
      value: String(batches.filter((batch) => batch.status === "Ready").length),
      note: "Prepared for handoff",
      icon: "check",
      tone: "success",
    },
    {
      label: "Submitted today",
      value: String(batches.filter((batch) => batch.submittedToday).length),
      note: "Sent to Existing Payroll",
      icon: "arrow",
      tone: "success",
    },
    {
      label: "Blocked batches",
      value: String(batches.filter((batch) => batch.status === "Blocked").length),
      note: "Requires follow-up",
      icon: "warning",
      tone: "warning",
    },
    {
      label: "Records in drafts",
      value: String(draftBatches.reduce((total, batch) => total + batch.records, 0)),
      note: "Included attendance records",
      icon: "users",
      tone: "info",
    },
  ];
}
