"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  attendanceHistoryFilterLabels,
  attendanceHistoryRecords,
  type AttendanceHistoryRecord,
  type AttendanceHistoryStatus,
  type AttendanceTimeState,
} from "@/data/attendance-history";
import type { StatusTone } from "@/types/ui";

type StatusFilter = "all" | AttendanceHistoryStatus;

const statusFilters: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All Status" },
  { value: "ontime", label: "On Time" },
  { value: "late", label: "Late" },
  { value: "absent", label: "Absent" },
  { value: "overtime", label: "Overtime" },
];

const statusTones: Record<AttendanceHistoryStatus, StatusTone> = {
  ontime: "success",
  late: "warning",
  absent: "danger",
  overtime: "info",
};

export function AttendanceHistoryExplorer() {
  const [draftStatus, setDraftStatus] = useState<StatusFilter>("all");
  const [draftDate, setDraftDate] = useState("");
  const [appliedStatus, setAppliedStatus] = useState<StatusFilter>("all");
  const [appliedDate, setAppliedDate] = useState("");
  const [selectedId, setSelectedId] = useState(attendanceHistoryRecords[0]?.id ?? "");
  const [rowsPerPage, setRowsPerPage] = useState("10");
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [feedback, setFeedback] = useState("");

  const filteredRecords = useMemo(() => {
    const search = appliedDate.trim().toLowerCase();

    return attendanceHistoryRecords.filter((record) => {
      const matchesStatus = appliedStatus === "all" || record.status === appliedStatus;
      const matchesDate = !search || record.date.toLowerCase().includes(search) || record.fullDate.toLowerCase().includes(search);
      return matchesStatus && matchesDate;
    });
  }, [appliedDate, appliedStatus]);

  const selectedRecord = filteredRecords.find((record) => record.id === selectedId) ?? filteredRecords[0];
  const displayedCount = Math.min(Number(rowsPerPage), filteredRecords.length);

  function selectRecord(record: AttendanceHistoryRecord) {
    setSelectedId(record.id);
    setDetailsOpen(true);
  }

  function applyFilters() {
    setAppliedStatus(draftStatus);
    setAppliedDate(draftDate);
    setFeedback("Attendance history filters applied.");
  }

  function resetFilters() {
    setDraftStatus("all");
    setDraftDate("");
    setAppliedStatus("all");
    setAppliedDate("");
    setFeedback("Attendance history filters reset.");
  }

  function notify(message: string) {
    setFeedback(message);
  }

  return (
    <div className="attendance-history-workspace">
      <div className="attendance-history-main-column">
        <section className="attendance-history-filters" aria-label="Attendance history filters">
          <div className="attendance-history-filter-grid">
            <FilterSummary label="Date Range" icon="calendar" value={attendanceHistoryFilterLabels.dateRange} onClick={() => notify("Date range selection is not connected in this prototype.")} />
            <FilterSummary label="Month" icon="calendar" value={attendanceHistoryFilterLabels.month} onClick={() => notify("Month selection is not connected in this prototype.")} />
            <label className="attendance-history-field">
              <span>Status</span>
              <span className="attendance-history-field-input">
                <select value={draftStatus} onChange={(event) => setDraftStatus(event.target.value as StatusFilter)} aria-label="Filter attendance by status">
                  {statusFilters.map((status) => <option value={status.value} key={status.value}>{status.label}</option>)}
                </select>
                <Icon name="chevron" />
              </span>
            </label>
            <label className="attendance-history-field">
              <span>Search by Date</span>
              <span className="attendance-history-field-input">
                <Icon name="search" />
                <input value={draftDate} onChange={(event) => setDraftDate(event.target.value)} placeholder="Select date" aria-label="Search attendance by date" />
                <Icon name="calendar" />
              </span>
            </label>
          </div>

          <div className="attendance-history-filter-actions">
            <div className="attendance-history-filter-buttons">
              <button type="button" className="attendance-history-button attendance-history-button-primary" onClick={applyFilters}>
                <Icon name="filter" />
                Apply Filter
              </button>
              <button type="button" className="attendance-history-button attendance-history-button-ghost" onClick={resetFilters}>
                <Icon name="refresh" />
                Reset
              </button>
            </div>
            <button type="button" className="attendance-history-button attendance-history-button-outline" onClick={() => notify("Report export is not connected in this prototype.")}>
              <Icon name="download" />
              Export Report
            </button>
          </div>
          <p className="attendance-history-feedback" role="status" aria-live="polite">{feedback}</p>
        </section>

        <section className="attendance-history-table-panel" aria-label="Attendance history records">
          <div className="attendance-history-table-wrap">
            <table className="attendance-history-table">
              <caption className="sr-only">Employee attendance history records</caption>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Scheduled Time</th>
                  <th scope="col">Time-In</th>
                  <th scope="col">Time-Out</th>
                  <th scope="col">Total Hours</th>
                  <th scope="col">Overtime</th>
                  <th scope="col">Status</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
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
                    <td><TimeCell value={record.timeIn} state={record.timeInState} /></td>
                    <td><TimeCell value={record.timeOut} state={record.timeOutState} /></td>
                    <td>{record.totalHours}</td>
                    <td>{record.overtime}</td>
                    <td><StatusBadge tone={statusTones[record.status]}>{record.statusLabel}</StatusBadge></td>
                    <td>
                      <button type="button" className="attendance-history-action-link" onClick={(event) => { event.stopPropagation(); selectRecord(record); }}>
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td className="attendance-history-empty" colSpan={8}>No attendance records match the selected filters.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="attendance-history-table-footer">
            <div className="attendance-history-pager" aria-label="Attendance history pages">
              <button type="button" className="attendance-history-page-button attendance-history-page-nav" onClick={() => notify("Previous page is not connected in this prototype.")}>‹ Previous</button>
              {[1, 2, 3, 4, 5].map((page) => (
                <button type="button" className={`attendance-history-page-button ${page === 1 ? "is-active" : ""}`} key={page} onClick={() => notify(page === 1 ? "Page 1 is selected." : "Pagination is not connected in this prototype.")}>{page}</button>
              ))}
              <button type="button" className="attendance-history-page-button attendance-history-page-nav" onClick={() => notify("Next page is not connected in this prototype.")}>Next ›</button>
            </div>
            <div className="attendance-history-rows-select">
              <span>Rows per page:</span>
              <select value={rowsPerPage} onChange={(event) => setRowsPerPage(event.target.value)} aria-label="Rows per page">
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
              <span>{filteredRecords.length === 0 ? "0" : `1–${displayedCount}`} of 42 records</span>
            </div>
          </div>
        </section>
      </div>

      <AttendanceHistoryDetails record={selectedRecord} open={detailsOpen} onClose={() => setDetailsOpen(false)} onOpen={() => setDetailsOpen(true)} />
    </div>
  );
}

function FilterSummary({ label, icon, value, onClick }: { label: string; icon: "calendar"; value: string; onClick: () => void }) {
  return (
    <div className="attendance-history-field">
      <span>{label}</span>
      <button type="button" className="attendance-history-field-input attendance-history-field-button" onClick={onClick}>
        <Icon name={icon} />
        <span>{value}</span>
        <Icon name="chevron" />
      </button>
    </div>
  );
}

function TimeCell({ value, state }: { value: string; state: AttendanceTimeState }) {
  if (state === "none") {
    return <span className="attendance-history-time-none">{value}</span>;
  }

  return (
    <span className={`attendance-history-time-${state}`}>
      <span>{value}</span>
      <Icon name={state === "ok" ? "check" : "clock"} />
    </span>
  );
}

function AttendanceHistoryDetails({ record, open, onClose, onOpen }: { record?: AttendanceHistoryRecord; open: boolean; onClose: () => void; onOpen: () => void }) {
  return (
    <aside className={`attendance-history-details ${open ? "" : "is-closed"}`} aria-labelledby="attendance-history-details-title">
      <div className="attendance-history-details-heading">
        <h2 id="attendance-history-details-title">Record Details</h2>
        <button type="button" className="attendance-history-close-button" onClick={open ? onClose : onOpen} aria-label={open ? "Close record details" : "Open record details"}>
          <Icon name={open ? "close" : "chevron"} />
        </button>
      </div>

      {open && record ? (
        <>
          <div className="attendance-history-date-pill"><Icon name="calendar" /><span>{record.fullDate}</span></div>
          <div className="attendance-history-profile-row">
            <div className="attendance-history-avatar" aria-hidden="true">JV</div>
            <div>
              <p className="attendance-history-profile-name">John Benedict M. Villegas</p>
              <p className="attendance-history-profile-sub">Employee ID: AU-EMP-2026-001</p>
              <p className="attendance-history-profile-sub">Department: Information Technology Department</p>
            </div>
          </div>
          <div className="attendance-history-detail-list">
            <DetailRow icon="clock" label="Schedule" value={record.schedule} />
            <DetailRow icon="clock" label="Time-In" value={record.timeIn} />
            <DetailRow icon="clock" label="Time-Out" value={record.timeOut} />
            <DetailRow icon="clock" label="Total Hours" value={record.totalHours} />
            <DetailRow icon="clock" label="Overtime" value={record.overtime === "0h" ? "0h 0m" : record.overtime} />
            <DetailRow icon="check" label="Attendance Status" value={<StatusBadge tone={statusTones[record.status]}>{record.statusLabel}</StatusBadge>} />
            <DetailRow icon="location" label="Scanner Location" value={record.scannerLocation} />
            <DetailRow icon="comment" label="Remarks" value={record.remarks} />
          </div>
          <div className="attendance-history-note"><Icon name="info" /><span>This record was captured by the authorized attendance system.</span></div>
        </>
      ) : (
        <p className="attendance-history-details-closed">Select a record to view its details.</p>
      )}
    </aside>
  );
}

function DetailRow({ icon, label, value }: { icon: "clock" | "check" | "location" | "comment"; label: string; value: ReactNode }) {
  return (
    <div className="attendance-history-detail-row">
      <span className="attendance-history-detail-icon" aria-hidden="true"><Icon name={icon} /></span>
      <div><p>{label}</p><strong>{value}</strong></div>
    </div>
  );
}
