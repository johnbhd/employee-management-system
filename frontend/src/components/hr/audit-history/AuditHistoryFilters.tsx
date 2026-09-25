import { Icon } from "@/components/ui/Icon";
import type { AttendanceAuditAction, AttendanceAuditActorRole, AttendanceAuditArea, AttendanceAuditOutcome } from "@/data/hr-attendance-audit";

type FilterOption = {
  value: string;
  label: string;
};

type AuditHistoryFiltersProps = {
  search: string;
  fromDate: string;
  toDate: string;
  action: string;
  area: string;
  actorRole: string;
  outcome: string;
  employeeId: string;
  actions: readonly FilterOption[];
  areas: readonly FilterOption[];
  actorRoles: readonly FilterOption[];
  outcomes: readonly FilterOption[];
  employees: readonly FilterOption[];
  activeFilterCount: number;
  onSearchChange: (value: string) => void;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  onActionChange: (value: AttendanceAuditAction | "all") => void;
  onAreaChange: (value: AttendanceAuditArea | "all") => void;
  onActorRoleChange: (value: AttendanceAuditActorRole | "all") => void;
  onOutcomeChange: (value: AttendanceAuditOutcome | "all") => void;
  onEmployeeChange: (value: string) => void;
  onReset: () => void;
};

export function AuditHistoryFilters({
  search,
  fromDate,
  toDate,
  action,
  area,
  actorRole,
  outcome,
  employeeId,
  actions,
  areas,
  actorRoles,
  outcomes,
  employees,
  activeFilterCount,
  onSearchChange,
  onFromDateChange,
  onToDateChange,
  onActionChange,
  onAreaChange,
  onActorRoleChange,
  onOutcomeChange,
  onEmployeeChange,
  onReset,
}: AuditHistoryFiltersProps) {
  return (
    <section className="hr-audit-filter-panel" aria-labelledby="hr-audit-filter-heading">
      <div className="hr-audit-filter-heading">
        <div>
          <p className="hr-section-kicker">Audit filters</p>
          <h2 id="hr-audit-filter-heading">Find attendance workflow activity</h2>
        </div>
        <span className="hr-audit-filter-count" aria-live="polite">
          {activeFilterCount > 0 ? `${activeFilterCount} filters active` : "All recorded activity"}
        </span>
      </div>

      <div className="hr-audit-filter-grid">
        <label className="hr-audit-field hr-audit-search-field">
          <span>Search</span>
          <span className="hr-audit-input-wrap">
            <Icon name="search" />
            <input
              type="search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Name, ID, request, or event"
            />
          </span>
        </label>

        <label className="hr-audit-field">
          <span>From</span>
          <input type="date" value={fromDate} max={toDate || undefined} onChange={(event) => onFromDateChange(event.target.value)} />
        </label>

        <label className="hr-audit-field">
          <span>To</span>
          <input type="date" value={toDate} min={fromDate || undefined} onChange={(event) => onToDateChange(event.target.value)} />
        </label>

        <label className="hr-audit-field">
          <span>Action type</span>
          <select value={action} onChange={(event) => onActionChange(event.target.value as AttendanceAuditAction | "all")}>
            {actions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
          </select>
        </label>

        <label className="hr-audit-field">
          <span>Area</span>
          <select value={area} onChange={(event) => onAreaChange(event.target.value as AttendanceAuditArea | "all")}>
            {areas.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
          </select>
        </label>

        <label className="hr-audit-field">
          <span>Actor role</span>
          <select value={actorRole} onChange={(event) => onActorRoleChange(event.target.value as AttendanceAuditActorRole | "all")}>
            {actorRoles.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
          </select>
        </label>

        <label className="hr-audit-field">
          <span>Outcome</span>
          <select value={outcome} onChange={(event) => onOutcomeChange(event.target.value as AttendanceAuditOutcome | "all")}>
            {outcomes.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
          </select>
        </label>

        <label className="hr-audit-field">
          <span>Employee</span>
          <select value={employeeId} onChange={(event) => onEmployeeChange(event.target.value)}>
            {employees.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
          </select>
        </label>
      </div>

      <div className="hr-audit-filter-footer">
        <p>Historical attendance workflow activity is read-only and derived from recorded correction history.</p>
        <button type="button" className="button-secondary" onClick={onReset}>
          <Icon name="refresh" />
          Reset filters
        </button>
      </div>
    </section>
  );
}
