"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { ActionButton } from "@/components/ui/ActionButton";
import { Icon } from "@/components/ui/Icon";
import { SectionCard } from "@/components/ui/SectionCard";
import { SummaryCard } from "@/components/ui/SummaryCard";
import {
  getPayrollResultsSummaryMetrics,
  initialPayrollBatchResults,
  initialPayrollResultNotices,
  initialPayrollResultRecords,
  payrollResultDepartments,
  payrollResultPeriods,
  type PayrollResultProcessingStatus,
  type PayrollResultRecord,
} from "@/data/payroll/results";

import { PayrollBatchResultsTable } from "./PayrollBatchResultsTable";
import { PayrollResultsDetailsModal } from "./PayrollResultsDetailsModal";
import { PayrollResultsFilters } from "./PayrollResultsFilters";
import { PayrollResultsNotices } from "./PayrollResultsNotices";
import { PayrollResultsTable } from "./PayrollResultsTable";

const pageSize = 5;

type ResultsModalState =
  | { kind: "record"; id: string }
  | { kind: "batch"; id: string }
  | null;

export function PayrollResultsPage() {
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState("all");
  const [status, setStatus] = useState<PayrollResultProcessingStatus | "all">("all");
  const [department, setDepartment] = useState("all");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<ResultsModalState>(null);
  const [feedback, setFeedback] = useState("");

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return initialPayrollResultRecords.filter((record) => (
      (!normalizedQuery
        || record.employeeName.toLowerCase().includes(normalizedQuery)
        || record.employeeId.toLowerCase().includes(normalizedQuery)
        || record.department.toLowerCase().includes(normalizedQuery))
      && (period === "all" || record.period === period)
      && (status === "all" || record.processingStatus === status)
      && (department === "all" || record.department === department)
    ));
  }, [department, period, query, status]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const visiblePage = Math.min(page, totalPages);
  const pageRecords = filteredRecords.slice((visiblePage - 1) * pageSize, visiblePage * pageSize);
  const firstVisible = filteredRecords.length === 0 ? 0 : (visiblePage - 1) * pageSize + 1;
  const lastVisible = Math.min(visiblePage * pageSize, filteredRecords.length);
  const selectedRecord = modal?.kind === "record"
    ? initialPayrollResultRecords.find((record) => record.employeeId === modal.id) ?? null
    : null;
  const selectedBatch = modal?.kind === "batch"
    ? initialPayrollBatchResults.find((batch) => batch.id === modal.id) ?? null
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

  function clearFilters() {
    setQuery("");
    setPeriod("all");
    setStatus("all");
    setDepartment("all");
    setPage(1);
  }

  function copyReference(record: PayrollResultRecord) {
    if (record.reference === "—") {
      showFeedback("This result has no payroll reference yet.");
      return;
    }

    if (!navigator.clipboard) {
      showFeedback(`Payroll reference: ${record.reference}`);
      return;
    }

    void navigator.clipboard.writeText(record.reference).then(
      () => showFeedback(`Payroll reference ${record.reference} copied.`),
      () => showFeedback(`Could not copy automatically. Reference: ${record.reference}`),
    );
  }

  return (
    <div className="payroll-results">
      <AdminPageHeader
        eyebrow="Payroll output"
        title="Payroll Results"
        description="Review payroll processing results, employee payslip availability, and response status returned by the Existing Payroll System."
        actions={(
          <div className="payroll-results__header-actions">
            <Link className="button-secondary" href="/payroll/handoff"><Icon name="arrow" /> View handoff</Link>
            <ActionButton icon="refresh" variant="primary" action="Payroll results refreshed. No new results received in prototype data." onAction={() => showFeedback("Payroll results refreshed. No new results received in prototype data.")}>Refresh results</ActionButton>
          </div>
        )}
      />

      <p className="payroll-results__period"><Icon name="calendar" /> Payroll period: September 1–15, 2026</p>

      <div className="metric-grid payroll-results__summary">
        {getPayrollResultsSummaryMetrics().map((metric) => <SummaryCard key={metric.label} {...metric} />)}
      </div>

      <SectionCard className="payroll-results__records-card" title="Payroll Result Records" eyebrow="Employee payroll results">
        <p className="payroll-results__panel-description">List of employees with payroll processing results returned by the Existing Payroll System.</p>
        <PayrollResultsFilters
          query={query}
          period={period}
          status={status}
          department={department}
          periods={payrollResultPeriods}
          departments={payrollResultDepartments}
          onQueryChange={(value) => { setQuery(value); setPage(1); }}
          onPeriodChange={(value) => { setPeriod(value); setPage(1); }}
          onStatusChange={(value) => { setStatus(value); setPage(1); }}
          onDepartmentChange={(value) => { setDepartment(value); setPage(1); }}
          onReset={clearFilters}
        />
        <p className="payroll-results__result-meta" aria-live="polite">
          {filteredRecords.length ? `Showing ${firstVisible} to ${lastVisible} of ${filteredRecords.length} ${filteredRecords.length === 1 ? "record" : "records"}` : "No result records found"}
        </p>
        <PayrollResultsTable
          records={pageRecords}
          onViewDetails={(record) => setModal({ kind: "record", id: record.employeeId })}
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
          <PayrollBatchResultsTable batches={initialPayrollBatchResults} onViewDetails={(batch) => setModal({ kind: "batch", id: batch.id })} />
        </SectionCard>
        <PayrollResultsNotices notices={initialPayrollResultNotices} onViewAll={() => showFeedback("Showing all payroll result notices in the prototype.")} />
      </div>

      <p className="payroll-results__boundary-note"><Icon name="info" /> This is a migration prototype. Result data is read-only local data; the page does not calculate payroll, create payslips, or connect to the Existing Payroll System.</p>
      <span className="sr-only" aria-live="polite">{feedback}</span>

      <PayrollResultsDetailsModal record={selectedRecord} batch={selectedBatch} onClose={() => setModal(null)} onCopyReference={copyReference} />
    </div>
  );
}
