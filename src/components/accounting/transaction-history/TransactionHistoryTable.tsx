import type { AccountingTransaction } from "@/data/accounting/transaction-history";
import { formatPhilippinePeso } from "@/lib/format-currency";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";

type TransactionHistoryTableProps = {
  transactions: readonly AccountingTransaction[];
  onViewDetails: (transaction: AccountingTransaction) => void;
};

export function TransactionHistoryTable({
  transactions,
  onViewDetails,
}: TransactionHistoryTableProps) {
  return (
    <div className="accounting-transaction-history__table-wrap">
      <table className="data-table accounting-transaction-history__table">
        <caption className="sr-only">Accounting payroll integration transaction history</caption>
        <thead>
          <tr>
            <th scope="col">Transaction Reference</th>
            <th scope="col">Payroll Reference</th>
            <th scope="col">Payroll Period</th>
            <th scope="col">Date / Time</th>
            <th scope="col">Employees</th>
            <th scope="col">Amount</th>
            <th scope="col">Transfer Status</th>
            <th scope="col">Acknowledgement</th>
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.id}>
              <td>
                <strong className="accounting-transaction-history__reference">
                  {transaction.transactionReference}
                </strong>
              </td>
              <td>{transaction.payrollReference}</td>
              <td>{transaction.payrollPeriod}</td>
              <td>{transaction.dateTime}</td>
              <td>{transaction.employeeCount}</td>
              <td>{formatPhilippinePeso(transaction.approvedAmount)}</td>
              <td>
                <StatusBadge tone={transaction.statusTone}>
                  {transaction.statusLabel}
                </StatusBadge>
              </td>
              <td>
                <StatusBadge tone={transaction.acknowledgementTone}>
                  {transaction.acknowledgement}
                </StatusBadge>
              </td>
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
              <td colSpan={9} className="accounting-transaction-history__empty">
                <strong>No transactions found.</strong>
                <span>Try adjusting your filters.</span>
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
