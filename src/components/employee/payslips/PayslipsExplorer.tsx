"use client";

import { useMemo, useState } from "react";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  employeePayslipRecordCount,
  employeePayslips,
  employeePayslipYears,
  type EmployeePayslipStatus,
} from "@/data/employee-payslips";

type StatusFilter = "all" | EmployeePayslipStatus;

const statusFilters: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All Status" },
  { value: "released", label: "Released" },
];

export function PayslipsExplorer() {
  const [draftYear, setDraftYear] = useState<string>(employeePayslipYears[0]);
  const [draftStatus, setDraftStatus] = useState<StatusFilter>("all");
  const [appliedYear, setAppliedYear] = useState<string>(employeePayslipYears[0]);
  const [appliedStatus, setAppliedStatus] = useState<StatusFilter>("all");
  const [rowsPerPage, setRowsPerPage] = useState("5");
  const [feedback, setFeedback] = useState("");

  const filteredPayslips = useMemo(
    () => employeePayslips.filter((payslip) => {
      const matchesYear = payslip.payrollPeriod.includes(appliedYear);
      const matchesStatus = appliedStatus === "all" || payslip.status === appliedStatus;
      return matchesYear && matchesStatus;
    }),
    [appliedStatus, appliedYear],
  );

  const displayedCount = Math.min(Number(rowsPerPage), filteredPayslips.length);

  function applyFilters() {
    setAppliedYear(draftYear);
    setAppliedStatus(draftStatus);
    setFeedback("Payslip filters applied.");
  }

  function resetFilters() {
    setDraftYear(employeePayslipYears[0]);
    setDraftStatus("all");
    setAppliedYear(employeePayslipYears[0]);
    setAppliedStatus("all");
    setFeedback("Payslip filters reset.");
  }

  function notify(message: string) {
    setFeedback(message);
  }

  return (
    <div className="employee-payslips-workspace">
      <section className="employee-payslips-filters" aria-label="Payslip filters">
        <div className="employee-payslips-filter-grid">
          <label className="employee-payslips-field">
            <span>Year</span>
            <span className="employee-payslips-field-input">
              <Icon name="calendar" />
              <select value={draftYear} onChange={(event) => setDraftYear(event.target.value)} aria-label="Filter payslips by year">
                {employeePayslipYears.map((year) => <option value={year} key={year}>{year}</option>)}
              </select>
              <Icon name="chevron" />
            </span>
          </label>
          <label className="employee-payslips-field">
            <span>Status</span>
            <span className="employee-payslips-field-input">
              <select value={draftStatus} onChange={(event) => setDraftStatus(event.target.value as StatusFilter)} aria-label="Filter payslips by status">
                {statusFilters.map((status) => <option value={status.value} key={status.value}>{status.label}</option>)}
              </select>
              <Icon name="chevron" />
            </span>
          </label>
        </div>

        <div className="employee-payslips-filter-actions">
          <div className="employee-payslips-filter-buttons">
            <button type="button" className="employee-payslips-button employee-payslips-button-reset" onClick={resetFilters}>
              <Icon name="refresh" />
              Reset
            </button>
            <button type="button" className="employee-payslips-button employee-payslips-button-primary" onClick={applyFilters}>
              <Icon name="filter" />
              Apply Filters
            </button>
          </div>
        </div>
        <p className="employee-payslips-feedback" role="status" aria-live="polite">{feedback}</p>
      </section>

      <section className="employee-payslips-table-panel" aria-label="Payslip records">
        <div className="employee-payslips-table-wrap">
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
              {filteredPayslips.map((payslip) => (
                <tr key={payslip.id}>
                  <td>{payslip.payrollPeriod}</td>
                  <td>{payslip.dateReleased}</td>
                  <td>{payslip.basicPay}</td>
                  <td>{payslip.deductions}</td>
                  <td>{payslip.netPay}</td>
                  <td><StatusBadge tone={payslip.statusTone}>{payslip.statusLabel}</StatusBadge></td>
                  <td>
                    <button type="button" className="employee-payslips-view-button" onClick={() => notify(`Viewing ${payslip.payrollPeriod} payslip is not connected in this prototype.`)}>
                      <Icon name="file" />
                      View Payslip
                    </button>
                  </td>
                </tr>
              ))}
              {filteredPayslips.length === 0 ? (
                <tr>
                  <td colSpan={7} className="employee-payslips-empty">No payslips match the selected filters.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="employee-payslips-table-footer">
          <div className="employee-payslips-pager" aria-label="Payslip pages">
            <button type="button" className="employee-payslips-page-button employee-payslips-page-nav" onClick={() => notify("Previous page is not connected in this prototype.")}>‹ Previous</button>
            {[1, 2, 3, 4, 5].map((page) => (
              <button type="button" className={`employee-payslips-page-button ${page === 1 ? "is-active" : ""}`} key={page} onClick={() => notify(page === 1 ? "Page 1 is selected." : "Pagination is not connected in this prototype.")}>{page}</button>
            ))}
            <button type="button" className="employee-payslips-page-button employee-payslips-page-nav" onClick={() => notify("Next page is not connected in this prototype.")}>Next ›</button>
          </div>
          <label className="employee-payslips-rows-select">
            <span>Rows per page:</span>
            <select value={rowsPerPage} onChange={(event) => setRowsPerPage(event.target.value)} aria-label="Rows per page">
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="25">25</option>
            </select>
          </label>
          <span className="employee-payslips-record-count">{filteredPayslips.length === 0 ? "0" : `1 – ${displayedCount}`} of {employeePayslipRecordCount} records</span>
        </div>
      </section>
    </div>
  );
}
