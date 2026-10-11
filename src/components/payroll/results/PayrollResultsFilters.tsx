import type { PayrollResultProcessingStatus } from "@/data/payroll/results";

import { Icon } from "@/components/ui/Icon";

type PayrollResultsFiltersProps = {
  query: string;
  period: string;
  status: PayrollResultProcessingStatus | "all";
  department: string;
  periods: readonly string[];
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
        <span className="payroll-results__search-input"><Icon name="search" /><input type="search" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search employee name, ID, or department" aria-label="Search employee name, ID, or department" /></span>
      </label>
      <label>
        <span>Payroll period</span>
        <select value={period} onChange={(event) => onPeriodChange(event.target.value)} aria-label="Filter by payroll period">
          <option value="all">All periods</option>
          {periods.map((option) => <option value={option} key={option}>{option}</option>)}
        </select>
      </label>
      <label>
        <span>Result status</span>
        <select value={status} onChange={(event) => onStatusChange(event.target.value as PayrollResultProcessingStatus | "all")} aria-label="Filter by result status">
          <option value="all">All statuses</option>
          <option value="Completed">Completed</option>
          <option value="Pending">Pending</option>
          <option value="Failed">Failed</option>
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
