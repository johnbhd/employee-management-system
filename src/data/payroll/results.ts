import type { Metric, StatusTone } from "@/types/ui";
import type {
  PayrollResultBatchSummary,
  PayrollResultItem,
  PayrollResultNotice,
  PayrollResultPayslipStatus,
  PayrollResultProcessingStatus,
  PayrollResultsSummary,
} from "@/types/payroll-results";
import type { PayrollResultStatus } from "@/types/payroll-results";

export type PayrollResultRecord = PayrollResultItem;
export type PayrollBatchResult = PayrollResultBatchSummary;

export function getPayrollResultLabel(status: PayrollResultProcessingStatus): string {
  switch (status) {
    case "processed":
      return "Processed";
    case "pending":
      return "Pending";
    case "rejected":
      return "Rejected";
    case "failed":
      return "Failed";
  }
}

export function getPayrollPayslipLabel(status: PayrollResultPayslipStatus): string {
  switch (status) {
    case "available":
      return "Available";
    case "not_yet_available":
      return "Not yet available";
    case "unavailable":
      return "Unavailable";
  }
}

export function getPayrollResultTone(status: PayrollResultProcessingStatus): StatusTone {
  return status === "processed" ? "success" : status === "pending" ? "warning" : "danger";
}

export function getPayrollResultStatusLabel(status: PayrollResultStatus): string {
  switch (status) {
    case "processing":
      return "Processing";
    case "completed":
      return "Completed";
    case "completed_with_issues":
      return "Completed with issues";
    case "partially_completed":
      return "Partially completed";
    case "rejected":
      return "Rejected";
    case "failed":
      return "Failed";
  }
}

export function getPayrollResultStatusTone(status: PayrollResultStatus): StatusTone {
  return status === "completed" ? "success" : status === "processing" ? "warning" : status === "failed" || status === "rejected" ? "danger" : "info";
}

export function getPayrollPayslipTone(status: PayrollResultPayslipStatus): StatusTone {
  return status === "available" ? "success" : status === "not_yet_available" ? "warning" : "danger";
}

export function formatPayrollResultDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

export function formatPayrollResultDateTime(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

export function getPayrollResultsSummaryMetrics(summary: PayrollResultsSummary): Metric[] {
  return [
    {
      label: "Processed employees",
      value: String(summary.processedEmployees),
      note: "Returned by Existing Payroll",
      icon: "users",
      tone: "info",
    },
    {
      label: "Payslips available",
      value: String(summary.payslipsAvailable),
      note: "Available for employees",
      icon: "file",
      tone: "success",
    },
    {
      label: "Pending results",
      value: String(summary.pendingResults),
      note: "Awaiting final result",
      icon: "clock",
      tone: "warning",
    },
    {
      label: "Failed / rejected",
      value: String(summary.failedOrRejected),
      note: "Requires follow-up",
      icon: "warning",
      tone: "danger",
    },
    {
      label: "Total batches processed",
      value: String(summary.completedBatches),
      note: "With completed returned results",
      icon: "layers",
      tone: "info",
    },
  ];
}

export type { PayrollResultNotice };
