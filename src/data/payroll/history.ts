import type { Metric, StatusTone } from "@/types/ui";
import type {
  PayrollHistoryData,
  PayrollHistoryRecord,
  PayrollHistorySummary,
} from "@/types/payroll-history";

export type {
  PayrollHistoryData,
  PayrollHistoryRecord,
  PayrollHistorySummary,
} from "@/types/payroll-history";

export function getPayrollHistoryTone(value: string | null): StatusTone {
  if (!value) return "muted";
  if (["Completed", "Acknowledged", "Accepted", "Submitted", "Ready"].includes(value)) return "success";
  if (["Completed with Issues", "Awaiting Acknowledgement", "Awaiting Payroll Result", "Processing", "Pending", "Preparing"].includes(value)) return "warning";
  if (["Failed", "Handoff Failed", "Rejected", "Blocked"].includes(value)) return "danger";
  return "muted";
}

export function getPayrollHistoryBatchStatusLabel(value: string): string {
  return value;
}

export function getPayrollHistoryTransferStatusLabel(value: string | null): string {
  if (!value) return "Not submitted";
  switch (value) {
    case "preparing":
      return "Preparing";
    case "submitting":
      return "Submitting";
    case "submitted":
      return "Submitted";
    case "failed":
      return "Failed";
  }
  return value;
}

export function getPayrollHistoryAcknowledgementLabel(value: string | null): string {
  if (!value) return "—";
  switch (value) {
    case "pending":
      return "Awaiting response";
    case "accepted":
      return "Accepted";
    case "rejected":
      return "Rejected";
    case "not_received":
      return "Not received";
  }
  return value;
}

export function getPayrollHistoryResultStatusLabel(value: string | null): string {
  if (!value) return "Awaiting result";
  switch (value) {
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
  return value;
}

export function formatPayrollHistoryDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

export function formatPayrollHistoryDateTime(value: string | null): string {
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

export function getPayrollHistorySummaryMetrics(summary: PayrollHistorySummary): Metric[] {
  return [
    {
      label: "Total batches",
      value: String(summary.totalBatches),
      note: "Persistent payroll cycles",
      icon: "layers",
      tone: "info",
    },
    {
      label: "Completed",
      value: String(summary.completed),
      note: "Successfully completed cycles",
      icon: "check",
      tone: "success",
    },
    {
      label: "Completed with issues",
      value: String(summary.completedWithIssues),
      note: "Required follow-up",
      icon: "warning",
      tone: "warning",
    },
    {
      label: "Failed / rejected",
      value: String(summary.failedOrRejected),
      note: "Historical problem cycles",
      icon: "close",
      tone: "danger",
    },
    {
      label: "Latest completed period",
      value: summary.latestCompletedPeriod ?? "—",
      note: "Most recent completed cycle",
      icon: "calendar",
      tone: "info",
    },
  ];
}

export function getPayrollHistoryRowIssueCount(record: PayrollHistoryRecord) {
  return record.issues.length;
}

export function getPayrollHistoryOptions(data: PayrollHistoryData) {
  return {
    periods: data.periodOptions,
    batchStatuses: data.batchStatusOptions,
    transferStatuses: data.transferStatusOptions,
    resultStatuses: data.resultStatusOptions,
  };
}
