"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { Icon } from "@/components/ui/Icon";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SummaryCard } from "@/components/ui/SummaryCard";
import { apiRequest } from "@/lib/api/client";
import type { ApiSuccessResponse } from "@/types/api/responses";
import type { AdminIntegrationMonitoringData } from "@/types/admin-integration-monitoring";
import type { Metric, StatusTone } from "@/types/ui";
import type {
  UnifiedAttendanceBusinessStatus,
  UnifiedAttendanceTechnicalState,
  UnifiedAttendanceView,
} from "@/types/unified-attendance";
import type {
  UnifiedAttendanceProcessingItemView,
  UnifiedAttendanceProcessingRunView,
} from "@/types/unified-attendance-processing";

type RecordListData = {
  items: UnifiedAttendanceView[];
  page: number;
  pageSize: number;
  total: number;
  hasNext: boolean;
  reviewCount: number;
};

type RunListData = {
  items: UnifiedAttendanceProcessingRunView[];
  page: number;
  pageSize: number;
  total: number;
};

type RunItemsData = {
  items: UnifiedAttendanceProcessingItemView[];
  page: number;
  pageSize: number;
  total: number;
};

type Props = {
  initialMonitoring: AdminIntegrationMonitoringData | null;
  initialRecords: RecordListData | null;
  initialRuns: RunListData | null;
  initialReviewCount: number | null;
  initialLoadError: boolean;
  canProcess: boolean;
};

type Confirmation = "process" | "reprocess" | "retry" | null;

const technicalOptions: Array<[UnifiedAttendanceTechnicalState, string]> = [
  ["NO_EVENTS", "No events"],
  ["IN_PROGRESS", "In progress"],
  ["COMPLETE", "Complete"],
  ["MISSING_IN", "Missing IN"],
  ["MISSING_OUT", "Missing OUT"],
  ["NEEDS_REVIEW", "Needs review"],
];

const businessOptions: Array<[UnifiedAttendanceBusinessStatus, string]> = [
  ["UNCLASSIFIED", "Unclassified"],
  ["PRESENT", "Present"],
  ["LATE", "Late"],
  ["ABSENT", "Absent"],
];

function formatDate(value: string | null) {
  if (!value) return "Not recorded";
  const date = new Date(value.includes("T") ? value : `${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: value.includes("T") ? "short" : undefined }).format(date);
}

function formatTime(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-PH", { timeStyle: "short" }).format(date);
}

function readable(value: string | null | undefined) {
  if (!value) return "—";
  return value.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function toneForStatus(status: string | null | undefined): StatusTone {
  if (status === "COMPLETED" || status === "COMPLETE" || status === "PRESENT" || status === "healthy") return "success";
  if (status === "FAILED" || status === "MISSING_IN" || status === "MISSING_OUT" || status === "ABSENT" || status === "failed") return "danger";
  if (status === "COMPLETED_WITH_ERRORS" || status === "NEEDS_REVIEW" || status === "LATE" || status === "degraded") return "warning";
  if (status === "PROCESSING" || status === "PENDING" || status === "IN_PROGRESS") return "info";
  return "muted";
}

function sourceLabel(source: string | null) {
  return source === "BUNDY" ? "Bundy" : source === "QR" ? "QR" : "—";
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "The request could not be completed.";
}

function getQrSnapshot(value: UnifiedAttendanceView["sourceMetadata"]) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const qr = (value as Record<string, unknown>).qrEvidence;
  if (!qr || typeof qr !== "object" || Array.isArray(qr)) return null;
  return qr as Record<string, unknown>;
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return <div className="unified-detail-row"><dt>{label}</dt><dd>{children}</dd></div>;
}

function RecordDetails({ record, onClose }: { record: UnifiedAttendanceView; onClose: () => void }) {
  const qr = getQrSnapshot(record.sourceMetadata);
  const evidence = record.bundyEvidence;
  const qrEntries = qr ? Object.entries(qr).filter(([, value]) => value !== null && value !== undefined) : [];

  return (
    <div className="unified-modal-layer" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <aside className="unified-detail-drawer" role="dialog" aria-modal="true" aria-labelledby="unified-record-details-title">
        <div className="unified-detail-header">
          <div>
            <p className="section-kicker">Read-only canonical record</p>
            <h2 id="unified-record-details-title">Attendance details</h2>
            <p>{record.employee.displayName} · {record.employee.employeeId}</p>
          </div>
          <button type="button" className="unified-icon-button" onClick={onClose} aria-label="Close attendance details" autoFocus><Icon name="close" /></button>
        </div>
        <div className="unified-detail-content">
          <section className="unified-detail-section" aria-labelledby="unified-record-summary-title">
            <h3 id="unified-record-summary-title">Record summary</h3>
            <dl className="unified-detail-list">
              <DetailRow label="Employee" >{record.employee.displayName}</DetailRow>
              <DetailRow label="Employee ID">{record.employee.employeeId}</DetailRow>
              <DetailRow label="Department">{record.employee.department || "—"}</DetailRow>
              <DetailRow label="Attendance date">{formatDate(record.attendanceDate)}</DetailRow>
              <DetailRow label="Technical state"><StatusBadge tone={toneForStatus(record.technicalState)}>{readable(record.technicalState)}</StatusBadge></DetailRow>
              <DetailRow label="Attendance state"><StatusBadge tone={toneForStatus(record.businessStatus)}>{readable(record.businessStatus)}</StatusBadge></DetailRow>
              <DetailRow label="Review status">{record.requiresReview ? <StatusBadge tone="warning">Needs HR review</StatusBadge> : "No review flag"}</DetailRow>
              <DetailRow label="Review reason">{readable(record.reviewReasonCode)}</DetailRow>
            </dl>
          </section>
          <section className="unified-detail-section" aria-labelledby="unified-record-schedule-title">
            <h3 id="unified-record-schedule-title">Schedule and processing</h3>
            <dl className="unified-detail-list">
              <DetailRow label="Schedule">{record.schedule?.shiftLabel || record.schedule?.scheduleId || "No schedule"}</DetailRow>
              <DetailRow label="Scheduled hours">{record.schedule ? `${record.schedule.workStart || "—"}–${record.schedule.workEnd || "—"}` : "—"}</DetailRow>
              <DetailRow label="First IN">{formatDate(record.firstInAt)} · {sourceLabel(record.firstInSource)}</DetailRow>
              <DetailRow label="Last OUT">{formatDate(record.lastOutAt)} · {sourceLabel(record.lastOutSource)}</DetailRow>
              <DetailRow label="Processed">{formatDate(record.processedAt)}</DetailRow>
              <DetailRow label="Processing version">{record.processingVersion || "—"}</DetailRow>
              <DetailRow label="Last reprocessed">{formatDate(record.lastReprocessedAt)}</DetailRow>
            </dl>
          </section>
          <section className="unified-detail-section" aria-labelledby="unified-evidence-title">
            <h3 id="unified-evidence-title">Attendance evidence</h3>
            {evidence.length ? (
              <ol className="unified-evidence-list">
                {evidence.map((item) => (
                  <li key={item.id}>
                    <strong>{formatDate(item.occurredAt)}</strong>
                    <span>{item.event} · Bundy</span>
                    <small>Source log {item.sourceLogId} · Import {item.importId}</small>
                  </li>
                ))}
              </ol>
            ) : <p className="empty-state">No Bundy evidence is linked to this record.</p>}
            {qrEntries.length ? (
              <div className="unified-qr-snapshot">
                <h4>QR evidence snapshot</h4>
                <dl className="unified-detail-list">{qrEntries.map(([key, value]) => <DetailRow key={key} label={readable(key)}>{String(value)}</DetailRow>)}</dl>
              </div>
            ) : null}
          </section>
        </div>
        <div className="unified-detail-footer"><button type="button" className="button-secondary" onClick={onClose}>Close</button></div>
      </aside>
    </div>
  );
}

function ConfirmDialog({ kind, dateFrom, dateTo, busy, onConfirm, onClose }: { kind: Exclude<Confirmation, null>; dateFrom: string; dateTo: string; busy: boolean; onConfirm: () => void; onClose: () => void }) {
  const isRetry = kind === "retry";
  const title = isRetry ? "Retry failed processing" : kind === "reprocess" ? "Reprocess Unified Attendance" : "Process Unified Attendance";
  const description = isRetry
    ? "Retry only the failed items in this persisted run. Raw attendance evidence will not be changed."
    : kind === "reprocess"
      ? "This recalculates existing canonical AttendanceRecords for the selected date range using the latest available schedule and evidence."
      : "This processes eligible HRPS workdays using available Bundy Clock and QR evidence.";

  return (
    <div className="unified-modal-layer" role="presentation">
      <div className="unified-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="unified-confirm-title">
        <div className="unified-detail-header"><div><p className="section-kicker">Confirm technical action</p><h2 id="unified-confirm-title">{title}</h2></div><button type="button" className="unified-icon-button" onClick={onClose} aria-label="Close confirmation"><Icon name="close" /></button></div>
        <div className="unified-confirm-content">
          <p>{description}</p>
          {!isRetry ? <p><strong>Date range:</strong> {dateFrom} to {dateTo}</p> : null}
          <p className="notice"><Icon name="info" /> Raw Bundy and QR evidence remains read-only. HR review and Payroll decisions are outside this workspace.</p>
        </div>
        <div className="unified-detail-footer"><button type="button" className="button-secondary" onClick={onClose} disabled={busy}>Cancel</button><button type="button" className="button-primary" onClick={onConfirm} disabled={busy}>{busy ? "Working…" : isRetry ? "Retry Failed" : kind === "reprocess" ? "Start Reprocessing" : "Start Processing"}</button></div>
      </div>
    </div>
  );
}

export function UnifiedAttendancePage({ initialMonitoring, initialRecords, initialRuns, initialReviewCount, initialLoadError, canProcess }: Props) {
  const [monitoring, setMonitoring] = useState(initialMonitoring);
  const [records, setRecords] = useState(initialRecords);
  const [runs, setRuns] = useState(initialRuns);
  const [reviewCount, setReviewCount] = useState(initialReviewCount);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [technicalState, setTechnicalState] = useState("");
  const [businessStatus, setBusinessStatus] = useState("");
  const [requiresReview, setRequiresReview] = useState("");
  const [processingFrom, setProcessingFrom] = useState("");
  const [processingTo, setProcessingTo] = useState("");
  const [recordsPage, setRecordsPage] = useState(1);
  const [runsPage, setRunsPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(initialLoadError ? "Some Unified Attendance data could not be loaded. Refresh to try again." : "");
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<UnifiedAttendanceView | null>(null);
  const [selectedRun, setSelectedRun] = useState<UnifiedAttendanceProcessingRunView | null>(null);
  const [runItems, setRunItems] = useState<RunItemsData | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const unifiedStatus = monitoring?.integrations.find((item) => item.key === "unified-attendance") ?? null;
  const activeRun = useMemo(() => runs?.items.find((run) => run.status === "PENDING" || run.status === "PROCESSING") ?? null, [runs]);
  const recordsTotalPages = records ? Math.max(1, Math.ceil(records.total / records.pageSize)) : 1;
  const runsTotalPages = runs ? Math.max(1, Math.ceil(runs.total / runs.pageSize)) : 1;

  const loadRecords = useCallback(async (page = recordsPage) => {
    const params = new URLSearchParams({ page: String(page), pageSize: "25" });
    if (search.trim()) params.set("search", search.trim());
    if (fromDate) params.set("fromDate", fromDate);
    if (toDate) params.set("toDate", toDate);
    if (technicalState) params.set("technicalState", technicalState);
    if (businessStatus) params.set("businessStatus", businessStatus);
    if (requiresReview) params.set("requiresReview", requiresReview);
    const response = await apiRequest<ApiSuccessResponse<RecordListData>>(`/api/admin/unified-attendance/records?${params}`);
    setRecords(response.data);
    setReviewCount(response.data.reviewCount);
  }, [businessStatus, fromDate, recordsPage, requiresReview, search, technicalState, toDate]);

  const loadRuns = useCallback(async (page = runsPage) => {
    const response = await apiRequest<ApiSuccessResponse<RunListData>>(`/api/admin/unified-attendance/runs?page=${page}&pageSize=10`);
    setRuns(response.data);
  }, [runsPage]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError("");
    try {
      const [monitoringResponse] = await Promise.all([
        apiRequest<ApiSuccessResponse<AdminIntegrationMonitoringData>>("/api/admin/integration-monitoring"),
        loadRecords(recordsPage),
        loadRuns(runsPage),
      ]);
      setMonitoring(monitoringResponse.data);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setRefreshing(false);
    }
  }, [loadRecords, loadRuns, recordsPage, runsPage]);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setConfirmation(null);
        setSelectedRecord(null);
        setSelectedRun(null);
      }
    }
    if (confirmation || selectedRecord || selectedRun) {
      window.addEventListener("keydown", closeOnEscape);
      return () => window.removeEventListener("keydown", closeOnEscape);
    }
  }, [confirmation, selectedRecord, selectedRun]);

  async function openRecord(id: string) {
    setDetailsLoading(true);
    setError("");
    try {
      const response = await apiRequest<ApiSuccessResponse<UnifiedAttendanceView>>(`/api/admin/unified-attendance/records/${encodeURIComponent(id)}`);
      setSelectedRecord(response.data);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setDetailsLoading(false);
    }
  }

  async function openRun(run: UnifiedAttendanceProcessingRunView) {
    setDetailsLoading(true);
    setError("");
    try {
      const [runResponse, itemsResponse] = await Promise.all([
        apiRequest<ApiSuccessResponse<{ run: UnifiedAttendanceProcessingRunView }>>(`/api/admin/unified-attendance/runs/${encodeURIComponent(run.id)}`),
        apiRequest<ApiSuccessResponse<RunItemsData>>(`/api/admin/unified-attendance/runs/${encodeURIComponent(run.id)}/items?page=1&pageSize=50`),
      ]);
      setSelectedRun(runResponse.data.run);
      setRunItems(itemsResponse.data);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setDetailsLoading(false);
    }
  }

  async function submitAction() {
    if (!confirmation) return;
    if (confirmation !== "retry" && (!processingFrom || !processingTo || processingFrom > processingTo)) {
      setError("Choose a valid date range before starting attendance processing.");
      setConfirmation(null);
      return;
    }
    setActionBusy(true);
    setError("");
    try {
      if (confirmation === "retry" && selectedRun) {
        await apiRequest<ApiSuccessResponse<unknown>>(`/api/admin/unified-attendance/runs/${encodeURIComponent(selectedRun.id)}/retry-failed`, { method: "POST" });
      } else {
        await apiRequest<ApiSuccessResponse<unknown>>(`/api/admin/unified-attendance/${confirmation === "reprocess" ? "reprocess" : "runs"}`, {
          method: "POST",
          body: JSON.stringify({ dateFrom: processingFrom, dateTo: processingTo }),
        });
      }
      setConfirmation(null);
      setSelectedRun(null);
      setRunItems(null);
      await refresh();
    } catch (actionError) {
      setError(errorMessage(actionError));
    } finally {
      setActionBusy(false);
    }
  }

  function clearFilters() {
    setSearch("");
    setFromDate("");
    setToDate("");
    setTechnicalState("");
    setBusinessStatus("");
    setRequiresReview("");
    setRecordsPage(1);
  }

  const metrics: Metric[] = [
    { label: "Processing health", value: unifiedStatus ? readable(unifiedStatus.health) : "Unknown", note: unifiedStatus?.mode === "real" ? "Persisted processing boundary" : "No confirmed run state", icon: "activity", tone: toneForStatus(unifiedStatus?.health) },
    { label: "Last successful run", value: unifiedStatus?.lastSuccessfulAt ? formatDate(unifiedStatus.lastSuccessfulAt) : "Not recorded", note: "From completed processing history", icon: "check", tone: "success" },
    { label: "Pending operations", value: String(unifiedStatus?.pendingCount ?? monitoring?.summary.pendingOperations ?? "—"), note: "Pending or processing items", icon: "clock", tone: "info" },
    { label: "Technical issues", value: String(unifiedStatus?.issueCount ?? "—"), note: "Failed processing work", icon: "warning", tone: (unifiedStatus?.issueCount ?? 0) > 0 ? "danger" : "success" },
    { label: "Needs HR review", value: reviewCount === null ? "—" : String(reviewCount), note: "Read-only handoff to HR", icon: "users", tone: reviewCount ? "warning" : "success" },
  ];

  return (
    <main className="admin-page unified-attendance-page">
      <AdminPageHeader eyebrow="Admin · Technical workspace" title="Unified Attendance" description="Process and monitor HRPS-backed attendance using Bundy Clock and QR evidence. Technical processing does not perform HR final verification or Payroll decisions." actions={<button type="button" className="button-secondary" onClick={refresh} disabled={refreshing} aria-busy={refreshing}><Icon name="refresh" />{refreshing ? "Refreshing…" : "Refresh"}</button>} />
      {error ? <div className="notice notice-error" role="alert"><Icon name="warning" /><span>{error}</span></div> : null}
      <div className="metric-grid admin-five-card-metrics">{metrics.map((metric) => <SummaryCard key={metric.label} {...metric} />)}</div>

      <SectionCard title="Processing controls" eyebrow="Technical action">
        <div className="unified-controls-body">
          <div className="filter-toolbar unified-processing-fields">
            <label className="field"><span>Date from</span><input type="date" value={processingFrom} onChange={(event) => setProcessingFrom(event.target.value)} /></label>
            <label className="field"><span>Date to</span><input type="date" value={processingTo} onChange={(event) => setProcessingTo(event.target.value)} /></label>
            <div className="unified-control-actions"><button type="button" className="button-primary" onClick={() => setConfirmation("process")} disabled={!canProcess}><Icon name="activity" />Process Attendance</button><button type="button" className="button-secondary" onClick={() => setConfirmation("reprocess")} disabled={!canProcess}><Icon name="refresh" />Reprocess Attendance</button></div>
          </div>
          <p className="data-flow-note"><Icon name="info" />Processing creates or updates canonical AttendanceRecords through the server boundary. Raw Bundy/QR evidence is not edited here, and review decisions remain with HR.</p>
          {!canProcess ? <p className="page-feedback">Your account can view this workspace but does not have permission to start or retry processing.</p> : null}
        </div>
      </SectionCard>

      <SectionCard title="Active processing" eyebrow="Persisted run state">
        <div className="panel-body">{activeRun ? <ActiveRun run={activeRun} /> : <p className="empty-state">No processing run is currently active.</p>}</div>
      </SectionCard>

      <SectionCard title="Unified Attendance records" eyebrow="Canonical records">
        <div className="filter-toolbar unified-record-filters">
          <label className="field"><span>Search employee</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name or employee ID" /></label>
          <label className="field"><span>Date from</span><input type="date" value={fromDate} onChange={(event) => { setFromDate(event.target.value); setRecordsPage(1); }} /></label>
          <label className="field"><span>Date to</span><input type="date" value={toDate} onChange={(event) => { setToDate(event.target.value); setRecordsPage(1); }} /></label>
          <label className="field"><span>Technical state</span><select value={technicalState} onChange={(event) => { setTechnicalState(event.target.value); setRecordsPage(1); }}><option value="">All states</option>{technicalOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="field"><span>Attendance state</span><select value={businessStatus} onChange={(event) => { setBusinessStatus(event.target.value); setRecordsPage(1); }}><option value="">All states</option>{businessOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="field"><span>Review</span><select value={requiresReview} onChange={(event) => { setRequiresReview(event.target.value); setRecordsPage(1); }}><option value="">All records</option><option value="true">Needs HR review</option><option value="false">No review flag</option></select></label>
          <div className="unified-filter-actions"><button type="button" className="button-primary" onClick={() => { setRecordsPage(1); void loadRecords(1); }}>Apply filters</button><button type="button" className="button-link" onClick={clearFilters}>Clear filters</button></div>
        </div>
        {records?.items.length ? <RecordTable records={records.items} onView={openRecord} /> : <p className="empty-state">{records ? "No canonical AttendanceRecords match the selected filters." : "Attendance records are unavailable."}</p>}
        <Pagination page={records?.page ?? 1} totalPages={recordsTotalPages} total={records?.total ?? 0} onPrevious={() => { const page = Math.max(1, (records?.page ?? 1) - 1); setRecordsPage(page); void loadRecords(page); }} onNext={() => { const page = (records?.page ?? 1) + 1; setRecordsPage(page); void loadRecords(page); }} hasNext={records?.hasNext ?? false} />
      </SectionCard>

      <SectionCard title="Processing history" eyebrow="Persisted runs">
        {runs?.items.length ? <RunTable runs={runs.items} canProcess={canProcess} onView={openRun} onRetry={(run) => { setSelectedRun(run); setConfirmation("retry"); }} /> : <p className="empty-state">{runs ? "No processing runs have been recorded yet." : "Processing history is unavailable."}</p>}
        <Pagination page={runs?.page ?? 1} totalPages={runsTotalPages} total={runs?.total ?? 0} onPrevious={() => { const page = Math.max(1, (runs?.page ?? 1) - 1); setRunsPage(page); void loadRuns(page); }} onNext={() => { const page = (runs?.page ?? 1) + 1; setRunsPage(page); void loadRuns(page); }} hasNext={(runs?.page ?? 1) < runsTotalPages} />
      </SectionCard>

      {detailsLoading ? <div className="unified-loading-panel" role="status">Loading details…</div> : null}
      {selectedRecord ? <RecordDetails record={selectedRecord} onClose={() => setSelectedRecord(null)} /> : null}
      {selectedRun ? <RunDetails run={selectedRun} items={runItems} canProcess={canProcess} onClose={() => { setSelectedRun(null); setRunItems(null); }} onRetry={() => setConfirmation("retry")} /> : null}
      {confirmation ? <ConfirmDialog kind={confirmation} dateFrom={processingFrom} dateTo={processingTo} busy={actionBusy} onConfirm={() => void submitAction()} onClose={() => setConfirmation(null)} /> : null}
    </main>
  );
}

function ActiveRun({ run }: { run: UnifiedAttendanceProcessingRunView }) {
  const processed = run.completedItems + run.failedItems;
  const percentage = run.totalItems ? Math.min(100, Math.round((processed / run.totalItems) * 100)) : 0;
  return <div className="unified-active-run"><div className="unified-active-run-heading"><div><h3>{run.runType === "REPROCESS" ? "Reprocessing" : "Processing"} {run.dateFrom} to {run.dateTo}</h3><p>Started {formatDate(run.startedAt)} by {run.initiatedBy.displayName}</p></div><StatusBadge tone={toneForStatus(run.status)}>{readable(run.status)}</StatusBadge></div><div className="progress-line"><div><span>Processed items</span><strong>{processed} of {run.totalItems}</strong></div><progress value={processed} max={Math.max(run.totalItems, 1)} aria-label={`Processed ${processed} of ${run.totalItems} items`} /> <span className="sr-only">{percentage}% complete</span></div><div className="unified-counter-grid"><span><strong>{run.createdCount}</strong>Created</span><span><strong>{run.updatedCount}</strong>Updated</span><span><strong>{run.unchangedCount}</strong>Unchanged</span><span><strong>{run.needsReviewCount}</strong>Review needed</span><span><strong>{run.failedItems}</strong>Failed</span></div></div>;
}

function RecordTable({ records, onView }: { records: UnifiedAttendanceView[]; onView: (id: string) => void }) {
  return <div className="table-wrap"><table className="data-table unified-table"><caption className="sr-only">Canonical Unified Attendance records</caption><thead><tr><th scope="col">Employee</th><th scope="col">Date</th><th scope="col">Schedule</th><th scope="col">First IN</th><th scope="col">Last OUT</th><th scope="col">Sources</th><th scope="col">Technical</th><th scope="col">Attendance</th><th scope="col">Review</th><th scope="col">Actions</th></tr></thead><tbody>{records.map((record) => <tr key={record.id}><td><strong>{record.employee.displayName}</strong><small>{record.employee.employeeId} · {record.employee.department || "No department"}</small></td><td>{formatDate(record.attendanceDate)}</td><td>{record.schedule ? `${record.schedule.workStart || "—"}–${record.schedule.workEnd || "—"}` : "No schedule"}</td><td>{formatTime(record.firstInAt)}<small>{sourceLabel(record.firstInSource)}</small></td><td>{formatTime(record.lastOutAt)}<small>{sourceLabel(record.lastOutSource)}</small></td><td>{record.firstInSource || record.lastOutSource ? `${sourceLabel(record.firstInSource)} / ${sourceLabel(record.lastOutSource)}` : "—"}</td><td><StatusBadge tone={toneForStatus(record.technicalState)}>{readable(record.technicalState)}</StatusBadge></td><td><StatusBadge tone={toneForStatus(record.businessStatus)}>{readable(record.businessStatus)}</StatusBadge></td><td>{record.requiresReview ? <StatusBadge tone="warning">Needs review</StatusBadge> : <span className="muted-text">No</span>}</td><td><button type="button" className="button-link" onClick={() => onView(record.id)}>View details</button></td></tr>)}</tbody></table></div>;
}

function RunTable({ runs, canProcess, onView, onRetry }: { runs: UnifiedAttendanceProcessingRunView[]; canProcess: boolean; onView: (run: UnifiedAttendanceProcessingRunView) => void; onRetry: (run: UnifiedAttendanceProcessingRunView) => void }) {
  return <div className="table-wrap"><table className="data-table unified-table"><caption className="sr-only">Unified Attendance processing history</caption><thead><tr><th scope="col">Date range</th><th scope="col">Started</th><th scope="col">Started by</th><th scope="col">Progress</th><th scope="col">Results</th><th scope="col">Status</th><th scope="col">Actions</th></tr></thead><tbody>{runs.map((run) => <tr key={run.id}><td><strong>{run.dateFrom} to {run.dateTo}</strong><small>{run.runType === "REPROCESS" ? "Intentional reprocess" : "Normal processing"}</small></td><td>{formatDate(run.startedAt)}</td><td>{run.initiatedBy.displayName}</td><td>{run.completedItems + run.failedItems} / {run.totalItems}</td><td>{run.createdCount} created · {run.updatedCount} updated · {run.failedItems} failed</td><td><StatusBadge tone={toneForStatus(run.status)}>{readable(run.status)}</StatusBadge></td><td><div className="unified-row-actions"><button type="button" className="button-link" onClick={() => onView(run)}>View</button>{canProcess && run.failedItems > 0 ? <button type="button" className="button-link" onClick={() => onRetry(run)}>Retry failed</button> : null}</div></td></tr>)}</tbody></table></div>;
}

function RunDetails({ run, items, canProcess, onClose, onRetry }: { run: UnifiedAttendanceProcessingRunView; items: RunItemsData | null; canProcess: boolean; onClose: () => void; onRetry: () => void }) {
  return <div className="unified-modal-layer" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><aside className="unified-detail-drawer" role="dialog" aria-modal="true" aria-labelledby="unified-run-details-title"><div className="unified-detail-header"><div><p className="section-kicker">Persisted processing run</p><h2 id="unified-run-details-title">Run details</h2><p>{run.dateFrom} to {run.dateTo} · {run.runType === "REPROCESS" ? "Reprocess" : "Initial process"}</p></div><button type="button" className="unified-icon-button" onClick={onClose} aria-label="Close run details" autoFocus><Icon name="close" /></button></div><div className="unified-detail-content"><section className="unified-detail-section"><h3>Run summary</h3><dl className="unified-detail-list"><DetailRow label="Status"><StatusBadge tone={toneForStatus(run.status)}>{readable(run.status)}</StatusBadge></DetailRow><DetailRow label="Started by">{run.initiatedBy.displayName}</DetailRow><DetailRow label="Started">{formatDate(run.startedAt)}</DetailRow><DetailRow label="Completed">{formatDate(run.completedAt)}</DetailRow><DetailRow label="Items">{run.completedItems + run.failedItems} processed of {run.totalItems}</DetailRow><DetailRow label="Results">{run.createdCount} created · {run.updatedCount} updated · {run.unchangedCount} unchanged</DetailRow><DetailRow label="Review needed">{run.needsReviewCount}</DetailRow><DetailRow label="Failed">{run.failedItems}</DetailRow></dl>{run.errorSummary ? <p className="notice notice-error"><Icon name="warning" />{run.errorSummary}</p> : null}</section><section className="unified-detail-section"><div className="unified-section-heading"><h3>Run items</h3>{canProcess && run.failedItems > 0 ? <button type="button" className="button-secondary" onClick={onRetry}>Retry failed</button> : null}</div>{items?.items.length ? <div className="unified-run-items">{items.items.map((item) => <article key={item.id}><div><strong>{item.employeeName}</strong><small>{item.employeeId} · {item.attendanceDate}</small></div><StatusBadge tone={toneForStatus(item.status)}>{readable(item.status)}</StatusBadge>{item.errorMessage ? <p>{item.errorMessage}</p> : null}</article>)}</div> : <p className="empty-state">No run items are available.</p>}</section></div><div className="unified-detail-footer"><button type="button" className="button-secondary" onClick={onClose}>Close</button></div></aside></div>;
}

function Pagination({ page, totalPages, total, hasNext, onPrevious, onNext }: { page: number; totalPages: number; total: number; hasNext: boolean; onPrevious: () => void; onNext: () => void }) {
  return <div className="table-meta unified-pagination"><span>{total} total · Page {page} of {totalPages}</span><div><button type="button" className="button-secondary" onClick={onPrevious} disabled={page <= 1}>Previous</button><button type="button" className="button-secondary" onClick={onNext} disabled={!hasNext && page >= totalPages}>Next</button></div></div>;
}
