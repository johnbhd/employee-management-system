"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  attendanceReportTypes,
  buildMonthlyAttendanceRows,
  type AttendanceReportCorrectionRecord,
  type AttendanceReportRecord,
  type AttendanceReportType,
} from "@/data/hr-attendance-reports";
import type { AttendanceReportsData } from "@/server/hr/attendance-reports.service";
import type { AttendanceReportsQuery } from "@/server/hr/attendance-reports-query";

import { AttendanceReportFilters } from "./AttendanceReportFilters";
import { AttendanceReportSelector } from "./AttendanceReportSelector";
import { AttendanceReportSummary } from "./AttendanceReportSummary";
import { AttendanceReportTable } from "./AttendanceReportTable";
import { AttendanceReportToolbar } from "./AttendanceReportToolbar";
import { AttendanceSourceBreakdown } from "./AttendanceSourceBreakdown";

type AttendanceReportsExplorerProps = {
  data: AttendanceReportsData;
  query: AttendanceReportsQuery;
  defaultDate: string;
  loadError?: boolean;
};

type FilterOption = {
  value: string;
  label: string;
};

function escapeCsv(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function createCsv(
  headers: readonly string[],
  rows: readonly (readonly (string | number)[])[],
) {
  return [headers, ...rows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\n");
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
  if (value.length === 7) {
    const [year, month] = value.split("-").map(Number);

    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(year, month - 1, 1)));
  }

  return formatDate(value);
}

function getReportLabel(reportType: AttendanceReportType) {
  return attendanceReportTypes.find((report) => report.id === reportType)?.label
    ?? "Attendance report";
}

function optionValues(values: readonly string[], allLabel: string): FilterOption[] {
  return [
    { value: "", label: allLabel },
    ...values.map((value) => ({ value, label: value })),
  ];
}

function buildExportData(
  reportType: AttendanceReportType,
  records: readonly AttendanceReportRecord[],
  monthlyRows: ReturnType<typeof buildMonthlyAttendanceRows>,
  correctionRequests: readonly AttendanceReportCorrectionRecord[],
) {
  if (reportType === "monthly") {
    return createCsv(
      [
        "Employee",
        "Employee ID",
        "Department",
        "Attendance records",
        "Completed",
        "Awaiting time-out",
        "QR records",
      ],
      monthlyRows.map((row) => [
        row.employeeName,
        row.employeeId,
        row.department,
        row.attendanceRecords,
        row.completed,
        row.awaitingTimeOut,
        row.qrRecords,
      ]),
    );
  }

  if (reportType === "correction-summary") {
    return createCsv(
      [
        "Request",
        "Attendance record",
        "Employee",
        "Employee ID",
        "Department",
        "Attendance date",
        "Issue",
        "Submitted",
        "Status",
        "Decision date",
      ],
      correctionRequests.map((request) => [
        request.id,
        request.attendanceRecordId,
        request.employeeName,
        request.employeeId,
        request.department,
        request.attendanceDate,
        request.issueType,
        request.submittedAt,
        request.status,
        request.decisionAt ?? "Not decided",
      ]),
    );
  }

  if (reportType === "source-usage") {
    return createCsv(
      ["Source", "Records", "Share"],
      [["QR", records.length, records.length ? "100%" : "0%"]],
    );
  }

  return createCsv(
    [
      "Employee",
      "Employee ID",
      "Department",
      "Date",
      "Time in",
      "Time out",
      "Source",
      "Status",
    ],
    records.map((record) => [
      record.employeeName,
      record.employeeId,
      record.department,
      record.date,
      record.timeIn,
      record.timeOut ?? "Not recorded",
      record.source,
      record.status,
    ]),
  );
}

function buildQueryString(values: AttendanceReportsQuery) {
  const params = new URLSearchParams();

  if (values.reportType !== "daily") params.set("report", values.reportType);
  params.set("date", values.date);
  if (values.reportType === "monthly") params.set("month", values.month);
  if (values.employeeId) params.set("employeeId", values.employeeId);
  if (values.department) params.set("department", values.department);
  if (values.status) params.set("status", values.status);
  if (values.source) params.set("source", values.source);

  return params.toString();
}

export function AttendanceReportsExplorer({
  data,
  query,
  defaultDate,
  loadError = false,
}: AttendanceReportsExplorerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [reportType, setReportType] = useState(query.reportType);
  const [date, setDate] = useState(query.date);
  const [month, setMonth] = useState(query.month);
  const [department, setDepartment] = useState(query.department ?? "");
  const [employeeId, setEmployeeId] = useState(query.employeeId ?? "");
  const [source, setSource] = useState(query.source ?? "");
  const [status, setStatus] = useState(query.status ?? "");

  const departmentOptions = useMemo(
    () => optionValues(data.departments, "All departments"),
    [data.departments],
  );
  const employeeOptions = useMemo(() => [
    { value: "", label: "All employees" },
    ...data.employees.map((employee) => ({
      value: employee.employeeId,
      label: `${employee.displayName} (${employee.employeeId})`,
    })),
  ], [data.employees]);
  const sourceOptions = useMemo(() => [
    { value: "", label: "All sources" },
    { value: "QR", label: "QR" },
  ], []);
  const statusOptions = useMemo(() => [
    { value: "", label: "All statuses" },
    { value: "present", label: "Present" },
    { value: "completed", label: "Completed" },
  ], []);
  const hasRows = reportType === "monthly"
    ? data.monthlyRows.length > 0
    : reportType === "correction-summary"
      ? data.correctionRequests.length > 0
      : data.records.length > 0;
  const exportCsv = useMemo(() => buildExportData(
    reportType,
    data.records,
    data.monthlyRows,
    data.correctionRequests,
  ), [data.correctionRequests, data.monthlyRows, data.records, reportType]);
  const exportHref = hasRows
    ? `data:text/csv;charset=utf-8,${encodeURIComponent(exportCsv)}`
    : undefined;
  const selectedEmployee = employeeId
    ? data.employees.find((employee) => employee.employeeId === employeeId)?.displayName
    : undefined;
  const activeFilterCount = [
    reportType === "monthly" ? month !== defaultDate.slice(0, 7) : date !== defaultDate,
    department,
    employeeId,
    source,
    status,
  ].filter(Boolean).length;

  function navigateToFilters(overrides: Partial<AttendanceReportsQuery> = {}) {
    const nextQuery: AttendanceReportsQuery = {
      ...query,
      reportType,
      date,
      month,
      department: department || null,
      employeeId: employeeId || null,
      source: source === "QR" ? "QR" : null,
      status: status === "present" || status === "completed" ? status : null,
      ...overrides,
    };
    const queryString = buildQueryString(nextQuery);

    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  }

  function resetFilters() {
    router.push(pathname);
  }

  function handleReportChange(nextReportType: AttendanceReportType) {
    setReportType(nextReportType);
    setSource("");
    setStatus("");
    navigateToFilters({ reportType: nextReportType, status: null, source: null });
  }

  return (
    <div className="hr-reports-explorer">
      <AttendanceReportSelector
        reportTypes={attendanceReportTypes}
        selectedReport={reportType}
        onSelectReport={handleReportChange}
      />
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
        onDateChange={(value) => {
          setDate(value);
          navigateToFilters({ date: value });
        }}
        onMonthChange={(value) => {
          setMonth(value);
          navigateToFilters({ month: value });
        }}
        onDepartmentChange={(value) => {
          setDepartment(value);
          navigateToFilters({ department: value || null });
        }}
        onEmployeeChange={(value) => {
          setEmployeeId(value);
          navigateToFilters({ employeeId: value || null });
        }}
        onSourceChange={(value) => {
          setSource(value);
          navigateToFilters({ source: value === "QR" ? "QR" : null });
        }}
        onStatusChange={(value) => {
          setStatus(value);
          navigateToFilters({
            status: value === "present" || value === "completed" ? value : null,
          });
        }}
        onReset={resetFilters}
      />

      <section className="hr-dashboard-panel hr-reports-result-panel">
        <AttendanceReportToolbar
          reportLabel={getReportLabel(reportType)}
          periodLabel={formatPeriod(reportType === "monthly" ? month : date)}
          departmentLabel={department || "All departments"}
          employeeLabel={selectedEmployee}
          exportHref={exportHref}
          exportFileName={`attendance-${reportType}-${reportType === "monthly" ? month : date}.csv`}
          hasRows={hasRows}
          onPrint={() => window.print()}
        />

        {!loadError ? (
          <AttendanceReportSummary
            reportType={reportType}
            summary={data.summary}
            monthlyRows={data.monthlyRows}
            correctionRequests={data.correctionRequests}
          />
        ) : null}

        {reportType === "source-usage" ? (
          <AttendanceSourceBreakdown summary={data.sourceSummary} />
        ) : null}
        {hasRows && reportType !== "source-usage" ? (
          <AttendanceReportTable
            reportType={reportType}
            records={data.records}
            monthlyRows={data.monthlyRows}
            correctionRequests={data.correctionRequests}
          />
        ) : null}
        {!hasRows ? (
          <div className="hr-reports-empty-state" role={loadError ? "alert" : undefined}>
            <strong>
              {loadError
                ? "Unable to load the attendance report."
                : "No attendance records found for the selected report filters."}
            </strong>
            <p>
              {loadError
                ? "Please try again by refreshing the page."
                : "Try another period, department, or employee to view available HR records."}
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
