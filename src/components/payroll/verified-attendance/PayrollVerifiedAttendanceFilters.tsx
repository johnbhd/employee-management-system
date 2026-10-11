import type {
  PayrollBatchFilter,
  PayrollReadinessFilter,
} from "@/data/payroll/verified-attendance";

import { Icon } from "@/components/ui/Icon";

type PayrollVerifiedAttendanceFiltersProps = {
  search: string;
  department: string;
  readiness: PayrollReadinessFilter | "";
  batch: PayrollBatchFilter | "";
  departments: readonly string[];
  onSearchChange: (value: string) => void;
  onDepartmentChange: (value: string) => void;
  onReadinessChange: (value: PayrollReadinessFilter | "") => void;
  onBatchChange: (value: PayrollBatchFilter | "") => void;
  onReset: () => void;
};

export function PayrollVerifiedAttendanceFilters({
  search,
  department,
  readiness,
  batch,
  departments,
  onSearchChange,
  onDepartmentChange,
  onReadinessChange,
  onBatchChange,
  onReset,
}: PayrollVerifiedAttendanceFiltersProps) {
  return (
    <form
      className="payroll-verified-attendance__filters"
      onSubmit={(event) => event.preventDefault()}
      role="search"
      aria-label="Verified attendance filters"
    >
      <label className="payroll-verified-attendance__search-field">
        <span>Search</span>
        <span className="payroll-verified-attendance__search-input">
          <Icon name="search" />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search employee name, ID, or department"
            aria-label="Search employee name, ID, or department"
          />
        </span>
      </label>

      <label className="payroll-verified-attendance__field">
        <span>Department</span>
        <select
          value={department}
          onChange={(event) => onDepartmentChange(event.target.value)}
          aria-label="Filter by department"
        >
          <option value="">All departments</option>
          {departments.map((option) => <option value={option} key={option}>{option}</option>)}
        </select>
      </label>

      <label className="payroll-verified-attendance__field">
        <span>Payroll readiness</span>
        <select
          value={readiness}
          onChange={(event) => onReadinessChange(event.target.value as PayrollReadinessFilter | "")}
          aria-label="Filter by payroll readiness"
        >
          <option value="">All statuses</option>
          <option value="ready">Ready</option>
          <option value="blocked">Blocked</option>
        </select>
      </label>

      <label className="payroll-verified-attendance__field">
        <span>Batch status</span>
        <select
          value={batch}
          onChange={(event) => onBatchChange(event.target.value as PayrollBatchFilter | "")}
          aria-label="Filter by batch status"
        >
          <option value="">All statuses</option>
          <option value="included">Included in batch</option>
          <option value="ready-batch">Ready for batch</option>
          <option value="not-included">Not included</option>
          <option value="transferred">Transferred</option>
        </select>
      </label>

      <button type="button" className="button-secondary" onClick={onReset}>Clear filters</button>
    </form>
  );
}

