"use client";

import { useEffect, useMemo, useState } from "react";

import {
  hrAttendanceMonitoringDate,
  type HrAttendanceMonitoringRecord,
} from "@/data/hr";

import { AttendanceMonitoringFilters } from "./AttendanceMonitoringFilters";
import { AttendanceMonitoringSummary } from "./AttendanceMonitoringSummary";
import { AttendanceMonitoringTable } from "./AttendanceMonitoringTable";
import { AttendanceRecordDrawer } from "./AttendanceRecordDrawer";

const allValue = "all";

const statusOptions = [
  { value: allValue, label: "All statuses" },
  { value: "Present", label: "Present" },
  { value: "Late", label: "Late" },
  { value: "Absent", label: "Absent" },
  { value: "Missing Time-Out", label: "Missing Time-Out" },
];

const sourceOptions = [
  { value: allValue, label: "All sources" },
  { value: "Bundy", label: "Bundy" },
  { value: "QR", label: "QR" },
  { value: "none", label: "No source" },
];

const validationOptions = [
  { value: allValue, label: "All validation statuses" },
  { value: "Verified", label: "Verified" },
  { value: "Needs Review", label: "Needs Review" },
  { value: "Missing Data", label: "Missing Data" },
  { value: "Source Conflict", label: "Source Conflict" },
  { value: "Schedule Mismatch", label: "Schedule Mismatch" },
];

type AttendanceMonitoringExplorerProps = {
  records: readonly HrAttendanceMonitoringRecord[];
};

export function AttendanceMonitoringExplorer({ records }: AttendanceMonitoringExplorerProps) {
  const [search, setSearch] = useState("");
  const [date, setDate] = useState(hrAttendanceMonitoringDate);
  const [department, setDepartment] = useState(allValue);
  const [status, setStatus] = useState(allValue);
  const [source, setSource] = useState(allValue);
  const [validation, setValidation] = useState(allValue);
  const [selectedRecord, setSelectedRecord] = useState<HrAttendanceMonitoringRecord | null>(null);

  const departments = useMemo(
    () => [
      { value: allValue, label: "All departments" },
      ...Array.from(new Set(records.map((record) => record.department)))
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
      const matchesDate = record.date === date;
      const matchesDepartment = department === allValue || record.department === department;
      const matchesStatus = status === allValue || record.status === status;
      const sourceValue = record.source ?? "none";
      const matchesSource = source === allValue || sourceValue === source;
      const matchesValidation = validation === allValue || record.validationStatus === validation;

      return matchesSearch && matchesDate && matchesDepartment && matchesStatus && matchesSource && matchesValidation;
    });
  }, [date, department, records, search, source, status, validation]);

  const activeFilterCount = [
    search.trim(),
    date !== hrAttendanceMonitoringDate ? date : "",
    department !== allValue ? department : "",
    status !== allValue ? status : "",
    source !== allValue ? source : "",
    validation !== allValue ? validation : "",
  ].filter(Boolean).length;

  useEffect(() => {
    if (!selectedRecord) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedRecord(null);
    }

    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [selectedRecord]);

  function resetFilters() {
    setSearch("");
    setDate(hrAttendanceMonitoringDate);
    setDepartment(allValue);
    setStatus(allValue);
    setSource(allValue);
    setValidation(allValue);
  }

  return (
    <div className="hr-monitoring-explorer">
      <AttendanceMonitoringSummary records={filteredRecords} />

      <AttendanceMonitoringFilters
        search={search}
        date={date}
        department={department}
        status={status}
        source={source}
        validation={validation}
        departments={departments}
        statuses={statusOptions}
        sources={sourceOptions}
        validations={validationOptions}
        activeFilterCount={activeFilterCount}
        onSearchChange={setSearch}
        onDateChange={setDate}
        onDepartmentChange={setDepartment}
        onStatusChange={setStatus}
        onSourceChange={setSource}
        onValidationChange={setValidation}
        onReset={resetFilters}
      />

      <section className="hr-dashboard-panel hr-monitoring-records" aria-labelledby="hr-monitoring-records-heading">
        <div className="hr-panel-header">
          <div>
            <p className="hr-section-kicker">Operational records</p>
            <h2 id="hr-monitoring-records-heading">Attendance records</h2>
            <p className="hr-panel-description">Review source events, attendance status, and validation results before opening a record.</p>
          </div>
          <span className="hr-monitoring-result-count">Showing {filteredRecords.length} of {records.length} records</span>
        </div>

        <AttendanceMonitoringTable records={filteredRecords} onSelectRecord={setSelectedRecord} />
      </section>

      <AttendanceRecordDrawer record={selectedRecord} onClose={() => setSelectedRecord(null)} />
    </div>
  );
}
