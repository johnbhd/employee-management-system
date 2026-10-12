import type { PayrollBatchPeriod } from "@/types/payroll-batches";
import type {
  PayrollHandoffData,
  PayrollHandoffReadyBatch,
  PayrollHandoffRecord as StoredPayrollHandoffRecord,
  PayrollHandoffSummary,
} from "@/types/payroll-handoff";
import type { Metric, StatusTone } from "@/types/ui";

export type PayrollHandoffTransferStatus = "Submitting" | "Submitted" | "Failed";
export type PayrollHandoffAcknowledgement = "Pending" | "Accepted" | "Rejected";

export type PayrollReadyBatch = {
  id: string;
  period: string;
  periodStart: string;
  employees: number;
  includedRecords: number;
  departments: number;
  createdBy: string;
  createdAt: string;
  blockedRecords: number;
};

export type PayrollHandoffRecord = {
  id: string;
  transferId: string;
  batchId: string;
  period: string;
  periodStart: string;
  employees: number;
  submittedAt: string;
  date: string;
  transferStatus: PayrollHandoffTransferStatus;
  acknowledgement: PayrollHandoffAcknowledgement;
  reference: string;
  submittedBy: string;
  failureSummary: string | null;
  provider: string;
  attemptCount: number;
  timeline: StoredPayrollHandoffRecord["timeline"];
  batchStatus: string;
};

export function mapPayrollHandoffData(data: PayrollHandoffData) {
  return {
    ...data,
    readyBatches: data.readyBatches.map(mapReadyBatch),
    history: data.history.map(mapHandoffRecord),
  };
}

function mapReadyBatch(batch: PayrollHandoffReadyBatch): PayrollReadyBatch {
  return {
    ...batch,
    period: batch.period.label,
    periodStart: batch.period.start,
  };
}

function mapHandoffRecord(record: StoredPayrollHandoffRecord): PayrollHandoffRecord {
  return {
    id: record.batchId,
    transferId: record.transferId,
    batchId: record.batchId,
    period: record.period.label,
    periodStart: record.period.start,
    employees: record.batchSummary.employeeCount,
    submittedAt: record.submittedAt,
    date: record.submittedAt.slice(0, 10),
    transferStatus: record.transferStatus === "failed"
      ? "Failed"
      : record.transferStatus === "submitted"
        ? "Submitted"
        : "Submitting",
    acknowledgement: record.acknowledgementStatus === "accepted"
      ? "Accepted"
      : record.acknowledgementStatus === "pending"
        ? "Pending"
        : "Rejected",
    reference: record.externalReference ?? "—",
    submittedBy: record.submittedBy.displayName,
    failureSummary: record.failureSummary,
    provider: record.provider,
    attemptCount: record.attemptCount,
    timeline: record.timeline,
    batchStatus: record.batchSummary.batchStatus,
  };
}

export function getPayrollHandoffTransferTone(status: PayrollHandoffTransferStatus): StatusTone {
  if (status === "Submitting") return "warning";
  if (status === "Submitted") return "success";
  return "danger";
}

export function getPayrollHandoffAcknowledgementTone(acknowledgement: PayrollHandoffAcknowledgement): StatusTone {
  if (acknowledgement === "Pending") return "warning";
  if (acknowledgement === "Accepted") return "success";
  return "danger";
}

export function getPayrollHandoffResponse(record: PayrollHandoffRecord): string {
  if (record.transferStatus === "Submitting") {
    return "Transfer submitted. The handoff is waiting for a final acknowledgement.";
  }
  if (record.transferStatus === "Failed") {
    return record.failureSummary ?? "Payroll handoff could not be completed. Technical follow-up is required.";
  }
  return record.acknowledgement === "Accepted"
    ? "The handoff was accepted by the configured payroll integration adapter. Payroll processing remains outside this application."
    : "The handoff was submitted and is awaiting a final acknowledgement.";
}

export function getPayrollHandoffSummaryMetrics(
  readyBatches: readonly PayrollReadyBatch[],
  history: readonly PayrollHandoffRecord[],
): Metric[] {
  return [
    { label: "Ready for handoff", value: String(readyBatches.length), note: "Batches ready to submit", icon: "arrow", tone: "info" },
    { label: "In progress", value: String(history.filter((record) => record.transferStatus === "Submitting").length), note: "Transfer currently processing", icon: "activity", tone: "warning" },
    { label: "Acknowledged", value: String(history.filter((record) => record.transferStatus === "Submitted" && record.acknowledgement === "Accepted").length), note: "Accepted by the integration adapter", icon: "check", tone: "success" },
    { label: "Failed transfers", value: String(history.filter((record) => record.transferStatus === "Failed").length), note: "Technical follow-up required", icon: "warning", tone: "danger" },
    { label: "Awaiting acknowledgement", value: String(history.filter((record) => record.transferStatus === "Submitted" && record.acknowledgement === "Pending").length), note: "Submitted, response pending", icon: "clock", tone: "warning" },
  ];
}

export function getPayrollHandoffSummaryMetricsFromSummary(summary: PayrollHandoffSummary): Metric[] {
  return [
    { label: "Ready for handoff", value: String(summary.readyForHandoff), note: "Batches ready to submit", icon: "arrow", tone: "info" },
    { label: "In progress", value: String(summary.inProgress), note: "Transfer currently processing", icon: "activity", tone: "warning" },
    { label: "Acknowledged", value: String(summary.acknowledged), note: "Accepted by the integration adapter", icon: "check", tone: "success" },
    { label: "Failed transfers", value: String(summary.failed), note: "Technical follow-up required", icon: "warning", tone: "danger" },
    { label: "Awaiting acknowledgement", value: String(summary.awaitingAcknowledgement), note: "Submitted, response pending", icon: "clock", tone: "warning" },
  ];
}

export function getPeriodLabel(period: PayrollBatchPeriod) {
  return period.label;
}
