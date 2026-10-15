"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { ActionButton } from "@/components/ui/ActionButton";
import { Icon } from "@/components/ui/Icon";
import { SectionCard } from "@/components/ui/SectionCard";
import { SummaryCard } from "@/components/ui/SummaryCard";
import {
  getPayrollHistorySummaryMetrics,
  type PayrollHistoryRecord,
} from "@/data/payroll/history";
import type { PayrollBatchStatus } from "@/types/payroll-batches";
import type { PayrollTransferStatus } from "@/types/payroll-handoff";
import type { PayrollResultStatus } from "@/types/payroll-results";
import type { PayrollHistoryData } from "@/types/payroll-history";

import { PayrollHistoryDetailsModal } from "./PayrollHistoryDetailsModal";
import { PayrollHistoryTable } from "./PayrollHistoryTable";

type PayrollHistoryPageProps = {
  initialData: PayrollHistoryData;
  loadError: boolean;
};

type ApiResult = {
  success: boolean;
  data?: PayrollHistoryData;
  error?: { message?: string };
};

export function PayrollHistoryPage({ initialData, loadError: initialLoadError }: PayrollHistoryPageProps) {
  const [data, setData] = useState(initialData);
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState("all");
  const [batchStatus, setBatchStatus] = useState<PayrollBatchStatus | "all">("all");
  const [transferStatus, setTransferStatus] = useState<PayrollTransferStatus | "all">("all");
  const [resultStatus, setResultStatus] = useState<PayrollResultStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState<PayrollHistoryRecord | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(initialLoadError);
  const firstRender = useRef(true);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: String(data.pageSize || 5) });
    if (query.trim()) params.set("search", query.trim());
    if (period !== "all") params.set("periodStart", period);
    if (batchStatus !== "all") params.set("batchStatus", batchStatus);
    if (transferStatus !== "all") params.set("transferStatus", transferStatus);
    if (resultStatus !== "all") params.set("resultStatus", resultStatus);

    try {
      const response = await fetch(`/api/payroll/history?${params.toString()}`, { cache: "no-store" });
      const payload = await response.json() as ApiResult;
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error?.message || "Payroll history data is temporarily unavailable.");
      }
      setData(payload.data);
      setLoadError(false);
    } catch (error) {
      setLoadError(true);
      setFeedback(error instanceof Error ? error.message : "Payroll history data is temporarily unavailable.");
    } finally {
      setIsLoading(false);
    }
  }, [batchStatus, data.pageSize, page, period, query, resultStatus, transferStatus]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    void loadHistory();
  }, [loadHistory]);

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

  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));
  const visiblePage = Math.min(data.page, totalPages);
  const firstVisible = data.total === 0 ? 0 : (visiblePage - 1) * data.pageSize + 1;
  const lastVisible = Math.min(visiblePage * data.pageSize, data.total);
  const selectedPeriodLabel = period === "all"
    ? "All periods"
    : data.periodOptions.find((option) => option.start === period)?.label ?? period;

  return (
    <div className={`payroll-history${isLoading ? " is-loading" : ""}`}>
      <AdminPageHeader
        eyebrow="Payroll records"
        title="Payroll History"
        description="Review previous payroll batches, handoff activity, acknowledgement status, and payroll results by period."
        actions={(
          <div className="payroll-history__header-actions">
            <ActionButton icon="download" variant="secondary" action="History export is not available until an export service is connected." onAction={() => showFeedback("History export is not available until an export service is connected.")}>Export history</ActionButton>
            <ActionButton icon="refresh" variant="primary" action="Payroll history refreshed." onAction={() => void loadHistory()}>Refresh data</ActionButton>
          </div>
        )}
      />

      {loadError ? (
        <div className="payroll-history__load-error" role="alert">
          <Icon name="warning" />
          <span>Unable to load persistent payroll history.</span>
          <button type="button" className="button-link" onClick={() => void loadHistory()}>Try again</button>
        </div>
      ) : null}

      <p className="payroll-history__period"><Icon name="calendar" /> Payroll period: {selectedPeriodLabel}</p>

      <div className="metric-grid payroll-history__summary">
        {getPayrollHistorySummaryMetrics(data.summary).map((metric) => <SummaryCard key={metric.label} {...metric} />)}
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
              {data.periodOptions.map((option) => <option key={option.start} value={option.start}>{option.label}</option>)}
            </select>
          </label>
          <label>
            <span>Batch status</span>
            <select value={batchStatus} onChange={(event) => updateFilter(setBatchStatus, event.target.value as PayrollBatchStatus | "all")}>
              <option value="all">All statuses</option>
              {data.batchStatusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label>
            <span>Transfer status</span>
            <select value={transferStatus} onChange={(event) => updateFilter(setTransferStatus, event.target.value as PayrollTransferStatus | "all")}>
              <option value="all">All statuses</option>
              {data.transferStatusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label>
            <span>Result status</span>
            <select value={resultStatus} onChange={(event) => updateFilter(setResultStatus, event.target.value as PayrollResultStatus | "all")}>
              <option value="all">All statuses</option>
              {data.resultStatusOptions.map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}
            </select>
          </label>
          <button type="button" className="button-secondary payroll-history__clear" onClick={clearFilters}>Clear filters</button>
        </div>
      </SectionCard>

      <SectionCard className="payroll-history__records-card" title="Payroll Operations History" eyebrow="Historical payroll activity">
        <p className="payroll-history__panel-description">View persistent payroll batches and their derived handoff and result status from previous payroll periods.</p>
        <p className="payroll-history__result-meta" aria-live="polite">
          {isLoading ? "Refreshing payroll history…" : data.total ? `Showing ${firstVisible} to ${lastVisible} of ${data.total} ${data.total === 1 ? "batch" : "batches"}` : "No historical batches found"}
        </p>
        <PayrollHistoryTable records={data.records} onViewDetails={setSelectedRecord} />
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

      <Link className="payroll-history__results-link" href="/payroll/results">View current payroll results <Icon name="arrow" /></Link>
      <span className="sr-only" aria-live="polite">{feedback}</span>

      <PayrollHistoryDetailsModal record={selectedRecord} onClose={() => setSelectedRecord(null)} />
    </div>
  );
}
