"use client";

import { useEffect, useMemo, useState } from "react";

import type { HrEmployeeReference } from "@/data/hr-employee-directory";

import { EmployeeDetailsDrawer } from "./EmployeeDetailsDrawer";
import { EmployeeDirectoryFilters } from "./EmployeeDirectoryFilters";
import { EmployeeDirectorySummary } from "./EmployeeDirectorySummary";
import { EmployeeDirectoryTable } from "./EmployeeDirectoryTable";

const allValue = "all";

const employmentStatusOptions = [
  { value: allValue, label: "All employment statuses" },
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

const hrpsStatusOptions = [
  { value: allValue, label: "All HRPS statuses" },
  { value: "Synchronized", label: "Synchronized" },
  { value: "Needs Review", label: "Needs Review" },
  { value: "Unavailable", label: "Unavailable" },
];

type EmployeeDirectoryExplorerProps = {
  employees: readonly HrEmployeeReference[];
};

export function EmployeeDirectoryExplorer({ employees }: EmployeeDirectoryExplorerProps) {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState(allValue);
  const [position, setPosition] = useState(allValue);
  const [employmentStatus, setEmploymentStatus] = useState(allValue);
  const [schedule, setSchedule] = useState(allValue);
  const [hrpsStatus, setHrpsStatus] = useState(allValue);
  const [selectedEmployee, setSelectedEmployee] = useState<HrEmployeeReference | null>(null);

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
      ...Array.from(new Set(employees.map((employee) => employee.position)))
        .sort()
        .map((value) => ({ value, label: value })),
    ],
    [employees],
  );

  const schedules = useMemo(
    () => [
      { value: allValue, label: "All schedules" },
      ...Array.from(new Set(employees.map((employee) => employee.schedule).filter((value): value is string => Boolean(value))))
        .sort()
        .map((value) => ({ value, label: value })),
    ],
    [employees],
  );

  const filteredEmployees = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return employees.filter((employee) => {
      const matchesSearch = !normalizedSearch
        || employee.employeeName.toLowerCase().includes(normalizedSearch)
        || employee.employeeId.toLowerCase().includes(normalizedSearch)
        || employee.position.toLowerCase().includes(normalizedSearch);
      const matchesDepartment = department === allValue || employee.department === department;
      const matchesPosition = position === allValue || employee.position === position;
      const matchesEmploymentStatus = employmentStatus === allValue || employee.employmentStatus === employmentStatus;
      const matchesSchedule = schedule === allValue || employee.schedule === schedule;
      const matchesHrpsStatus = hrpsStatus === allValue || employee.hrpsStatus === hrpsStatus;

      return matchesSearch
        && matchesDepartment
        && matchesPosition
        && matchesEmploymentStatus
        && matchesSchedule
        && matchesHrpsStatus;
    });
  }, [department, employees, employmentStatus, hrpsStatus, position, schedule, search]);

  const activeFilterCount = [
    search.trim(),
    department !== allValue ? department : "",
    position !== allValue ? position : "",
    employmentStatus !== allValue ? employmentStatus : "",
    schedule !== allValue ? schedule : "",
    hrpsStatus !== allValue ? hrpsStatus : "",
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
    setSchedule(allValue);
    setHrpsStatus(allValue);
  }

  return (
    <div className="hr-directory-explorer">
      <EmployeeDirectorySummary employees={filteredEmployees} />

      <EmployeeDirectoryFilters
        search={search}
        department={department}
        position={position}
        employmentStatus={employmentStatus}
        schedule={schedule}
        hrpsStatus={hrpsStatus}
        departments={departments}
        positions={positions}
        employmentStatuses={employmentStatusOptions}
        schedules={schedules}
        hrpsStatuses={hrpsStatusOptions}
        activeFilterCount={activeFilterCount}
        onSearchChange={setSearch}
        onDepartmentChange={setDepartment}
        onPositionChange={setPosition}
        onEmploymentStatusChange={setEmploymentStatus}
        onScheduleChange={setSchedule}
        onHrpsStatusChange={setHrpsStatus}
        onReset={resetFilters}
      />

      <section className="hr-dashboard-panel hr-directory-records" aria-labelledby="hr-directory-records-heading">
        <div className="hr-panel-header">
          <div>
            <p className="hr-section-kicker">Employee reference</p>
            <h2 id="hr-directory-records-heading">Employee records</h2>
            <p className="hr-panel-description">
              Review the employee reference values used across attendance operations.
            </p>
          </div>
          <span className="hr-directory-result-count">Showing {filteredEmployees.length} of {employees.length} employees</span>
        </div>

        {filteredEmployees.length > 0 ? (
          <EmployeeDirectoryTable employees={filteredEmployees} onSelectEmployee={setSelectedEmployee} />
        ) : (
          <div className="hr-directory-empty-state">
            <p>No employees match the selected filters.</p>
            <button type="button" className="button-secondary" onClick={resetFilters}>Clear filters</button>
          </div>
        )}
      </section>

      <EmployeeDetailsDrawer employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} />
    </div>
  );
}
