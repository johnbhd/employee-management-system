"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { ActionButton } from "@/components/ui/ActionButton";
import { Icon } from "@/components/ui/Icon";
import { SectionCard } from "@/components/ui/SectionCard";
import { SummaryCard } from "@/components/ui/SummaryCard";
import {
  getPayrollHandoffSummaryMetrics,
  initialPayrollHandoffHistory,
  initialPayrollReadyBatches,
  type PayrollHandoffRecord,
  type PayrollReadyBatch,
} from "@/data/payroll/handoff";

import { PayrollHandoffDetailsModal } from "./PayrollHandoffDetailsModal";
import { PayrollHandoffRetryModal } from "./PayrollHandoffRetryModal";
import { PayrollHandoffSubmitModal } from "./PayrollHandoffSubmitModal";
import { PayrollHandoffTable } from "./PayrollHandoffTable";

const pageSize = 5;

type HandoffModalState =
  | { kind: "ready-details" | "submit"; batchId: string }
  | { kind: "history-details" | "retry"; recordId: string }
  | null;

export function PayrollHandoffPage() {
  const [readyBatches, setReadyBatches] = useState<PayrollReadyBatch[]>([...initialPayrollReadyBatches]);
  const [history, setHistory] = useState<PayrollHandoffRecord[]>([...initialPayrollHandoffHistory]);
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState("all");
  const [status, setStatus] = useState<PayrollHandoffRecord["transferStatus"] | "all">("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<HandoffModalState>(null);
  const [feedback, setFeedback] = useState("");
  const readyPanelRef = useRef<HTMLDivElement>(null);

  const invalidDateRange = Boolean(fromDate && toDate && fromDate > toDate);
  const filteredHistory = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (invalidDateRange) return [];

    return history.filter((record) => (
      (!normalizedQuery || record.id.toLowerCase().includes(normalizedQuery))
      && (period === "all" || record.period === period)
      && (status === "all" || record.transferStatus === status)
      && (!fromDate || record.date >= fromDate)
      && (!toDate || record.date <= toDate)
    ));
  }, [fromDate, history, invalidDateRange, period, query, status, toDate]);

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / pageSize));
  const visiblePage = Math.min(page, totalPages);
  const pageHistory = filteredHistory.slice((visiblePage - 1) * pageSize, visiblePage * pageSize);
  const firstVisible = filteredHistory.length === 0 ? 0 : (visiblePage - 1) * pageSize + 1;
  const lastVisible = Math.min(visiblePage * pageSize, filteredHistory.length);
  const ongoingTransfers = history.filter((record) => record.transferStatus === "Processing");
  const metrics = getPayrollHandoffSummaryMetrics(readyBatches, history);
  const selectedReadyBatch = modal && "batchId" in modal
    ? readyBatches.find((batch) => batch.id === modal.batchId) ?? null
    : null;
  const selectedRecord = modal && "recordId" in modal
    ? history.find((record) => record.id === modal.recordId) ?? null
    : null;

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

  function openSubmit(batch: PayrollReadyBatch) {
    setModal({ kind: "submit", batchId: batch.id });
  }

  function confirmSubmit() {
    if (!modal || modal.kind !== "submit") return;

    const batch = readyBatches.find((candidate) => candidate.id === modal.batchId);
    if (!batch) {
      setModal(null);
      showFeedback("This batch is no longer ready for handoff.");
      return;
    }

    const now = new Date();
    setReadyBatches((current) => current.filter((candidate) => candidate.id !== batch.id));
    setHistory((current) => [
      {
        id: batch.id,
        period: batch.period,
        employees: batch.employees,
        submittedAt: formatHandoffTimestamp(now),
        date: now.toISOString().slice(0, 10),
        transferStatus: "Processing",
        acknowledgement: "Pending",
        reference: "—",
      },
      ...current,
    ]);
    setPage(1);
    setModal(null);
    showFeedback(`Batch ${batch.id} submitted for transfer. Awaiting acknowledgement.`);
  }

  function confirmRetry() {
    if (!modal || modal.kind !== "retry") return;

    const record = history.find((candidate) => candidate.id === modal.recordId);
    if (!record || record.transferStatus !== "Failed") {
      setModal(null);
      showFeedback("Only failed transfers can be retried.");
      return;
    }

    const now = new Date();
    setHistory((current) => current.map((candidate) => candidate.id === record.id ? {
      ...candidate,
      submittedAt: formatHandoffTimestamp(now),
      date: now.toISOString().slice(0, 10),
      transferStatus: "Processing",
      acknowledgement: "Pending",
      reference: "—",
    } : candidate));
    setModal(null);
    showFeedback(`Retry initiated for ${record.id}. Awaiting acknowledgement.`);
  }

  function copyReference(record: PayrollHandoffRecord) {
    if (record.reference === "—") {
      showFeedback("This batch has no reference number yet.");
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

  function clearFilters() {
    setQuery("");
    setPeriod("all");
    setStatus("all");
    setFromDate("");
    setToDate("");
    setPage(1);
  }

  function updateDateRange(nextFromDate: string, nextToDate: string) {
    setFromDate(nextFromDate);
    setToDate(nextToDate);
    setPage(1);
    if (nextFromDate && nextToDate && nextFromDate > nextToDate) {
      showFeedback("The start date must be on or before the end date.");
    }
  }

  function scrollToReadyBatches() {
    readyPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    readyPanelRef.current?.focus({ preventScroll: true });
  }

  return (
    <div className="payroll-handoff">
      <AdminPageHeader
        eyebrow="Payroll integration"
        title="Payroll Handoff"
        description="Submit prepared attendance batches to the Existing Payroll System and monitor transfer status and acknowledgement."
        actions={(
          <div className="payroll-handoff__header-actions">
            <button type="button" className="button-secondary" onClick={scrollToReadyBatches}><Icon name="arrow" /> View ready batches</button>
            <ActionButton icon="refresh" action="Handoff status refreshed. No new acknowledgements received in prototype data." onAction={() => showFeedback("Handoff status refreshed. No new acknowledgements received in prototype data.")}>Refresh status</ActionButton>
          </div>
        )}
      />

      <p className="payroll-handoff__period"><Icon name="calendar" /> Payroll period: September 1–15, 2026</p>

      <div className="metric-grid payroll-handoff__summary">
        {metrics.map((metric) => <SummaryCard key={metric.label} {...metric} />)}
      </div>

      <div className="payroll-handoff__panels">
        <div ref={readyPanelRef} className="payroll-handoff__panel-anchor" tabIndex={-1}>
          <SectionCard
            className="payroll-handoff__panel"
            title="Batches Ready to Submit"
            eyebrow="Ready for handoff"
          >
            <p className="payroll-handoff__panel-description">Prepared payroll batches that can be submitted to the Existing Payroll System.</p>
            <PayrollHandoffTable
              kind="ready"
              readyBatches={readyBatches}
              onSubmit={openSubmit}
              onViewReady={(batch) => setModal({ kind: "ready-details", batchId: batch.id })}
            />
          </SectionCard>
        </div>

        <SectionCard
          className="payroll-handoff__panel"
          title="Batches Currently Processing"
          eyebrow="Ongoing transfers"
        >
          <p className="payroll-handoff__panel-description">Payroll batches that have been submitted and are being transferred.</p>
          <PayrollHandoffTable
            kind="ongoing"
            records={ongoingTransfers}
            onViewRecord={(record) => setModal({ kind: "history-details", recordId: record.id })}
          />
        </SectionCard>
      </div>

      <SectionCard className="payroll-handoff__history-card" title="All Payroll Handoff Activity" eyebrow="Handoff history">
        <p className="payroll-handoff__panel-description">List of submitted payroll batches and their transfer status with acknowledgement from the Existing Payroll System.</p>
        <form className="payroll-handoff__filters" onSubmit={(event) => event.preventDefault()} role="search" aria-label="Payroll handoff history filters">
          <label className="payroll-handoff__search-field">
            <span>Search batch ID</span>
            <span className="payroll-handoff__search-input"><Icon name="search" /><input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search batch ID" aria-label="Search handoff history by batch ID" /></span>
          </label>
          <label>
            <span>Payroll period</span>
            <select value={period} onChange={(event) => { setPeriod(event.target.value); setPage(1); }} aria-label="Filter handoff history by payroll period">
              {payrollPeriods().map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label>
            <span>Transfer status</span>
            <select value={status} onChange={(event) => { setStatus(event.target.value as PayrollHandoffRecord["transferStatus"] | "all"); setPage(1); }} aria-label="Filter handoff history by transfer status">
              <option value="all">All statuses</option>
              <option value="Processing">Processing</option>
              <option value="Acknowledged">Acknowledged</option>
              <option value="Failed">Failed</option>
            </select>
          </label>
          <label>
            <span>Date from</span>
            <input type="date" value={fromDate} onChange={(event) => updateDateRange(event.target.value, toDate)} aria-label="Filter handoff history from date" />
          </label>
          <label>
            <span>Date to</span>
            <input type="date" value={toDate} onChange={(event) => updateDateRange(fromDate, event.target.value)} aria-label="Filter handoff history to date" />
          </label>
          {query || period !== "all" || status !== "all" || fromDate || toDate ? <button type="button" className="button-secondary" onClick={clearFilters}>Clear filters</button> : null}
        </form>
        {invalidDateRange ? <p className="payroll-handoff__filter-error" role="alert"><Icon name="warning" /> The start date must be on or before the end date.</p> : null}
        <p className="payroll-handoff__result-meta" aria-live="polite">
          {filteredHistory.length ? `Showing ${firstVisible} to ${lastVisible} of ${filteredHistory.length} ${filteredHistory.length === 1 ? "batch" : "batches"}` : "No batches found"}
        </p>
        <PayrollHandoffTable
          kind="history"
          records={pageHistory}
          onViewRecord={(record) => setModal({ kind: "history-details", recordId: record.id })}
          onRetry={(record) => setModal({ kind: "retry", recordId: record.id })}
          onCopyReference={copyReference}
        />
        <footer className="payroll-handoff__pagination">
          <span>Page {visiblePage} of {totalPages}</span>
          <nav aria-label="Payroll handoff history pages">
            <button type="button" className="payroll-handoff__page-button" onClick={() => setPage(Math.max(1, visiblePage - 1))} disabled={visiblePage === 1} aria-label="Previous page"><Icon name="chevron-left" /></button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => <button type="button" className={`payroll-handoff__page-button ${pageNumber === visiblePage ? "is-active" : ""}`} onClick={() => setPage(pageNumber)} aria-current={pageNumber === visiblePage ? "page" : undefined} key={pageNumber}>{pageNumber}</button>)}
            <button type="button" className="payroll-handoff__page-button" onClick={() => setPage(Math.min(totalPages, visiblePage + 1))} disabled={visiblePage === totalPages} aria-label="Next page"><Icon name="chevron-right" /></button>
          </nav>
        </footer>
      </SectionCard>

      <p className="payroll-handoff__boundary-note"><Icon name="info" /> This is a migration prototype. Submit and retry actions update the local interface only; no external payroll system is contacted.</p>
      <span className="sr-only" aria-live="polite">{feedback}</span>

      <PayrollHandoffDetailsModal
        readyBatch={modal?.kind === "ready-details" ? selectedReadyBatch : null}
        record={modal?.kind === "history-details" ? selectedRecord : null}
        onClose={() => setModal(null)}
        onSubmitReady={openSubmit}
        onCopyReference={copyReference}
      />
      <PayrollHandoffSubmitModal batch={modal?.kind === "submit" ? selectedReadyBatch : null} onCancel={() => setModal(null)} onConfirm={confirmSubmit} />
      <PayrollHandoffRetryModal record={modal?.kind === "retry" ? selectedRecord : null} onCancel={() => setModal(null)} onConfirm={confirmRetry} />
    </div>
  );
}

function payrollPeriods() {
  return [
    { value: "all", label: "All periods" },
    { value: "Sep 1–15, 2026", label: "Sep 1–15, 2026" },
    { value: "Aug 16–31, 2026", label: "Aug 16–31, 2026" },
    { value: "Aug 1–15, 2026", label: "Aug 1–15, 2026" },
    { value: "Jul 16–31, 2026", label: "Jul 16–31, 2026" },
  ];
}

function formatHandoffTimestamp(date: Date) {
  const dateLabel = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const timeLabel = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  return `${dateLabel}, ${timeLabel}`;
}
