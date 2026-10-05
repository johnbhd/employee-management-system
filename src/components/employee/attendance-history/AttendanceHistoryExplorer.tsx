"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  formatCampusDateKeyLabel,
  formatCampusMonthYear,
  formatCampusTime,
} from "@/lib/campus-time";
import type {
  AttendanceHistoryData,
  AttendanceHistoryQuery,
  AttendanceHistoryRecordData,
  AttendanceHistoryStatus,
} from "@/types/attendance-history";
import type { EmployeeReference } from "@/types/employee";
import type { StatusTone } from "@/types/ui";

type StatusFilter = "all" | AttendanceHistoryStatus;
type AttendanceTimeState = "ok" | "none";

type DisplayRecord = {
  id: string;
  dateKey: string;
  date: string;
  fullDate: string;
  schedule: string;
  timeIn: string;
  timeInState: AttendanceTimeState;
  timeOut: string;
  timeOutState: AttendanceTimeState;
  source: string;
  timeInSource: string;
  timeOutSource: string;
  totalHours: string;
  overtime: string;
  status: AttendanceHistoryStatus;
  statusLabel: string;
  remarks: string;
  scannerLocation: string;
};

const unavailableValue = "—";

const statusFilters: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All Status" },
  { value: "present", label: "Present" },
  { value: "completed", label: "Completed" },
];

const statusTones: Record<AttendanceHistoryStatus, StatusTone> = {
  present: "warning",
  completed: "success",
};

export function AttendanceHistoryExplorer({
  attendanceLoadError,
  attendanceData,
  employee,
  query,
}: {
  attendanceLoadError: boolean;
  attendanceData: AttendanceHistoryData;
  employee: EmployeeReference | null;
  query: AttendanceHistoryQuery;
}) {
  const router = useRouter();
  const [draftStatus, setDraftStatus] = useState<StatusFilter>("all");
  const [draftMonth, setDraftMonth] = useState("");
  const [draftDate, setDraftDate] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(String(query.pageSize));
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [feedback, setFeedback] = useState("");

  const displayRecords = useMemo(
    () => attendanceData.records.map(toDisplayRecord),
    [attendanceData.records],
  );
  const monthOptions = useMemo(
    () => attendanceData.availableMonths,
    [attendanceData.availableMonths],
  );
  const dateRangeLabel = getDateRangeLabel(attendanceData);
  const totalPages = Math.max(
    1,
    Math.ceil(attendanceData.total / attendanceData.pageSize),
  );
  const currentPage = attendanceData.page;
  const pageStart = (currentPage - 1) * attendanceData.pageSize;
  const pageRecords = displayRecords;
  const selectedRecord = selectedId
    ? displayRecords.find((record) => record.id === selectedId)
    : undefined;

  useEffect(() => {
    if (!detailsOpen) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDetailsOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => window.removeEventListener("keydown", handleEscape);
  }, [detailsOpen]);

  function selectRecord(record: DisplayRecord) {
    setSelectedId(record.id);
    setDetailsOpen(true);
  }

  function navigateToHistory(next: {
    status?: StatusFilter;
    month?: string;
    date?: string;
    page?: number;
    pageSize?: number;
  }) {
    const params = new URLSearchParams();
    const status = next.status === "all"
      ? null
      : next.status ?? query.status;
    const month = next.month ?? query.month;
    const date = next.date ?? query.date;
    const page = next.page ?? query.page;
    const pageSize = next.pageSize ?? query.pageSize;

    if (status) {
      params.set("status", status);
    }

    if (month) {
      params.set("month", month);
    }

    if (date) {
      params.set("date", date);
    }

    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    setSelectedId("");
    setDetailsOpen(false);
    router.push(`/employee/attendance-history?${params.toString()}`);
  }

  function applyFilters() {
    navigateToHistory({
      status: draftStatus,
      month: draftMonth,
      date: draftDate,
      page: 1,
      pageSize: Number(rowsPerPage),
    });
    setFeedback("Attendance history filters applied.");
  }

  function resetFilters() {
    setDraftStatus("all");
    setDraftMonth("");
    setDraftDate("");
    navigateToHistory({
      status: "all",
      month: "",
      date: "",
      page: 1,
      pageSize: Number(rowsPerPage),
    });
    setFeedback("Attendance history filters reset.");
  }

  function notify(message: string) {
    setFeedback(message);
  }

  const emptyMessage = attendanceLoadError
    ? "Unable to load attendance history. Please try again."
    : attendanceData.totalRecords === 0
      ? "No attendance records found."
      : "No attendance records match the selected filters.";

  return (
    <div className="attendance-history-workspace">
      <div className="attendance-history-main-column">
        <section
          className="attendance-history-filters"
          aria-label="Attendance history filters"
        >
          <div className="attendance-history-filter-grid">
            <FilterSummary
              label="Date Range"
              icon="calendar"
              value={dateRangeLabel}
              onClick={() =>
                notify("The date range shows the available attendance records.")
              }
            />
            <label className="attendance-history-field">
              <span>Month</span>
              <span className="attendance-history-field-input">
                <Icon name="calendar" />
                <select
                  value={draftMonth}
                  onChange={(event) => setDraftMonth(event.target.value)}
                  aria-label="Filter attendance by month"
                >
                  <option value="">All Months</option>
                  {monthOptions.map((month) => (
                    <option value={month} key={month}>
                      {formatMonthKey(month)}
                    </option>
                  ))}
                </select>
                <Icon name="chevron" />
              </span>
            </label>
            <label className="attendance-history-field">
              <span>Status</span>
              <span className="attendance-history-field-input">
                <select
                  value={draftStatus}
                  onChange={(event) =>
                    setDraftStatus(event.target.value as StatusFilter)
                  }
                  aria-label="Filter attendance by status"
                >
                  {statusFilters.map((status) => (
                    <option value={status.value} key={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
                <Icon name="chevron" />
              </span>
            </label>
            <label className="attendance-history-field">
              <span>Search by Date</span>
              <span className="attendance-history-field-input">
                <Icon name="search" />
                <input
                  value={draftDate}
                  onChange={(event) => setDraftDate(event.target.value)}
                  placeholder="Search date"
                  aria-label="Search attendance by date"
                />
                <Icon name="calendar" />
              </span>
            </label>
          </div>

          <div className="attendance-history-filter-actions">
            <div className="attendance-history-filter-buttons">
              <button
                type="button"
                className="attendance-history-button attendance-history-button-primary"
                onClick={applyFilters}
              >
                <Icon name="filter" />
                Apply Filter
              </button>
              <button
                type="button"
                className="attendance-history-button attendance-history-button-ghost"
                onClick={resetFilters}
              >
                <Icon name="refresh" />
                Reset
              </button>
            </div>
            <button
              type="button"
              className="attendance-history-button attendance-history-button-outline"
              onClick={() => notify("Report export is not available yet.")}
            >
              <Icon name="download" />
              Export Report
            </button>
          </div>
          <p
            className={`attendance-history-feedback${attendanceLoadError ? " is-error" : ""}`}
            role={attendanceLoadError ? "alert" : "status"}
            aria-live="polite"
          >
            {attendanceLoadError
              ? "Unable to load attendance history. Please try again."
              : feedback}
          </p>
        </section>

        <section
          className="attendance-history-table-panel"
          aria-label="Attendance history records"
        >
          <div className="attendance-history-table-wrap">
            <table className="attendance-history-table">
              <caption className="sr-only">
                Employee attendance history records
              </caption>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Scheduled Time</th>
                  <th scope="col">Time-In</th>
                  <th scope="col">Time-Out</th>
                  <th scope="col">Source</th>
                  <th scope="col">Total Hours</th>
                  <th scope="col">Overtime</th>
                  <th scope="col">Status</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {pageRecords.map((record) => (
                  <tr
                    className={record.id === selectedRecord?.id ? "is-selected" : ""}
                    key={record.id}
                    onClick={() => selectRecord(record)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        selectRecord(record);
                      }
                    }}
                    tabIndex={0}
                    aria-selected={record.id === selectedRecord?.id}
                  >
                    <td>{record.date}</td>
                    <td>{record.schedule}</td>
                    <td>
                      <TimeCell value={record.timeIn} state={record.timeInState} />
                    </td>
                    <td>
                      <TimeCell value={record.timeOut} state={record.timeOutState} />
                    </td>
                    <td>
                      <span className="attendance-history-source">
                        {record.source}
                      </span>
                    </td>
                    <td>{record.totalHours}</td>
                    <td>{record.overtime}</td>
                    <td>
                      <StatusBadge tone={statusTones[record.status]}>
                        {record.statusLabel}
                      </StatusBadge>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="attendance-history-action-link"
                        onClick={(event) => {
                          event.stopPropagation();
                          selectRecord(record);
                        }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
                {pageRecords.length === 0 ? (
                  <tr>
                    <td
                      className={`attendance-history-empty${attendanceLoadError ? " is-error" : ""}`}
                      colSpan={9}
                    >
                      {emptyMessage}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="attendance-history-table-footer">
            <div className="attendance-history-pager" aria-label="Attendance history pages">
              <button
                type="button"
                className="attendance-history-page-button attendance-history-page-nav"
                onClick={() =>
                  navigateToHistory({ page: Math.max(1, currentPage - 1) })
                }
                disabled={currentPage === 1}
              >
                ‹ Previous
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (pageNumber) => (
                  <button
                    type="button"
                    className={`attendance-history-page-button ${pageNumber === currentPage ? "is-active" : ""}`}
                    key={pageNumber}
                    onClick={() => navigateToHistory({ page: pageNumber })}
                    aria-label={`Go to attendance history page ${pageNumber}`}
                    aria-current={pageNumber === currentPage ? "page" : undefined}
                  >
                    {pageNumber}
                  </button>
                ),
              )}
              <button
                type="button"
                className="attendance-history-page-button attendance-history-page-nav"
                onClick={() =>
                  navigateToHistory({
                    page: Math.min(totalPages, currentPage + 1),
                  })
                }
                disabled={currentPage === totalPages}
              >
                Next ›
              </button>
            </div>
            <div className="attendance-history-rows-select">
              <span>Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(event) => {
                  setRowsPerPage(event.target.value);
                  navigateToHistory({
                    page: 1,
                    pageSize: Number(event.target.value),
                  });
                }}
                aria-label="Rows per page"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
              <span>
                {attendanceData.total === 0
                  ? "0 records"
                  : `${pageStart + 1}–${Math.min(pageStart + attendanceData.pageSize, attendanceData.total)} of ${attendanceData.total} records`}
              </span>
            </div>
          </div>
        </section>
      </div>

      <AttendanceHistoryDetails
        employee={employee}
        record={selectedRecord}
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
      />
    </div>
  );
}

function FilterSummary({
  label,
  icon,
  value,
  onClick,
}: {
  label: string;
  icon: "calendar";
  value: string;
  onClick: () => void;
}) {
  return (
    <div className="attendance-history-field">
      <span>{label}</span>
      <button
        type="button"
        className="attendance-history-field-input attendance-history-field-button"
        onClick={onClick}
      >
        <Icon name={icon} />
        <span>{value}</span>
        <Icon name="chevron" />
      </button>
    </div>
  );
}

function TimeCell({
  value,
  state,
}: {
  value: string;
  state: AttendanceTimeState;
}) {
  if (state === "none") {
    return <span className="attendance-history-time-none">{value}</span>;
  }

  return (
    <span className="attendance-history-time-ok">
      <span>{value}</span>
      <Icon name="check" />
    </span>
  );
}

function AttendanceHistoryDetails({
  employee,
  record,
  open,
  onClose,
}: {
  employee: EmployeeReference | null;
  record?: DisplayRecord;
  open: boolean;
  onClose: () => void;
}) {
  if (!open || !record) {
    return null;
  }

  return (
    <div className="attendance-history-drawer-layer">
      <button
        type="button"
        className="attendance-history-drawer-backdrop"
        onClick={onClose}
        aria-label="Close record details"
      />
      <aside
        className="attendance-history-details"
        aria-labelledby="attendance-history-details-title"
        aria-modal="true"
        role="dialog"
      >
        <div className="attendance-history-details-heading">
          <div>
            <span className="attendance-history-details-kicker">Selected record</span>
            <h2 id="attendance-history-details-title">Record details</h2>
          </div>
          <button
            type="button"
            className="attendance-history-close-button"
            onClick={onClose}
            aria-label="Close record details"
            autoFocus
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="attendance-history-date-pill">
          <Icon name="calendar" />
          <span>{record.fullDate}</span>
        </div>
        <div className="attendance-history-profile-row">
          <div className="attendance-history-avatar" aria-hidden="true">
            {getEmployeeInitials(employee?.displayName ?? "Employee information unavailable")}
          </div>
          <div>
            <p className="attendance-history-profile-name">
              {employee?.displayName ?? "Employee information unavailable"}
            </p>
            <p className="attendance-history-profile-sub">
              Employee ID: {employee?.employeeId ?? "Unavailable"}
            </p>
            <p className="attendance-history-profile-sub">
              Department: {employee?.department ?? "Unavailable"}
            </p>
          </div>
        </div>
        <div className="attendance-history-detail-list">
          <DetailRow icon="clock" label="Schedule" value={record.schedule} />
          <DetailRow icon="clock" label="Time-In" value={record.timeIn} />
          <DetailRow icon="clock" label="Time-Out" value={record.timeOut} />
          <DetailRow icon="location" label="Source" value={record.source} />
          <DetailRow icon="location" label="Time-In Source" value={record.timeInSource} />
          <DetailRow icon="location" label="Time-Out Source" value={record.timeOutSource} />
          <DetailRow icon="clock" label="Total Hours" value={record.totalHours} />
          <DetailRow icon="clock" label="Overtime" value={record.overtime} />
          <DetailRow
            icon="check"
            label="Attendance Status"
            value={
              <StatusBadge tone={statusTones[record.status]}>
                {record.statusLabel}
              </StatusBadge>
            }
          />
          <DetailRow icon="comment" label="Remarks" value={record.remarks} />
        </div>
        <div className="attendance-history-note">
          <Icon name="info" />
          <span>This record was captured by the authorized attendance system.</span>
        </div>
      </aside>
    </div>
  );
}

function toDisplayRecord(record: AttendanceHistoryRecordData): DisplayRecord {
  return {
    id: record.id,
    dateKey: record.date,
    date: formatCampusDateKeyLabel(record.date),
    fullDate: formatCampusDateKeyLabel(record.date, "long"),
    schedule: unavailableValue,
    timeIn: formatAttendanceTime(record.timeIn),
    timeInState: record.timeIn ? "ok" : "none",
    timeOut: formatAttendanceTime(record.timeOut),
    timeOutState: record.timeOut ? "ok" : "none",
    source: getSourceLabel(record),
    timeInSource: record.timeInSource,
    timeOutSource: record.timeOutSource ?? unavailableValue,
    totalHours: unavailableValue,
    overtime: unavailableValue,
    status: record.status,
    statusLabel: record.status === "completed" ? "Completed" : "Present",
    remarks: unavailableValue,
    scannerLocation: unavailableValue,
  };
}

function formatAttendanceTime(value: string | null) {
  if (!value) {
    return unavailableValue;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? unavailableValue
    : formatCampusTime(date);
}

function getSourceLabel(record: AttendanceHistoryRecordData) {
  if (
    !record.timeOutSource
    || record.timeOutSource === record.timeInSource
  ) {
    return record.timeInSource;
  }

  return `${record.timeInSource} / ${record.timeOutSource}`;
}

function getDateRangeLabel(data: AttendanceHistoryData) {
  if (!data.oldestDate || !data.newestDate) {
    return "No records available";
  }

  const newest = formatCampusDateKeyLabel(data.newestDate);
  const oldest = formatCampusDateKeyLabel(data.oldestDate);

  return newest === oldest ? newest : `${oldest} – ${newest}`;
}

function formatMonthKey(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);

  if (!year || !month) {
    return monthKey;
  }

  return formatCampusMonthYear(new Date(Date.UTC(year, month - 1, 1)));
}

function getEmployeeInitials(displayName: string) {
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name[0]?.toUpperCase() ?? "")
    .join("");

  return initials || unavailableValue;
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: "clock" | "check" | "location" | "comment";
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="attendance-history-detail-row">
      <span className="attendance-history-detail-icon" aria-hidden="true">
        <Icon name={icon} />
      </span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </div>
  );
}
