import "server-only";

import { accountingIntegrationProviderNote } from "@/server/accounting/accounting-integration.adapter";
import {
  determineAccountingLifecycleStatus,
  getAccountingTransferCompletionTimestamp,
} from "@/server/accounting/accounting-lifecycle";
import {
  AccountingTransferDataError,
  getAccountingTransferById,
  listAccountingTransferAuditEvents,
  listAccountingTransfers,
  type AccountingTransferAuditEventRecord,
} from "@/server/repositories/accounting-transfers/accounting-transfer.repository";
import {
  getPayrollResultById,
  listPayrollResults,
  PayrollResultDataError,
} from "@/server/repositories/payroll-results/payroll-result.repository";
import type { AccountingTransferRecord } from "@/types/accounting-transfers";
import {
  accountingAcknowledgementStatuses,
  accountingTransferStatuses,
  type AccountingAcknowledgementStatus,
  type AccountingTransferStatus,
} from "@/types/accounting-transfers";
import type { PayrollResultRecord } from "@/types/payroll-results";
import type {
  AccountingTransactionHistoryData,
  AccountingTransactionHistoryDetail,
  AccountingTransactionHistoryItem,
  AccountingTransactionHistoryQuery,
} from "@/types/accounting-transaction-history";

export class AccountingTransactionHistoryValidationError extends Error {
  readonly code = "ACCOUNTING_TRANSACTION_HISTORY_QUERY_INVALID";

  constructor(message: string) {
    super(message);
    this.name = "AccountingTransactionHistoryValidationError";
  }
}

function getIssueSummary(
  transfer: AccountingTransferRecord,
  lifecycleStatus: AccountingTransactionHistoryItem["lifecycleStatus"],
) {
  if (transfer.failureSummary) return transfer.failureSummary;
  if (lifecycleStatus === "Rejected") return "The Accounting acknowledgement was rejected.";
  if (lifecycleStatus === "Failed") {
    return transfer.failureCode
      ? `The Accounting transfer failed with code ${transfer.failureCode}.`
      : "The Accounting transfer failed without a provider summary.";
  }
  if (lifecycleStatus === "Not Received") {
    return "The Accounting System has not acknowledged this transfer.";
  }
  return null;
}

function toHistoryItem(
  transfer: AccountingTransferRecord,
  result: PayrollResultRecord | null = null,
): AccountingTransactionHistoryItem {
  const lifecycleStatus = determineAccountingLifecycleStatus(transfer);
  const issueSummary = getIssueSummary(transfer, lifecycleStatus);

  return {
    transferId: transfer.transferId,
    payrollResultId: transfer.payrollResultId,
    payrollBatchId: transfer.payrollBatchId,
    payrollHandoffId: transfer.payrollHandoffId,
    payrollPeriod: transfer.period,
    payrollReference: transfer.externalPayrollReference,
    payrollResultStatus: result?.status ?? null,
    accountingReference: transfer.externalAccountingReference,
    submittedBy: transfer.submittedBy,
    submittedAt: transfer.submittedAt,
    preparedAt: transfer.preparedAt,
    preparedBy: transfer.preparedBy,
    transferStatus: transfer.transferStatus,
    acknowledgementStatus: transfer.acknowledgementStatus,
    lifecycleStatus,
    completedAt: getAccountingTransferCompletionTimestamp(transfer),
    employeeCount: transfer.employeeCount,
    provider: transfer.provider,
    attemptCount: transfer.attemptCount,
    issueSummary,
    hasIssue: lifecycleStatus === "Failed"
      || lifecycleStatus === "Rejected"
      || lifecycleStatus === "Not Received"
      || Boolean(issueSummary),
  };
}

function matchesSearch(item: AccountingTransactionHistoryItem, search: string) {
  const normalizedSearch = search.trim().toLowerCase();
  if (!normalizedSearch) return true;

  return [
    item.transferId,
    item.payrollResultId,
    item.payrollBatchId,
    item.payrollHandoffId,
    item.payrollReference,
    item.accountingReference,
    item.payrollPeriod.label,
    item.submittedBy.displayName,
    item.submittedBy.username,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase()
    .includes(normalizedSearch);
}

function matchesQuery(
  item: AccountingTransactionHistoryItem,
  query: AccountingTransactionHistoryQuery,
) {
  return matchesSearch(item, query.search)
    && (!query.periodStart || item.payrollPeriod.start === query.periodStart)
    && (!query.transferStatus || item.transferStatus === query.transferStatus)
    && (!query.acknowledgementStatus || item.acknowledgementStatus === query.acknowledgementStatus);
}

function getPeriodOptions(records: readonly AccountingTransactionHistoryItem[]) {
  return Array.from(
    new Map(records.map((record) => [record.payrollPeriod.start, record.payrollPeriod])).values(),
  ).sort((left, right) => right.start.localeCompare(left.start));
}

function getSummary(records: readonly AccountingTransactionHistoryItem[]) {
  const completed = records.filter((record) => record.lifecycleStatus === "Completed");

  return {
    totalTransfers: records.length,
    successfulTransfers: completed.length,
    awaitingAcknowledgement: records.filter(
      (record) => record.lifecycleStatus === "Awaiting Acknowledgement",
    ).length,
    failedOrRejected: records.filter(
      (record) => record.lifecycleStatus === "Failed"
        || record.lifecycleStatus === "Rejected"
        || record.lifecycleStatus === "Not Received",
    ).length,
    latestCompletedPeriod: completed
      .slice()
      .sort((left, right) => (right.completedAt ?? "").localeCompare(left.completedAt ?? ""))[0]
      ?.payrollPeriod.label ?? null,
  };
}

function mapPayrollResult(result: PayrollResultRecord | null) {
  if (!result) return null;

  return {
    resultId: result.resultId,
    batchId: result.batchId,
    transferId: result.transferId,
    period: result.period,
    externalPayrollReference: result.externalPayrollReference,
    status: result.status,
    provider: result.provider,
    employeeCount: result.employeeCount,
    processedCount: result.processedCount,
    pendingCount: result.pendingCount,
    rejectedCount: result.rejectedCount,
    failedCount: result.failedCount,
    payslipAvailableCount: result.payslipAvailableCount,
    receivedAt: result.receivedAt,
    processedAt: result.processedAt,
    completedAt: result.completedAt,
  };
}

function mapAuditTimeline(
  events: readonly AccountingTransferAuditEventRecord[],
  fallback: AccountingTransferRecord["timeline"],
) {
  if (events.length === 0) return fallback;

  return events.map((event) => ({
    id: event.id,
    label: event.action,
    occurredAt: event.occurredAt,
  }));
}

async function loadHistoryRecords() {
  const [transfers, results] = await Promise.all([
    listAccountingTransfers(),
    listPayrollResults(),
  ]);
  const resultsById = new Map(results.map((result) => [result.resultId, result]));
  const records = transfers
    .map((transfer) => toHistoryItem(transfer, resultsById.get(transfer.payrollResultId) ?? null))
    .sort((left, right) => right.submittedAt.localeCompare(left.submittedAt)
      || right.transferId.localeCompare(left.transferId));

  return { transfers, records };
}

export function getDefaultAccountingTransactionHistoryQuery(): AccountingTransactionHistoryQuery {
  return {
    search: "",
    periodStart: null,
    transferStatus: null,
    acknowledgementStatus: null,
    page: 1,
    pageSize: 5,
  };
}

export async function getAccountingTransactionHistoryData(
  query: AccountingTransactionHistoryQuery = getDefaultAccountingTransactionHistoryQuery(),
): Promise<AccountingTransactionHistoryData> {
  if (query.page < 1 || query.pageSize < 1 || query.pageSize > 50) {
    throw new AccountingTransactionHistoryValidationError(
      "The Accounting transaction history pagination values are invalid.",
    );
  }

  const { records } = await loadHistoryRecords();
  const filteredRecords = records.filter((record) => matchesQuery(record, query));
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / query.pageSize));
  const page = Math.min(query.page, totalPages);
  const start = (page - 1) * query.pageSize;

  return {
    records: filteredRecords.slice(start, start + query.pageSize),
    summary: getSummary(records),
    total: filteredRecords.length,
    page,
    pageSize: query.pageSize,
    totalPages,
    hasNext: page < totalPages,
    periodOptions: getPeriodOptions(records),
    transferStatusOptions: [...accountingTransferStatuses],
    acknowledgementStatusOptions: [...accountingAcknowledgementStatuses],
    providerNote: `History is derived from persistent Accounting Transfer records and Payroll Result snapshots. ${accountingIntegrationProviderNote}`,
  };
}

export async function getAccountingTransactionHistoryDetail(
  transferId: string,
): Promise<AccountingTransactionHistoryDetail | null> {
  const transfer = await getAccountingTransferById(transferId);
  if (!transfer) return null;

  const [result, auditEvents] = await Promise.all([
    getPayrollResultById(transfer.payrollResultId),
    listAccountingTransferAuditEvents(transfer.transferId),
  ]);
  const item = toHistoryItem(transfer, result);

  return {
    ...item,
    createdAt: transfer.createdAt,
    acknowledgedAt: transfer.acknowledgedAt,
    failedAt: transfer.failedAt,
    updatedAt: transfer.updatedAt,
    failureCode: transfer.failureCode,
    timeline: mapAuditTimeline(auditEvents, transfer.timeline),
    payrollResult: mapPayrollResult(result),
  };
}

export {
  AccountingTransferDataError,
  PayrollResultDataError,
};

export type {
  AccountingAcknowledgementStatus,
  AccountingTransferStatus,
};
