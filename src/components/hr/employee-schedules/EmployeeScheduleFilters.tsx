import { Icon } from "@/components/ui/Icon";

type FilterOption = {
  value: string;
  label: string;
};

type EmployeeScheduleFiltersProps = {
  search: string;
  department: string;
  schedule: string;
  workLocation: string;
  departments: readonly FilterOption[];
  schedules: readonly FilterOption[];
  workLocations: readonly FilterOption[];
  activeFilterCount: number;
  onSearchChange: (value: string) => void;
  onDepartmentChange: (value: string) => void;
  onScheduleChange: (value: string) => void;
  onWorkLocationChange: (value: string) => void;
  onReset: () => void;
};

export function EmployeeScheduleFilters({
  search,
  department,
  schedule,
  workLocation,
  departments,
  schedules,
  workLocations,
  activeFilterCount,
  onSearchChange,
  onDepartmentChange,
  onScheduleChange,
  onWorkLocationChange,
  onReset,
}: EmployeeScheduleFiltersProps) {
  return (
    <section className="hr-schedules-filter-panel" aria-labelledby="hr-schedules-filter-heading">
      <div className="hr-schedules-filter-heading">
        <div>
          <p className="hr-section-kicker">Schedule reference</p>
          <h2 id="hr-schedules-filter-heading">Search and filter employees</h2>
        </div>
        <span className="hr-schedules-filter-count" aria-live="polite">
          {activeFilterCount > 0 ? `${activeFilterCount} filters active` : "All employee schedules"}
        </span>
      </div>

      <div className="hr-schedules-filter-grid">
        <label className="hr-schedules-field hr-schedules-search-field">
          <span>Search employee</span>
          <span className="hr-schedules-input-wrap">
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

        <label className="hr-schedules-field">
          <span>Department</span>
          <select value={department} onChange={(event) => onDepartmentChange(event.target.value)}>
            {departments.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="hr-schedules-field">
          <span>Work schedule</span>
          <select value={schedule} onChange={(event) => onScheduleChange(event.target.value)}>
            {schedules.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="hr-schedules-field">
          <span>Work location</span>
          <select
            value={workLocation}
            onChange={(event) => onWorkLocationChange(event.target.value)}
          >
            {workLocations.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="hr-schedules-filter-footer">
        <p>Schedule information is read-only HRPS reference data. Official changes must be made in HRPS.</p>
        <button type="button" className="button-secondary" onClick={onReset}>
          <Icon name="refresh" />
          Reset filters
        </button>
      </div>
    </section>
  );
}
