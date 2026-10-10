"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  EmployeeScheduleDetails,
  EmployeeScheduleItem,
} from "@/types/hr-employee-schedule";

import { EmployeeScheduleDrawer } from "./EmployeeScheduleDrawer";
import { EmployeeScheduleFilters } from "./EmployeeScheduleFilters";
import { EmployeeScheduleSummary } from "./EmployeeScheduleSummary";
import { EmployeeSchedulesTable } from "./EmployeeSchedulesTable";
import { formatSchedule } from "./schedule-display";

const allValue = "all";
const noLocationValue = "none";

type FilterOption = {
  value: string;
  label: string;
};

type EmployeeSchedulesExplorerProps = {
  records: readonly EmployeeScheduleItem[];
  loadError: boolean;
};

function getSearchText(record: EmployeeScheduleItem): string {
  return [
    record.employee.displayName,
    record.employee.employeeId,
    record.employee.department,
    record.employee.position ?? "",
  ]
    .join(" ")
    .toLowerCase();
}

function getScheduleOption(schedule: EmployeeScheduleDetails): FilterOption {
  return { value: schedule.scheduleId, label: formatSchedule(schedule) };
}

export function EmployeeSchedulesExplorer({
  records,
  loadError,
}: EmployeeSchedulesExplorerProps) {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState(allValue);
  const [schedule, setSchedule] = useState(allValue);
  const [workLocation, setWorkLocation] = useState(allValue);
  const [selectedRecord, setSelectedRecord] = useState<EmployeeScheduleItem | null>(null);

  const departments = useMemo<FilterOption[]>(
    () => [
      { value: allValue, label: "All departments" },
      ...Array.from(new Set(records.map((record) => record.employee.department)))
        .sort()
        .map((value) => ({ value, label: value })),
    ],
    [records],
  );

  const schedules = useMemo<FilterOption[]>(
    () => [
      { value: allValue, label: "All schedules" },
      ...Array.from(
        new Map(
          records
            .flatMap((record) => (record.schedule ? [record.schedule] : []))
            .map((value) => [value.scheduleId, value]),
        ).values(),
      )
        .sort((left, right) => formatSchedule(left).localeCompare(formatSchedule(right)))
        .map(getScheduleOption),
    ],
    [records],
  );

  const workLocations = useMemo<FilterOption[]>(
    () => [
      { value: allValue, label: "All work locations" },
      ...(records.some((record) => !record.schedule?.workLocation)
        ? [{ value: noLocationValue, label: "No location reference" }]
        : []),
      ...Array.from(
        new Set(
          records.flatMap((record) =>
            record.schedule?.workLocation ? [record.schedule.workLocation] : [],
          ),
        ),
      )
        .sort()
        .map((value) => ({ value, label: value })),
    ],
    [records],
  );

  const filteredRecords = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return records.filter((record) => {
      const matchesSearch = !normalizedSearch || getSearchText(record).includes(normalizedSearch);
      const matchesDepartment =
        department === allValue || record.employee.department === department;
      const matchesSchedule =
        schedule === allValue || record.schedule?.scheduleId === schedule;
      const matchesLocation =
        workLocation === allValue
        || (workLocation === noLocationValue && !record.schedule?.workLocation)
        || record.schedule?.workLocation === workLocation;

      return matchesSearch && matchesDepartment && matchesSchedule && matchesLocation;
    });
  }, [department, records, schedule, search, workLocation]);

  const activeFilterCount = [
    search.trim(),
    department !== allValue ? department : "",
    schedule !== allValue ? schedule : "",
    workLocation !== allValue ? workLocation : "",
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
  }

  return (
    <div className="hr-schedules-explorer">
      <EmployeeScheduleSummary records={filteredRecords} />

      <EmployeeScheduleFilters
        search={search}
        department={department}
        schedule={schedule}
        workLocation={workLocation}
        departments={departments}
        schedules={schedules}
        workLocations={workLocations}
        activeFilterCount={activeFilterCount}
        onSearchChange={setSearch}
        onDepartmentChange={setDepartment}
        onScheduleChange={setSchedule}
        onWorkLocationChange={setWorkLocation}
        onReset={resetFilters}
      />

      <section
        className="hr-dashboard-panel hr-schedules-records"
        aria-labelledby="hr-schedules-records-heading"
      >
        <div className="hr-panel-header">
          <div>
            <p className="hr-section-kicker">Schedule reference</p>
            <h2 id="hr-schedules-records-heading">Employee schedule records</h2>
            <p className="hr-panel-description">
              Review read-only work-schedule references associated with Employee IDs.
            </p>
          </div>
          <span className="hr-schedules-result-count">
            {loadError
              ? "Records unavailable"
              : `Showing ${filteredRecords.length} of ${records.length} employees`}
          </span>
        </div>

        {loadError ? (
          <div className="hr-schedules-empty-state" role="alert">
            <p>Unable to load employee schedules. Please try again.</p>
            <button
              type="button"
              className="button-secondary"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        ) : filteredRecords.length > 0 ? (
          <EmployeeSchedulesTable
            records={filteredRecords}
            onSelectSchedule={setSelectedRecord}
          />
        ) : (
          <div className="hr-schedules-empty-state">
            <p>
              {records.length === 0
                ? "No schedule reference records are available."
                : "No employee schedules match the selected filters."}
            </p>
            {records.length > 0 ? (
              <button type="button" className="button-secondary" onClick={resetFilters}>
                Clear filters
              </button>
            ) : null}
          </div>
        )}
      </section>

      <EmployeeScheduleDrawer
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />
    </div>
  );
}
