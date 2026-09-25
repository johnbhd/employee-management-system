import { Icon } from "@/components/ui/Icon";

type FilterOption = {
  value: string;
  label: string;
};

type AttendanceMonitoringFiltersProps = {
  search: string;
  date: string;
  department: string;
  status: string;
  source: string;
  validation: string;
  departments: readonly FilterOption[];
  statuses: readonly FilterOption[];
  sources: readonly FilterOption[];
  validations: readonly FilterOption[];
  activeFilterCount: number;
  onSearchChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onDepartmentChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSourceChange: (value: string) => void;
  onValidationChange: (value: string) => void;
  onReset: () => void;
};

export function AttendanceMonitoringFilters({
  search,
  date,
  department,
  status,
  source,
  validation,
  departments,
  statuses,
  sources,
  validations,
  activeFilterCount,
  onSearchChange,
  onDateChange,
  onDepartmentChange,
  onStatusChange,
  onSourceChange,
  onValidationChange,
  onReset,
}: AttendanceMonitoringFiltersProps) {
  return (
    <section className="hr-monitoring-filter-panel" aria-labelledby="attendance-monitoring-filters-heading">
      <div className="hr-monitoring-filter-heading">
        <div>
          <p className="hr-section-kicker">Records workspace</p>
          <h2 id="attendance-monitoring-filters-heading">Search and filter records</h2>
        </div>
        <span className="hr-monitoring-filter-count" aria-live="polite">
          {activeFilterCount > 0 ? `${activeFilterCount} filters active` : "All attendance records"}
        </span>
      </div>

      <div className="hr-monitoring-filter-grid">
        <label className="hr-monitoring-field hr-monitoring-search-field">
          <span>Search employees</span>
          <span className="hr-monitoring-input-wrap">
            <Icon name="search" />
            <input
              type="search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search name or employee ID"
              aria-label="Search by employee name or employee ID"
            />
          </span>
        </label>

        <label className="hr-monitoring-field">
          <span>Date</span>
          <input type="date" value={date} onChange={(event) => onDateChange(event.target.value)} />
        </label>

        <label className="hr-monitoring-field">
          <span>Department</span>
          <select value={department} onChange={(event) => onDepartmentChange(event.target.value)}>
            {departments.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="hr-monitoring-field">
          <span>Attendance status</span>
          <select value={status} onChange={(event) => onStatusChange(event.target.value)}>
            {statuses.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="hr-monitoring-field">
          <span>Source</span>
          <select value={source} onChange={(event) => onSourceChange(event.target.value)}>
            {sources.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="hr-monitoring-field">
          <span>Validation</span>
          <select value={validation} onChange={(event) => onValidationChange(event.target.value)}>
            {validations.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="hr-monitoring-filter-footer">
        <p>Attendance status and validation status are reviewed separately.</p>
        <button type="button" className="button-secondary hr-monitoring-reset-button" onClick={onReset}>
          <Icon name="refresh" />
          Reset filters
        </button>
      </div>
    </section>
  );
}
