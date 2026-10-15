import type {
  AccountingAcknowledgementStatus,
  AccountingTransferStatus,
} from "@/types/accounting-transfers";
import type { PayrollBatchPeriod } from "@/types/payroll-batches";

import { Icon } from "@/components/ui/Icon";

type TransactionHistoryStatusFilter = "all" | AccountingTransferStatus;
type TransactionHistoryAcknowledgementFilter = "all" | AccountingAcknowledgementStatus;

type TransactionHistoryFiltersProps = {
  search: string;
  status: TransactionHistoryStatusFilter;
  period: string;
  acknowledgement: TransactionHistoryAcknowledgementFilter;
  periods: readonly PayrollBatchPeriod[];
  transferStatuses: readonly AccountingTransferStatus[];
  acknowledgementStatuses: readonly AccountingAcknowledgementStatus[];
  onSearchChange: (value: string) => void;
  onStatusChange: (value: TransactionHistoryStatusFilter) => void;
  onPeriodChange: (value: string) => void;
  onAcknowledgementChange: (value: TransactionHistoryAcknowledgementFilter) => void;
  onReset: () => void;
};

function getTransferStatusLabel(status: AccountingTransferStatus) {
  switch (status) {
    case "preparing":
      return "Preparing";
    case "submitting":
      return "Submitting";
    case "submitted":
      return "Submitted";
    case "failed":
      return "Failed";
  }
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

export function TransactionHistoryFilters({
  search,
  status,
  period,
  acknowledgement,
  periods,
  transferStatuses,
  acknowledgementStatuses,
  onSearchChange,
  onStatusChange,
  onPeriodChange,
  onAcknowledgementChange,
  onReset,
}: TransactionHistoryFiltersProps) {
  return (
    <form
      className="accounting-transaction-history__filters"
      onSubmit={(event) => event.preventDefault()}
      role="search"
      aria-label="Transaction history filters"
    >
      <label className="accounting-transaction-history__search-field">
        <span>Search</span>
        <span className="accounting-transaction-history__search-input">
          <Icon name="search" />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search transfer, result, or reference"
            aria-label="Search Accounting transfer history"
          />
        </span>
      </label>

      <label className="accounting-transaction-history__field">
        <span>Transfer status</span>
        <select
          value={status}
          onChange={(event) => onStatusChange(event.target.value as TransactionHistoryStatusFilter)}
          aria-label="Filter transactions by transfer status"
        >
          <option value="all">All transfer statuses</option>
          {transferStatuses.map((option) => (
            <option value={option} key={option}>{getTransferStatusLabel(option)}</option>
          ))}
        </select>
      </label>

      <label className="accounting-transaction-history__field">
        <span>Payroll period</span>
        <select
          value={period}
          onChange={(event) => onPeriodChange(event.target.value)}
          aria-label="Filter transactions by Payroll period"
        >
          <option value="all">All Payroll periods</option>
          {periods.map((option) => (
            <option value={option.start} key={option.start}>{option.label}</option>
          ))}
        </select>
      </label>

      <label className="accounting-transaction-history__field">
        <span>Acknowledgement</span>
        <select
          value={acknowledgement}
          onChange={(event) => onAcknowledgementChange(
            event.target.value as TransactionHistoryAcknowledgementFilter,
          )}
          aria-label="Filter transactions by acknowledgement status"
        >
          <option value="all">All acknowledgements</option>
          {acknowledgementStatuses.map((option) => (
            <option value={option} key={option}>{getAcknowledgementLabel(option)}</option>
          ))}
        </select>
      </label>

      <button type="button" className="button-secondary" onClick={onReset}>
        Reset
      </button>
    </form>
  );
}

export type {
  TransactionHistoryAcknowledgementFilter,
  TransactionHistoryStatusFilter,
};
