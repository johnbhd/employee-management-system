import { Icon } from "@/components/ui/Icon";

type FilterOption = {
  value: string;
  label: string;
};

type AuditLogsFiltersProps = {
  search: string;
  fromDate: string;
  toDate: string;
  actor: string;
  role: string;
  module: string;
  action: string;
  outcome: string;
  actors: readonly FilterOption[];
  roles: readonly FilterOption[];
  modules: readonly FilterOption[];
  actions: readonly FilterOption[];
  outcomes: readonly FilterOption[];
  activeFilterCount: number;
  onSearchChange: (value: string) => void;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  onActorChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onModuleChange: (value: string) => void;
  onActionChange: (value: string) => void;
  onOutcomeChange: (value: string) => void;
  onReset: () => void;
};

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly FilterOption[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="admin-audit-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option value={option.value} key={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function AuditLogsFilters({
  search,
  fromDate,
  toDate,
  actor,
  role,
  module,
  action,
  outcome,
  actors,
  roles,
  modules,
  actions,
  outcomes,
  activeFilterCount,
  onSearchChange,
  onFromDateChange,
  onToDateChange,
  onActorChange,
  onRoleChange,
  onModuleChange,
  onActionChange,
  onOutcomeChange,
  onReset,
}: AuditLogsFiltersProps) {
  return (
    <section className="admin-audit-filter-panel" aria-labelledby="admin-audit-filter-heading">
      <div className="admin-audit-filter-heading">
        <div>
          <p className="section-kicker">Audit filters</p>
          <h2 id="admin-audit-filter-heading">Find workspace activity</h2>
        </div>
        <span className="admin-audit-filter-count" aria-live="polite">
          {activeFilterCount > 0 ? `${activeFilterCount} filters active` : "All recorded activity"}
        </span>
      </div>

      <div className="admin-audit-filter-grid">
        <label className="admin-audit-field admin-audit-search-field">
          <span>Search</span>
          <span className="admin-audit-input-wrap">
            <Icon name="search" />
            <input
              type="search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Action, actor, module, or reference"
            />
          </span>
        </label>

        <label className="admin-audit-field">
          <span>From</span>
          <input
            type="date"
            value={fromDate}
            max={toDate || undefined}
            onChange={(event) => onFromDateChange(event.target.value)}
          />
        </label>

        <label className="admin-audit-field">
          <span>To</span>
          <input
            type="date"
            value={toDate}
            min={fromDate || undefined}
            onChange={(event) => onToDateChange(event.target.value)}
          />
        </label>

        <FilterSelect label="Actor" value={actor} options={actors} onChange={onActorChange} />
        <FilterSelect label="Role" value={role} options={roles} onChange={onRoleChange} />
        <FilterSelect label="Module" value={module} options={modules} onChange={onModuleChange} />
        <FilterSelect label="Action type" value={action} options={actions} onChange={onActionChange} />
        <FilterSelect label="Outcome" value={outcome} options={outcomes} onChange={onOutcomeChange} />
      </div>

      <div className="admin-audit-filter-footer">
        <p>Filters apply to the read-only activity recorded in this workspace.</p>
        <button type="button" className="button-secondary" onClick={onReset}>
          <Icon name="refresh" />
          Reset filters
        </button>
      </div>
    </section>
  );
}
