"use client";

import { useEffect, useMemo, useState } from "react";

import type { EmployeeReference } from "@/types/employee";

import { EmployeeDetailsDrawer } from "./EmployeeDetailsDrawer";
import { EmployeeDirectoryFilters } from "./EmployeeDirectoryFilters";
import { EmployeeDirectorySummary } from "./EmployeeDirectorySummary";
import { EmployeeDirectoryTable } from "./EmployeeDirectoryTable";

const allValue = "all";

const employmentStatusOptions = [
    { value: allValue, label: "All employment statuses" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
];

type EmployeeDirectoryExplorerProps = {
    employees: readonly EmployeeReference[];
    loadError?: boolean;
};

export function EmployeeDirectoryExplorer({
    employees,
    loadError = false,
}: EmployeeDirectoryExplorerProps) {
    const [search, setSearch] = useState("");
    const [department, setDepartment] = useState(allValue);
    const [position, setPosition] = useState(allValue);
    const [employmentStatus, setEmploymentStatus] = useState(allValue);
    const [selectedEmployee, setSelectedEmployee] = useState<EmployeeReference | null>(null);

    const departments = useMemo(
        () => [
            { value: allValue, label: "All departments" },
            ...Array.from(new Set(employees.map((employee) => employee.department)))
                .sort()
                .map((value) => ({ value, label: value })),
        ],
        [employees],
    );

    const positions = useMemo(
        () => [
            { value: allValue, label: "All positions" },
            ...Array.from(
                new Set(
                    employees
                        .map((employee) => employee.position)
                        .filter((value): value is string => Boolean(value)),
                ),
            )
                .sort()
                .map((value) => ({ value, label: value })),
        ],
        [employees],
    );

    const filteredEmployees = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        return employees.filter((employee) => {
            const matchesSearch = !normalizedSearch
                || employee.displayName.toLowerCase().includes(normalizedSearch)
                || employee.employeeId.toLowerCase().includes(normalizedSearch)
                || employee.department.toLowerCase().includes(normalizedSearch)
                || (employee.position ?? "").toLowerCase().includes(normalizedSearch);
            const matchesDepartment = department === allValue
                || employee.department === department;
            const matchesPosition = position === allValue
                || employee.position === position;
            const matchesEmploymentStatus = employmentStatus === allValue
                || employee.employmentStatus === employmentStatus;

            return matchesSearch
                && matchesDepartment
                && matchesPosition
                && matchesEmploymentStatus;
        });
    }, [department, employees, employmentStatus, position, search]);

    const activeFilterCount = [
        search.trim(),
        department !== allValue ? department : "",
        position !== allValue ? position : "",
        employmentStatus !== allValue ? employmentStatus : "",
    ].filter(Boolean).length;

    useEffect(() => {
        if (!selectedEmployee) return;

        function closeOnEscape(event: KeyboardEvent) {
            if (event.key === "Escape") setSelectedEmployee(null);
        }

        document.addEventListener("keydown", closeOnEscape);

        return () => document.removeEventListener("keydown", closeOnEscape);
    }, [selectedEmployee]);

    function resetFilters() {
        setSearch("");
        setDepartment(allValue);
        setPosition(allValue);
        setEmploymentStatus(allValue);
    }

    function retryLoad() {
        window.location.reload();
    }

    return (
        <div className="hr-directory-explorer">
            <EmployeeDirectorySummary employees={filteredEmployees} />

            <EmployeeDirectoryFilters
                search={search}
                department={department}
                position={position}
                employmentStatus={employmentStatus}
                departments={departments}
                positions={positions}
                employmentStatuses={employmentStatusOptions}
                activeFilterCount={activeFilterCount}
                onSearchChange={setSearch}
                onDepartmentChange={setDepartment}
                onPositionChange={setPosition}
                onEmploymentStatusChange={setEmploymentStatus}
                onReset={resetFilters}
            />

            <section className="hr-dashboard-panel hr-directory-records" aria-labelledby="hr-directory-records-heading">
                <div className="hr-panel-header">
                    <div>
                        <p className="hr-section-kicker">Employee reference</p>
                        <h2 id="hr-directory-records-heading">Employee records</h2>
                        <p className="hr-panel-description">
                            Review the Employee reference values used across attendance operations.
                        </p>
                    </div>
                    <span className="hr-directory-result-count">
                        {loadError
                            ? "Records unavailable"
                            : "Showing " + filteredEmployees.length + " of " + employees.length + " employees"}
                    </span>
                </div>

                {loadError ? (
                    <div className="hr-directory-empty-state" role="alert">
                        <p>Unable to load employee records. Please try again.</p>
                        <button type="button" className="button-secondary" onClick={retryLoad}>
                            Try again
                        </button>
                    </div>
                ) : filteredEmployees.length > 0 ? (
                    <EmployeeDirectoryTable
                        employees={filteredEmployees}
                        onSelectEmployee={setSelectedEmployee}
                    />
                ) : (
                    <div className="hr-directory-empty-state">
                        <p>
                            {employees.length === 0
                                ? "No employee records are available."
                                : "No employee records match the selected filters."}
                        </p>
                        {employees.length > 0 ? (
                            <button type="button" className="button-secondary" onClick={resetFilters}>
                                Clear filters
                            </button>
                        ) : null}
                    </div>
                )}
            </section>

            <EmployeeDetailsDrawer
                employee={selectedEmployee}
                onClose={() => setSelectedEmployee(null)}
            />
        </div>
    );
}
