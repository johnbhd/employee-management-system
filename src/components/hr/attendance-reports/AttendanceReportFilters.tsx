import { Icon } from "@/components/ui/Icon";

import type { AttendanceReportType } from "@/data/hr-attendance-reports";

type FilterOption = {
  value: string;
  label: string;
};

type AttendanceReportFiltersProps = {
  reportType: AttendanceReportType;
  date: string;
  month: string;
  department: string;
  employeeId: string;
  source: string;
  status: string;
  departments: readonly FilterOption[];
  employees: readonly FilterOption[];
  sources: readonly FilterOption[];
  statuses: readonly FilterOption[];
  activeFilterCount: number;
  onDateChange: (value: string) => void;
  onMonthChange: (value: string) => void;
  onDepartmentChange: (value: string) => void;
  onEmployeeChange: (value: string) => void;
  onSourceChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onReset: () => void;
};

function showsEmployeeFilter(reportType: AttendanceReportType) {
  return reportType !== "source-usage";
}

function showsSourceFilter(reportType: AttendanceReportType) {
  return reportType !== "monthly" && reportType !== "source-usage" && reportType !== "correction-summary";
}

function showsStatusFilter(reportType: AttendanceReportType) {
  return reportType === "daily";
}

export function AttendanceReportFilters({
  reportType,
  date,
  month,
  department,
  employeeId,
  source,
  status,
  departments,
  employees,
  sources,
  statuses,
  activeFilterCount,
  onDateChange,
  onMonthChange,
  onDepartmentChange,
  onEmployeeChange,
  onSourceChange,
  onStatusChange,
  onReset,
}: AttendanceReportFiltersProps) {
  const isMonthly = reportType === "monthly";

  return (
    <section className="hr-reports-filter-panel" aria-labelledby="hr-reports-filter-heading">
      <div className="hr-reports-filter-heading">
        <div>
          <p className="hr-section-kicker">Report filters</p>
          <h2 id="hr-reports-filter-heading">Set the report period and scope</h2>
        </div>
        <span className="hr-reports-filter-count" aria-live="polite">
          {activeFilterCount > 0 ? `${activeFilterCount} filters active` : "All available records"}
        </span>
      </div>

      <div className="hr-reports-filter-grid">
        <label className="hr-reports-field">
          <span>{isMonthly ? "Month" : "Date"}</span>
          <input type={isMonthly ? "month" : "date"} value={isMonthly ? month : date} onChange={(event) => {
            if (isMonthly) onMonthChange(event.target.value);
            else onDateChange(event.target.value);
          }} />
        </label>

        <label className="hr-reports-field">
          <span>Department</span>
          <select value={department} onChange={(event) => onDepartmentChange(event.target.value)}>
            {departments.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
          </select>
        </label>

        {showsEmployeeFilter(reportType) ? (
          <label className="hr-reports-field">
            <span>Employee</span>
            <select value={employeeId} onChange={(event) => onEmployeeChange(event.target.value)}>
              {employees.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
            </select>
          </label>
        ) : null}

        {showsSourceFilter(reportType) ? (
          <label className="hr-reports-field">
            <span>Attendance source</span>
            <select value={source} onChange={(event) => onSourceChange(event.target.value)}>
              {sources.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
            </select>
          </label>
        ) : null}

        {showsStatusFilter(reportType) ? (
          <label className="hr-reports-field">
            <span>Attendance status</span>
            <select value={status} onChange={(event) => onStatusChange(event.target.value)}>
              {statuses.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
            </select>
          </label>
        ) : null}
      </div>

      <div className="hr-reports-filter-footer">
        <p>Report values are summarized from the attendance and correction records available to HR.</p>
        <button type="button" className="button-secondary" onClick={onReset}>
          <Icon name="refresh" />
          Reset filters
        </button>
      </div>
    </section>
  );
}
