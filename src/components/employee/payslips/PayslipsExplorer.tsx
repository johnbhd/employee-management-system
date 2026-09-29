"use client";

import { useMemo, useState } from "react";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  employeeMonthlyPayslips,
  employeePayslipCutoffStats,
  employeePayslips,
  employeePayslipMonthlyStats,
  employeePayslipYears,
  type EmployeeMonthlyPayslip,
  type EmployeeMonthlyPayslipStatus,
  type EmployeePayslip,
  type EmployeePayslipStatus,
  type EmployeePayslipStat,
} from "@/data/employee-payslips";

import {
  PayslipDetailsModal,
  type PayslipDetailsRecord,
} from "./PayslipDetailsModal";

type PayslipViewMode = "cutoff" | "monthly";
type StatusFilter = "all" | EmployeePayslipStatus | EmployeeMonthlyPayslipStatus;

const viewModes: Array<{ value: PayslipViewMode; label: string }> = [
  { value: "cutoff", label: "Per Cutoff" },
  { value: "monthly", label: "Monthly" },
];

const cutoffStatusFilters: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All Status" },
  { value: "released", label: "Released" },
  { value: "in-progress", label: "In Progress" },
];

const monthlyStatusFilters: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All Status" },
  { value: "complete", label: "Complete" },
  { value: "in-progress", label: "In Progress" },
];

export function PayslipsExplorer() {
  const [viewMode, setViewMode] = useState<PayslipViewMode>("cutoff");
  const [draftYear, setDraftYear] = useState<string>(employeePayslipYears[0]);
  const [draftStatus, setDraftStatus] = useState<StatusFilter>("all");
  const [appliedYear, setAppliedYear] = useState<string>(employeePayslipYears[0]);
  const [appliedStatus, setAppliedStatus] = useState<StatusFilter>("all");
  const [rowsPerPage, setRowsPerPage] = useState("5");
  const [currentPage, setCurrentPage] = useState(1);
  const [feedback, setFeedback] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<PayslipDetailsRecord | null>(
    null,
  );

  const filteredPayslips = useMemo(
    () => employeePayslips.filter((payslip) => {
      const matchesYear = payslip.payrollMonth.includes(appliedYear);
      const matchesStatus = appliedStatus === "all" || payslip.status === appliedStatus;
      return matchesYear && matchesStatus;
    }),
    [appliedStatus, appliedYear],
  );

  const filteredMonthlyPayslips = useMemo(
    () => employeeMonthlyPayslips.filter((summary) => {
      const matchesYear = summary.monthKey.startsWith(appliedYear);
      const matchesStatus = appliedStatus === "all" || summary.status === appliedStatus;
      return matchesYear && matchesStatus;
    }),
    [appliedStatus, appliedYear],
  );

  const activeRows = viewMode === "cutoff" ? filteredPayslips : filteredMonthlyPayslips;
  const pageSize = Number(rowsPerPage);
  const pageCount = Math.max(1, Math.ceil(activeRows.length / pageSize));
  const pageStartIndex = (currentPage - 1) * pageSize;
  const visiblePayslips = filteredPayslips.slice(pageStartIndex, pageStartIndex + pageSize);
  const visibleMonthlyPayslips = filteredMonthlyPayslips.slice(
    pageStartIndex,
    pageStartIndex + pageSize,
  );
  const rangeStart = activeRows.length === 0 ? 0 : pageStartIndex + 1;
  const rangeEnd = Math.min(pageStartIndex + pageSize, activeRows.length);
  const statusFilters = viewMode === "cutoff" ? cutoffStatusFilters : monthlyStatusFilters;
  const summaryStats = viewMode === "cutoff"
    ? employeePayslipCutoffStats
    : employeePayslipMonthlyStats;
  const includedCutoffs = selectedRecord?.kind === "monthly"
    ? employeePayslips.filter((payslip) => selectedRecord.summary.includedPayslipIds.includes(payslip.id))
    : [];

  function applyFilters() {
    setAppliedYear(draftYear);
    setAppliedStatus(draftStatus);
    setCurrentPage(1);
    setSelectedRecord(null);
    setFeedback("Payslip filters applied.");
  }

  function resetFilters() {
    setDraftYear(employeePayslipYears[0]);
    setDraftStatus("all");
    setAppliedYear(employeePayslipYears[0]);
    setAppliedStatus("all");
    setCurrentPage(1);
    setSelectedRecord(null);
    setFeedback("Payslip filters reset.");
  }

  function handleViewModeChange(nextMode: PayslipViewMode) {
    if (nextMode === viewMode) {
      return;
    }

    setViewMode(nextMode);
    setDraftStatus("all");
    setAppliedStatus("all");
    setCurrentPage(1);
    setSelectedRecord(null);
    setFeedback(nextMode === "cutoff" ? "Per Cutoff view selected." : "Monthly view selected.");
  }

  function notify(message: string) {
    setFeedback(message);
  }

  function handleRowsPerPageChange(value: string) {
    setRowsPerPage(value);
    setCurrentPage(1);
  }

  function handlePageChange(page: number) {
    setCurrentPage(page);
    setFeedback(`Page ${page} is selected.`);
  }

  function handleViewPayslip(payslip: EmployeePayslip) {
    if (payslip.status !== "released") {
      notify("This payslip is not available until payroll is released.");
      return;
    }

    setSelectedRecord({ kind: "cutoff", payslip });
  }

  function handleViewSummary(summary: EmployeeMonthlyPayslip) {
    setSelectedRecord({ kind: "monthly", summary });
  }

  function handleViewCutoff(payslip: EmployeePayslip) {
    setSelectedRecord({ kind: "cutoff", payslip });
  }

  return (
    <div className="employee-payslips-workspace">
      <PayslipSummaryStats stats={summaryStats} />

      <section className="employee-payslips-filters" aria-label="Payslip filters">
        <div className="employee-payslips-filter-grid">
          <div className="employee-payslips-field employee-payslips-view-field">
            <span id="employee-payslip-view-label">View</span>
            <div
              className="employee-payslips-view-switch"
              role="group"
              aria-labelledby="employee-payslip-view-label"
            >
              {viewModes.map((mode) => (
                <button
                  type="button"
                  className={`employee-payslips-mode-button ${mode.value === viewMode ? "is-active" : ""}`}
                  key={mode.value}
                  onClick={() => handleViewModeChange(mode.value)}
                  aria-pressed={mode.value === viewMode}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          <label className="employee-payslips-field">
            <span>Year</span>
            <span className="employee-payslips-field-input">
              <Icon name="calendar" />
              <select
                value={draftYear}
                onChange={(event) => setDraftYear(event.target.value)}
                aria-label="Filter payslips by year"
              >
                {employeePayslipYears.map((year) => (
                  <option value={year} key={year}>{year}</option>
                ))}
              </select>
              <Icon name="chevron" />
            </span>
          </label>

          <label className="employee-payslips-field">
            <span>Status</span>
            <span className="employee-payslips-field-input">
              <select
                value={draftStatus}
                onChange={(event) => setDraftStatus(event.target.value as StatusFilter)}
                aria-label="Filter payslips by status"
              >
                {statusFilters.map((status) => (
                  <option value={status.value} key={status.value}>{status.label}</option>
                ))}
              </select>
              <Icon name="chevron" />
            </span>
          </label>
        </div>

        <div className="employee-payslips-filter-actions">
          <div className="employee-payslips-filter-buttons">
            <button
              type="button"
              className="employee-payslips-button employee-payslips-button-reset"
              onClick={resetFilters}
            >
              <Icon name="refresh" />
              Reset
            </button>
            <button
              type="button"
              className="employee-payslips-button employee-payslips-button-primary"
              onClick={applyFilters}
            >
              <Icon name="filter" />
              Apply Filters
            </button>
          </div>
        </div>
        <p className="employee-payslips-feedback" role="status" aria-live="polite">{feedback}</p>
      </section>

      <section className="employee-payslips-table-panel" aria-label="Payslip records">
        <div className="employee-payslips-table-wrap">
          {viewMode === "cutoff" ? (
            <table className="employee-payslips-table">
              <caption className="sr-only">Employee payroll records and payslip actions</caption>
              <thead>
                <tr>
                  <th scope="col">Payroll Period</th>
                  <th scope="col">Date Released</th>
                  <th scope="col">Basic Pay</th>
                  <th scope="col">Deductions</th>
                  <th scope="col">Net Pay</th>
                  <th scope="col">Status</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {visiblePayslips.map((payslip) => (
                  <tr key={payslip.id}>
                    <td>{payslip.payrollPeriod}</td>
                    <td>{payslip.dateReleased ?? "—"}</td>
                    <td>{displayAmount(payslip.earnings.basicPay)}</td>
                    <td>{displayAmount(payslip.totalDeductions)}</td>
                    <td>{displayAmount(payslip.netPay)}</td>
                    <td><StatusBadge tone={payslip.statusTone}>{payslip.statusLabel}</StatusBadge></td>
                    <td>
                      {payslip.status === "released" ? (
                        <button
                          type="button"
                          className="employee-payslips-view-button"
                          onClick={() => handleViewPayslip(payslip)}
                        >
                          <Icon name="file" />
                          View Payslip
                        </button>
                      ) : (
                        <span className="employee-payslips-unavailable">Not yet available</span>
                      )}
                    </td>
                  </tr>
                ))}
                {visiblePayslips.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="employee-payslips-empty">No payslips match the selected filters.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          ) : (
            <table className="employee-payslips-table employee-payslips-monthly-table">
              <caption className="sr-only">Monthly employee payroll summaries and actions</caption>
              <thead>
                <tr>
                  <th scope="col">Month</th>
                  <th scope="col">Total Earnings</th>
                  <th scope="col">Total Deductions</th>
                  <th scope="col">Net Pay</th>
                  <th scope="col">Status</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleMonthlyPayslips.map((summary) => (
                  <tr key={summary.id}>
                    <td>
                      <strong>{summary.monthLabel}</strong>
                      {summary.status === "in-progress" ? (
                        <small className="employee-payslips-table-cell-note">
                          {summary.releasedCutoffCount} of {summary.totalCutoffCount} cutoffs released
                        </small>
                      ) : null}
                    </td>
                    <td>
                      <span>{displayAmount(summary.totalEarnings)}</span>
                      {summary.status === "in-progress" ? (
                        <small className="employee-payslips-table-cell-note">Released so far</small>
                      ) : null}
                    </td>
                    <td>{displayAmount(summary.totalDeductions)}</td>
                    <td>{displayAmount(summary.netPay)}</td>
                    <td><StatusBadge tone={summary.statusTone}>{summary.statusLabel}</StatusBadge></td>
                    <td>
                      <button
                        type="button"
                        className="employee-payslips-view-button"
                        onClick={() => handleViewSummary(summary)}
                      >
                        <Icon name="file" />
                        {summary.status === "complete" ? "View Summary" : "View Partial Summary"}
                      </button>
                    </td>
                  </tr>
                ))}
                {visibleMonthlyPayslips.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="employee-payslips-empty">
                      No monthly payroll summaries match the selected filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          )}
        </div>

        <div className="employee-payslips-table-footer">
          <div className="employee-payslips-pager" aria-label="Payslip pages">
            <button
              type="button"
              className="employee-payslips-page-button employee-payslips-page-nav"
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              ‹ Previous
            </button>
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
              <button
                type="button"
                className={`employee-payslips-page-button ${page === currentPage ? "is-active" : ""}`}
                key={page}
                onClick={() => handlePageChange(page)}
                aria-current={page === currentPage ? "page" : undefined}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              className="employee-payslips-page-button employee-payslips-page-nav"
              onClick={() => handlePageChange(Math.min(pageCount, currentPage + 1))}
              disabled={currentPage === pageCount}
            >
              Next ›
            </button>
          </div>
          <label className="employee-payslips-rows-select">
            <span>Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(event) => handleRowsPerPageChange(event.target.value)}
              aria-label="Rows per page"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="25">25</option>
            </select>
          </label>
          <span className="employee-payslips-record-count">
            {rangeStart === 0 ? "0" : `${rangeStart} – ${rangeEnd}`} of {activeRows.length} records
          </span>
        </div>
      </section>

      <PayslipDetailsModal
        record={selectedRecord}
        includedCutoffs={includedCutoffs}
        onClose={() => setSelectedRecord(null)}
        onViewCutoff={handleViewCutoff}
      />
    </div>
  );
}

function PayslipSummaryStats({ stats }: { stats: readonly EmployeePayslipStat[] }) {
  return (
    <section className="employee-payslips-stat-grid" aria-label="Payroll summary">
      {stats.map((stat) => (
        <article className="employee-payslips-stat-card" key={stat.label}>
          <span
            className={`employee-payslips-stat-icon employee-payslips-stat-icon-${stat.tone}`}
            aria-hidden="true"
          >
            <Icon name={stat.icon} />
          </span>
          <div>
            <p className="employee-payslips-stat-label">{stat.label}</p>
            <p
              className={`employee-payslips-stat-value ${
                stat.label === "Latest Payslip" || stat.label === "Payroll Month"
                  ? "is-date"
                  : ""
              }`}
            >
              {stat.value}
            </p>
            <p className="employee-payslips-stat-note">{stat.note}</p>
          </div>
        </article>
      ))}
    </section>
  );
}

function displayAmount(value: string | null) {
  return value ?? "—";
}
