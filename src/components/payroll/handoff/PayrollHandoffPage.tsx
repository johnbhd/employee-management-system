"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { ActionButton } from "@/components/ui/ActionButton";
import { Icon } from "@/components/ui/Icon";
import { SectionCard } from "@/components/ui/SectionCard";
import { SummaryCard } from "@/components/ui/SummaryCard";
import type { ApiResponse } from "@/types/api/responses";
import type { PayrollHandoffData } from "@/types/payroll-handoff";
import {
  getPayrollHandoffSummaryMetricsFromSummary,
  mapPayrollHandoffData,
  type PayrollHandoffRecord,
} from "@/data/payroll/handoff";

import { PayrollHandoffDetailsModal } from "./PayrollHandoffDetailsModal";
import { PayrollHandoffSubmitModal } from "./PayrollHandoffSubmitModal";
import { PayrollHandoffTable } from "./PayrollHandoffTable";

type HandoffData = ReturnType<typeof mapPayrollHandoffData>;
type HandoffModalState = { kind: "ready-details" | "submit"; batchId: string } | { kind: "history-details"; recordId: string } | null;
type HandoffApiResponse = ApiResponse<PayrollHandoffData>;

function getErrorMessage(status: number, body: HandoffApiResponse) {
  if (status === 401) return "Your Payroll session has expired. Sign in again.";
  if (status === 403) return "You do not have permission to manage payroll handoffs.";
  return body.success ? "Payroll handoff data could not be loaded." : body.error.message;
}

function getTransferStatusQuery(status: PayrollHandoffRecord["transferStatus"] | "all") {
  if (status === "Submitting") return "submitting";
  if (status === "Submitted") return "submitted";
  if (status === "Failed") return "failed";
  return "";
}

export function PayrollHandoffPage({
  initialData,
  loadError = false,
}: {
  initialData: PayrollHandoffData;
  loadError?: boolean;
}) {
  const [data, setData] = useState<HandoffData>(() => mapPayrollHandoffData(initialData));
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState("all");
  const [status, setStatus] = useState<PayrollHandoffRecord["transferStatus"] | "all">("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(initialData.page);
  const [modal, setModal] = useState<HandoffModalState>(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState(loadError ? "Payroll handoff records could not be loaded." : null);
  const [isLoading, setIsLoading] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const readyPanelRef = useRef<HTMLDivElement>(null);

  const invalidDateRange = Boolean(fromDate && toDate && fromDate > toDate);
  const history = data.history;
  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));
  const visiblePage = data.page;
  const selectedReadyBatch = modal && "batchId" in modal
    ? data.readyBatches.find((batch) => batch.id === modal.batchId) ?? null
    : null;
  const selectedRecord = modal && "recordId" in modal
    ? history.find((record) => record.id === modal.recordId) ?? null
    : null;
  const ongoingTransfers = history.filter((record) => record.transferStatus === "Submitting");
  const metrics = getPayrollHandoffSummaryMetricsFromSummary(data.summary);
  const periodOptions = useMemo(() => data.periodOptions, [data.periodOptions]);

  const fetchData = useCallback(async (requestedPage = page) => {
    if (invalidDateRange) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(requestedPage),
        pageSize: String(initialData.pageSize),
      });
      if (query.trim()) params.set("search", query.trim());
      if (period !== "all") params.set("periodStart", period);
      const transferStatus = getTransferStatusQuery(status);
      if (transferStatus) params.set("transferStatus", transferStatus);
      if (fromDate) params.set("fromDate", fromDate);
      if (toDate) params.set("toDate", toDate);

      const response = await fetch(`/api/v1/payroll/handoffs?${params.toString()}`, {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      const body = await response.json() as HandoffApiResponse;
      if (!response.ok || !body.success) throw new Error(getErrorMessage(response.status, body));
      setData(mapPayrollHandoffData(body.data));
      setError(null);
    } catch (loadErrorValue) {
      setError(loadErrorValue instanceof Error ? loadErrorValue.message : "Payroll handoff records could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, [fromDate, initialData.pageSize, invalidDateRange, page, period, query, status, toDate]);

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchData(page), query ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [fetchData, page, query]);

  useEffect(() => {
    if (!modal) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isBusy) setModal(null);
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isBusy, modal]);

  function showFeedback(message: string) {
    setFeedback(message);
    window.setTimeout(() => setFeedback(""), 3200);
  }

  function resetToFirstPage() {
    setPage(1);
  }

  async function confirmSubmit() {
    if (!modal || modal.kind !== "submit" || !selectedReadyBatch) return;
    setIsBusy(true);
    try {
      const response = await fetch("/api/v1/payroll/handoffs", {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ batchId: selectedReadyBatch.id }),
      });
      const body = await response.json() as ApiResponse<unknown>;
      if (!response.ok || !body.success) {
        throw new Error(!body.success ? body.error.message : "Payroll handoff could not be submitted.");
      }
      setModal(null);
      setPage(1);
      await fetchData(1);
      showFeedback(`Payroll batch ${selectedReadyBatch.id} was submitted for handoff.`);
    } catch (submitError) {
      showFeedback(submitError instanceof Error ? submitError.message : "Payroll handoff could not be submitted.");
    } finally {
      setIsBusy(false);
    }
  }

  function copyReference(record: PayrollHandoffRecord) {
    if (record.reference === "—") {
      showFeedback("This handoff has no external reference number.");
      return;
    }
    if (!navigator.clipboard) {
      showFeedback(`Reference number: ${record.reference}`);
      return;
    }
    void navigator.clipboard.writeText(record.reference).then(
      () => showFeedback(`Reference number ${record.reference} copied.`),
      () => showFeedback(`Could not copy automatically. Reference: ${record.reference}`),
    );
  }

  function scrollToReadyBatches() {
    readyPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    readyPanelRef.current?.focus({ preventScroll: true });
  }

  return (
    <div className="payroll-handoff" aria-busy={isLoading || isBusy}>
      <AdminPageHeader
        eyebrow="Payroll integration"
        title="Payroll Handoff"
        description="Submit prepared attendance batches to the configured Payroll integration and monitor transfer status and acknowledgement."
        actions={(
          <div className="payroll-handoff__header-actions">
            <button type="button" className="button-secondary" onClick={scrollToReadyBatches}><Icon name="arrow" /> View ready batches</button>
            <ActionButton icon="refresh" action="Payroll handoff status refreshed." onAction={() => void fetchData(page)}>Refresh status</ActionButton>
          </div>
        )}
      />

      {error ? <p className="payroll-handoff__filter-error" role="alert">{error} {data.history.length ? "Showing the last successful handoff data." : "Use Refresh status to try again."}</p> : null}
      <p className="payroll-handoff__period"><Icon name="calendar" /> Payroll period: {data.period.label}</p>
      <div className="metric-grid payroll-handoff__summary">{metrics.map((metric) => <SummaryCard key={metric.label} {...metric} />)}</div>

      <div className="payroll-handoff__panels">
        <div ref={readyPanelRef} className="payroll-handoff__panel-anchor" tabIndex={-1}>
          <SectionCard className="payroll-handoff__panel" title="Batches Ready to Submit" eyebrow="Ready for handoff">
            <p className="payroll-handoff__panel-description">Prepared payroll batches that passed server-side readiness checks.</p>
            <PayrollHandoffTable kind="ready" readyBatches={data.readyBatches} onSubmit={(batch) => setModal({ kind: "submit", batchId: batch.id })} onViewReady={(batch) => setModal({ kind: "ready-details", batchId: batch.id })} />
          </SectionCard>
        </div>

        <SectionCard className="payroll-handoff__panel" title="Batches Currently Processing" eyebrow="Ongoing transfers">
          <p className="payroll-handoff__panel-description">Payroll batches that have been submitted and are awaiting a final acknowledgement.</p>
          <PayrollHandoffTable kind="ongoing" records={ongoingTransfers} onViewRecord={(record) => setModal({ kind: "history-details", recordId: record.id })} />
        </SectionCard>
      </div>

      <SectionCard className="payroll-handoff__history-card" title="All Payroll Handoff Activity" eyebrow="Handoff history">
        <p className="payroll-handoff__panel-description">Persistent transfer records and acknowledgement state returned by the configured integration adapter.</p>
        <form className="payroll-handoff__filters" onSubmit={(event) => event.preventDefault()} role="search" aria-label="Payroll handoff history filters">
          <label className="payroll-handoff__search-field"><span>Search transfer or batch ID</span><span className="payroll-handoff__search-input"><Icon name="search" /><input type="search" value={query} onChange={(event) => { setQuery(event.target.value); resetToFirstPage(); }} placeholder="Search transfer or batch ID" aria-label="Search handoff history by transfer or batch ID" /></span></label>
          <label><span>Payroll period</span><select value={period} onChange={(event) => { setPeriod(event.target.value); resetToFirstPage(); }} aria-label="Filter handoff history by payroll period"><option value="all">All periods</option>{periodOptions.map((option) => <option value={option.start} key={option.start}>{option.label}</option>)}</select></label>
          <label><span>Transfer status</span><select value={status} onChange={(event) => { setStatus(event.target.value as PayrollHandoffRecord["transferStatus"] | "all"); resetToFirstPage(); }} aria-label="Filter handoff history by transfer status"><option value="all">All statuses</option><option value="Submitting">Submitting</option><option value="Submitted">Submitted</option><option value="Failed">Failed</option></select></label>
          <label><span>Date from</span><input type="date" value={fromDate} onChange={(event) => { setFromDate(event.target.value); resetToFirstPage(); }} aria-label="Filter handoff history from date" /></label>
          <label><span>Date to</span><input type="date" value={toDate} onChange={(event) => { setToDate(event.target.value); resetToFirstPage(); }} aria-label="Filter handoff history to date" /></label>
          {query || period !== "all" || status !== "all" || fromDate || toDate ? <button type="button" className="button-secondary" onClick={() => { setQuery(""); setPeriod("all"); setStatus("all"); setFromDate(""); setToDate(""); setPage(1); }}>Clear filters</button> : null}
        </form>
        {invalidDateRange ? <p className="payroll-handoff__filter-error" role="alert"><Icon name="warning" /> The start date must be on or before the end date.</p> : null}
        <p className="payroll-handoff__result-meta" aria-live="polite">{isLoading ? "Loading handoff activity…" : data.total ? `Showing ${(visiblePage - 1) * data.pageSize + 1} to ${Math.min(visiblePage * data.pageSize, data.total)} of ${data.total} batches` : "No payroll handoff activity is available for this period."}</p>
        <PayrollHandoffTable kind="history" records={history} onViewRecord={(record) => setModal({ kind: "history-details", recordId: record.id })} onCopyReference={copyReference} />
        <footer className="payroll-handoff__pagination"><span>Page {visiblePage} of {totalPages}</span><nav aria-label="Payroll handoff history pages"><button type="button" className="payroll-handoff__page-button" onClick={() => setPage(Math.max(1, visiblePage - 1))} disabled={visiblePage === 1 || isLoading} aria-label="Previous page"><Icon name="chevron-left" /></button>{Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => <button type="button" className={`payroll-handoff__page-button ${pageNumber === visiblePage ? "is-active" : ""}`} onClick={() => setPage(pageNumber)} aria-current={pageNumber === visiblePage ? "page" : undefined} key={pageNumber}>{pageNumber}</button>)}<button type="button" className="payroll-handoff__page-button" onClick={() => setPage(Math.min(totalPages, visiblePage + 1))} disabled={visiblePage === totalPages || isLoading} aria-label="Next page"><Icon name="chevron-right" /></button></nav></footer>
      </SectionCard>

      <span className="sr-only" aria-live="polite">{feedback}</span>
      <PayrollHandoffDetailsModal readyBatch={modal?.kind === "ready-details" ? selectedReadyBatch : null} record={modal?.kind === "history-details" ? selectedRecord : null} onClose={() => !isBusy && setModal(null)} onSubmitReady={(batch) => setModal({ kind: "submit", batchId: batch.id })} onCopyReference={copyReference} />
      <PayrollHandoffSubmitModal batch={modal?.kind === "submit" ? selectedReadyBatch : null} onCancel={() => !isBusy && setModal(null)} onConfirm={() => void confirmSubmit()} isBusy={isBusy} />
    </div>
  );
}
