"use client";

import { useEffect, useMemo, useState } from "react";

import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { ActionButton } from "@/components/ui/ActionButton";
import { Icon } from "@/components/ui/Icon";
import { SectionCard } from "@/components/ui/SectionCard";
import { SummaryCard } from "@/components/ui/SummaryCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  getPayrollBatchBreakdown,
  getPayrollBatchSummaryMetrics,
  getPayrollBatchTone,
  initialPayrollBatches,
  payrollBatchPeriods,
  type PayrollBatchRecord,
} from "@/data/payroll/batches";

import {
  PayrollBatchDetailsModal,
  type PayrollBatchDetailsMode,
} from "./PayrollBatchDetailsModal";
import {
  PayrollBatchFormModal,
  type PayrollBatchFormValues,
} from "./PayrollBatchFormModal";
import { PayrollBatchSubmitModal } from "./PayrollBatchSubmitModal";
import { PayrollBatchTable } from "./PayrollBatchTable";

const pageSize = 5;

type PayrollBatchModalState =
  | { kind: "create" }
  | { kind: "edit"; batchId: string }
  | { kind: "details" | "records" | "transfer"; batchId: string }
  | { kind: "submit"; batchId: string }
  | null;

export function PayrollBatchesPage() {
  const [batches, setBatches] = useState<PayrollBatchRecord[]>([...initialPayrollBatches]);
  const [currentId, setCurrentId] = useState("PAY-2026-0915-B");
  const [page, setPage] = useState(1);
  const [periodFilter, setPeriodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<PayrollBatchRecord["status"] | "all">("all");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<PayrollBatchModalState>(null);
  const [feedback, setFeedback] = useState("");

  const currentBatch = batches.find((batch) => batch.id === currentId) ?? batches[0] ?? null;
  const currentBreakdown = currentBatch ? getPayrollBatchBreakdown(currentBatch) : [];

  const filteredBatches = useMemo(() => {
    const query = search.trim().toLowerCase();

    return batches.filter((batch) => (
      (periodFilter === "all" || batch.period === periodFilter)
      && (statusFilter === "all" || batch.status === statusFilter)
      && (!query || batch.id.toLowerCase().includes(query) || batch.createdBy.toLowerCase().includes(query))
    ));
  }, [batches, periodFilter, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredBatches.length / pageSize));
  const visiblePage = Math.min(page, totalPages);
  const pageBatches = filteredBatches.slice((visiblePage - 1) * pageSize, visiblePage * pageSize);
  const firstVisibleBatch = filteredBatches.length === 0 ? 0 : (visiblePage - 1) * pageSize + 1;
  const lastVisibleBatch = Math.min(visiblePage * pageSize, filteredBatches.length);
  const summaryMetrics = getPayrollBatchSummaryMetrics(batches);
  const modalBatch = modal && "batchId" in modal ? batches.find((batch) => batch.id === modal.batchId) ?? null : null;
  const detailsMode: PayrollBatchDetailsMode | null = modal?.kind === "details"
    || modal?.kind === "records"
    || modal?.kind === "transfer"
    ? modal.kind
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
    window.setTimeout(() => setFeedback(""), 2800);
  }

  function getNextBatchId(period: string) {
    const prefix = period.startsWith("Aug") ? "PAY-2026-0901-" : "PAY-2026-0915-";
    const usedCodes = new Set(
      batches
        .filter((batch) => batch.id.startsWith(prefix))
        .map((batch) => batch.id.slice(prefix.length)),
    );
    let code = 65;
    while (usedCodes.has(String.fromCharCode(code))) code += 1;
    return `${prefix}${String.fromCharCode(code)}`;
  }

  function openDetails(batch: PayrollBatchRecord) {
    setCurrentId(batch.id);
    setModal({ kind: "details", batchId: batch.id });
  }

  function openRecords(batch: PayrollBatchRecord) {
    setCurrentId(batch.id);
    setModal({ kind: "records", batchId: batch.id });
  }

  function openEdit(batch: PayrollBatchRecord) {
    setCurrentId(batch.id);
    if (batch.status === "Transferred") {
      showFeedback("Transferred batches cannot be edited.");
      return;
    }
    setModal({ kind: "edit", batchId: batch.id });
  }

  function openSubmit(batch: PayrollBatchRecord) {
    setCurrentId(batch.id);
    if (batch.status === "Transferred") {
      showFeedback("This batch has already been transferred to payroll.");
      return;
    }
    if (batch.status === "Blocked") {
      showFeedback(`${batch.id} is blocked and cannot be submitted until the issues are resolved.`);
      return;
    }
    setModal({ kind: "submit", batchId: batch.id });
  }

  function handleCreate(values: PayrollBatchFormValues) {
    const id = getNextBatchId(values.period);
    const newBatch: PayrollBatchRecord = {
      id,
      period: values.period,
      records: values.records,
      departments: values.departments,
      createdBy: values.createdBy,
      createdAt: "Sep 16, 2026, 02:00 PM",
      status: "Draft",
      notes: values.notes || undefined,
    };

    setBatches((current) => [newBatch, ...current]);
    setCurrentId(id);
    setPage(1);
    setModal(null);
    showFeedback(`Batch ${id} created as Draft. No external write was made.`);
  }

  function handleEdit(values: PayrollBatchFormValues) {
    if (!modal || modal.kind !== "edit") return;
    const batchId = modal.batchId;

    setBatches((current) => current.map((batch) => (
      batch.id === batchId
        ? {
          ...batch,
          period: values.period,
          records: values.records,
          departments: values.departments,
          createdBy: values.createdBy,
          notes: values.notes || undefined,
          breakdown: undefined,
        }
        : batch
    )));
    setModal(null);
    showFeedback(`Batch ${batchId} updated. No external write was made.`);
  }

  function confirmSubmit() {
    if (!modal || modal.kind !== "submit") return;
    const batchId = modal.batchId;

    setBatches((current) => current.map((batch) => (
      batch.id === batchId
        ? { ...batch, status: "Transferred", submittedToday: true }
        : batch
    )));
    setModal(null);
    showFeedback(`Batch ${batchId} submitted to payroll in the prototype. No external write was made.`);
  }

  function resetFilters() {
    setPeriodFilter("all");
    setStatusFilter("all");
    setSearch("");
    setPage(1);
  }

  function navigatePage(nextPage: number) {
    setPage(Math.max(1, Math.min(totalPages, nextPage)));
  }

  return (
    <div className="payroll-batches">
      <AdminPageHeader
        eyebrow="Payroll preparation"
        title="Payroll Batches"
        description="Create, review, and prepare verified attendance batches for payroll handoff."
        actions={(
          <div className="payroll-batches__header-actions">
            <button type="button" className="button-primary" onClick={() => setModal({ kind: "create" })}>
              <Icon name="layers" /> Create batch
            </button>
            <ActionButton icon="refresh" action="Payroll batch data refreshed.">Refresh data</ActionButton>
          </div>
        )}
      />

      <p className="payroll-batches__period"><Icon name="calendar" /> Payroll period: September 1–15, 2026</p>

      <div className="metric-grid payroll-batches__summary">
        {summaryMetrics.map((metric) => <SummaryCard key={metric.label} {...metric} />)}
      </div>

      {currentBatch ? (
        <section className="dashboard-card payroll-batches__current-card" aria-labelledby="payroll-current-batch-heading">
          <div className="panel-header">
            <div>
              <p className="section-kicker">Current working batch</p>
              <div className="payroll-batches__title-row">
                <h2 id="payroll-current-batch-heading">Batch {currentBatch.id}</h2>
                <StatusBadge tone={getPayrollBatchTone(currentBatch.status)}>{currentBatch.status}</StatusBadge>
              </div>
              <p className="payroll-batches__panel-description">Attendance records selected for the current payroll batch. Review the list before submitting.</p>
            </div>
            <div className="payroll-batches__panel-actions">
              <button type="button" className="button-secondary" onClick={() => openDetails(currentBatch)}><Icon name="file" /> View details</button>
              <button type="button" className="button-secondary" onClick={() => openEdit(currentBatch)} disabled={currentBatch.status === "Transferred"}><Icon name="settings" /> Edit batch</button>
              <button type="button" className="button-primary" onClick={() => openSubmit(currentBatch)} disabled={currentBatch.status === "Transferred" || currentBatch.status === "Blocked"}><Icon name="arrow" /> Submit to payroll</button>
            </div>
          </div>

          <div className="payroll-batches__current-info">
            <div><Icon name="calendar" /><span><small>Payroll period</small><strong>{currentBatch.period}</strong></span></div>
            <div><Icon name="users" /><span><small>Total records</small><strong>{currentBatch.records}</strong></span></div>
            <div><Icon name="building" /><span><small>Departments</small><strong>{currentBatch.departments}</strong></span></div>
            <div><Icon name="user" /><span><small>Created by</small><strong>{currentBatch.createdBy}</strong></span></div>
            <div><Icon name="clock" /><span><small>Created at</small><strong>{currentBatch.createdAt}</strong></span></div>
          </div>
        </section>
      ) : null}

      <div className="payroll-batches__layout">
        <section className="dashboard-card payroll-batches__list-card" aria-labelledby="payroll-batch-list-heading">
          <div className="panel-header payroll-batches__list-header">
            <div>
              <p className="section-kicker">Payroll batch list</p>
              <h2 id="payroll-batch-list-heading">All Payroll Batches</h2>
              <p className="payroll-batches__panel-description">List of attendance batches for the selected payroll period.</p>
            </div>
            <div className="payroll-batches__filters">
              <label>
                <span>Payroll period</span>
                <select value={periodFilter} onChange={(event) => { setPeriodFilter(event.target.value); setPage(1); }} aria-label="Filter batches by payroll period">
                  <option value="all">All periods</option>
                  {payrollBatchPeriods.map((period) => <option value={period} key={period}>{period}</option>)}
                </select>
              </label>
              <label>
                <span>Status</span>
                <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value as PayrollBatchRecord["status"] | "all"); setPage(1); }} aria-label="Filter batches by status">
                  <option value="all">All statuses</option>
                  <option value="Draft">Draft</option>
                  <option value="Ready">Ready</option>
                  <option value="Transferred">Transferred</option>
                  <option value="Blocked">Blocked</option>
                </select>
              </label>
              <label className="payroll-batches__search">
                <span>Search</span>
                <span className="payroll-batches__search-input"><Icon name="search" /><input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search batch ID or created by" aria-label="Search batch ID or created by" /></span>
              </label>
              <button type="button" className="button-secondary" onClick={resetFilters}>Clear</button>
            </div>
          </div>

          <p className="payroll-batches__result-meta" aria-live="polite">
            {filteredBatches.length ? `Showing ${firstVisibleBatch} to ${lastVisibleBatch} of ${filteredBatches.length} ${filteredBatches.length === 1 ? "batch" : "batches"}` : "No batches found"}
          </p>

          <PayrollBatchTable
            batches={pageBatches}
            onView={openDetails}
            onEdit={openEdit}
            onSubmit={openSubmit}
            onTransfer={(batch) => {
              setCurrentId(batch.id);
              setModal({ kind: "transfer", batchId: batch.id });
            }}
          />

          <footer className="payroll-batches__pagination">
            <span>Page {visiblePage} of {totalPages}</span>
            <nav aria-label="Payroll batch pages">
              <button type="button" className="payroll-batches__page-button" onClick={() => navigatePage(visiblePage - 1)} disabled={visiblePage === 1} aria-label="Previous page"><Icon name="chevron-left" /></button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <button type="button" className={`payroll-batches__page-button ${pageNumber === visiblePage ? "is-active" : ""}`} onClick={() => navigatePage(pageNumber)} aria-current={pageNumber === visiblePage ? "page" : undefined} key={pageNumber}>{pageNumber}</button>
              ))}
              <button type="button" className="payroll-batches__page-button" onClick={() => navigatePage(visiblePage + 1)} disabled={visiblePage === totalPages} aria-label="Next page"><Icon name="chevron-right" /></button>
            </nav>
          </footer>
        </section>

        <aside className="payroll-batches__side">
          <SectionCard title="Batch Attendance by Department" eyebrow="Batch summary">
            <p className="payroll-batches__panel-description payroll-batches__side-description">Breakdown of records in the current batch.</p>
            <div className="payroll-batches__summary-table-wrap">
              <table className="data-table payroll-batches__summary-table">
                <caption className="sr-only">Batch attendance by department</caption>
                <thead><tr><th scope="col">Department</th><th scope="col">Records</th><th scope="col">Status</th></tr></thead>
                <tbody>
                  {currentBatch
                    ? currentBreakdown.map((item) => (
                      <tr key={item.department}>
                        <td>{item.department}</td>
                        <td>{item.records}</td>
                        <td>
                          <StatusBadge tone={getPayrollBatchTone(currentBatch.status)}>
                            {getDepartmentStatus(currentBatch.status)}
                          </StatusBadge>
                        </td>
                      </tr>
                    ))
                    : null}
                  {currentBatch ? (
                    <tr className="payroll-batches__total-row">
                      <td>Total</td>
                      <td>{currentBatch.records}</td>
                      <td><StatusBadge tone={getPayrollBatchTone(currentBatch.status)}>{currentBatch.status}</StatusBadge></td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard title="Batch Actions" eyebrow="Current working batch">
            <div className="payroll-batches__side-actions">
              <button
                type="button"
                className="button-secondary"
                onClick={() => currentBatch && openRecords(currentBatch)}
                disabled={!currentBatch}
              >
                <Icon name="file" /> View records
              </button>
              <button
                type="button"
                className="button-secondary"
                onClick={() => currentBatch && openEdit(currentBatch)}
                disabled={!currentBatch || currentBatch.status === "Transferred"}
              >
                <Icon name="settings" /> Edit batch
              </button>
              <button
                type="button"
                className="button-primary"
                onClick={() => currentBatch && openSubmit(currentBatch)}
                disabled={!currentBatch || currentBatch.status === "Transferred" || currentBatch.status === "Blocked"}
              >
                <Icon name="arrow" /> Submit to payroll
              </button>
            </div>
          </SectionCard>
        </aside>
      </div>

      <p className="payroll-batches__boundary-note"><Icon name="shield" /> Payroll Staff can prepare and review batch groupings here. Submission is represented as local prototype feedback; authoritative payroll handoff and financial processing remain outside this workspace.</p>
      <span className="sr-only" aria-live="polite">{feedback}</span>

      <PayrollBatchDetailsModal
        batch={modalBatch}
        mode={detailsMode}
        onClose={() => setModal(null)}
      />
      {modal?.kind === "create" ? (
        <PayrollBatchFormModal
          mode="create"
          batch={null}
          periods={payrollBatchPeriods}
          getNextBatchId={getNextBatchId}
          onCancel={() => setModal(null)}
          onSubmit={handleCreate}
        />
      ) : null}
      {modal?.kind === "edit" ? (
        <PayrollBatchFormModal
          mode="edit"
          batch={modalBatch}
          periods={payrollBatchPeriods}
          getNextBatchId={getNextBatchId}
          onCancel={() => setModal(null)}
          onSubmit={handleEdit}
        />
      ) : null}
      {modal?.kind === "submit" ? (
        <PayrollBatchSubmitModal
          batch={modalBatch}
          onCancel={() => setModal(null)}
          onConfirm={confirmSubmit}
        />
      ) : null}
    </div>
  );
}

function getDepartmentStatus(status: PayrollBatchRecord["status"]) {
  if (status === "Blocked") return "Blocked";
  if (status === "Transferred") return "Transferred";
  return "Ready";
}
