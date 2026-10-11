import type { Metric, StatusTone } from "@/types/ui";

export type PayrollHistoryBatchStatus = "Completed" | "Failed";
export type PayrollHistoryTransferStatus = "Transferred" | "Failed";
export type PayrollHistoryAcknowledgement = "Accepted" | "Accepted with Issues" | "Rejected";
export type PayrollHistoryResultStatus = "Completed" | "Completed with Issues" | "Failed";

export type PayrollHistoryRecord = {
  id: string;
  period: string;
  employees: number;
  createdBy: string;
  createdAt: string;
  date: string;
  batchStatus: PayrollHistoryBatchStatus;
  transferStatus: PayrollHistoryTransferStatus;
  acknowledgement: PayrollHistoryAcknowledgement;
  resultStatus: PayrollHistoryResultStatus;
  note: string;
};

export const payrollHistoryPeriods = [
  "Sep 1-15, 2026",
  "Aug 16-31, 2026",
  "Aug 1-15, 2026",
  "Jul 16-31, 2026",
  "Jul 1-15, 2026",
  "Jun 16-30, 2026",
  "Jun 1-15, 2026",
  "May 16-31, 2026",
] as const;

export const payrollHistoryBatchStatuses: readonly PayrollHistoryBatchStatus[] = ["Completed", "Failed"];
export const payrollHistoryTransferStatuses: readonly PayrollHistoryTransferStatus[] = ["Transferred", "Failed"];
export const payrollHistoryResultStatuses: readonly PayrollHistoryResultStatus[] = [
  "Completed",
  "Completed with Issues",
  "Failed",
];

export const initialPayrollHistory: readonly PayrollHistoryRecord[] = [
  {
    id: "PAY-2026-0915-A",
    period: "Sep 1-15, 2026",
    employees: 48,
    createdBy: "Maria Santos",
    createdAt: "Sep 15, 2026, 02:30 PM",
    date: "2026-09-15",
    batchStatus: "Completed",
    transferStatus: "Transferred",
    acknowledgement: "Accepted",
    resultStatus: "Completed",
    note: "All records were accepted and payroll results were returned successfully.",
  },
  {
    id: "PAY-2026-0831-A",
    period: "Aug 16-31, 2026",
    employees: 52,
    createdBy: "Maria Santos",
    createdAt: "Aug 31, 2026, 03:15 PM",
    date: "2026-08-31",
    batchStatus: "Completed",
    transferStatus: "Transferred",
    acknowledgement: "Accepted",
    resultStatus: "Completed",
    note: "The Existing Payroll System accepted the complete batch.",
  },
  {
    id: "PAY-2026-0801-A",
    period: "Aug 1-15, 2026",
    employees: 45,
    createdBy: "Maria Santos",
    createdAt: "Aug 15, 2026, 04:20 PM",
    date: "2026-08-15",
    batchStatus: "Completed",
    transferStatus: "Transferred",
    acknowledgement: "Accepted with Issues",
    resultStatus: "Completed with Issues",
    note: "The batch completed with three records requiring follow-up.",
  },
  {
    id: "PAY-2026-0731-A",
    period: "Jul 16-31, 2026",
    employees: 51,
    createdBy: "Maria Santos",
    createdAt: "Jul 31, 2026, 01:10 PM",
    date: "2026-07-31",
    batchStatus: "Failed",
    transferStatus: "Failed",
    acknowledgement: "Rejected",
    resultStatus: "Failed",
    note: "The Existing Payroll System rejected the handoff. Follow-up is required before retrying.",
  },
  {
    id: "PAY-2026-0715-A",
    period: "Jul 1-15, 2026",
    employees: 47,
    createdBy: "Maria Santos",
    createdAt: "Jul 15, 2026, 11:45 AM",
    date: "2026-07-15",
    batchStatus: "Completed",
    transferStatus: "Transferred",
    acknowledgement: "Accepted",
    resultStatus: "Completed",
    note: "All records were accepted and completed for the period.",
  },
  {
    id: "PAY-2026-0630-A",
    period: "Jun 16-30, 2026",
    employees: 43,
    createdBy: "Maria Santos",
    createdAt: "Jun 30, 2026, 02:20 PM",
    date: "2026-06-30",
    batchStatus: "Completed",
    transferStatus: "Transferred",
    acknowledgement: "Accepted",
    resultStatus: "Completed",
    note: "The completed batch was acknowledged without issues.",
  },
  {
    id: "PAY-2026-0615-A",
    period: "Jun 1-15, 2026",
    employees: 46,
    createdBy: "Maria Santos",
    createdAt: "Jun 15, 2026, 03:05 PM",
    date: "2026-06-15",
    batchStatus: "Completed",
    transferStatus: "Transferred",
    acknowledgement: "Accepted",
    resultStatus: "Completed",
    note: "The Existing Payroll System accepted the complete batch.",
  },
  {
    id: "PAY-2026-0531-A",
    period: "May 16-31, 2026",
    employees: 49,
    createdBy: "Maria Santos",
    createdAt: "May 31, 2026, 01:35 PM",
    date: "2026-05-31",
    batchStatus: "Completed",
    transferStatus: "Transferred",
    acknowledgement: "Accepted",
    resultStatus: "Completed",
    note: "The batch completed and was acknowledged by the Existing Payroll System.",
  },
];

export function getPayrollHistoryTone(value: string): StatusTone {
  if (value === "Completed" || value === "Transferred" || value === "Accepted") return "success";
  if (value === "Completed with Issues" || value === "Accepted with Issues") return "warning";
  if (value === "Failed" || value === "Rejected") return "danger";
  return "muted";
}

export function getPayrollHistorySummaryMetrics(records: readonly PayrollHistoryRecord[]): Metric[] {
  const completed = records.filter((record) => record.batchStatus === "Completed").length;
  const completedWithIssues = records.filter((record) => record.resultStatus === "Completed with Issues").length;
  const failed = records.filter((record) => record.batchStatus === "Failed" || record.acknowledgement === "Rejected").length;
  const latestCompleted = records.find((record) => record.resultStatus === "Completed")?.period ?? "Unavailable";

  return [
    { label: "Total batches", value: String(records.length), note: "Across recorded payroll periods", icon: "layers", tone: "info" },
    { label: "Completed", value: String(completed), note: "Successfully completed cycles", icon: "check", tone: "success" },
    { label: "Completed with issues", value: String(completedWithIssues), note: "Required follow-up", icon: "warning", tone: "warning" },
    { label: "Failed / rejected", value: String(failed), note: "Historical problem records", icon: "close", tone: "danger" },
    { label: "Latest completed period", value: latestCompleted, note: "Most recent completed cycle", icon: "calendar", tone: "info" },
  ];
}
