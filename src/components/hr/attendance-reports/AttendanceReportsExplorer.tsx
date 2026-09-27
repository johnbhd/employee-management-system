"use client";

import { useMemo, useState } from "react";

import { AttendanceReportFilters } from "@/components/hr/attendance-reports/AttendanceReportFilters";
import { AttendanceReportSelector } from "@/components/hr/attendance-reports/AttendanceReportSelector";
import { AttendanceReportSummary } from "@/components/hr/attendance-reports/AttendanceReportSummary";
import { AttendanceReportTable } from "@/components/hr/attendance-reports/AttendanceReportTable";
import { AttendanceReportToolbar } from "@/components/hr/attendance-reports/AttendanceReportToolbar";
import { AttendanceSourceBreakdown } from "@/components/hr/attendance-reports/AttendanceSourceBreakdown";
import { useHrWorkflow } from "@/components/layouts/hr/HrWorkflowContext";
import type { HrCorrectionRequest } from "@/data/hr-correction-requests";
import {
  attendanceReportTypes,
  buildMonthlyAttendanceRows,
  buildSourceUsageSummary,
  defaultAttendanceReportDate,
  defaultAttendanceReportMonth,
  type AttendanceReportRecord,
  type AttendanceReportType,
} from "@/data/hr-attendance-reports";

type FilterOption = {
  value: string;
  label: string;
};

function escapeCsv(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function createCsv(headers: readonly string[], rows: readonly (readonly (string | number)[])[]) {
  return [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function formatPeriod(value: string) {
  if (!value) return "All dates";
  if (value.length === 7) {
    const [year, month] = value.split("-").map(Number);
    return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, 1)));
  }
  return formatDate(value);
}

function optionValues(values: readonly string[], allLabel: string): FilterOption[] {
  return [{ value: "all", label: allLabel }, ...values.map((value) => ({ value, label: value }))];
}

function getReportLabel(reportType: AttendanceReportType) {
  return attendanceReportTypes.find((report) => report.id === reportType)?.label ?? "Attendance report";
}

function buildExportData(
  reportType: AttendanceReportType,
  records: readonly AttendanceReportRecord[],
  monthlyRows: ReturnType<typeof buildMonthlyAttendanceRows>,
  correctionRequests: readonly HrCorrectionRequest[],
) {
  if (reportType === "monthly") {
    return createCsv(
      ["Employee", "Employee ID", "Department", "Scheduled days", "Present", "Late", "Absent", "Undertime minutes", "Missing time-out"],
      monthlyRows.map((row) => [row.employeeName, row.employeeId, row.department, row.scheduledDays, row.present, row.late, row.absent, row.undertimeMinutes, row.missingTimeOut]),
    );
  }

  if (reportType === "correction-summary") {
    return createCsv(
      ["Request", "Employee", "Employee ID", "Department", "Attendance date", "Issue", "Submitted", "Status", "Decision date"],
      correctionRequests.map((request) => [request.id, request.employeeName, request.employeeId, request.department, request.attendanceDate, request.issueType, request.submittedDate, request.status, request.decisionAt ?? "Not decided"]),
    );
  }

  if (reportType === "source-usage") {
    const summary = buildSourceUsageSummary(records);
    return createCsv(
      ["Source", "Records", "Share"],
      [
        ["Bundy", summary.bundy, summary.total ? `${Math.round((summary.bundy / summary.total) * 100)}%` : "0%"],
        ["QR", summary.qr, summary.total ? `${Math.round((summary.qr / summary.total) * 100)}%` : "0%"],
        ["No source", summary.noSource, summary.total ? `${Math.round((summary.noSource / summary.total) * 100)}%` : "0%"],
      ],
    );
  }

  return createCsv(
    ["Employee", "Employee ID", "Department", "Date", "Schedule", "Time in", "Time out", "Source", "Status", "Validation", "HR Verification", "Payroll Readiness", "Late minutes", "Undertime minutes"],
    records.map((record) => [record.employeeName, record.employeeId, record.department, record.date, record.schedule, record.timeIn, record.timeOut, record.source ?? "No source", record.status, record.validationStatus, record.hrVerificationStatus ?? "Pending Review", record.payrollReadiness ?? "Not Ready", record.lateMinutes ?? 0, record.undertimeMinutes ?? 0]),
  );
}

export function AttendanceReportsExplorer() {
  const { attendanceRecords, correctionRequests } = useHrWorkflow();
  const records = useMemo<AttendanceReportRecord[]>(() => attendanceRecords.map((record) => ({
    ...record,
    correctionRequestId: record.correctionStatus === "No Correction Request"
      ? undefined
      : correctionRequests.find((request) => request.attendanceRecordId === record.id)?.id,
    correctionStatus: record.correctionStatus === "No Correction Request" ? undefined : record.correctionStatus,
  })), [attendanceRecords, correctionRequests]);
  const [reportType, setReportType] = useState<AttendanceReportType>("daily");
  const [date, setDate] = useState(defaultAttendanceReportDate);
  const [month, setMonth] = useState(defaultAttendanceReportMonth);
  const [department, setDepartment] = useState("all");
  const [employeeId, setEmployeeId] = useState("all");
  const [source, setSource] = useState("all");
  const [status, setStatus] = useState("all");

  const departments = useMemo(() => Array.from(new Set(records.map((record) => record.department))).sort(), [records]);
  const employees = useMemo(() => Array.from(new Map(records.map((record) => [record.employeeId, record.employeeName])).entries()).sort((first, second) => first[1].localeCompare(second[1])), [records]);
  const employeeOptions = useMemo(() => [{ value: "all", label: "All employees" }, ...employees.map(([value, label]) => ({ value, label }))], [employees]);
  const departmentOptions = useMemo(() => optionValues(departments, "All departments"), [departments]);
  const sourceOptions = useMemo(() => optionValues(["Bundy", "QR", "none"], "All sources").map((option) => option.value === "none" ? { ...option, label: "No source" } : option), []);
  const statusOptions = useMemo(() => optionValues(["Present", "Late", "Absent", "Missing Time-Out"], "All statuses"), []);

  const filteredAttendanceRecords = useMemo(() => records.filter((record) => {
    const periodMatches = reportType === "monthly" ? record.date.startsWith(month) : record.date === date;
    const departmentMatches = department === "all" || record.department === department;
    const employeeMatches = employeeId === "all" || record.employeeId === employeeId;
    const sourceMatches = source === "all" || (source === "none" ? record.source === null : record.source === source);
    const statusMatches = status === "all" || record.status === status;
    const sourceFilterApplies = reportType !== "monthly" && reportType !== "source-usage" && reportType !== "correction-summary";
    const statusFilterApplies = reportType === "daily";

    return periodMatches && departmentMatches && employeeMatches && (sourceFilterApplies ? sourceMatches : true) && (statusFilterApplies ? statusMatches : true);
  }), [date, department, employeeId, month, records, reportType, source, status]);

  const reportRecords = useMemo(() => {
    if (reportType === "late") return filteredAttendanceRecords.filter((record) => record.status === "Late" || (record.lateMinutes ?? 0) > 0);
    if (reportType === "undertime") return filteredAttendanceRecords.filter((record) => (record.undertimeMinutes ?? 0) > 0);
    if (reportType === "missing-time-out") return filteredAttendanceRecords.filter((record) => record.status === "Missing Time-Out");
    return filteredAttendanceRecords;
  }, [filteredAttendanceRecords, reportType]);

  const filteredCorrectionRequests = useMemo(() => correctionRequests.filter((request) => {
    const periodMatches = request.attendanceDate === date;
    const departmentMatches = department === "all" || request.department === department;
    const employeeMatches = employeeId === "all" || request.employeeId === employeeId;

    return (reportType === "monthly" ? request.attendanceDate.startsWith(month) : periodMatches) && departmentMatches && employeeMatches;
  }), [correctionRequests, date, department, employeeId, month, reportType]);

  const monthlyRows = useMemo(() => buildMonthlyAttendanceRows(filteredAttendanceRecords), [filteredAttendanceRecords]);
  const sourceSummary = useMemo(() => buildSourceUsageSummary(filteredAttendanceRecords), [filteredAttendanceRecords]);
  const hasRows = reportType === "source-usage" ? sourceSummary.total > 0 : reportType === "correction-summary" ? filteredCorrectionRequests.length > 0 : reportType === "monthly" ? monthlyRows.length > 0 : reportRecords.length > 0;
  const activeFilterCount = [
    reportType === "monthly" ? month !== defaultAttendanceReportMonth : date !== defaultAttendanceReportDate,
    department !== "all",
    reportType !== "source-usage" && employeeId !== "all",
    reportType !== "monthly" && reportType !== "source-usage" && reportType !== "correction-summary" && source !== "all",
    reportType === "daily" && status !== "all",
  ].filter(Boolean).length;

  const exportCsv = useMemo(() => buildExportData(reportType, reportRecords, monthlyRows, filteredCorrectionRequests), [filteredCorrectionRequests, monthlyRows, reportRecords, reportType]);
  const exportHref = hasRows ? `data:text/csv;charset=utf-8,${encodeURIComponent(exportCsv)}` : undefined;
  const reportLabel = getReportLabel(reportType);
  const selectedEmployee = employeeId === "all" ? undefined : employees.find(([id]) => id === employeeId)?.[1];
  const periodLabel = formatPeriod(reportType === "monthly" ? month : date);
  const fileName = `attendance-${reportType}-${reportType === "monthly" ? month : date}.csv`;

  function resetFilters() {
    setDate(defaultAttendanceReportDate);
    setMonth(defaultAttendanceReportMonth);
    setDepartment("all");
    setEmployeeId("all");
    setSource("all");
    setStatus("all");
  }

  return (
    <div className="hr-reports-explorer">
      <AttendanceReportSelector reportTypes={attendanceReportTypes} selectedReport={reportType} onSelectReport={setReportType} />
      <AttendanceReportFilters
        reportType={reportType}
        date={date}
        month={month}
        department={department}
        employeeId={employeeId}
        source={source}
        status={status}
        departments={departmentOptions}
        employees={employeeOptions}
        sources={sourceOptions}
        statuses={statusOptions}
        activeFilterCount={activeFilterCount}
        onDateChange={setDate}
        onMonthChange={setMonth}
        onDepartmentChange={setDepartment}
        onEmployeeChange={setEmployeeId}
        onSourceChange={setSource}
        onStatusChange={setStatus}
        onReset={resetFilters}
      />

      <section className="hr-dashboard-panel hr-reports-result-panel">
        <AttendanceReportToolbar
          reportLabel={reportLabel}
          periodLabel={periodLabel}
          departmentLabel={department === "all" ? "All departments" : department}
          employeeLabel={selectedEmployee}
          exportHref={exportHref}
          exportFileName={fileName}
          hasRows={hasRows}
          onPrint={() => window.print()}
        />
        <AttendanceReportSummary reportType={reportType} records={reportRecords} monthlyRows={monthlyRows} correctionRequests={filteredCorrectionRequests} />

        {reportType === "source-usage" ? <AttendanceSourceBreakdown summary={sourceSummary} /> : null}
        {hasRows && reportType !== "source-usage" ? (
          <AttendanceReportTable reportType={reportType} records={reportRecords} monthlyRows={monthlyRows} correctionRequests={filteredCorrectionRequests} />
        ) : null}
        {!hasRows ? (
          <div className="hr-reports-empty-state">
            <strong>No report records match the selected filters.</strong>
            <p>Try another period, department, or employee to view available HR records.</p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
