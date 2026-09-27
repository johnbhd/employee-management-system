"use client";

import { useEffect, useMemo, useState } from "react";

import type { HrEmployeeScheduleRecord } from "@/data/hr-employee-schedules";

import { EmployeeScheduleDrawer } from "./EmployeeScheduleDrawer";
import { EmployeeScheduleFilters } from "./EmployeeScheduleFilters";
import { EmployeeScheduleSummary } from "./EmployeeScheduleSummary";
import { EmployeeSchedulesTable } from "./EmployeeSchedulesTable";

const allValue = "all";

const dayStatusOptions = [
  { value: allValue, label: "All day statuses" },
  { value: "Working Day", label: "Working Day" },
  { value: "Rest Day", label: "Rest Day" },
  { value: "Leave", label: "Leave" },
  { value: "Holiday", label: "Holiday" },
];

const hrpsStatusOptions = [
  { value: allValue, label: "All HRPS statuses" },
  { value: "Synchronized", label: "Synchronized" },
  { value: "Needs Review", label: "Needs Review" },
  { value: "Unavailable", label: "Unavailable" },
];

type EmployeeSchedulesExplorerProps = {
  records: readonly HrEmployeeScheduleRecord[];
};

export function EmployeeSchedulesExplorer({ records }: EmployeeSchedulesExplorerProps) {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState(allValue);
  const [schedule, setSchedule] = useState(allValue);
  const [workLocation, setWorkLocation] = useState(allValue);
  const [dayStatus, setDayStatus] = useState(allValue);
  const [hrpsStatus, setHrpsStatus] = useState(allValue);
  const [selectedRecord, setSelectedRecord] = useState<HrEmployeeScheduleRecord | null>(null);

  const departments = useMemo(
    () => [
      { value: allValue, label: "All departments" },
      ...Array.from(new Set(records.map((record) => record.department)))
        .sort()
        .map((value) => ({ value, label: value })),
    ],
    [records],
  );

  const schedules = useMemo(
    () => [
      { value: allValue, label: "All schedules" },
      ...Array.from(new Set(records.map((record) => record.schedule)))
        .sort()
        .map((value) => ({ value, label: value })),
    ],
    [records],
  );

  const workLocations = useMemo(
    () => [
      { value: allValue, label: "All work locations" },
      ...Array.from(new Set(records.map((record) => record.workLocation)))
        .sort()
        .map((value) => ({ value, label: value })),
    ],
    [records],
  );

  const filteredRecords = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return records.filter((record) => {
      const matchesSearch = !normalizedSearch
        || record.employeeName.toLowerCase().includes(normalizedSearch)
        || record.employeeId.toLowerCase().includes(normalizedSearch)
        || record.department.toLowerCase().includes(normalizedSearch);
      const matchesDepartment = department === allValue || record.department === department;
      const matchesSchedule = schedule === allValue || record.schedule === schedule;
      const matchesLocation = workLocation === allValue || record.workLocation === workLocation;
      const matchesDayStatus = dayStatus === allValue || record.todayStatus === dayStatus;
      const matchesHrpsStatus = hrpsStatus === allValue || record.hrpsStatus === hrpsStatus;

      return matchesSearch
        && matchesDepartment
        && matchesSchedule
        && matchesLocation
        && matchesDayStatus
        && matchesHrpsStatus;
    });
  }, [dayStatus, department, hrpsStatus, records, schedule, search, workLocation]);

  const activeFilterCount = [
    search.trim(),
    department !== allValue ? department : "",
    schedule !== allValue ? schedule : "",
    workLocation !== allValue ? workLocation : "",
    dayStatus !== allValue ? dayStatus : "",
    hrpsStatus !== allValue ? hrpsStatus : "",
  ].filter(Boolean).length;

  useEffect(() => {
    if (!selectedRecord) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedRecord(null);
    }

    document.addEventListener("keydown", closeOnEscape);

    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [selectedRecord]);

  function resetFilters() {
    setSearch("");
    setDepartment(allValue);
    setSchedule(allValue);
    setWorkLocation(allValue);
    setDayStatus(allValue);
    setHrpsStatus(allValue);
  }

  return (
    <div className="hr-schedules-explorer">
      <EmployeeScheduleSummary records={filteredRecords} />

      <EmployeeScheduleFilters
        search={search}
        department={department}
        schedule={schedule}
        workLocation={workLocation}
        dayStatus={dayStatus}
        hrpsStatus={hrpsStatus}
        departments={departments}
        schedules={schedules}
        workLocations={workLocations}
        dayStatuses={dayStatusOptions}
        hrpsStatuses={hrpsStatusOptions}
        activeFilterCount={activeFilterCount}
        onSearchChange={setSearch}
        onDepartmentChange={setDepartment}
        onScheduleChange={setSchedule}
        onWorkLocationChange={setWorkLocation}
        onDayStatusChange={setDayStatus}
        onHrpsStatusChange={setHrpsStatus}
        onReset={resetFilters}
      />

      <section className="hr-dashboard-panel hr-schedules-records" aria-labelledby="hr-schedules-records-heading">
        <div className="hr-panel-header">
          <div>
            <p className="hr-section-kicker">Operational records</p>
            <h2 id="hr-schedules-records-heading">Employee schedule records</h2>
            <p className="hr-panel-description">
              Use assigned schedules as reference when reviewing attendance status and schedule mismatches.
            </p>
          </div>
          <span className="hr-schedules-result-count">Showing {filteredRecords.length} of {records.length} employees</span>
        </div>

        {filteredRecords.length > 0 ? (
          <EmployeeSchedulesTable records={filteredRecords} onSelectSchedule={setSelectedRecord} />
        ) : (
          <div className="hr-schedules-empty-state">
            <p>No employee schedules match the selected filters.</p>
            <button type="button" className="button-secondary" onClick={resetFilters}>Clear filters</button>
          </div>
        )}
      </section>

      <EmployeeScheduleDrawer record={selectedRecord} onClose={() => setSelectedRecord(null)} />
    </div>
  );
}
