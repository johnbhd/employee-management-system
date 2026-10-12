import type { PayrollResultProcessingStatus } from "@/types/payroll-results";

import { Icon } from "@/components/ui/Icon";

type PayrollResultsFiltersProps = {
  query: string;
  period: string;
  status: PayrollResultProcessingStatus | "all";
  department: string;
  periods: readonly { value: string; label: string }[];
  departments: readonly string[];
  onQueryChange: (value: string) => void;
  onPeriodChange: (value: string) => void;
  onStatusChange: (value: PayrollResultProcessingStatus | "all") => void;
  onDepartmentChange: (value: string) => void;
  onReset: () => void;
};

export function PayrollResultsFilters({
  query,
  period,
  status,
  department,
  periods,
  departments,
  onQueryChange,
  onPeriodChange,
  onStatusChange,
  onDepartmentChange,
  onReset,
}: PayrollResultsFiltersProps) {
  return (
    <form className="payroll-results__filters" onSubmit={(event) => event.preventDefault()} role="search" aria-label="Payroll result filters">
      <label className="payroll-results__search-field">
        <span>Search</span>
        <span className="payroll-results__search-input"><Icon name="search" /><input type="search" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search employee name, ID, department, or reference" aria-label="Search employee name, ID, department, or reference" /></span>
      </label>
      <label>
        <span>Payroll period</span>
        <select value={period} onChange={(event) => onPeriodChange(event.target.value)} aria-label="Filter by payroll period">
          <option value="all">All periods</option>
          {periods.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
        </select>
      </label>
      <label>
        <span>Processing status</span>
        <select value={status} onChange={(event) => onStatusChange(event.target.value as PayrollResultProcessingStatus | "all")} aria-label="Filter by processing status">
          <option value="all">All statuses</option>
          <option value="processed">Processed</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
          <option value="failed">Failed</option>
        </select>
      </label>
      <label>
        <span>Department</span>
        <select value={department} onChange={(event) => onDepartmentChange(event.target.value)} aria-label="Filter by department">
          <option value="all">All departments</option>
          {departments.map((option) => <option value={option} key={option}>{option}</option>)}
        </select>
      </label>
      {query || period !== "all" || status !== "all" || department !== "all" ? <button type="button" className="button-secondary" onClick={onReset}>Clear filters</button> : null}
    </form>
  );
}
