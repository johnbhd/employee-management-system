import "server-only";

import { formatCampusDate, formatCampusTime } from "@/lib/campus-time";
import {
  AccountingAdapterTechnicalError,
  getAccountingIntegrationAdapter,
  accountingIntegrationProviderNote,
  type AccountingHandoffPayload,
} from "@/server/accounting/accounting-integration.adapter";
import { listPayrollResults, PayrollResultDataError } from "@/server/repositories/payroll-results/payroll-result.repository";
import {
  accountingAdapterProvider,
  AccountingTransferConflictError,
  AccountingTransferDataError,
  AccountingTransferNotFoundError,
  claimAccountingTransferForSubmission,
  getAccountingTransferById,
  listAccountingTransfers,
  updateAccountingAcknowledgement,
  updateAccountingTransferResult,
  writeAccountingTransferAuditEvent,
} from "@/server/repositories/accounting-transfers/accounting-transfer.repository";
import {
  getAccountingTransferLabel,
  getAccountingTransferTone,
} from "@/data/accounting/approved-payroll";
import { getAccountingApprovedPayrollItem } from "@/server/accounting/accounting-approved-payroll.service";
import {
  isAccountingTransferAwaitingAcknowledgement,
  isAccountingTransferSuccessful,
} from "@/server/accounting/accounting-lifecycle";
import type {
  AccountingIntegrationStatusData,
  AccountingIntegrationStatusQuery,
  AccountingTransferRecord,
  AccountingTransferStatus,
  AccountingTransferView,
} from "@/types/accounting-transfers";
import type { AccountingApprovedPayrollItem } from "@/types/accounting-approved-payroll";
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

function buildTransferView(transfer: AccountingTransferRecord): AccountingTransferView {
  const updatedAt = new Date(transfer.updatedAt);
  const hasAcknowledgementIssue = transfer.acknowledgementStatus === "rejected"
    || transfer.acknowledgementStatus === "not_received";
  const transferTone = transfer.transferStatus === "failed" || hasAcknowledgementIssue
    ? "danger" as const
    : getAccountingTransferTone(transfer.transferStatus);
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
    resultTone: transferTone,
    status: getAccountingTransferLabel(transfer.transferStatus),
    tone: transferTone,
    acknowledgement: transfer.transferStatus === "prepared"
      ? "Not submitted - local snapshot"
      : transfer.acknowledgementStatus === "accepted"
        ? "Received by Accounting adapter"
        : transfer.acknowledgementStatus === "rejected"
          ? "Rejected by Accounting adapter"
          : transfer.acknowledgementStatus === "not_received"
            ? "Not received"
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
      status: "Operational - Simulated handoff",
      tone: "success" as const,
      lastSync: latestSync,
      details: `${transfers.length} persisted transfer record${transfers.length === 1 ? "" : "s"}; handoff state is retained locally.`,
    },
    {
      system: "Existing Accounting System",
      status: "Not connected · No live API",
      tone: "warning" as const,
      lastSync: "No live sync",
      details: "The configured adapter is simulated; no live Accounting API is connected.",
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
      return !transfer;
    }).length,
    preparedTransfers: transfers.filter((transfer) => transfer.transferStatus === "prepared").length,
    inProgress: transfers.filter((transfer) => isInProgress(transfer.transferStatus)).length,
    successfulTransfers: transfers.filter(isAccountingTransferSuccessful).length,
    awaitingAcknowledgement: transfers.filter(isAccountingTransferAwaitingAcknowledgement).length,
    failedTransfers: transfers.filter((transfer) => transfer.transferStatus === "failed"
      || transfer.acknowledgementStatus === "rejected"
      || transfer.acknowledgementStatus === "not_received").length,
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
      return !transfer;
    }),
    transfers: pageTransfers,
    attention: pageTransfers
      .filter((transfer) => transfer.transferStatus === "failed"
        || transfer.acknowledgementStatus === "rejected"
        || transfer.acknowledgementStatus === "not_received")
      .map(buildTransferView),
    history: pageTransfers.map(buildTransferView),
    connectionStatuses: buildConnectionStatuses(transfers),
    summary: getAccountingIntegrationStatusSummary(readyRecords, transfers),
    total: filteredTransfers.length,
    page,
    pageSize: query.pageSize,
    totalPages,
    hasNext: page < totalPages,
    transferStatusOptions: ["preparing", "prepared", "submitting", "submitted", "failed"],
    providerNote: accountingIntegrationProviderNote,
  };
}

export async function getAccountingTransferDetail(transferId: string) {
  const transfer = await getAccountingTransferById(transferId);
  if (!transfer) return null;
  return transfer;
}

function buildHandoffPayload(transfer: AccountingTransferRecord): AccountingHandoffPayload {
  if (!transfer.snapshot || !transfer.preparedAt) {
    throw new AccountingTransferConflictError(
      "This Accounting transfer has no immutable prepared snapshot to submit.",
    );
  }

  return {
    transfer: {
      transferReference: transfer.transferId,
      preparedAt: transfer.preparedAt,
      idempotencyKey: transfer.transferId,
    },
    payroll: {
      batchReference: transfer.snapshot.payroll.payrollBatchId,
      payrollResultReference: transfer.snapshot.payroll.payrollResultId,
      externalPayrollReference: transfer.snapshot.payroll.externalPayrollReference,
      periodStart: transfer.snapshot.payroll.periodStart,
      periodEnd: transfer.snapshot.payroll.periodEnd,
      resultStatus: transfer.snapshot.payroll.resultStatus,
    },
    summary: transfer.snapshot.summary,
    source: transfer.snapshot.source,
    items: transfer.snapshot.items,
  };
}

function toAcknowledgementEvent(
  transfer: AccountingTransferRecord,
) {
  if (transfer.acknowledgementStatus === "accepted") return "Acknowledged" as const;
  if (transfer.acknowledgementStatus === "rejected") return "Rejected" as const;
  return null;
}

async function runAccountingTransferSubmission(input: {
  transferId: string;
  actor: Pick<SessionUser, "uid" | "username" | "displayName" | "role">;
  mode: "initial" | "retry";
}) {
  const claimed = await claimAccountingTransferForSubmission({
    transferId: input.transferId,
    actor: input.actor,
    mode: input.mode,
  });
  const payload = buildHandoffPayload(claimed);

  let response;
  try {
    response = await getAccountingIntegrationAdapter().submitTransfer(payload);
  } catch (error) {
    const failureCode = error instanceof AccountingAdapterTechnicalError
      ? error.code
      : "ACCOUNTING_ADAPTER_UNAVAILABLE";

    const failed = await updateAccountingTransferResult({
      transferId: claimed.transferId,
      transferStatus: "failed",
      acknowledgementStatus: "not_received",
      provider: accountingAdapterProvider,
      failureCode,
      failureSummary: "The Accounting adapter did not return a response. Technical follow-up is required.",
    });
    await writeAccountingTransferAuditEvent({
      transfer: failed,
      action: "Failed",
      occurredAt: failed.failedAt ?? failed.updatedAt,
    });
    throw new AccountingTransferUnavailableError();
  }

  const updated = await updateAccountingTransferResult({
    transferId: claimed.transferId,
    transferStatus: "submitted",
    acknowledgementStatus: response.acknowledgementStatus,
    provider: response.provider,
    externalAccountingReference: response.externalAccountingReference,
    failureCode: response.failureCode ?? null,
    failureSummary: response.failureSummary ?? null,
  });

  await writeAccountingTransferAuditEvent({
    transfer: updated,
    action: "Submitted",
    occurredAt: updated.submittedAt,
  });

  const acknowledgementEvent = toAcknowledgementEvent(updated);
  if (acknowledgementEvent) {
    await writeAccountingTransferAuditEvent({
      transfer: updated,
      action: acknowledgementEvent,
      occurredAt: updated.acknowledgedAt ?? updated.updatedAt,
    });
  }

  return updated;
}

export async function submitAccountingTransfer(input: {
  transferId: string;
  actor: Pick<SessionUser, "uid" | "username" | "displayName" | "role">;
}) {
  return runAccountingTransferSubmission({
    ...input,
    mode: "initial",
  });
}

export async function retryAccountingTransfer(input: {
  transferId: string;
  actor: Pick<SessionUser, "uid" | "username" | "displayName" | "role">;
}) {
  return runAccountingTransferSubmission({
    ...input,
    mode: "retry",
  });
}

export async function checkAccountingAcknowledgement(input: {
  transferId: string;
}) {
  const transfer = await getAccountingTransferById(input.transferId);
  if (!transfer) {
    throw new AccountingTransferNotFoundError();
  }

  if (transfer.transferStatus !== "submitted") {
    throw new AccountingTransferConflictError(
      "Only a submitted Accounting transfer can be checked for acknowledgement.",
    );
  }

  let response;
  try {
    response = await getAccountingIntegrationAdapter().checkAcknowledgement({
      transferReference: transfer.transferId,
      externalAccountingReference: transfer.externalAccountingReference,
      idempotencyKey: transfer.transferId,
    });
  } catch {
    throw new AccountingTransferUnavailableError();
  }

  const updated = await updateAccountingAcknowledgement({
    transferId: transfer.transferId,
    acknowledgementStatus: response.acknowledgementStatus,
    provider: response.provider,
    externalAccountingReference: response.externalAccountingReference,
    failureCode: response.failureCode ?? null,
    failureSummary: response.failureSummary ?? null,
  });

  const acknowledgementEvent = toAcknowledgementEvent(updated);
  if (acknowledgementEvent) {
    await writeAccountingTransferAuditEvent({
      transfer: updated,
      action: acknowledgementEvent,
      occurredAt: updated.acknowledgedAt ?? updated.updatedAt,
    });
  }

  return updated;
}

export {
  AccountingTransferConflictError,
  AccountingTransferDataError,
  AccountingTransferNotFoundError,
  PayrollResultDataError,
};
