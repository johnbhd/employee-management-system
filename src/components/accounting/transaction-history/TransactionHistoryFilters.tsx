import type { AccountingTransactionStatus } from "@/data/accounting/transaction-history";

import { Icon } from "@/components/ui/Icon";

type TransactionHistoryStatusFilter = "all" | AccountingTransactionStatus;
type TransactionHistoryAcknowledgementFilter = "all" | "acknowledged" | "waiting" | "not-acknowledged";

type TransactionHistoryFiltersProps = {
  search: string;
  status: TransactionHistoryStatusFilter;
  year: string;
  acknowledgement: TransactionHistoryAcknowledgementFilter;
  years: readonly string[];
  onSearchChange: (value: string) => void;
  onStatusChange: (value: TransactionHistoryStatusFilter) => void;
  onYearChange: (value: string) => void;
  onAcknowledgementChange: (value: TransactionHistoryAcknowledgementFilter) => void;
  onReset: () => void;
};

export function TransactionHistoryFilters({
  search,
  status,
  year,
  acknowledgement,
  years,
  onSearchChange,
  onStatusChange,
  onYearChange,
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
            placeholder="Search reference or payroll period"
            aria-label="Search transaction or payroll reference"
          />
        </span>
      </label>

      <label className="accounting-transaction-history__field">
        <span>Status</span>
        <select
          value={status}
          onChange={(event) => onStatusChange(event.target.value as TransactionHistoryStatusFilter)}
          aria-label="Filter transactions by status"
        >
          <option value="all">All Status</option>
          <option value="successful">Successful</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </label>

      <label className="accounting-transaction-history__field">
        <span>Year</span>
        <select
          value={year}
          onChange={(event) => onYearChange(event.target.value)}
          aria-label="Filter transactions by year"
        >
          <option value="all">All Years</option>
          {years.map((option) => (
            <option value={option} key={option}>{option}</option>
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
          aria-label="Filter transactions by acknowledgement"
        >
          <option value="all">All Acknowledgements</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="waiting">Waiting</option>
          <option value="not-acknowledged">Not Acknowledged</option>
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
