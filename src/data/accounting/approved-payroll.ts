import { formatPhilippinePeso } from "@/lib/format-currency";
import type {
  AccountingApprovedPayrollItem,
  AccountingReadinessStatus,
  AccountingTransferStatus,
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
  status: AccountingTransferStatus,
): string {
  return status === "not_transferred" ? "Not yet transferred" : status;
}

export function getAccountingTransferTone(
  status: AccountingTransferStatus,
): StatusTone {
  return status === "not_transferred" ? "muted" : "info";
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
