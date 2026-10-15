import "server-only";

import { getCurrentPayrollPeriod } from "@/server/payroll/payroll-dashboard.service";
import {
  listPayrollBatches,
} from "@/server/repositories/payroll-batches/payroll-batch.repository";
import {
  listPayrollHandoffs,
  type PayrollStoredHandoff,
} from "@/server/repositories/payroll-handoffs/payroll-handoff.repository";
import {
  listPayrollResultItems,
  listPayrollResults,
} from "@/server/repositories/payroll-results/payroll-result.repository";
import { payrollIntegrationProviderNote } from "@/server/payroll/integration/payroll-integration-adapter";
import {
  payrollBatchStatuses,
  type PayrollBatchRecord,
  type PayrollBatchStatus,
} from "@/types/payroll-batches";
import {
  payrollTransferStatuses,
  type PayrollAcknowledgementStatus,
  type PayrollTransferStatus,
} from "@/types/payroll-handoff";
import {
  payrollResultStatuses,
  type PayrollResultItem,
  type PayrollResultRecord,
  type PayrollResultStatus,
} from "@/types/payroll-results";
import type {
  PayrollHistoryData,
  PayrollHistoryDetail,
  PayrollHistoryHandoff,
  PayrollHistoryQuery,
  PayrollHistoryRecord,
  PayrollHistoryResult,
  PayrollHistoryTimelineEvent,
} from "@/types/payroll-history";

export class PayrollHistoryValidationError extends Error {
  readonly code = "PAYROLL_HISTORY_VALIDATION_ERROR";

  constructor(message: string) {
    super(message);
    this.name = "PayrollHistoryValidationError";
  }
}

export function getDefaultPayrollHistoryQuery(): PayrollHistoryQuery {
  return {
    search: "",
    periodStart: null,
    batchStatus: null,
    transferStatus: null,
    acknowledgementStatus: null,
    resultStatus: null,
    fromDate: null,
    toDate: null,
    page: 1,
    pageSize: 5,
  };
}

function getHistoryLifecycleStatus(
  batch: PayrollBatchRecord,
  handoff: PayrollStoredHandoff | undefined,
  result: PayrollResultRecord | undefined,
): PayrollHistoryRecord["lifecycleStatus"] {
  if (result) {
    switch (result.status) {
      case "completed":
        return "Completed";
      case "completed_with_issues":
      case "partially_completed":
        return "Completed with Issues";
      case "processing":
        return "Processing";
      case "rejected":
        return "Rejected";
      case "failed":
        return "Failed";
    }
  }

  if (handoff?.transferStatus === "failed") return "Handoff Failed";
  if (handoff?.acknowledgementStatus === "rejected") return "Rejected";
  if (handoff?.transferStatus === "preparing" || handoff?.transferStatus === "submitting") {
    return "Awaiting Acknowledgement";
  }
  if (handoff?.transferStatus === "submitted" && handoff.acknowledgementStatus !== "accepted") {
    return "Awaiting Acknowledgement";
  }
  if (handoff?.transferStatus === "submitted") return "Awaiting Payroll Result";
  if (batch.status === "Ready") return "Ready";
  if (batch.status === "Failed") return "Failed";
  return "Preparing";
}

function createTimeline(
  batch: PayrollBatchRecord,
  handoff: PayrollStoredHandoff | undefined,
  result: PayrollResultRecord | undefined,
  resultItems: readonly PayrollResultItem[],
): PayrollHistoryTimelineEvent[] {
  const events: PayrollHistoryTimelineEvent[] = [
    { id: `${batch.id}:created`, label: "Batch created", occurredAt: batch.createdAt },
  ];

  if (handoff) {
    events.push({ id: `${batch.id}:ready`, label: "Batch ready for handoff", occurredAt: handoff.readyAt });
    events.push({ id: `${batch.id}:submitted`, label: "Submitted for handoff", occurredAt: handoff.submittedAt });
    if (handoff.acknowledgedAt) {
      events.push({ id: `${batch.id}:acknowledged`, label: "Handoff acknowledgement received", occurredAt: handoff.acknowledgedAt });
    }
    if (handoff.failedAt) {
      events.push({ id: `${batch.id}:handoff-failed`, label: "Handoff failed", occurredAt: handoff.failedAt });
    }
  }

  if (result) {
    events.push({ id: `${batch.id}:result-received`, label: "Payroll result received", occurredAt: result.receivedAt });
    if (result.completedAt) {
      events.push({ id: `${batch.id}:result-completed`, label: "Payroll processing completed", occurredAt: result.completedAt });
    }
  }

  const latestPayslipRelease = resultItems
    .map((item) => item.releasedAt)
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => right.localeCompare(left))[0];
  if (latestPayslipRelease) {
    events.push({ id: `${batch.id}:payslips`, label: "Payslips made available", occurredAt: latestPayslipRelease });
  }

  return events.sort((left, right) => left.occurredAt.localeCompare(right.occurredAt));
}

function getIssues(
  handoff: PayrollStoredHandoff | undefined,
  result: PayrollResultRecord | undefined,
  resultItems: readonly PayrollResultItem[],
): string[] {
  const issues: string[] = [];
  if (handoff?.failureSummary) issues.push(handoff.failureSummary);
  if (handoff?.failureCode && !handoff.failureSummary) issues.push(`Handoff failure code: ${handoff.failureCode}`);
  for (const item of resultItems) {
    if (item.issueSummary) issues.push(`${item.employeeName}: ${item.issueSummary}`);
    else if (item.issueCode) issues.push(`${item.employeeName}: ${item.issueCode}`);
  }
  if (result && result.status === "failed" && issues.length === 0) issues.push("Payroll processing failed.");
  if (result && result.status === "rejected" && issues.length === 0) issues.push("Payroll processing was rejected.");
  if (!result && handoff?.transferStatus === "submitted" && handoff.acknowledgementStatus === "accepted" && issues.length === 0) {
    issues.push("The handoff was accepted, but a Payroll result has not been returned yet.");
  }
  return Array.from(new Set(issues));
}

function toHistoryHandoff(handoff: PayrollStoredHandoff | undefined): PayrollHistoryHandoff {
  return {
    transferId: handoff?.transferId ?? null,
    status: handoff?.transferStatus ?? null,
    acknowledgementStatus: handoff?.acknowledgementStatus ?? null,
    externalReference: handoff?.externalReference ?? null,
    provider: handoff?.provider ?? null,
    submittedAt: handoff?.submittedAt ?? null,
    acknowledgedAt: handoff?.acknowledgedAt ?? null,
    failedAt: handoff?.failedAt ?? null,
    failureCode: handoff?.failureCode ?? null,
    failureSummary: handoff?.failureSummary ?? null,
  };
}

function toHistoryResult(result: PayrollResultRecord | undefined): PayrollHistoryResult {
  return {
    resultId: result?.resultId ?? null,
    status: result?.status ?? null,
    externalReference: result?.externalPayrollReference ?? null,
    employeeCount: result?.employeeCount ?? 0,
    processedCount: result?.processedCount ?? 0,
    pendingCount: result?.pendingCount ?? 0,
    rejectedCount: result?.rejectedCount ?? 0,
    failedCount: result?.failedCount ?? 0,
    payslipAvailableCount: result?.payslipAvailableCount ?? 0,
    receivedAt: result?.receivedAt ?? null,
    processedAt: result?.processedAt ?? null,
    completedAt: result?.completedAt ?? null,
  };
}

function toHistoryRecord(
  batch: PayrollBatchRecord,
  handoff: PayrollStoredHandoff | undefined,
  result: PayrollResultRecord | undefined,
  resultItems: readonly PayrollResultItem[],
): PayrollHistoryRecord {
  const lifecycleStatus = getHistoryLifecycleStatus(batch, handoff, result);
  const issues = getIssues(handoff, result, resultItems);

  return {
    batchId: batch.id,
    period: batch.period,
    employeeCount: batch.recordCount,
    createdBy: batch.createdBy,
    createdAt: batch.createdAt,
    batchStatus: batch.status,
    handoff: toHistoryHandoff(handoff),
    result: toHistoryResult(result),
    lifecycleStatus,
    completedAt: result?.completedAt ?? null,
    issueSummary: issues[0] ?? null,
    timeline: createTimeline(batch, handoff, result, resultItems),
    issues,
    batch: {
      includedRecordCount: batch.includedRecords.length,
      blockedRecordCount: batch.blockedCount,
      departmentCount: batch.departmentNames.length,
      readyAt: handoff?.readyAt ?? null,
      submittedAt: batch.submittedAt ?? handoff?.submittedAt ?? null,
      updatedAt: batch.updatedAt,
      notes: batch.notes,
    },
  };
}

type HistorySnapshot = {
  batches: PayrollBatchRecord[];
  handoffs: PayrollStoredHandoff[];
  results: PayrollResultRecord[];
  itemsByResultId: Map<string, PayrollResultItem[]>;
  records: PayrollHistoryRecord[];
};

async function loadHistorySnapshot(): Promise<HistorySnapshot> {
  const [batches, handoffs, results] = await Promise.all([
    listPayrollBatches(),
    listPayrollHandoffs(),
    listPayrollResults(),
  ]);
  const resultItems = await Promise.all(results.map(async (result) => (
    [result.resultId, await listPayrollResultItems(result.resultId)] as const
  )));
  const itemsByResultId = new Map(resultItems);
  const handoffsByBatchId = new Map(handoffs.map((handoff) => [handoff.batchId, handoff]));
  const resultsByBatchId = new Map(results.map((result) => [result.batchId, result]));
  const records = batches
    .map((batch) => {
      const handoff = handoffsByBatchId.get(batch.id);
      const result = resultsByBatchId.get(batch.id)
        ?? (handoff ? results.find((candidate) => candidate.transferId === handoff.transferId) : undefined);
      return toHistoryRecord(batch, handoff, result, result ? itemsByResultId.get(result.resultId) ?? [] : []);
    })
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

  return { batches, handoffs, results, itemsByResultId, records };
}

function matchesQuery(record: PayrollHistoryRecord, query: PayrollHistoryQuery) {
  const search = query.search.trim().toLowerCase();
  const searchable = [
    record.batchId,
    record.period.label,
    record.createdBy.displayName,
    record.createdBy.username,
    record.handoff.transferId,
    record.handoff.externalReference,
    record.result.resultId,
    record.result.externalReference,
  ].filter(Boolean).join(" ").toLowerCase();
  const createdDate = record.createdAt.slice(0, 10);

  return (!search || searchable.includes(search))
    && (!query.periodStart || record.period.start === query.periodStart)
    && (!query.batchStatus || record.batchStatus === query.batchStatus)
    && (!query.transferStatus || record.handoff.status === query.transferStatus)
    && (!query.acknowledgementStatus || record.handoff.acknowledgementStatus === query.acknowledgementStatus)
    && (!query.resultStatus || record.result.status === query.resultStatus)
    && (!query.fromDate || createdDate >= query.fromDate)
    && (!query.toDate || createdDate <= query.toDate);
}

function getPeriods(records: readonly PayrollHistoryRecord[]) {
  return Array.from(new Map(records.map((record) => [record.period.start, record.period])).values())
    .sort((left, right) => right.start.localeCompare(left.start));
}

function getSummary(records: readonly PayrollHistoryRecord[]) {
  const completed = records.filter((record) => record.lifecycleStatus === "Completed");
  return {
    totalBatches: records.length,
    completed: completed.length,
    completedWithIssues: records.filter((record) => record.lifecycleStatus === "Completed with Issues").length,
    failedOrRejected: records.filter((record) => (
      record.lifecycleStatus === "Handoff Failed"
      || record.lifecycleStatus === "Rejected"
      || record.lifecycleStatus === "Failed"
    )).length,
    latestCompletedPeriod: completed
      .slice()
      .sort((left, right) => (right.completedAt ?? "").localeCompare(left.completedAt ?? ""))[0]?.period.label ?? null,
  };
}

export async function getPayrollHistoryData(
  query: PayrollHistoryQuery = getDefaultPayrollHistoryQuery(),
): Promise<PayrollHistoryData> {
  if (query.page < 1 || query.pageSize < 1 || query.pageSize > 50) {
    throw new PayrollHistoryValidationError("The payroll history pagination values are invalid.");
  }
  if (query.fromDate && query.toDate && query.fromDate > query.toDate) {
    throw new PayrollHistoryValidationError("The start date must be on or before the end date.");
  }

  const snapshot = await loadHistorySnapshot();
  const filtered = snapshot.records.filter((record) => matchesQuery(record, query));
  const totalPages = Math.max(1, Math.ceil(filtered.length / query.pageSize));
  const page = Math.min(query.page, totalPages);
  const start = (page - 1) * query.pageSize;

  return {
    period: getCurrentPayrollPeriod(),
    records: filtered.slice(start, start + query.pageSize),
    summary: getSummary(snapshot.records),
    total: filtered.length,
    page,
    pageSize: query.pageSize,
    hasNext: page < totalPages,
    periodOptions: getPeriods(snapshot.records),
    batchStatusOptions: [...payrollBatchStatuses],
    transferStatusOptions: [...payrollTransferStatuses],
    resultStatusOptions: [...payrollResultStatuses],
    providerNote: `History is derived from persistent Payroll Batches, Handoffs, and Results. ${payrollIntegrationProviderNote}`,
  };
}

export async function getPayrollHistoryDetail(batchId: string): Promise<PayrollHistoryDetail | null> {
  const snapshot = await loadHistorySnapshot();
  const record = snapshot.records.find((candidate) => candidate.batchId === batchId);
  const batch = snapshot.batches.find((candidate) => candidate.id === batchId);
  if (!record || !batch) return null;
  return record;
}

export type { PayrollBatchStatus, PayrollAcknowledgementStatus, PayrollTransferStatus, PayrollResultStatus };
