"use client";

import { useEffect, useMemo, useState } from "react";

import { useHrWorkflow } from "@/components/layouts/hr/HrWorkflowContext";
import { hrAttendanceMonitoringDate } from "@/data/hr";
import type { HrWorkflowAttendanceRecord } from "@/data/hr-workflow";

import { AttendanceMonitoringFilters } from "./AttendanceMonitoringFilters";
import { AttendanceMonitoringSummary } from "./AttendanceMonitoringSummary";
import { AttendanceMonitoringTable } from "./AttendanceMonitoringTable";
import { AttendanceRecordDrawer } from "./AttendanceRecordDrawer";
import { HrVerificationDialog } from "./HrVerificationDialog";

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

export function AttendanceMonitoringExplorer() {
  const { attendanceRecords, verifyAttendance } = useHrWorkflow();
  const records = attendanceRecords;
  const [search, setSearch] = useState("");
  const [date, setDate] = useState(hrAttendanceMonitoringDate);
  const [department, setDepartment] = useState(allValue);
  const [status, setStatus] = useState(allValue);
  const [source, setSource] = useState(allValue);
  const [validation, setValidation] = useState(allValue);
  const [verification, setVerification] = useState(allValue);
  const [payrollReadiness, setPayrollReadiness] = useState(allValue);
  const [selectedRecord, setSelectedRecord] = useState<HrWorkflowAttendanceRecord | null>(null);
  const [verificationTarget, setVerificationTarget] = useState<HrWorkflowAttendanceRecord | null>(null);
  const [verificationFeedback, setVerificationFeedback] = useState("");

  const verificationOptions = [
    { value: allValue, label: "All HR verification" },
    { value: "Pending Review", label: "Pending Review" },
    { value: "Needs Correction", label: "Needs Correction" },
    { value: "Verified", label: "Verified" },
  ];
  const payrollReadinessOptions = [
    { value: allValue, label: "All payroll readiness" },
    { value: "Ready for Payroll", label: "Ready for Payroll" },
    { value: "Not Ready", label: "Not Ready" },
  ];

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
      const matchesVerification = verification === allValue || record.hrVerificationStatus === verification;
      const matchesPayrollReadiness = payrollReadiness === allValue || record.payrollReadiness === payrollReadiness;

      return matchesSearch && matchesDate && matchesDepartment && matchesStatus && matchesSource && matchesValidation && matchesVerification && matchesPayrollReadiness;
    });
  }, [date, department, payrollReadiness, records, search, source, status, validation, verification]);

  const activeFilterCount = [
    search.trim(),
    date !== hrAttendanceMonitoringDate ? date : "",
    department !== allValue ? department : "",
    status !== allValue ? status : "",
    source !== allValue ? source : "",
    validation !== allValue ? validation : "",
    verification !== allValue ? verification : "",
    payrollReadiness !== allValue ? payrollReadiness : "",
  ].filter(Boolean).length;

  useEffect(() => {
    if (!selectedRecord) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedRecord(null);
        setVerificationTarget(null);
      }
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
    setVerification(allValue);
    setPayrollReadiness(allValue);
  }

  function openVerification() {
    if (!selectedRecord) return;
    setVerificationFeedback("");
    setVerificationTarget(selectedRecord);
  }

  function confirmVerification() {
    if (!verificationTarget) return;
    const result = verifyAttendance(verificationTarget.id);
    if (!result.ok) {
      setVerificationFeedback(result.reason);
      setVerificationTarget(null);
      return;
    }

    setVerificationFeedback("Attendance verified. The record is ready for payroll handoff.");
    setVerificationTarget(null);
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
        verification={verification}
        payrollReadiness={payrollReadiness}
        departments={departments}
        statuses={statusOptions}
        sources={sourceOptions}
        validations={validationOptions}
        verifications={verificationOptions}
        payrollReadinessOptions={payrollReadinessOptions}
        activeFilterCount={activeFilterCount}
        onSearchChange={setSearch}
        onDateChange={setDate}
        onDepartmentChange={setDepartment}
        onStatusChange={setStatus}
        onSourceChange={setSource}
        onValidationChange={setValidation}
        onVerificationChange={setVerification}
        onPayrollReadinessChange={setPayrollReadiness}
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

      <AttendanceRecordDrawer
        record={selectedRecord ? attendanceRecords.find((record) => record.id === selectedRecord.id) ?? null : null}
        onClose={() => setSelectedRecord(null)}
        onVerify={openVerification}
        verificationFeedback={verificationFeedback}
      />
      <HrVerificationDialog
        record={verificationTarget}
        onClose={() => setVerificationTarget(null)}
        onConfirm={confirmVerification}
      />
    </div>
  );
}
