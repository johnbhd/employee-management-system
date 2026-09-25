import { Icon } from "@/components/ui/Icon";

type FilterOption = {
  value: string;
  label: string;
};

type CorrectionRequestFiltersProps = {
  search: string;
  status: string;
  issueType: string;
  department: string;
  submittedDate: string;
  attendanceDate: string;
  statuses: readonly FilterOption[];
  issueTypes: readonly FilterOption[];
  departments: readonly FilterOption[];
  activeFilterCount: number;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onIssueTypeChange: (value: string) => void;
  onDepartmentChange: (value: string) => void;
  onSubmittedDateChange: (value: string) => void;
  onAttendanceDateChange: (value: string) => void;
  onReset: () => void;
};

export function CorrectionRequestFilters({
  search,
  status,
  issueType,
  department,
  submittedDate,
  attendanceDate,
  statuses,
  issueTypes,
  departments,
  activeFilterCount,
  onSearchChange,
  onStatusChange,
  onIssueTypeChange,
  onDepartmentChange,
  onSubmittedDateChange,
  onAttendanceDateChange,
  onReset,
}: CorrectionRequestFiltersProps) {
  return (
    <section className="hr-correction-filter-panel" aria-labelledby="hr-correction-filter-heading">
      <div className="hr-correction-filter-heading">
        <div>
          <p className="hr-section-kicker">Review queue</p>
          <h2 id="hr-correction-filter-heading">Search and filter requests</h2>
        </div>
        <span className="hr-correction-filter-count" aria-live="polite">
          {activeFilterCount > 0 ? `${activeFilterCount} filters active` : "All correction requests"}
        </span>
      </div>

      <div className="hr-correction-filter-grid">
        <label className="hr-correction-field hr-correction-search-field">
          <span>Search employee or request</span>
          <span className="hr-correction-input-wrap">
            <Icon name="search" />
            <input
              type="search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Name, employee ID, or CR number"
              aria-label="Search employee, employee ID, or correction request ID"
            />
          </span>
        </label>

        <label className="hr-correction-field">
          <span>Status</span>
          <select value={status} onChange={(event) => onStatusChange(event.target.value)}>
            {statuses.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="hr-correction-field">
          <span>Issue type</span>
          <select value={issueType} onChange={(event) => onIssueTypeChange(event.target.value)}>
            {issueTypes.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="hr-correction-field">
          <span>Department</span>
          <select value={department} onChange={(event) => onDepartmentChange(event.target.value)}>
            {departments.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="hr-correction-field">
          <span>Date submitted</span>
          <input type="date" value={submittedDate} onChange={(event) => onSubmittedDateChange(event.target.value)} />
        </label>

        <label className="hr-correction-field">
          <span>Attendance date</span>
          <input type="date" value={attendanceDate} onChange={(event) => onAttendanceDateChange(event.target.value)} />
        </label>
      </div>

      <div className="hr-correction-filter-footer">
        <p>Attendance status and correction request status remain separate review contexts.</p>
        <button type="button" className="button-secondary" onClick={onReset}>
          <Icon name="refresh" />
          Reset filters
        </button>
      </div>
    </section>
  );
}
