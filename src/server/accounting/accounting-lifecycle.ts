import type { AccountingTransferRecord } from "@/types/accounting-transfers";
import type { AccountingHistoryLifecycleStatus } from "@/types/accounting-transaction-history";
import type { AccountingReadinessStatus } from "@/types/accounting-approved-payroll";
import type { AccountingDashboardAccountingStatus } from "@/types/accounting-dashboard";
import type {
  AccountingAcknowledgementStatus,
  AccountingApprovedPayrollTransferStatus,
} from "@/types/accounting-transfers";

export function determineAccountingLifecycleStatus(
  transfer: Pick<AccountingTransferRecord, "transferStatus" | "acknowledgementStatus">,
): AccountingHistoryLifecycleStatus {
  if (transfer.transferStatus === "failed") {
    return transfer.acknowledgementStatus === "rejected" ? "Rejected" : "Failed";
  }

  if (transfer.transferStatus === "submitted") {
    if (transfer.acknowledgementStatus === "accepted") return "Completed";
    if (transfer.acknowledgementStatus === "rejected") return "Rejected";
    if (transfer.acknowledgementStatus === "not_received") return "Not Received";
    return "Awaiting Acknowledgement";
  }

  if (transfer.transferStatus === "prepared") {
    return "Prepared";
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

export function determineAccountingDashboardStatus(input: {
  readinessStatus: AccountingReadinessStatus;
  transfer: {
    transferStatus: AccountingApprovedPayrollTransferStatus;
    acknowledgementStatus: AccountingAcknowledgementStatus | null;
  };
}): AccountingDashboardAccountingStatus {
  if (input.transfer.transferStatus === "not_transferred") {
    return input.readinessStatus === "ready"
      ? "Ready for Transfer"
      : "Blocked";
  }

  const transfer = input.transfer as Pick<
    AccountingTransferRecord,
    "transferStatus" | "acknowledgementStatus"
  >;

  if (transfer.transferStatus === "prepared") {
    return "Prepared";
  }

  if (
    transfer.transferStatus === "preparing"
    || transfer.transferStatus === "submitting"
  ) {
    return "Transfer In Progress";
  }

  if (isAccountingTransferSuccessful(transfer)) {
    return "Transferred";
  }

  if (isAccountingTransferAwaitingAcknowledgement(transfer)) {
    return "Awaiting Acknowledgement";
  }

  return "Integration Issue";
}
