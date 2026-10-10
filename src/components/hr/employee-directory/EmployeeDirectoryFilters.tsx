import { Icon } from "@/components/ui/Icon";

type FilterOption = {
    value: string;
    label: string;
};

type EmployeeDirectoryFiltersProps = {
    search: string;
    department: string;
    position: string;
    employmentStatus: string;
    departments: readonly FilterOption[];
    positions: readonly FilterOption[];
    employmentStatuses: readonly FilterOption[];
    activeFilterCount: number;
    onSearchChange: (value: string) => void;
    onDepartmentChange: (value: string) => void;
    onPositionChange: (value: string) => void;
    onEmploymentStatusChange: (value: string) => void;
    onReset: () => void;
};

export function EmployeeDirectoryFilters({
    search,
    department,
    position,
    employmentStatus,
    departments,
    positions,
    employmentStatuses,
    activeFilterCount,
    onSearchChange,
    onDepartmentChange,
    onPositionChange,
    onEmploymentStatusChange,
    onReset,
}: EmployeeDirectoryFiltersProps) {
    return (
        <section className="hr-directory-filter-panel" aria-labelledby="hr-directory-filter-heading">
            <div className="hr-directory-filter-heading">
                <div>
                    <p className="hr-section-kicker">Employee reference</p>
                    <h2 id="hr-directory-filter-heading">Search and filter employees</h2>
                </div>
                <span className="hr-directory-filter-count" aria-live="polite">
                    {activeFilterCount > 0
                        ? String(activeFilterCount) + " filters active"
                        : "All employee records"}
                </span>
            </div>

            <div className="hr-directory-filter-grid">
                <label className="hr-directory-field hr-directory-search-field">
                    <span>Search employee</span>
                    <span className="hr-directory-input-wrap">
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

                <label className="hr-directory-field">
                    <span>Department</span>
                    <select value={department} onChange={(event) => onDepartmentChange(event.target.value)}>
                        {departments.map((option) => (
                            <option value={option.value} key={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="hr-directory-field">
                    <span>Position</span>
                    <select value={position} onChange={(event) => onPositionChange(event.target.value)}>
                        {positions.map((option) => (
                            <option value={option.value} key={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="hr-directory-field">
                    <span>Employment status</span>
                    <select value={employmentStatus} onChange={(event) => onEmploymentStatusChange(event.target.value)}>
                        {employmentStatuses.map((option) => (
                            <option value={option.value} key={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            <div className="hr-directory-filter-footer">
                <p>Official employee information remains a read-only HRPS reference.</p>
                <button type="button" className="button-secondary" onClick={onReset}>
                    <Icon name="refresh" />
                    Reset filters
                </button>
            </div>
        </section>
    );
}
