import { formatPhilippinePeso } from "@/lib/format-currency";
import type {
  AccountingApprovedPayrollItem,
  AccountingApprovedPayrollTransferStatus,
  AccountingReadinessStatus,
} from "@/types/accounting-approved-payroll";
import type { StatusTone } from "@/types/ui";

export function getAccountingReadinessLabel(
  status: AccountingReadinessStatus,
): string {
  return status === "ready" ? "Ready for Transfer" : "Blocked";
}

export function getAccountingReadinessTone(
  status: AccountingReadinessStatus,
): StatusTone {
  return status === "ready" ? "success" : "danger";
}

export function getAccountingTransferLabel(
  status: AccountingApprovedPayrollTransferStatus,
): string {
  switch (status) {
    case "not_transferred":
      return "Not yet transferred";
    case "preparing":
      return "Preparing";
    case "prepared":
      return "Prepared";
    case "submitting":
      return "Submitting";
    case "submitted":
      return "Submitted";
    case "failed":
      return "Failed";
  }
}

export function getAccountingTransferTone(
  status: AccountingApprovedPayrollTransferStatus,
): StatusTone {
  if (status === "not_transferred") return "muted";
  if (status === "failed") return "danger";
  if (status === "submitted" || status === "prepared") return "success";
  return "warning";
}

export function formatAccountingReturnedAmount(
  returnedAmount: AccountingApprovedPayrollItem["returnedAmount"],
): string {
  if (returnedAmount.amount === null) {
    return "—";
  }

  if (returnedAmount.currency === "PHP") {
    return formatPhilippinePeso(returnedAmount.amount);
  }

  return new Intl.NumberFormat("en-US", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(returnedAmount.amount);
}
