import type {
  AccountingAcknowledgementStatus,
  AccountingTransferStatus,
} from "@/types/accounting-transfers";
import type { AccountingTransactionHistoryItem } from "@/types/accounting-transaction-history";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";

type TransactionHistoryTableProps = {
  transactions: readonly AccountingTransactionHistoryItem[];
  emptyMessage: string;
  onViewDetails: (transaction: AccountingTransactionHistoryItem) => void;
};

function formatDateTime(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

function getTransferStatusLabel(status: AccountingTransferStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getTransferStatusTone(status: AccountingTransferStatus) {
  if (status === "failed") return "danger" as const;
  if (status === "submitted") return "success" as const;
  return "warning" as const;
}

function getAcknowledgementLabel(status: AccountingAcknowledgementStatus) {
  switch (status) {
    case "pending":
      return "Pending";
    case "accepted":
      return "Accepted";
    case "rejected":
      return "Rejected";
    case "not_received":
      return "Not received";
  }
}

function getAcknowledgementTone(status: AccountingAcknowledgementStatus) {
  if (status === "accepted") return "success" as const;
  if (status === "rejected" || status === "not_received") return "danger" as const;
  return "warning" as const;
}

export function TransactionHistoryTable({
  transactions,
  emptyMessage,
  onViewDetails,
}: TransactionHistoryTableProps) {
  return (
    <div className="accounting-transaction-history__table-wrap">
      <table className="data-table accounting-transaction-history__table">
        <caption className="sr-only">Accounting payroll integration transaction history</caption>
        <thead>
          <tr>
            <th scope="col">Accounting Transfer ID</th>
            <th scope="col">Payroll Result ID</th>
            <th scope="col">Payroll Period</th>
            <th scope="col">Prepared / submitted at</th>
            <th scope="col">Prepared / submitted by</th>
            <th scope="col">Employees</th>
            <th scope="col">Transfer Status</th>
            <th scope="col">Acknowledgement</th>
            <th scope="col">Completed / Failed</th>
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.transferId}>
              <td>
                <strong className="accounting-transaction-history__reference">
                  {transaction.transferId}
                </strong>
              </td>
              <td>{transaction.payrollResultId}</td>
              <td>{transaction.payrollPeriod.label}</td>
              <td>{formatDateTime(transaction.preparedAt ?? transaction.submittedAt)}</td>
              <td>{(transaction.preparedBy ?? transaction.submittedBy).displayName}</td>
              <td>{transaction.employeeCount}</td>
              <td>
                <StatusBadge tone={getTransferStatusTone(transaction.transferStatus)}>
                  {getTransferStatusLabel(transaction.transferStatus)}
                </StatusBadge>
              </td>
              <td>
                <StatusBadge tone={getAcknowledgementTone(transaction.acknowledgementStatus)}>
                  {getAcknowledgementLabel(transaction.acknowledgementStatus)}
                </StatusBadge>
              </td>
              <td>{formatDateTime(transaction.completedAt)}</td>
              <td>
                <button
                  type="button"
                  className="button-link accounting-transaction-history__details-trigger"
                  onClick={() => onViewDetails(transaction)}
                  aria-haspopup="dialog"
                >
                  View Details
                  <Icon name="arrow" />
                </button>
              </td>
            </tr>
          ))}
          {transactions.length === 0 ? (
            <tr>
              <td colSpan={10} className="accounting-transaction-history__empty">
                <strong>{emptyMessage}</strong>
                <span>Accounting transfer records will appear after Payroll Results are prepared.</span>
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
