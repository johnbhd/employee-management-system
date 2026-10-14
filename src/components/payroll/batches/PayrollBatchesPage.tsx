"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { Icon } from "@/components/ui/Icon";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SummaryCard } from "@/components/ui/SummaryCard";
import type { ApiResponse } from "@/types/api/responses";
import type { Metric } from "@/types/ui";
import type { PayrollBatchRecord, PayrollBatchesData } from "@/types/payroll-batches";

import { PayrollBatchDetailsModal, type PayrollBatchDetailsMode } from "./PayrollBatchDetailsModal";
import { PayrollBatchFormModal, type PayrollBatchFormValues } from "./PayrollBatchFormModal";
import { PayrollBatchRecordsModal } from "./PayrollBatchRecordsModal";
import { getPayrollBatchTone, PayrollBatchTable } from "./PayrollBatchTable";

type Props = { initialData: PayrollBatchesData; loadError?: boolean };
type ModalState = { kind: "create" | "add" | "details" | "records"; batchId?: string } | null;
type BatchesApiResponse = ApiResponse<PayrollBatchesData>;

const pageSize = 5;

function getErrorMessage(status: number, body: ApiResponse<unknown>) {
  if (status === 401) return "Your Payroll session has expired. Sign in again.";
  if (status === 403) return "You do not have permission to manage payroll batches.";
  return body.success ? "Payroll batch data could not be loaded." : body.error.message;
}

function getSummaryMetrics(data: PayrollBatchesData, unavailable: boolean): Metric[] {
  if (unavailable) return [
    { label: "Draft batches", value: "—", note: "Unavailable", icon: "file", tone: "info" },
    { label: "Ready to submit", value: "—", note: "Unavailable", icon: "check", tone: "success" },
    { label: "Submitted", value: "—", note: "Unavailable", icon: "arrow", tone: "success" },
    { label: "Blocked batches", value: "—", note: "Unavailable", icon: "warning", tone: "warning" },
    { label: "Blocked records", value: "—", note: "Unavailable", icon: "warning", tone: "danger" },
  ];

  return [
    { label: "Draft batches", value: String(data.summary.draftBatches), note: "In preparation", icon: "file", tone: "info" },
    { label: "Ready to submit", value: String(data.summary.readyBatches), note: "Prepared for handoff", icon: "check", tone: "success" },
    { label: "Submitted", value: String(data.summary.submittedBatches), note: "Read-only snapshots", icon: "arrow", tone: "success" },
    { label: "Blocked batches", value: String(data.summary.blockedBatches), note: "Requires follow-up", icon: "warning", tone: "warning" },
    { label: "Blocked records", value: String(data.summary.blockedRecords), note: "Excluded by readiness", icon: "warning", tone: "danger" },
  ];
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date(value));
}

export function PayrollBatchesPage({ initialData, loadError = false }: Props) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [error, setError] = useState(loadError ? "Payroll batches could not be loaded." : null);
  const [isBusy, setIsBusy] = useState(false);
  const [currentId, setCurrentId] = useState(initialData.batches[0]?.id ?? "");
  const [page, setPage] = useState(1);
  const [periodFilter, setPeriodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<PayrollBatchRecord["status"] | "all">("all");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalState>(null);
  const [feedback, setFeedback] = useState("");

  const currentBatch = data.batches.find((batch) => batch.id === currentId) ?? data.batches[0] ?? null;
  const filteredBatches = useMemo(() => {
    const query = search.trim().toLowerCase();
    return data.batches.filter((batch) => (
      (periodFilter === "all" || batch.period.start === periodFilter)
      && (statusFilter === "all" || batch.status === statusFilter)
      && (!query || batch.id.toLowerCase().includes(query) || batch.createdBy.displayName.toLowerCase().includes(query))
    ));
  }, [data.batches, periodFilter, search, statusFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredBatches.length / pageSize));
  const visiblePage = Math.min(page, totalPages);
  const pageBatches = filteredBatches.slice((visiblePage - 1) * pageSize, visiblePage * pageSize);
  const modalBatch = modal?.batchId ? data.batches.find((batch) => batch.id === modal.batchId) ?? null : null;
  const detailsMode: PayrollBatchDetailsMode | null = modal?.kind === "details" || modal?.kind === "records" ? modal.kind : null;
  const currentBreakdown = currentBatch ? getBreakdown(currentBatch) : [];
  const periodOptions = Array.from(new Map([
    [data.period.start, data.period],
    ...data.batches.map((batch) => [batch.period.start, batch.period] as const),
  ]).values());

  function showFeedback(message: string) {
    setFeedback(message);
    window.setTimeout(() => setFeedback(""), 3200);
  }

  async function loadData(period = data.period) {
    try {
      const params = new URLSearchParams({ periodStart: period.start, periodEnd: period.end });
      const response = await fetch(`/api/payroll/batches?${params.toString()}`, { cache: "no-store", headers: { Accept: "application/json" } });
      const body = await response.json() as BatchesApiResponse;
      if (!response.ok || !body.success) throw new Error(getErrorMessage(response.status, body));
      setData(body.data);
      setError(null);
      return body.data;
    } catch (loadErrorValue) {
      setError(loadErrorValue instanceof Error ? loadErrorValue.message : "Payroll batches could not be loaded.");
      return null;
    }
  }

  async function request<T>(url: string, init: RequestInit) {
    const response = await fetch(url, { ...init, headers: { Accept: "application/json", "Content-Type": "application/json" } });
    const body = await response.json() as ApiResponse<T>;
    if (!response.ok || !body.success) throw new Error(getErrorMessage(response.status, body));
    return body.data;
  }

  async function handleCreate(values: PayrollBatchFormValues) {
    setIsBusy(true);
    try {
      const batch = await request<PayrollBatchRecord>("/api/payroll/batches", { method: "POST", body: JSON.stringify(values) });
      setCurrentId(batch.id);
      setModal(null);
      await loadData(batch.period);
      showFeedback(`${batch.id} was created as a persistent Draft batch.`);
    } catch (createError) {
      showFeedback(createError instanceof Error ? createError.message : "The batch could not be created.");
    } finally { setIsBusy(false); }
  }

  async function handleAdd(employeePeriodIds: string[]) {
    if (!modalBatch) return;
    setIsBusy(true);
    try {
      for (const employeePeriodId of employeePeriodIds) {
      await request<PayrollBatchRecord>(`/api/payroll/batches/${encodeURIComponent(modalBatch.id)}/items`, { method: "POST", body: JSON.stringify({ employeePeriodId }) });
      }
      setModal(null);
      await loadData(modalBatch.period);
      showFeedback(`${employeePeriodIds.length} record${employeePeriodIds.length === 1 ? "" : "s"} added to ${modalBatch.id}.`);
    } catch (addError) {
      await loadData(modalBatch.period);
      showFeedback(addError instanceof Error ? addError.message : "One or more records could not be added.");
    } finally { setIsBusy(false); }
  }

  async function handleRemove(employeePeriodId: string) {
    if (!modalBatch) return;
    setIsBusy(true);
    try {
      await request<PayrollBatchRecord>(`/api/payroll/batches/${encodeURIComponent(modalBatch.id)}/items/${encodeURIComponent(employeePeriodId)}`, { method: "DELETE" });
      await loadData(modalBatch.period);
      showFeedback("The record was removed from the Draft batch.");
    } catch (removeError) { showFeedback(removeError instanceof Error ? removeError.message : "The record could not be removed."); }
    finally { setIsBusy(false); }
  }

  async function changeStatus(batch: PayrollBatchRecord) {
    setIsBusy(true);
    try {
      await request<PayrollBatchRecord>(`/api/payroll/batches/${encodeURIComponent(batch.id)}`, { method: "PATCH", body: JSON.stringify({ status: "Ready" }) });
      setModal(null);
      await loadData(data.period);
      showFeedback(`${batch.id} is ready for payroll handoff.`);
    } catch (statusError) { showFeedback(statusError instanceof Error ? statusError.message : "The batch status could not be changed."); }
    finally { setIsBusy(false); }
  }

  async function openAddRecords(batch: PayrollBatchRecord) {
    setCurrentId(batch.id);
    if (data.period.start !== batch.period.start || data.period.end !== batch.period.end) await loadData(batch.period);
    setModal({ kind: "add", batchId: batch.id });
  }

  const summaryMetrics = getSummaryMetrics(data, Boolean(error));
  const firstVisible = filteredBatches.length === 0 ? 0 : (visiblePage - 1) * pageSize + 1;
  const lastVisible = Math.min(visiblePage * pageSize, filteredBatches.length);

  return (
    <div className="payroll-batches" aria-busy={isBusy}>
      <AdminPageHeader eyebrow="Payroll preparation" title="Payroll Batches" description="Create persistent payroll batches from HR-verified, Ready for Payroll attendance snapshots." actions={<div className="payroll-batches__header-actions"><button type="button" className="button-primary" onClick={() => setModal({ kind: "create" })} disabled={isBusy}><Icon name="layers" /> Create batch</button><button type="button" className="button-secondary" onClick={() => void loadData()} disabled={isBusy}><Icon name="refresh" /> Refresh data</button></div>} />
      {error ? <p className="payroll-batches__data-error" role="alert">{error} Use Refresh data to try again.</p> : null}
      <p className="payroll-batches__period"><Icon name="calendar" /> Selected source period: {data.period.label}</p>
      <div className="metric-grid payroll-batches__summary">{summaryMetrics.map((metric) => <SummaryCard key={metric.label} {...metric} />)}</div>

      {currentBatch ? <section className="dashboard-card payroll-batches__current-card" aria-labelledby="payroll-current-batch-heading"><div className="panel-header"><div><p className="section-kicker">Current working batch</p><div className="payroll-batches__title-row"><h2 id="payroll-current-batch-heading">{currentBatch.id}</h2><StatusBadge tone={getPayrollBatchTone(currentBatch.status)}>{currentBatch.status}</StatusBadge></div><p className="payroll-batches__panel-description">Review the persisted employee snapshots before advancing this batch.</p></div><div className="payroll-batches__panel-actions"><button type="button" className="button-secondary" onClick={() => setModal({ kind: "details", batchId: currentBatch.id })}><Icon name="file" /> View details</button><button type="button" className="button-secondary" onClick={() => void openAddRecords(currentBatch)} disabled={isBusy || currentBatch.status !== "Draft"}><Icon name="layers" /> Add records</button>{currentBatch.status === "Draft" ? <button type="button" className="button-secondary" onClick={() => void changeStatus(currentBatch)} disabled={isBusy || currentBatch.recordCount === 0}><Icon name="check" /> Mark Ready</button> : null}{currentBatch.status === "Ready" ? <Link className="button-primary" href={`/payroll/handoff?batchId=${encodeURIComponent(currentBatch.id)}`}><Icon name="arrow" /> Open handoff</Link> : null}</div></div><div className="payroll-batches__current-info"><div><Icon name="calendar" /><span><small>Payroll period</small><strong>{currentBatch.period.label}</strong></span></div><div><Icon name="users" /><span><small>Included records</small><strong>{currentBatch.recordCount}</strong></span></div><div><Icon name="building" /><span><small>Departments</small><strong>{currentBatch.departmentNames.length}</strong></span></div><div><Icon name="user" /><span><small>Created by</small><strong>{currentBatch.createdBy.displayName}</strong></span></div><div><Icon name="clock" /><span><small>Created at</small><strong>{formatDate(currentBatch.createdAt)}</strong></span></div></div></section> : <section className="dashboard-card payroll-batches__current-card"><div className="payroll-batches__empty"><strong>No persistent batches yet.</strong><span>Create a Draft batch to begin preparing a payroll handoff.</span></div></section>}

      <div className="payroll-batches__layout"><section className="dashboard-card payroll-batches__list-card" aria-labelledby="payroll-batch-list-heading"><div className="panel-header payroll-batches__list-header"><div><p className="section-kicker">Persistent batch list</p><h2 id="payroll-batch-list-heading">All Payroll Batches</h2><p className="payroll-batches__panel-description">Counts and statuses reflect saved batch records. Submitted snapshots cannot be edited.</p></div><div className="payroll-batches__filters"><label><span>Payroll period</span><select value={periodFilter} onChange={(event) => { setPeriodFilter(event.target.value); setPage(1); }} aria-label="Filter batches by payroll period"><option value="all">All periods</option>{periodOptions.map((period) => <option value={period.start} key={period.start}>{period.label}</option>)}</select></label><label><span>Status</span><select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value as PayrollBatchRecord["status"] | "all"); setPage(1); }} aria-label="Filter batches by status"><option value="all">All statuses</option>{["Draft", "Ready", "Submitted", "Acknowledged", "Blocked", "Failed"].map((status) => <option value={status} key={status}>{status}</option>)}</select></label><label className="payroll-batches__search"><span>Search</span><span className="payroll-batches__search-input"><Icon name="search" /><input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search batch ID or created by" aria-label="Search batch ID or created by" /></span></label><button type="button" className="button-secondary" onClick={() => { setPeriodFilter("all"); setStatusFilter("all"); setSearch(""); setPage(1); }}>Clear</button></div></div><p className="payroll-batches__result-meta" aria-live="polite">{filteredBatches.length ? `Showing ${firstVisible} to ${lastVisible} of ${filteredBatches.length} batches` : "No batches found"}</p><PayrollBatchTable batches={pageBatches} onView={(batch) => { setCurrentId(batch.id); setModal({ kind: "details", batchId: batch.id }); }} onRecords={(batch) => { setCurrentId(batch.id); setModal({ kind: "records", batchId: batch.id }); }} onReady={(batch) => void changeStatus(batch)} onHandoff={(batch) => router.push(`/payroll/handoff?batchId=${encodeURIComponent(batch.id)}`)} /><footer className="payroll-batches__pagination"><span>Page {visiblePage} of {totalPages}</span><nav aria-label="Payroll batch pages"><button type="button" className="payroll-batches__page-button" onClick={() => setPage(Math.max(1, visiblePage - 1))} disabled={visiblePage === 1} aria-label="Previous page"><Icon name="chevron-left" /></button>{Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => <button type="button" className={`payroll-batches__page-button ${pageNumber === visiblePage ? "is-active" : ""}`} onClick={() => setPage(pageNumber)} aria-current={pageNumber === visiblePage ? "page" : undefined} key={pageNumber}>{pageNumber}</button>)}<button type="button" className="payroll-batches__page-button" onClick={() => setPage(Math.min(totalPages, visiblePage + 1))} disabled={visiblePage === totalPages} aria-label="Next page"><Icon name="chevron-right" /></button></nav></footer></section>
        <aside className="payroll-batches__side"><SectionCard title="Batch Attendance by Department" eyebrow="Snapshot summary"><p className="payroll-batches__panel-description payroll-batches__side-description">Breakdown of records in the current batch.</p><div className="payroll-batches__summary-table-wrap"><table className="data-table payroll-batches__summary-table"><caption className="sr-only">Batch attendance by department</caption><thead><tr><th scope="col">Department</th><th scope="col">Records</th><th scope="col">Status</th></tr></thead><tbody>{currentBatch ? currentBreakdown.map((item) => <tr key={item.department}><td>{item.department}</td><td>{item.records}</td><td><StatusBadge tone={getPayrollBatchTone(currentBatch.status)}>{currentBatch.status}</StatusBadge></td></tr>) : null}{currentBatch ? <tr className="payroll-batches__total-row"><td>Total</td><td>{currentBatch.recordCount}</td><td><StatusBadge tone={getPayrollBatchTone(currentBatch.status)}>{currentBatch.status}</StatusBadge></td></tr> : null}</tbody></table></div></SectionCard><SectionCard title="Batch Actions" eyebrow="Current working batch"><div className="payroll-batches__side-actions"><button type="button" className="button-secondary" onClick={() => currentBatch && setModal({ kind: "records", batchId: currentBatch.id })} disabled={!currentBatch}><Icon name="file" /> View records</button><button type="button" className="button-secondary" onClick={() => currentBatch && void openAddRecords(currentBatch)} disabled={!currentBatch || isBusy || currentBatch.status !== "Draft"}><Icon name="layers" /> Add records</button>{currentBatch?.status === "Draft" ? <button type="button" className="button-secondary" onClick={() => void changeStatus(currentBatch)} disabled={isBusy || currentBatch.recordCount === 0}><Icon name="check" /> Mark Ready</button> : null}{currentBatch?.status === "Ready" ? <Link className="button-primary" href={`/payroll/handoff?batchId=${encodeURIComponent(currentBatch.id)}`}><Icon name="arrow" /> Open handoff</Link> : null}</div></SectionCard></aside>
      </div>

      <span className="sr-only" aria-live="polite">{feedback}</span>
      <PayrollBatchDetailsModal batch={modalBatch} mode={detailsMode} onClose={() => setModal(null)} onRemove={(employeePeriodId) => void handleRemove(employeePeriodId)} isBusy={isBusy} />
      {modal?.kind === "create" ? <PayrollBatchFormModal defaultPeriod={data.period} onCancel={() => setModal(null)} onSubmit={(values) => void handleCreate(values)} isBusy={isBusy} /> : null}
      {modal?.kind === "add" ? <PayrollBatchRecordsModal key={modalBatch?.id} batch={modalBatch} candidates={data.availableRecords} onCancel={() => setModal(null)} onAdd={(ids) => void handleAdd(ids)} isBusy={isBusy} /> : null}
    </div>
  );
}

function getBreakdown(batch: PayrollBatchRecord) {
  const counts = new Map<string, number>();
  batch.includedRecords.forEach((record) => counts.set(record.department, (counts.get(record.department) ?? 0) + 1));
  return Array.from(counts, ([department, records]) => ({ department, records })).sort((left, right) => left.department.localeCompare(right.department));
}
