import type { AccountingTransferRecord } from "@/types/accounting-transfers";
import type { AccountingHistoryLifecycleStatus } from "@/types/accounting-transaction-history";

export function determineAccountingLifecycleStatus(
  transfer: Pick<AccountingTransferRecord, "transferStatus" | "acknowledgementStatus">,
): AccountingHistoryLifecycleStatus {
  if (transfer.transferStatus === "failed") {
    return transfer.acknowledgementStatus === "rejected" ? "Rejected" : "Failed";
  }

  if (transfer.transferStatus === "submitted") {
    return transfer.acknowledgementStatus === "accepted"
      ? "Completed"
      : "Awaiting Acknowledgement";
  }

  return "Submitted";
}

export function isAccountingTransferSuccessful(
  transfer: Pick<AccountingTransferRecord, "transferStatus" | "acknowledgementStatus">,
) {
  return determineAccountingLifecycleStatus(transfer) === "Completed";
}

export function isAccountingTransferAwaitingAcknowledgement(
  transfer: Pick<AccountingTransferRecord, "transferStatus" | "acknowledgementStatus">,
) {
  return determineAccountingLifecycleStatus(transfer) === "Awaiting Acknowledgement";
}

export function getAccountingTransferCompletionTimestamp(
  transfer: Pick<AccountingTransferRecord, "acknowledgedAt" | "failedAt" | "transferStatus" | "acknowledgementStatus">,
) {
  if (transfer.acknowledgementStatus === "accepted" || transfer.acknowledgementStatus === "rejected") {
    return transfer.acknowledgedAt;
  }

  return transfer.transferStatus === "failed" ? transfer.failedAt : null;
}
