import type { Metric, StatusTone } from "@/types/ui";

export type PayrollResultProcessingStatus = "Completed" | "Pending" | "Failed";
export type PayrollPayslipStatus = "Available" | "Not Available";

export type PayrollResultRecord = {
  employeeName: string;
  employeeId: string;
  department: string;
  period: string;
  reference: string;
  processingStatus: PayrollResultProcessingStatus;
  payslipStatus: PayrollPayslipStatus;
  releasedAt: string;
  batchId: string;
};

export type PayrollBatchResult = {
  id: string;
  period: string;
  employees: number;
  returnedAt: string;
  resultStatus: PayrollResultProcessingStatus;
  payslipsAvailable: number;
};

export type PayrollResultNotice = {
  id: string;
  tone: StatusTone;
  title: string;
  description: string;
  date: string;
  time: string;
};

export const payrollResultPeriods = [
  "Sep 1–15, 2026",
  "Aug 16–31, 2026",
  "Aug 1–15, 2026",
] as const;

export const payrollResultDepartments = [
  "Information Technology",
  "Operations",
  "Facilities",
  "Registrar",
  "Human Resources",
] as const;

export const initialPayrollResultRecords: readonly PayrollResultRecord[] = [
  {
    employeeName: "John Benedict M. Villegas",
    employeeId: "AU-EMP-2026-0418",
    department: "Information Technology",
    period: "Sep 1–15, 2026",
    reference: "PR-2026-0915-001",
    processingStatus: "Completed",
    payslipStatus: "Available",
    releasedAt: "Sep 16, 2026",
    batchId: "PAY-2026-0915-A",
  },
  {
    employeeName: "Maria Santos",
    employeeId: "AU-EMP-2026-0194",
    department: "Operations",
    period: "Sep 1–15, 2026",
    reference: "PR-2026-0915-002",
    processingStatus: "Completed",
    payslipStatus: "Available",
    releasedAt: "Sep 16, 2026",
    batchId: "PAY-2026-0915-A",
  },
  {
    employeeName: "Robert Cruz",
    employeeId: "AU-EMP-2026-0332",
    department: "Facilities",
    period: "Sep 1–15, 2026",
    reference: "—",
    processingStatus: "Pending",
    payslipStatus: "Not Available",
    releasedAt: "—",
    batchId: "PAY-2026-0915-B",
  },
  {
    employeeName: "Ana Reyes",
    employeeId: "AU-EMP-2026-0271",
    department: "Registrar",
    period: "Sep 1–15, 2026",
    reference: "PR-2026-0915-003",
    processingStatus: "Completed",
    payslipStatus: "Available",
    releasedAt: "Sep 16, 2026",
    batchId: "PAY-2026-0915-A",
  },
  {
    employeeName: "Carlos Dela Cruz",
    employeeId: "AU-EMP-2026-0520",
    department: "Human Resources",
    period: "Sep 1–15, 2026",
    reference: "—",
    processingStatus: "Failed",
    payslipStatus: "Not Available",
    releasedAt: "—",
    batchId: "PAY-2026-0801-A",
  },
];

export const initialPayrollBatchResults: readonly PayrollBatchResult[] = [
  {
    id: "PAY-2026-0915-A",
    period: "Sep 1–15, 2026",
    employees: 48,
    returnedAt: "Sep 16, 2026, 02:35 PM",
    resultStatus: "Completed",
    payslipsAvailable: 48,
  },
  {
    id: "PAY-2026-0915-B",
    period: "Sep 1–15, 2026",
    employees: 31,
    returnedAt: "Sep 16, 2026, 11:20 AM",
    resultStatus: "Pending",
    payslipsAvailable: 0,
  },
  {
    id: "PAY-2026-0901-A",
    period: "Aug 16–31, 2026",
    employees: 52,
    returnedAt: "Aug 31, 2026, 03:15 PM",
    resultStatus: "Completed",
    payslipsAvailable: 52,
  },
];

export const initialPayrollResultNotices: readonly PayrollResultNotice[] = [
  {
    id: "success-0915-a",
    tone: "success",
    title: "Batch PAY-2026-0915-A processed successfully.",
    description: "48 payslips are now available for employees.",
    date: "Sep 16, 2026",
    time: "02:35 PM",
  },
  {
    id: "pending-0915-b",
    tone: "warning",
    title: "Batch PAY-2026-0915-B is still pending final result.",
    description: "Awaiting response from the Existing Payroll System.",
    date: "Sep 16, 2026",
    time: "11:20 AM",
  },
  {
    id: "failed-0801-a",
    tone: "danger",
    title: "Batch PAY-2026-0801-A has 2 rejected records.",
    description: "Please coordinate with HR for the affected employees.",
    date: "Aug 31, 2026",
    time: "02:35 PM",
  },
];

export function getPayrollResultTone(status: PayrollResultProcessingStatus): StatusTone {
  switch (status) {
    case "Completed":
      return "success";
    case "Pending":
      return "warning";
    case "Failed":
      return "danger";
  }
}

export function getPayrollPayslipTone(status: PayrollPayslipStatus): StatusTone {
  return status === "Available" ? "success" : "danger";
}

export function getPayrollResultsSummaryMetrics(): Metric[] {
  return [
    {
      label: "Processed employees",
      value: "124",
      note: "Returned by Existing Payroll",
      icon: "users",
      tone: "info",
    },
    {
      label: "Payslips available",
      value: "118",
      note: "Available for employees",
      icon: "file",
      tone: "success",
    },
    {
      label: "Pending results",
      value: "4",
      note: "Awaiting final result",
      icon: "clock",
      tone: "warning",
    },
    {
      label: "Failed / rejected",
      value: "2",
      note: "Requires follow-up",
      icon: "warning",
      tone: "danger",
    },
    {
      label: "Total batches processed",
      value: "5",
      note: "For current payroll period",
      icon: "layers",
      tone: "info",
    },
  ];
}
