import "server-only";

import { formatCampusDate, formatCampusTime } from "@/lib/campus-time";
import {
  getAccountingIntegrationAdapter,
  accountingIntegrationProviderNote,
  type AccountingSubmissionPayload,
} from "@/server/accounting/accounting-integration.adapter";
import {
  getAccountingReadiness,
} from "@/server/accounting/accounting-readiness.service";
import {
  getPayrollHandoffByTransferId,
} from "@/server/repositories/payroll-handoffs/payroll-handoff.repository";
import {
  getPayrollResultById,
  listPayrollResults,
  PayrollResultDataError,
} from "@/server/repositories/payroll-results/payroll-result.repository";
import {
  accountingAdapterProvider,
  AccountingTransferConflictError,
  AccountingTransferDataError,
  AccountingTransferNotFoundError,
  claimAccountingTransfer,
  getAccountingTransferById,
  listAccountingTransfers,
  updateAccountingTransferResult,
  writeAccountingTransferAuditEvent,
} from "@/server/repositories/accounting-transfers/accounting-transfer.repository";
import {
  getAccountingTransferLabel,
  getAccountingTransferTone,
} from "@/data/accounting/approved-payroll";
import { getAccountingApprovedPayrollItem } from "@/server/accounting/accounting-approved-payroll.service";
import type {
  AccountingIntegrationStatusData,
  AccountingIntegrationStatusQuery,
  AccountingTransferRecord,
  AccountingTransferStatus,
  AccountingTransferView,
} from "@/types/accounting-transfers";
import type { AccountingApprovedPayrollItem } from "@/types/accounting-approved-payroll";
import type { PayrollResultRecord } from "@/types/payroll-results";
import type { SessionUser } from "@/types/auth";

export class AccountingTransferValidationError extends Error {
  readonly code = "ACCOUNTING_TRANSFER_VALIDATION_FAILED";

  constructor(message: string) {
    super(message);
    this.name = "AccountingTransferValidationError";
  }
}

export class AccountingTransferUnavailableError extends Error {
  readonly code = "ACCOUNTING_TRANSFER_UNAVAILABLE";

  constructor() {
    super("Accounting transfer data is temporarily unavailable.");
    this.name = "AccountingTransferUnavailableError";
  }
}

function isInProgress(status: AccountingTransferStatus) {
  return status === "preparing" || status === "submitting";
}

function isSuccessful(transfer: AccountingTransferRecord) {
  return transfer.transferStatus === "submitted"
    && transfer.acknowledgementStatus === "accepted";
}

function isAwaitingAcknowledgement(transfer: AccountingTransferRecord) {
  return transfer.transferStatus === "submitted"
    && transfer.acknowledgementStatus === "pending";
}

function buildTransferView(transfer: AccountingTransferRecord): AccountingTransferView {
  const updatedAt = new Date(transfer.updatedAt);
  return {
    transferId: transfer.transferId,
    payrollResultId: transfer.payrollResultId,
    transactionReference: transfer.transferId,
    payrollReference: transfer.externalPayrollReference,
    period: transfer.period.label,
    date: formatCampusDate(updatedAt),
    time: formatCampusTime(updatedAt),
    records: String(transfer.employeeCount),
    amount: "Not returned by Payroll",
    result: getAccountingTransferLabel(transfer.transferStatus),
    resultTone: getAccountingTransferTone(transfer.transferStatus),
    status: getAccountingTransferLabel(transfer.transferStatus),
    tone: getAccountingTransferTone(transfer.transferStatus),
    acknowledgement: transfer.acknowledgementStatus === "accepted"
      ? "Received by Accounting adapter"
      : transfer.acknowledgementStatus === "rejected"
        ? "Rejected by Accounting adapter"
        : transfer.acknowledgementStatus === "pending"
          ? "Awaiting acknowledgement"
          : "No acknowledgement received",
    error: transfer.failureSummary,
  };
}

function matchesSearch(transfer: AccountingTransferRecord, search: string) {
  const normalized = search.trim().toLowerCase();
  if (!normalized) return true;
  return [
    transfer.transferId,
    transfer.payrollResultId,
    transfer.payrollBatchId,
    transfer.payrollHandoffId,
    transfer.externalPayrollReference,
    transfer.externalAccountingReference,
    transfer.period.label,
  ].some((value) => value?.toLowerCase().includes(normalized));
}

function buildConnectionStatuses(transfers: readonly AccountingTransferRecord[]) {
  const latest = transfers[0];
  const latestSync = latest ? formatCampusDateTime(latest.updatedAt) : "No transfer recorded";
  return [
    {
      system: "Existing Payroll System",
      status: "Connected · Read-only source",
      tone: "success" as const,
      lastSync: latestSync,
      details: "Reads persisted Payroll Result snapshots only.",
    },
    {
      system: "Accounting Integration Service",
      status: "Operational · Simulated adapter",
      tone: "success" as const,
      lastSync: latestSync,
      details: `${transfers.length} persisted transfer record${transfers.length === 1 ? "" : "s"}.`,
    },
    {
      system: "Existing Accounting System",
      status: "Not connected · No live API",
      tone: "warning" as const,
      lastSync: "No live sync",
      details: "Transfers use the configured deterministic simulated adapter.",
    },
  ];
}

function formatCampusDateTime(value: string) {
  const date = new Date(value);
  return `${formatCampusDate(date)} · ${formatCampusTime(date)}`;
}

export function getAccountingIntegrationStatusSummary(
  readyRecords: readonly AccountingApprovedPayrollItem[],
  transfers: readonly AccountingTransferRecord[],
) {
  return {
    readyForTransfer: readyRecords.filter((record) => {
      const transfer = transfers.find((item) => item.payrollResultId === record.payrollResultId);
      return !transfer || (!isSuccessful(transfer) && !isInProgress(transfer.transferStatus));
    }).length,
    inProgress: transfers.filter((transfer) => isInProgress(transfer.transferStatus)).length,
    successfulTransfers: transfers.filter(isSuccessful).length,
    awaitingAcknowledgement: transfers.filter(isAwaitingAcknowledgement).length,
    failedTransfers: transfers.filter((transfer) => transfer.transferStatus === "failed").length,
  };
}

export function getDefaultAccountingIntegrationStatusQuery(): AccountingIntegrationStatusQuery {
  return { search: "", transferStatus: null, page: 1, pageSize: 5 };
}

export async function getAccountingIntegrationStatusData(
  query: AccountingIntegrationStatusQuery = getDefaultAccountingIntegrationStatusQuery(),
): Promise<AccountingIntegrationStatusData> {
  if (query.page < 1 || query.pageSize < 1 || query.pageSize > 50) {
    throw new AccountingTransferValidationError("The Accounting transfer pagination values are invalid.");
  }

  const [results, transfers] = await Promise.all([listPayrollResults(), listAccountingTransfers()]);
  const approvedRecords = await Promise.all(results.map((result) => getAccountingApprovedPayrollItem(result, transfers)));
  const readyRecords = approvedRecords.filter((record) => record.accountingReadiness.status === "ready");
  const filteredTransfers = transfers.filter((transfer) => (
    (!query.transferStatus || transfer.transferStatus === query.transferStatus)
    && matchesSearch(transfer, query.search)
  ));
  const totalPages = Math.max(1, Math.ceil(filteredTransfers.length / query.pageSize));
  const page = Math.min(query.page, totalPages);
  const start = (page - 1) * query.pageSize;
  const pageTransfers = filteredTransfers.slice(start, start + query.pageSize);

  return {
    readyRecords: readyRecords.filter((record) => {
      const transfer = transfers.find((item) => item.payrollResultId === record.payrollResultId);
      return !transfer || (!isSuccessful(transfer) && !isInProgress(transfer.transferStatus));
    }),
    transfers: pageTransfers,
    attention: pageTransfers
      .filter((transfer) => transfer.transferStatus === "failed")
      .map(buildTransferView),
    history: pageTransfers.map(buildTransferView),
    connectionStatuses: buildConnectionStatuses(transfers),
    summary: getAccountingIntegrationStatusSummary(readyRecords, transfers),
    total: filteredTransfers.length,
    page,
    pageSize: query.pageSize,
    totalPages,
    hasNext: page < totalPages,
    transferStatusOptions: ["preparing", "submitting", "submitted", "failed"],
    providerNote: accountingIntegrationProviderNote,
  };
}

export async function getAccountingTransferDetail(transferId: string) {
  const transfer = await getAccountingTransferById(transferId);
  if (!transfer) return null;
  return transfer;
}

export async function submitAccountingTransfer(input: {
  payrollResultId: string;
  actor: Pick<SessionUser, "uid" | "username" | "displayName" | "role">;
}) {
  const result = await getPayrollResultById(input.payrollResultId);
  if (!result) {
    throw new AccountingTransferValidationError("The selected Payroll Result could not be found.");
  }

  const readiness = getAccountingReadiness(result);
  if (readiness.status !== "ready") {
    throw new AccountingTransferValidationError(
      `This Payroll Result is blocked from Accounting transfer: ${readiness.reasons.join(" ")}`,
    );
  }

  const handoff = await getPayrollHandoffByTransferId(result.transferId);
  if (!handoff) {
    throw new AccountingTransferValidationError("The Payroll handoff record for this result could not be found.");
  }

  const claimed = await claimAccountingTransfer({
    payrollResultId: result.resultId,
    payrollBatchId: result.batchId,
    payrollHandoffId: handoff.transferId,
    period: result.period,
    externalPayrollReference: result.externalPayrollReference,
    employeeCount: result.employeeCount,
    payrollResultStatus: result.status,
    actor: input.actor,
  });

  await writeAccountingTransferAuditEvent({
    transfer: claimed,
    action: claimed.attemptCount === 1 ? "Transfer Created" : "Submitted",
    occurredAt: claimed.submittedAt,
  });

  const payload: AccountingSubmissionPayload = {
    transferId: claimed.transferId,
    payrollResultId: result.resultId,
    payrollBatchId: result.batchId,
    payrollHandoffId: handoff.transferId,
    period: result.period,
    externalPayrollReference: result.externalPayrollReference,
    employeeCount: result.employeeCount,
    payrollResultStatus: result.status,
  };

  let response;
  try {
    response = await getAccountingIntegrationAdapter().submitPayrollResult(payload);
  } catch {
    const failed = await updateAccountingTransferResult({
      transferId: claimed.transferId,
      transferStatus: "failed",
      acknowledgementStatus: "not_received",
      provider: accountingAdapterProvider,
      failureCode: "ADAPTER_UNAVAILABLE",
      failureSummary: "The Accounting adapter did not return a response. Technical follow-up is required.",
    });
    await writeAccountingTransferAuditEvent({ transfer: failed, action: "Failed", occurredAt: failed.failedAt ?? failed.updatedAt });
    throw new AccountingTransferUnavailableError();
  }

  const updated = await updateAccountingTransferResult({
    transferId: claimed.transferId,
    transferStatus: response.accepted && response.acknowledgementStatus !== "rejected"
      ? "submitted"
      : "failed",
    acknowledgementStatus: response.acknowledgementStatus,
    provider: response.provider,
    externalAccountingReference: response.externalAccountingReference,
    failureCode: response.failureCode ?? null,
    failureSummary: response.failureSummary ?? null,
  });

  if (updated.transferStatus === "failed") {
    await writeAccountingTransferAuditEvent({ transfer: updated, action: "Failed", occurredAt: updated.failedAt ?? updated.updatedAt });
    if (updated.acknowledgementStatus === "rejected") {
      await writeAccountingTransferAuditEvent({ transfer: updated, action: "Rejected", occurredAt: updated.acknowledgedAt ?? updated.updatedAt });
    }
  } else {
    await writeAccountingTransferAuditEvent({ transfer: updated, action: "Submitted", occurredAt: updated.submittedAt });
    if (updated.acknowledgementStatus === "accepted") {
      await writeAccountingTransferAuditEvent({ transfer: updated, action: "Acknowledged", occurredAt: updated.acknowledgedAt ?? updated.updatedAt });
    }
  }

  return updated;
}

export {
  AccountingTransferConflictError,
  AccountingTransferDataError,
  AccountingTransferNotFoundError,
  PayrollResultDataError,
};
