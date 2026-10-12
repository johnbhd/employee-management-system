"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { ActionButton } from "@/components/ui/ActionButton";
import { Icon } from "@/components/ui/Icon";
import { SectionCard } from "@/components/ui/SectionCard";
import { SummaryCard } from "@/components/ui/SummaryCard";
import {
  formatPayrollResultDateTime,
  getPayrollResultsSummaryMetrics,
  type PayrollBatchResult,
  type PayrollResultRecord,
} from "@/data/payroll/results";
import type { PayrollResultProcessingStatus, PayrollResultsData } from "@/types/payroll-results";

import { PayrollBatchResultsTable } from "./PayrollBatchResultsTable";
import { PayrollResultsDetailsModal } from "./PayrollResultsDetailsModal";
import { PayrollResultsFilters } from "./PayrollResultsFilters";
import { PayrollResultsNotices } from "./PayrollResultsNotices";
import { PayrollResultsTable } from "./PayrollResultsTable";

type ResultsModalState =
  | { kind: "record"; id: string }
  | { kind: "batch"; id: string }
  | null;

type PayrollResultsPageProps = {
  initialData: PayrollResultsData;
  loadError: boolean;
};

type ApiResult = {
  success: boolean;
  data?: PayrollResultsData;
  error?: { message?: string };
};

export function PayrollResultsPage({ initialData, loadError: initialLoadError }: PayrollResultsPageProps) {
  const [data, setData] = useState(initialData);
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState("all");
  const [status, setStatus] = useState<PayrollResultProcessingStatus | "all">("all");
  const [department, setDepartment] = useState("all");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<ResultsModalState>(null);
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(initialLoadError);
  const firstRender = useRef(true);

  const loadResults = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: String(data.pageSize || 5) });
    if (query.trim()) params.set("search", query.trim());
    if (period !== "all") params.set("periodStart", period);
    if (status !== "all") params.set("status", status);
    if (department !== "all") params.set("department", department);

    try {
      const response = await fetch(`/api/v1/payroll/results?${params.toString()}`, { cache: "no-store" });
      const payload = await response.json() as ApiResult;
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error?.message || "Payroll result data is temporarily unavailable.");
      }
      setData(payload.data);
      setLoadError(false);
    } catch (error) {
      setLoadError(true);
      setFeedback(error instanceof Error ? error.message : "Payroll result data is temporarily unavailable.");
    } finally {
      setIsLoading(false);
    }
  }, [data.pageSize, department, page, period, query, status]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    void loadResults();
  }, [loadResults]);

  useEffect(() => {
    if (!modal) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setModal(null);
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [modal]);

  function showFeedback(message: string) {
    setFeedback(message);
    window.setTimeout(() => setFeedback(""), 3000);
  }

  function clearFilters() {
    setQuery("");
    setPeriod("all");
    setStatus("all");
    setDepartment("all");
    setPage(1);
  }

  function copyReference(record: PayrollResultRecord) {
    if (!record.externalPayrollReference) {
      showFeedback("This result has no returned payroll reference yet.");
      return;
    }

    if (!navigator.clipboard) {
      showFeedback(`Payroll reference: ${record.externalPayrollReference}`);
      return;
    }

    void navigator.clipboard.writeText(record.externalPayrollReference).then(
      () => showFeedback(`Payroll reference ${record.externalPayrollReference} copied.`),
      () => showFeedback(`Could not copy automatically. Reference: ${record.externalPayrollReference}`),
    );
  }

  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));
  const visiblePage = Math.min(data.page, totalPages);
  const firstVisible = data.total === 0 ? 0 : (visiblePage - 1) * data.pageSize + 1;
  const lastVisible = Math.min(visiblePage * data.pageSize, data.total);
  const selectedRecord = modal?.kind === "record"
    ? data.records.find((record) => record.id === modal.id) ?? null
    : null;
  const selectedBatch = modal?.kind === "batch"
    ? data.batchResults.find((batch) => batch.resultId === modal.id) ?? null
    : null;
  const periodOptions = useMemo(
    () => data.periodOptions.map((option) => ({ value: option.start, label: option.label })),
    [data.periodOptions],
  );

  return (
    <div className={`payroll-results${isLoading ? " is-loading" : ""}`}>
      <AdminPageHeader
        eyebrow="Payroll output"
        title="Payroll Results"
        description="Review payroll processing results, employee payslip availability, and response status returned by the Existing Payroll System."
        actions={(
          <div className="payroll-results__header-actions">
            <Link className="button-secondary" href="/payroll/handoff"><Icon name="arrow" /> View handoff</Link>
            <ActionButton icon="refresh" variant="primary" action="Payroll results refresh requested." onAction={() => void loadResults()}>Refresh results</ActionButton>
          </div>
        )}
      />

      {loadError ? (
        <div className="payroll-results__load-error" role="alert">
          <Icon name="warning" />
          <span>Unable to load the latest returned payroll results.</span>
          <button type="button" className="button-link" onClick={() => void loadResults()}>Try again</button>
        </div>
      ) : null}

      <p className="payroll-results__period"><Icon name="calendar" /> Payroll period: {data.period.label}</p>

      <div className="metric-grid payroll-results__summary">
        {getPayrollResultsSummaryMetrics(data.summary).map((metric) => <SummaryCard key={metric.label} {...metric} />)}
      </div>

      <SectionCard className="payroll-results__records-card" title="Payroll Result Records" eyebrow="Employee payroll results">
        <p className="payroll-results__panel-description">List of employees with payroll processing results returned by the Existing Payroll System.</p>
        <PayrollResultsFilters
          query={query}
          period={period}
          status={status}
          department={department}
          periods={periodOptions}
          departments={data.departmentOptions}
          onQueryChange={(value) => { setQuery(value); setPage(1); }}
          onPeriodChange={(value) => { setPeriod(value); setPage(1); }}
          onStatusChange={(value) => { setStatus(value); setPage(1); }}
          onDepartmentChange={(value) => { setDepartment(value); setPage(1); }}
          onReset={clearFilters}
        />
        <p className="payroll-results__result-meta" aria-live="polite">
          {isLoading ? "Refreshing returned results…" : data.total ? `Showing ${firstVisible} to ${lastVisible} of ${data.total} ${data.total === 1 ? "record" : "records"}` : "No returned result records found"}
        </p>
        <PayrollResultsTable
          records={data.records}
          onViewDetails={(record) => setModal({ kind: "record", id: record.id })}
          onCopyReference={copyReference}
        />
        <footer className="payroll-results__pagination">
          <span>Page {visiblePage} of {totalPages}</span>
          <nav aria-label="Payroll result record pages">
            <button type="button" className="payroll-results__page-button" onClick={() => setPage(Math.max(1, visiblePage - 1))} disabled={visiblePage === 1} aria-label="Previous page"><Icon name="chevron-left" /></button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => <button type="button" className={`payroll-results__page-button ${pageNumber === visiblePage ? "is-active" : ""}`} onClick={() => setPage(pageNumber)} aria-current={pageNumber === visiblePage ? "page" : undefined} key={pageNumber}>{pageNumber}</button>)}
            <button type="button" className="payroll-results__page-button" onClick={() => setPage(Math.min(totalPages, visiblePage + 1))} disabled={visiblePage === totalPages} aria-label="Next page"><Icon name="chevron-right" /></button>
          </nav>
        </footer>
      </SectionCard>

      <div className="payroll-results__bottom-grid">
        <SectionCard className="payroll-results__batch-card" title="Latest Batch Results" eyebrow="Recent payroll results by batch">
          <p className="payroll-results__panel-description">Recent payroll batches and their returned status from the Existing Payroll System.</p>
          <PayrollBatchResultsTable batches={data.batchResults} onViewDetails={(batch: PayrollBatchResult) => setModal({ kind: "batch", id: batch.resultId })} />
        </SectionCard>
        <PayrollResultsNotices notices={data.notices} onViewAll={() => showFeedback("All returned result notices are shown here.")} />
      </div>

      <p className="payroll-results__boundary-note"><Icon name="info" /> {data.providerNote}</p>
      <span className="sr-only" aria-live="polite">{feedback}</span>

      <PayrollResultsDetailsModal record={selectedRecord} batch={selectedBatch} onClose={() => setModal(null)} onCopyReference={copyReference} />
      {data.currentResult ? <span className="sr-only">Latest result {data.currentResult.resultId} returned at {formatPayrollResultDateTime(data.currentResult.receivedAt)}.</span> : null}
    </div>
  );
}
