import "server-only";

import { formatCampusDate, formatCampusTime } from "@/lib/campus-time";
import { upsertPayrollPayslipFromResult } from "@/server/repositories/payroll/payslip.repository";
import {
  getPayrollResultById,
  listPayrollResultItems,
  listPayrollResults,
  PayrollResultConflictError,
  PayrollResultDataError,
  upsertPayrollResult,
  writePayrollResultAuditEvents,
} from "@/server/repositories/payroll-results/payroll-result.repository";
import type { PayrollBatchItemSnapshot } from "@/types/payroll-batches";
import type {
  PayrollExternalPayslipStatus,
  PayrollExternalProcessingStatus,
  PayrollExternalResult,
} from "@/types/payroll-handoff";
import type {
  PayrollResultItem,
  PayrollResultRecord,
  PayrollResultsData,
  PayrollResultsQuery,
  PayrollResultStatus,
} from "@/types/payroll-results";

export class PayrollResultValidationError extends Error {
  readonly code = "PAYROLL_RESULT_VALIDATION_ERROR";

  constructor(message: string) {
    super(message);
    this.name = "PayrollResultValidationError";
  }
}

export function getDefaultPayrollResultsQuery(): PayrollResultsQuery {
  return {
    search: "",
    periodStart: null,
    status: null,
    department: null,
    page: 1,
    pageSize: 5,
  };
}

function isFinalResultStatus(status: PayrollResultStatus) {
  return status !== "processing";
}

function validateResultItems(
  snapshot: readonly PayrollBatchItemSnapshot[],
  result: PayrollExternalResult,
) {
  if (!result.items.length || result.items.length !== snapshot.length) {
    throw new PayrollResultValidationError("The returned payroll result does not match the submitted batch size.");
  }

  const snapshotByEmployeeId = new Map(snapshot.map((item) => [item.employeeId, item]));
  const seenEmployeeIds = new Set<string>();

  for (const item of result.items) {
    const source = snapshotByEmployeeId.get(item.employeeId);
    if (!source || seenEmployeeIds.has(item.employeeId)) {
      throw new PayrollResultValidationError("The returned payroll result contains an unknown or duplicate employee.");
    }
    if (!item.externalEmployeeReference.trim()) {
      throw new PayrollResultValidationError("The returned payroll result is missing an employee reference.");
    }
    if (item.payslipStatus === "available" && (!item.payslipId || !item.externalPayrollReference)) {
      throw new PayrollResultValidationError("An available payslip result must include stable payroll references.");
    }
    seenEmployeeIds.add(item.employeeId);
  }
}

function countStatuses(result: PayrollExternalResult) {
  return {
    processedCount: result.items.filter((item) => item.processingStatus === "processed").length,
    pendingCount: result.items.filter((item) => item.processingStatus === "pending").length,
    rejectedCount: result.items.filter((item) => item.processingStatus === "rejected").length,
    failedCount: result.items.filter((item) => item.processingStatus === "failed").length,
    payslipAvailableCount: result.items.filter((item) => item.payslipStatus === "available").length,
  };
}

function toResultItem(input: {
  resultId: string;
  batchId: string;
  transferId: string;
  period: PayrollResultRecord["period"];
  source: PayrollBatchItemSnapshot;
  returned: {
    externalEmployeeReference: string;
    externalPayrollReference: string | null;
    processingStatus: PayrollExternalProcessingStatus;
    payslipStatus: PayrollExternalPayslipStatus;
    payslipId: string | null;
    issueCode: string | null;
    issueSummary: string | null;
  };
  receivedAt: string;
}): PayrollResultItem {
  return {
    id: `${input.resultId}:${input.source.employeeId}`,
    resultId: input.resultId,
    batchId: input.batchId,
    transferId: input.transferId,
    employeeId: input.source.employeeId,
    employeeName: input.source.employeeName,
    department: input.source.department,
    period: input.period,
    externalEmployeeReference: input.returned.externalEmployeeReference,
    externalPayrollReference: input.returned.externalPayrollReference,
    processingStatus: input.returned.processingStatus,
    payslipStatus: input.returned.payslipStatus,
    payslipId: input.returned.payslipId,
    releasedAt: input.returned.payslipStatus === "available" ? input.receivedAt : null,
    processedAt: input.returned.processingStatus === "processed" ? input.receivedAt : null,
    issueCode: input.returned.issueCode,
    issueSummary: input.returned.issueSummary,
  };
}

export async function ingestPayrollResult(input: {
  batchSnapshot: readonly PayrollBatchItemSnapshot[];
  handoff: {
    resultId: string;
    batchId: string;
    transferId: string;
    period: PayrollResultRecord["period"];
    provider: string;
    externalReference: string;
  };
  result: PayrollExternalResult;
  receivedAt?: Date;
}): Promise<PayrollResultRecord> {
  if (input.result.batchId !== input.handoff.batchId || input.result.transferId !== input.handoff.transferId) {
    throw new PayrollResultValidationError("The returned payroll result is not associated with this handoff.");
  }
  if (!input.handoff.externalReference) {
    throw new PayrollResultValidationError("A payroll result requires an accepted external handoff reference.");
  }

  validateResultItems(input.batchSnapshot, input.result);
  const now = (input.receivedAt ?? new Date()).toISOString();
  const counts = countStatuses(input.result);
  const result: PayrollResultRecord = {
    resultId: input.handoff.resultId,
    batchId: input.handoff.batchId,
    transferId: input.handoff.transferId,
    period: input.handoff.period,
    externalPayrollReference: input.result.externalResultReference,
    status: input.result.status,
    provider: input.handoff.provider,
    employeeCount: input.result.items.length,
    ...counts,
    receivedAt: now,
    processedAt: counts.processedCount > 0 ? now : null,
    completedAt: isFinalResultStatus(input.result.status) ? now : null,
    createdAt: now,
    updatedAt: now,
  };
  const items = input.batchSnapshot.map((snapshot) => {
    const returned = input.result.items.find((item) => item.employeeId === snapshot.employeeId);
    if (!returned) throw new PayrollResultValidationError("The returned payroll result is missing a submitted employee.");
    return toResultItem({
      resultId: result.resultId,
      batchId: result.batchId,
      transferId: result.transferId,
      period: result.period,
      source: snapshot,
      returned,
      receivedAt: now,
    });
  });

  await upsertPayrollResult({ result, items });

  for (const item of items) {
    if (item.payslipStatus !== "available" || !item.payslipId || !item.externalPayrollReference || !item.releasedAt) {
      continue;
    }
    await upsertPayrollPayslipFromResult({
      id: item.payslipId,
      employeeId: item.employeeId,
      periodStart: item.period.start,
      periodEnd: item.period.end,
      payrollReference: item.externalPayrollReference,
      releasedAt: item.releasedAt,
    });
  }

  await writePayrollResultAuditEvents({ result, items, receivedAt: now });
  return result;
}

export async function getPayrollResultDetail(resultId: string) {
  const result = await getPayrollResultById(resultId);
  if (!result) return null;
  return {
    result,
    items: await listPayrollResultItems(resultId),
  };
}

function matchesQuery(item: PayrollResultItem, query: PayrollResultsQuery) {
  const search = query.search.trim().toLowerCase();
  return (!search
    || item.employeeName.toLowerCase().includes(search)
    || item.employeeId.toLowerCase().includes(search)
    || item.department.toLowerCase().includes(search)
    || item.externalEmployeeReference.toLowerCase().includes(search)
    || item.externalPayrollReference?.toLowerCase().includes(search))
    && (!query.periodStart || item.period.start === query.periodStart)
    && (!query.status || item.processingStatus === query.status)
    && (!query.department || item.department === query.department);
}

function getPeriods(results: readonly PayrollResultRecord[]) {
  const periods = new Map(results.map((result) => [result.period.start, result.period]));
  return Array.from(periods.values()).sort((left, right) => right.start.localeCompare(left.start));
}

function getDepartments(items: readonly PayrollResultItem[]) {
  return Array.from(new Set(items.map((item) => item.department))).sort((left, right) => left.localeCompare(right));
}

function formatNoticeDate(value: string) {
  const date = new Date(value);
  return { date: formatCampusDate(date), time: formatCampusTime(date) };
}

function buildNotices(results: readonly PayrollResultRecord[], itemsByResultId: ReadonlyMap<string, readonly PayrollResultItem[]>) {
  return results
    .slice()
    .sort((left, right) => right.receivedAt.localeCompare(left.receivedAt))
    .slice(0, 5)
    .map((result) => {
      const items = itemsByResultId.get(result.resultId) ?? [];
      const { date, time } = formatNoticeDate(result.receivedAt);
      const issueCount = items.filter((item) => item.processingStatus === "rejected" || item.processingStatus === "failed").length;
      if (result.status === "completed" && issueCount === 0) {
        return {
          id: `${result.resultId}:completed`,
          tone: "success" as const,
          title: `Batch ${result.batchId} returned successfully.`,
          description: `${result.payslipAvailableCount} payslip${result.payslipAvailableCount === 1 ? " is" : "s are"} available for employees.`,
          date,
          time,
        };
      }
      if (result.status === "processing" || items.some((item) => item.processingStatus === "pending")) {
        return {
          id: `${result.resultId}:pending`,
          tone: "warning" as const,
          title: `Batch ${result.batchId} has pending results.`,
          description: `${result.pendingCount} employee result${result.pendingCount === 1 ? " is" : "s are"} awaiting completion.`,
          date,
          time,
        };
      }
      return {
        id: `${result.resultId}:issues`,
        tone: result.status === "failed" || result.status === "rejected" ? "danger" as const : "warning" as const,
        title: `Batch ${result.batchId} returned with issues.`,
        description: `${result.rejectedCount + result.failedCount} employee result${result.rejectedCount + result.failedCount === 1 ? " requires" : "s require"} follow-up.`,
        date,
        time,
      };
    });
}

export async function getPayrollResultsData(
  query: PayrollResultsQuery = getDefaultPayrollResultsQuery(),
): Promise<PayrollResultsData> {
  if (query.page < 1 || query.pageSize < 1 || query.pageSize > 50) {
    throw new PayrollResultValidationError("The payroll result pagination values are invalid.");
  }

  const results = await listPayrollResults();
  const detailedItems = await Promise.all(results.map(async (result) => (
    [result.resultId, await listPayrollResultItems(result.resultId)] as const
  )));
  const itemsByResultId = new Map(detailedItems);
  const allItems = detailedItems.flatMap(([, items]) => items);
  const matchingItems = allItems.filter((item) => matchesQuery(item, query));
  const totalPages = Math.max(1, Math.ceil(matchingItems.length / query.pageSize));
  const page = Math.min(query.page, totalPages);
  const start = (page - 1) * query.pageSize;
  const records = matchingItems.slice(start, start + query.pageSize);
  const summaryItems = query.periodStart
    ? allItems.filter((item) => item.period.start === query.periodStart)
    : allItems;
  const latestResult = results[0] ?? null;
  const batchResults = results.slice(0, 10).map((result) => ({
    id: result.batchId,
    period: result.period,
    employees: result.employeeCount,
    returnedAt: result.completedAt ?? result.receivedAt,
    resultStatus: result.status,
    payslipsAvailable: result.payslipAvailableCount,
    resultId: result.resultId,
    transferId: result.transferId,
  }));
  const summary = {
    processedEmployees: summaryItems.filter((item) => item.processingStatus === "processed").length,
    payslipsAvailable: summaryItems.filter((item) => item.payslipStatus === "available").length,
    pendingResults: summaryItems.filter((item) => item.processingStatus === "pending").length,
    failedOrRejected: summaryItems.filter((item) => item.processingStatus === "failed" || item.processingStatus === "rejected").length,
    completedBatches: results.filter((result) => result.status === "completed" || result.status === "completed_with_issues").length,
  };

  return {
    period: latestResult?.period ?? { start: "", end: "", label: "No payroll result period available" },
    currentResult: latestResult,
    records,
    batchResults,
    notices: buildNotices(results, itemsByResultId),
    summary,
    total: matchingItems.length,
    page,
    pageSize: query.pageSize,
    hasNext: page < totalPages,
    periodOptions: getPeriods(results),
    departmentOptions: getDepartments(allItems),
    providerNote: "Results are returned by the configured Payroll Integration Adapter. No salary or deduction calculations are performed in SIA.",
  };
}

export {
  PayrollResultConflictError,
  PayrollResultDataError,
};
