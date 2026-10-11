"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { ActionButton } from "@/components/ui/ActionButton";
import { Icon } from "@/components/ui/Icon";
import { SectionCard } from "@/components/ui/SectionCard";
import { SummaryCard } from "@/components/ui/SummaryCard";
import {
  getPayrollHistorySummaryMetrics,
  initialPayrollHistory,
  payrollHistoryBatchStatuses,
  payrollHistoryPeriods,
  payrollHistoryResultStatuses,
  payrollHistoryTransferStatuses,
  type PayrollHistoryBatchStatus,
  type PayrollHistoryRecord,
  type PayrollHistoryResultStatus,
  type PayrollHistoryTransferStatus,
} from "@/data/payroll/history";

import { PayrollHistoryDetailsModal } from "./PayrollHistoryDetailsModal";
import { PayrollHistoryTable } from "./PayrollHistoryTable";

const pageSize = 5;

export function PayrollHistoryPage() {
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState("all");
  const [batchStatus, setBatchStatus] = useState<PayrollHistoryBatchStatus | "all">("all");
  const [transferStatus, setTransferStatus] = useState<PayrollHistoryTransferStatus | "all">("all");
  const [resultStatus, setResultStatus] = useState<PayrollHistoryResultStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState<PayrollHistoryRecord | null>(null);
  const [feedback, setFeedback] = useState("");

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return initialPayrollHistory.filter((record) => (
      (!normalizedQuery
        || record.id.toLowerCase().includes(normalizedQuery)
        || record.period.toLowerCase().includes(normalizedQuery)
        || record.createdBy.toLowerCase().includes(normalizedQuery))
      && (period === "all" || record.period === period)
      && (batchStatus === "all" || record.batchStatus === batchStatus)
      && (transferStatus === "all" || record.transferStatus === transferStatus)
      && (resultStatus === "all" || record.resultStatus === resultStatus)
    ));
  }, [batchStatus, period, query, resultStatus, transferStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const visiblePage = Math.min(page, totalPages);
  const pageRecords = filteredRecords.slice((visiblePage - 1) * pageSize, visiblePage * pageSize);
  const firstVisible = filteredRecords.length === 0 ? 0 : (visiblePage - 1) * pageSize + 1;
  const lastVisible = Math.min(visiblePage * pageSize, filteredRecords.length);

  useEffect(() => {
    if (!selectedRecord) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedRecord(null);
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [selectedRecord]);

  function showFeedback(message: string) {
    setFeedback(message);
    window.setTimeout(() => setFeedback(""), 3000);
  }

  function clearFilters() {
    setQuery("");
    setPeriod("all");
    setBatchStatus("all");
    setTransferStatus("all");
    setResultStatus("all");
    setPage(1);
  }

  function updateFilter<T>(update: (value: T) => void, value: T) {
    update(value);
    setPage(1);
  }

  const metrics = getPayrollHistorySummaryMetrics(initialPayrollHistory);

  return (
    <div className="payroll-history">
      <AdminPageHeader
        eyebrow="Payroll records"
        title="Payroll History"
        description="Review previous payroll batches, handoff activity, acknowledgement status, and payroll results by period."
        actions={(
          <div className="payroll-history__header-actions">
            <ActionButton icon="download" variant="secondary" action="Export is available when the payroll export service is connected." onAction={() => showFeedback("Export is available when the payroll export service is connected.")}>Export history</ActionButton>
            <ActionButton icon="refresh" variant="primary" action="Payroll history refreshed. No new records received in prototype data." onAction={() => showFeedback("Payroll history refreshed. No new records received in prototype data.")}>Refresh data</ActionButton>
          </div>
        )}
      />

      <p className="payroll-history__period"><Icon name="calendar" /> Payroll period: All periods</p>

      <div className="metric-grid payroll-history__summary">
        {metrics.map((metric) => <SummaryCard key={metric.label} {...metric} />)}
      </div>

      <SectionCard className="payroll-history__filters-card" title="Filter payroll history" eyebrow="Find a previous payroll cycle">
        <div className="payroll-history__filters">
          <label className="payroll-history__search-field">
            <span>Search</span>
            <span className="payroll-history__search-input">
              <Icon name="search" />
              <input
                type="search"
                value={query}
                placeholder="Search batch ID, reference, or creator"
                aria-label="Search payroll history"
                onChange={(event) => updateFilter(setQuery, event.target.value)}
              />
            </span>
          </label>
          <label>
            <span>Payroll period</span>
            <select value={period} onChange={(event) => updateFilter(setPeriod, event.target.value)}>
              <option value="all">All periods</option>
              {payrollHistoryPeriods.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label>
            <span>Batch status</span>
            <select value={batchStatus} onChange={(event) => updateFilter(setBatchStatus, event.target.value as PayrollHistoryBatchStatus | "all")}>
              <option value="all">All statuses</option>
              {payrollHistoryBatchStatuses.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label>
            <span>Transfer status</span>
            <select value={transferStatus} onChange={(event) => updateFilter(setTransferStatus, event.target.value as PayrollHistoryTransferStatus | "all")}>
              <option value="all">All statuses</option>
              {payrollHistoryTransferStatuses.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label>
            <span>Result status</span>
            <select value={resultStatus} onChange={(event) => updateFilter(setResultStatus, event.target.value as PayrollHistoryResultStatus | "all")}>
              <option value="all">All statuses</option>
              {payrollHistoryResultStatuses.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <button type="button" className="button-secondary payroll-history__clear" onClick={clearFilters}>Clear filters</button>
        </div>
      </SectionCard>

      <SectionCard className="payroll-history__records-card" title="Payroll Operations History" eyebrow="Historical payroll activity">
        <p className="payroll-history__panel-description">View payroll batches and their complete handoff and result status from previous payroll periods.</p>
        <p className="payroll-history__result-meta" aria-live="polite">
          {filteredRecords.length ? `Showing ${firstVisible} to ${lastVisible} of ${filteredRecords.length} ${filteredRecords.length === 1 ? "batch" : "batches"}` : "No historical batches found"}
        </p>
        <PayrollHistoryTable records={pageRecords} onViewDetails={setSelectedRecord} />
        <footer className="payroll-history__pagination">
          <span>Page {visiblePage} of {totalPages}</span>
          <nav aria-label="Payroll history pages">
            <button type="button" className="payroll-history__page-button" onClick={() => setPage(Math.max(1, visiblePage - 1))} disabled={visiblePage === 1} aria-label="Previous page"><Icon name="chevron-left" /></button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
              <button type="button" className={`payroll-history__page-button ${pageNumber === visiblePage ? "is-active" : ""}`} onClick={() => setPage(pageNumber)} aria-current={pageNumber === visiblePage ? "page" : undefined} key={pageNumber}>{pageNumber}</button>
            ))}
            <button type="button" className="payroll-history__page-button" onClick={() => setPage(Math.min(totalPages, visiblePage + 1))} disabled={visiblePage === totalPages} aria-label="Next page"><Icon name="chevron-right" /></button>
          </nav>
        </footer>
      </SectionCard>

      <p className="payroll-history__boundary-note"><Icon name="info" /> This is a migration prototype. History data is read-only local data; the page does not change payroll batches or connect to the Existing Payroll System.</p>
      <Link className="payroll-history__results-link" href="/payroll/results">View current payroll results <Icon name="arrow" /></Link>
      <span className="sr-only" aria-live="polite">{feedback}</span>

      <PayrollHistoryDetailsModal record={selectedRecord} onClose={() => setSelectedRecord(null)} />
    </div>
  );
}
