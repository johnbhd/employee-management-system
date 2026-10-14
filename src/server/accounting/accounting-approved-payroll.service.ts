import "server-only";

import {
  listPayrollResults,
  PayrollResultDataError,
} from "@/server/repositories/payroll-results/payroll-result.repository";
import {
  listAccountingTransfers,
} from "@/server/repositories/accounting-transfers/accounting-transfer.repository";
import { getAccountingReadiness } from "@/server/accounting/accounting-readiness.service";
import {
  accountingReadinessStatuses,
  accountingApprovedPayrollTransferStatuses,
  type AccountingApprovedPayrollData,
  type AccountingApprovedPayrollItem,
  type AccountingApprovedPayrollQuery,
  type AccountingApprovedPayrollSummary,
} from "@/types/accounting-approved-payroll";
import type { AccountingTransferRecord } from "@/types/accounting-transfers";
import {
  payrollResultStatuses,
  type PayrollResultRecord,
} from "@/types/payroll-results";

export class AccountingApprovedPayrollValidationError extends Error {
  readonly code = "ACCOUNTING_APPROVED_PAYROLL_QUERY_INVALID";

  constructor(message: string) {
    super(message);
    this.name = "AccountingApprovedPayrollValidationError";
  }
}

export function getDefaultAccountingApprovedPayrollQuery(): AccountingApprovedPayrollQuery {
  return {
    search: "",
    periodStart: null,
    resultStatus: null,
    readinessStatus: null,
    transferStatus: null,
    page: 1,
    pageSize: 5,
  };
}

export function getAccountingApprovedPayrollItem(
  result: PayrollResultRecord,
  transfers: readonly AccountingTransferRecord[] = [],
): AccountingApprovedPayrollItem {
  const transfer = transfers.find((item) => item.payrollResultId === result.resultId);

  return {
    payrollResultId: result.resultId,
    period: result.period,
    references: {
      batchId: result.batchId,
      payrollTransferId: result.transferId,
      externalPayrollReference: result.externalPayrollReference || null,
    },
    employeeCount: result.employeeCount,
    processedCount: result.processedCount,
    pendingCount: result.pendingCount,
    rejectedCount: result.rejectedCount,
    failedCount: result.failedCount,
    payslipAvailableCount: result.payslipAvailableCount,
    payrollResultStatus: result.status,
    provider: result.provider,
    returnedAmount: {
      amount: null,
      currency: null,
    },
    accountingReadiness: getAccountingReadiness(result),
    accountingTransfer: {
      status: transfer?.transferStatus ?? "not_transferred",
      transferId: transfer?.transferId ?? null,
      acknowledgementStatus: transfer?.acknowledgementStatus ?? null,
      externalReference: transfer?.externalAccountingReference ?? null,
      failureSummary: transfer?.failureSummary ?? null,
      submittedAt: transfer?.submittedAt ?? null,
      updatedAt: transfer?.updatedAt ?? null,
    },
    receivedAt: result.receivedAt,
    completedAt: result.completedAt,
    updatedAt: result.updatedAt,
  };
}

function compareItems(
  left: AccountingApprovedPayrollItem,
  right: AccountingApprovedPayrollItem,
): number {
  const leftDate = left.completedAt ?? left.receivedAt;
  const rightDate = right.completedAt ?? right.receivedAt;

  return rightDate.localeCompare(leftDate)
    || right.payrollResultId.localeCompare(left.payrollResultId);
}

function matchesQuery(
  item: AccountingApprovedPayrollItem,
  query: AccountingApprovedPayrollQuery,
): boolean {
  const search = query.search.trim().toLowerCase();
  const searchableText = [
    item.payrollResultId,
    item.references.batchId,
    item.references.payrollTransferId,
    item.references.externalPayrollReference,
    item.period.label,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();

  return (!search || searchableText.includes(search))
    && (!query.periodStart || item.period.start === query.periodStart)
    && (!query.resultStatus || item.payrollResultStatus === query.resultStatus)
    && (!query.readinessStatus
      || item.accountingReadiness.status === query.readinessStatus)
    && (!query.transferStatus
      || item.accountingTransfer.status === query.transferStatus);
}

function getPeriodOptions(
  records: readonly AccountingApprovedPayrollItem[],
) {
  return Array.from(
    new Map(records.map((record) => [record.period.start, record.period])).values(),
  ).sort((left, right) => right.start.localeCompare(left.start));
}

function getSummary(
  records: readonly AccountingApprovedPayrollItem[],
): AccountingApprovedPayrollSummary {
  return {
    approvedPayroll: records.filter(
      (record) => record.payrollResultStatus === "completed",
    ).length,
    readyForTransfer: records.filter(
      (record) => record.accountingReadiness.status === "ready"
        && record.accountingTransfer.status !== "submitted"
        && record.accountingTransfer.status !== "preparing"
        && record.accountingTransfer.status !== "submitting",
    ).length,
    transferred: records.filter(
      (record) => record.accountingTransfer.acknowledgementStatus === "accepted",
    ).length,
    blocked: records.filter(
      (record) => record.accountingReadiness.status === "blocked",
    ).length,
  };
}

export async function getAccountingApprovedPayrollData(
  query: AccountingApprovedPayrollQuery = getDefaultAccountingApprovedPayrollQuery(),
): Promise<AccountingApprovedPayrollData> {
  if (query.page < 1 || query.pageSize < 1 || query.pageSize > 50) {
    throw new AccountingApprovedPayrollValidationError(
      "The approved payroll pagination values are invalid.",
    );
  }

  const [results, transfers] = await Promise.all([
    listPayrollResults(),
    listAccountingTransfers(),
  ]);
  const allRecords = results
    .map((result) => getAccountingApprovedPayrollItem(result, transfers))
    .sort(compareItems);
  const filteredRecords = allRecords.filter((record) => matchesQuery(record, query));
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / query.pageSize));
  const page = Math.min(query.page, totalPages);
  const start = (page - 1) * query.pageSize;

  return {
    records: filteredRecords.slice(start, start + query.pageSize),
    summary: getSummary(allRecords),
    total: filteredRecords.length,
    page,
    pageSize: query.pageSize,
    totalPages,
    hasNext: page < totalPages,
    periodOptions: getPeriodOptions(allRecords),
    resultStatusOptions: [...payrollResultStatuses],
    readinessStatusOptions: [...accountingReadinessStatuses],
    transferStatusOptions: [...accountingApprovedPayrollTransferStatuses],
    providerNote: "Approved Payroll reads persisted Payroll Result snapshots and Accounting transfer records. No payroll calculation is performed here.",
  };
}

export { PayrollResultDataError };
