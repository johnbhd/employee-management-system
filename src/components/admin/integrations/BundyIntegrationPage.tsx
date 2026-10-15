"use client";

import { useCallback, useMemo, useState } from "react";

import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { Icon } from "@/components/ui/Icon";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SummaryCard } from "@/components/ui/SummaryCard";
import { apiRequest } from "@/lib/api/client";
import type { ApiSuccessResponse } from "@/types/api/responses";
import type {
  BundyImportHistoryData,
  BundyImportHistoryItem,
  BundyImportPreview,
  BundyImportResult,
  BundyPageData,
  BundyPreviewRow,
  BundyRawEventItem,
  BundyRollbackPreview,
  BundyRollbackResult,
} from "@/types/bundy-import";
import type { Metric, StatusTone } from "@/types/ui";

type BundyIntegrationPageProps = {
  initialData: BundyPageData | null;
  initialLoadError: boolean;
  canImport: boolean;
};

type ImportState = "idle" | "previewing" | "importing";
type PreviewFilter = "all" | "matched" | "unmatched" | "duplicate" | "invalid" | "IN" | "OUT";

function formatTimestamp(value: string | null) {
  if (!value) return "Not completed";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

function statusTone(status: string): StatusTone {
  if (["COMPLETED", "MATCHED", "VALID", "UNIQUE", "IMPORT"].includes(status)) return "success";
  if (["COMPLETED_WITH_ERRORS", "DUPLICATE_SCAN", "EMPLOYEE_INACTIVE"].includes(status)) return "warning";
  if (["FAILED", "ROLLBACK_FAILED", "INVALID", "SOURCE_CONFLICT"].includes(status)) return "danger";
  if (["UNMATCHED", "ALREADY_IMPORTED"].includes(status)) return "info";
  if (["ROLLING_BACK"].includes(status)) return "info";
  return "muted";
}

function getPreviewMetrics(preview: BundyImportPreview): Metric[] {
  return [
    { label: "Total events", value: String(preview.summary.totalRows), note: "Rows parsed from source file", icon: "bundy", tone: "info" },
    { label: "Matched", value: String(preview.summary.matchedCount), note: "Active HRPS Employee links", icon: "check", tone: "success" },
    { label: "Unmatched", value: String(preview.summary.unmatchedCount), note: "Retained without an Employee link", icon: "warning", tone: "warning" },
    { label: "Duplicate scans", value: String(preview.summary.duplicateScanCount), note: "Same ID, direction, device within 60 seconds", icon: "clock", tone: "warning" },
    { label: "Invalid", value: String(preview.summary.invalidCount), note: "Not eligible for raw persistence", icon: "warning", tone: "danger" },
    { label: "IN", value: String(preview.summary.inCount), note: "Canonical event direction", icon: "arrow", tone: "info" },
    { label: "OUT", value: String(preview.summary.outCount), note: "Canonical event direction", icon: "arrow", tone: "info" },
    { label: "Importable", value: String(preview.summary.importedCount), note: "Valid new raw events", icon: "check", tone: "success" },
  ];
}

function historyStatusTone(status: BundyImportHistoryItem["status"]): StatusTone {
  return statusTone(status);
}

function rowMatchesFilter(row: BundyPreviewRow, filter: PreviewFilter) {
  if (filter === "all") return true;
  if (filter === "matched") return row.matchStatus === "MATCHED" || row.matchStatus === "EMPLOYEE_INACTIVE";
  if (filter === "unmatched") return row.matchStatus === "UNMATCHED";
  if (filter === "duplicate") return row.duplicateStatus === "DUPLICATE_SCAN";
  if (filter === "invalid") return row.validationStatus === "INVALID";
  return row.event === filter;
}

function PaginationControls({
  page,
  pageSize,
  total,
  hasNext,
  label,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  hasNext: boolean;
  label: string;
  onPageChange: (page: number) => void;
}) {
  if (total <= pageSize && page === 1) return null;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <footer className="bundy-pagination">
      <span>Page {page} of {totalPages} · {total} {label}</span>
      <nav aria-label={`${label} pages`}>
        <button type="button" className="button-secondary" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1} aria-label={`Previous ${label} page`}>Previous</button>
        <button type="button" className="button-secondary" onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={!hasNext} aria-label={`Next ${label} page`}>Next</button>
      </nav>
    </footer>
  );
}

function PreviewTable({ rows, page, pageSize, onPageChange }: { rows: BundyPreviewRow[]; page: number; pageSize: number; onPageChange: (page: number) => void }) {
  if (!rows.length) return <p className="empty-state">No preview rows match this filter.</p>;

  const pageRows = rows.slice((page - 1) * pageSize, page * pageSize);
  const hasNext = page * pageSize < rows.length;

  return (
    <>
      <div className="table-scroll">
        <table className="data-table bundy-preview-table">
          <caption className="sr-only">Bundy CSV preview rows</caption>
          <thead>
            <tr>
            <th scope="col">Row</th>
            <th scope="col">Bundy log</th>
            <th scope="col">Employee ID</th>
            <th scope="col">Employee</th>
            <th scope="col">Timestamp</th>
            <th scope="col">Event</th>
            <th scope="col">Device</th>
            <th scope="col">Match</th>
            <th scope="col">Action / issues</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
            <tr key={`${row.rowNumber}-${row.bundyLogId ?? "invalid"}`}>
              <td>{row.rowNumber}</td>
              <td><strong>{row.bundyLogId ?? "—"}</strong></td>
              <td><strong>{row.deviceEmployeeId ?? "—"}</strong></td>
              <td>{row.employee?.displayName ?? "—"}</td>
              <td>{row.sourceTimestamp ?? "—"}</td>
              <td>{row.event ? <StatusBadge tone="info">{row.event}</StatusBadge> : "—"}</td>
              <td>{row.deviceId ?? "—"}<small className="bundy-cell-meta">{row.sourceBatch ?? "No source batch"}</small></td>
              <td><StatusBadge tone={statusTone(row.matchStatus ?? "INVALID")}>{row.matchStatus?.replaceAll("_", " ") ?? "INVALID"}</StatusBadge></td>
              <td>
                <StatusBadge tone={statusTone(row.importAction)}>{row.importAction.replaceAll("_", " ")}</StatusBadge>
                {row.anomalyCodes.length ? <small className="bundy-cell-meta">{row.anomalyCodes.join(", ")}</small> : null}
                {row.errors.length ? <ul className="bundy-row-messages is-error">{row.errors.map((error) => <li key={error}>{error}</li>)}</ul> : null}
                {row.warnings.length ? <ul className="bundy-row-messages">{row.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul> : null}
              </td>
            </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PaginationControls page={page} pageSize={pageSize} total={rows.length} hasNext={hasNext} label="preview rows" onPageChange={onPageChange} />
    </>
  );
}

function HistoryTable({ history, canRollback, onRollback, onPageChange }: { history: BundyImportHistoryData; canRollback: boolean; onRollback: (item: BundyImportHistoryItem) => void; onPageChange: (page: number) => void }) {
  if (!history.items.length) return <p className="empty-state">No Bundy imports have been confirmed yet.</p>;
  return (
    <>
      <div className="table-scroll">
        <table className="data-table bundy-history-table">
        <caption className="sr-only">Bundy import history</caption>
        <thead>
          <tr>
            <th scope="col">File / import</th>
            <th scope="col">Started</th>
            <th scope="col">Imported by</th>
            <th scope="col">Rows</th>
            <th scope="col">Result</th>
            <th scope="col"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {history.items.map((item) => (
            <tr key={item.id}>
              <td><strong>{item.filename}</strong><small className="bundy-cell-meta">{item.id}</small></td>
              <td>{formatTimestamp(item.startedAt)}</td>
              <td>{item.initiatedBy?.displayName ?? "Unavailable"}</td>
              <td>
                <strong>{item.summary.importedCount} imported</strong>
                <small className="bundy-cell-meta">{item.summary.totalRows} total · {item.summary.unmatchedCount} unmatched · {item.summary.duplicateScanCount} duplicate scans</small>
              </td>
              <td>
                <StatusBadge tone={historyStatusTone(item.status)}>{item.status.replaceAll("_", " ")}</StatusBadge>
                {item.errorSummary ? <small className="bundy-cell-meta">{item.errorSummary}</small> : null}
                {item.rollbackErrorSummary ? <small className="bundy-cell-meta">{item.rollbackErrorSummary}</small> : null}
              </td>
              <td>
                {canRollback && ["COMPLETED", "COMPLETED_WITH_ERRORS", "ROLLBACK_FAILED"].includes(item.status) ? (
                  <button type="button" className="button-secondary bundy-undo-import-button" onClick={() => onRollback(item)}>Undo import</button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
      <PaginationControls page={history.page} pageSize={history.pageSize} total={history.total} hasNext={history.hasNext} label="imports" onPageChange={onPageChange} />
    </>
  );
}

function RawEventsTable({ data, onPageChange }: { data: BundyPageData["events"]; onPageChange: (page: number) => void }) {
  if (!data.items.length) return <p className="empty-state">No raw Bundy events have been persisted yet.</p>;
  return (
    <>
      <div className="table-scroll">
        <table className="data-table bundy-events-table">
        <caption className="sr-only">Persisted raw Bundy events</caption>
        <thead>
          <tr>
            <th scope="col">Source log</th>
            <th scope="col">Employee</th>
            <th scope="col">Timestamp</th>
            <th scope="col">Event</th>
            <th scope="col">Device / batch</th>
            <th scope="col">Technical status</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((event: BundyRawEventItem) => (
            <tr key={event.id}>
              <td><strong>{event.sourceLogId}</strong><small className="bundy-cell-meta">Import {event.importId}</small></td>
              <td><strong>{event.deviceEmployeeId}</strong><small className="bundy-cell-meta">{event.employee?.displayName ?? "Unmatched Employee"}</small></td>
              <td>{event.sourceTimestamp}</td>
              <td><StatusBadge tone="info">{event.event}</StatusBadge></td>
              <td>{event.deviceId}<small className="bundy-cell-meta">{event.sourceBatch ?? "No source batch"}</small></td>
              <td>
                <StatusBadge tone={statusTone(event.matchStatus)}>{event.matchStatus.replaceAll("_", " ")}</StatusBadge>
                {event.duplicateStatus === "DUPLICATE_SCAN" ? <StatusBadge tone="warning">Duplicate scan</StatusBadge> : null}
                {event.anomalyCodes.length ? <small className="bundy-cell-meta">{event.anomalyCodes.join(", ")}</small> : null}
              </td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
      <PaginationControls page={data.page} pageSize={data.pageSize} total={data.total} hasNext={data.hasNext} label="raw events" onPageChange={onPageChange} />
    </>
  );
}

export function BundyIntegrationPage({ initialData, initialLoadError, canImport }: BundyIntegrationPageProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<BundyImportPreview | null>(null);
  const [result, setResult] = useState<BundyImportResult | null>(null);
  const [data, setData] = useState(initialData);
  const [state, setState] = useState<ImportState>("idle");
  const [filter, setFilter] = useState<PreviewFilter>("all");
  const [previewPage, setPreviewPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(initialData?.history.page ?? 1);
  const [eventPage, setEventPage] = useState(initialData?.events.page ?? 1);
  const [feedback, setFeedback] = useState(initialLoadError ? "Bundy history could not be loaded." : "");
  const [error, setError] = useState("");
  const [rollbackPreview, setRollbackPreview] = useState<BundyRollbackPreview | null>(null);
  const [rollbackTarget, setRollbackTarget] = useState<BundyImportHistoryItem | null>(null);
  const [rollbackState, setRollbackState] = useState<"idle" | "loading" | "rolling_back">("idle");

  const refreshData = useCallback(async (requestedHistoryPage = historyPage, requestedEventPage = eventPage) => {
    try {
      const response = await apiRequest<ApiSuccessResponse<BundyPageData>>(
        `/api/admin/bundy/imports?page=${requestedHistoryPage}&pageSize=10&eventPage=${requestedEventPage}&eventPageSize=25`,
        { cache: "no-store" },
      );
      setData(response.data);
      setHistoryPage(response.data.history.page);
      setEventPage(response.data.events.page);
      setFeedback("Bundy import history and raw-event records refreshed.");
      setError("");
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Bundy data could not be refreshed.");
    }
  }, [eventPage, historyPage]);

  async function previewFile() {
    if (!file) {
      setError("Choose a .csv file first.");
      return;
    }
    setState("previewing");
    setError("");
    setFeedback("");
    setResult(null);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await apiRequest<ApiSuccessResponse<BundyImportPreview>>(
        "/api/admin/bundy/preview",
        { method: "POST", body: formData },
      );
      setPreview(response.data);
      setFilter("all");
      setPreviewPage(1);
      setFeedback("Preview ready. No raw event, Employee, schedule, unified attendance, Payroll, or Accounting write occurred.");
    } catch (previewError) {
      setPreview(null);
      setError(previewError instanceof Error ? previewError.message : "The Bundy CSV preview failed.");
    } finally {
      setState("idle");
    }
  }

  async function confirmImport() {
    if (!file || !preview || !canImport) return;
    setState("importing");
    setError("");
    setFeedback("");
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("previewToken", preview.previewToken);
      const response = await apiRequest<ApiSuccessResponse<BundyImportResult>>(
        "/api/admin/bundy/import",
        { method: "POST", body: formData },
      );
      setResult(response.data);
      setPreview(response.data.preview);
      setFeedback(`Bundy import ${response.data.importId} finished with status ${response.data.status.replaceAll("_", " ")}.`);
      await refreshData();
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "The Bundy import failed safely.");
    } finally {
      setState("idle");
    }
  }

  async function openRollback(item: BundyImportHistoryItem) {
    setRollbackTarget(item);
    setRollbackPreview(null);
    setError("");
    setRollbackState("loading");
    try {
      const response = await apiRequest<ApiSuccessResponse<BundyRollbackPreview>>(
        `/api/admin/bundy/imports/${item.id}/rollback-preview`,
        { cache: "no-store" },
      );
      setRollbackPreview(response.data);
    } catch (previewError) {
      setRollbackTarget(null);
      setError(previewError instanceof Error ? previewError.message : "The Bundy rollback preview failed.");
    } finally {
      setRollbackState("idle");
    }
  }

  async function confirmRollback() {
    if (!rollbackTarget || !rollbackPreview?.canRollback) return;
    setRollbackState("rolling_back");
    setError("");
    try {
      const response = await apiRequest<ApiSuccessResponse<BundyRollbackResult>>(
        `/api/admin/bundy/imports/${rollbackTarget.id}/rollback`,
        { method: "POST", body: JSON.stringify({ confirmation: "UNDO_IMPORT" }) },
      );
      setRollbackTarget(null);
      setRollbackPreview(null);
      setFeedback(`Bundy import ${response.data.importId} was rolled back. Only its owned raw source events were removed.`);
      await refreshData();
    } catch (rollbackError) {
      setError(rollbackError instanceof Error ? rollbackError.message : "The Bundy rollback failed safely without completing.");
    } finally {
      setRollbackState("idle");
    }
  }

  const filteredRows = useMemo(
    () => preview?.rows.filter((row) => rowMatchesFilter(row, filter)) ?? [],
    [filter, preview],
  );
  const metrics = result ? getPreviewMetrics(result.preview) : preview ? getPreviewMetrics(preview) : [];
  const canConfirm = Boolean(preview?.rows.some((row) => row.importAction === "IMPORT")) && canImport;

  return (
    <div className="admin-page bundy-integration-page" aria-busy={state !== "idle" || rollbackState !== "idle"}>
      <AdminPageHeader
        eyebrow="Integration control"
        title="Bundy / Biometric ETL"
        description="Upload a Bundy Clock CSV, independently match device IDs to HRPS Employees in PostgreSQL, review raw-event classifications, and explicitly confirm source evidence import. This workspace does not calculate final attendance policy outcomes."
        actions={<button type="button" className="button-secondary" onClick={() => void refreshData()} disabled={state !== "idle"}><Icon name="refresh" /> Refresh data</button>}
      />

      {error ? <div className="notice bundy-error" role="alert"><Icon name="warning" /><p>{error}</p></div> : null}
      {feedback ? <div className="notice bundy-feedback" role="status" aria-live="polite"><Icon name="info" /><p>{feedback}</p></div> : null}

      <div className="two-column bundy-import-top-grid">
        <SectionCard title="Upload and preview" eyebrow="Read-only until confirmed">
          <div className="panel-body bundy-upload-panel">
            <label className="bundy-file-field">
              <span>Bundy CSV file</span>
              <input type="file" accept=".csv,text/csv" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setPreview(null); setResult(null); setError(""); setFeedback(""); }} disabled={state !== "idle"} />
              <small>UTF-8 CSV only, maximum 5 MB. Preview performs PostgreSQL reads only.</small>
            </label>
            <div className="button-row bundy-upload-actions">
              <button type="button" className="button-primary" onClick={() => void previewFile()} disabled={!file || state !== "idle"}><Icon name="file" /> {state === "previewing" ? "Reading CSV…" : "Preview CSV"}</button>
              {preview ? <button type="button" className="button-primary" onClick={() => void confirmImport()} disabled={!canConfirm || state !== "idle"}><Icon name="check" /> {state === "importing" ? "Importing raw events…" : "Confirm import"}</button> : null}
            </div>
            {!canImport ? <p className="bundy-permission-note">Your account can preview Bundy files but does not have the server permission to confirm import.</p> : null}
            <div className="bundy-boundary-note"><strong>Protected boundaries</strong><span>Firebase Authentication remains the credential provider. PostgreSQL through Prisma owns persistence. No Firestore, Supabase Auth, direct browser database access, Employee mutation, unified attendance calculation, Payroll, or Accounting write is performed.</span></div>
          </div>
        </SectionCard>

        <SectionCard title="CSV contract" eyebrow="Actual supported source fields">
          <div className="panel-body bundy-contract-panel">
            <p><strong>Required:</strong> bundy_log_id, device_employee_id, timestamp, event, and device_id.</p>
            <p><strong>Supported source metadata:</strong> import_batch, processing_status, and matched_hrps_employee_id are retained for traceability only.</p>
            <p><strong>Server authority:</strong> the application matches device_employee_id as text to PostgreSQL Employee.employee_id. Source match/status fields are never trusted as authoritative.</p>
            <p><strong>Raw boundary:</strong> valid IN/OUT device events are preserved separately from later Unified Attendance processing. Duplicate scans remain stored and marked.</p>
          </div>
        </SectionCard>
      </div>

      {preview ? (
        <>
          <div className="metric-grid bundy-import-metrics">{metrics.map((metric) => <SummaryCard key={metric.label} {...metric} />)}</div>
          <SectionCard title={result ? "Import result" : "Preview review"} eyebrow={result ? "PostgreSQL raw-event summary" : "No business writes yet"}>
            <div className="panel-body bundy-preview-panel">
              <div className="bundy-preview-meta"><span><strong>File:</strong> {preview.filename}</span><span><strong>HRPS Employees available:</strong> {preview.employeesAvailable}</span><span><strong>Devices:</strong> {preview.devices.join(", ") || "—"}</span><span><strong>Source batches:</strong> {preview.sourceBatches.join(", ") || "—"}</span></div>
              {result ? <div className="bundy-account-policy"><Icon name="info" /><p>{result.accountBoundary}</p></div> : null}
              <div className="bundy-filter-row" role="group" aria-label="Preview filters">
                {(["all", "matched", "unmatched", "duplicate", "invalid", "IN", "OUT"] as PreviewFilter[]).map((option) => <button key={option} type="button" className={`bundy-filter-button ${filter === option ? "is-active" : ""}`} onClick={() => { setFilter(option); setPreviewPage(1); }}>{option === "all" ? "All" : option.replaceAll("_", " ")}</button>)}
              </div>
              <PreviewTable rows={filteredRows} page={previewPage} pageSize={25} onPageChange={setPreviewPage} />
            </div>
          </SectionCard>
        </>
      ) : null}

      <SectionCard title="Import history" eyebrow="Persisted PostgreSQL metadata" actions={<span className="bundy-history-count">{data?.history.total ?? 0} recorded</span>}>
        <div className="panel-body">{data ? <HistoryTable history={data.history} canRollback={canImport} onRollback={(item) => void openRollback(item)} onPageChange={(page) => void refreshData(page, eventPage)} /> : <p className="empty-state">Import history is temporarily unavailable.</p>}</div>
      </SectionCard>

      <SectionCard title="Raw Bundy events" eyebrow="Immutable source evidence · unmatched rows remain reviewable">
        <div className="panel-body"><RawEventsTable data={data?.events ?? { items: [], page: 1, pageSize: 25, total: 0, hasNext: false }} onPageChange={(page) => void refreshData(historyPage, page)} /></div>
      </SectionCard>

      {rollbackTarget ? (
        <div className="bundy-rollback-backdrop" role="presentation">
          <section className="bundy-rollback-dialog" role="dialog" aria-modal="true" aria-labelledby="bundy-rollback-title" aria-describedby="bundy-rollback-description">
            <div className="bundy-rollback-dialog-header">
              <div>
                <span className="section-eyebrow">Safety preview</span>
                <h2 id="bundy-rollback-title">Undo Bundy import</h2>
                <p>{rollbackTarget.filename}</p>
              </div>
            </div>
            {rollbackState === "loading" ? <p className="bundy-rollback-loading" role="status">Checking raw-event ownership and downstream dependencies…</p> : null}
            {rollbackPreview ? (
              <>
                <p id="bundy-rollback-description" className="bundy-rollback-description">This removes only the persisted raw Bundy source events owned by this import. It does not remove Employees, schedules, user accounts, Firebase accounts, HRPS data, QR attendance, Payroll, or Accounting data.</p>
                <div className="bundy-rollback-metrics">
                  <div><strong>{rollbackPreview.rawEventsOwned}</strong><span>Raw events to remove</span></div>
                  <div><strong>{rollbackPreview.matchedEvents}</strong><span>Matched events</span></div>
                  <div><strong>{rollbackPreview.unmatchedEvents}</strong><span>Unmatched events</span></div>
                  <div><strong>{rollbackPreview.inactiveEvents}</strong><span>Inactive Employee events</span></div>
                  <div><strong>{rollbackPreview.duplicateScans}</strong><span>Duplicate scans</span></div>
                  <div><strong>{rollbackPreview.downstreamDependencies}</strong><span>Downstream dependencies</span></div>
                </div>
                <div className="bundy-rollback-meta"><span><strong>Import ID:</strong> {rollbackPreview.importId}</span><span><strong>Devices:</strong> {rollbackPreview.devices.join(", ") || "None"}</span><span><strong>Source batches:</strong> {rollbackPreview.sourceBatches.join(", ") || "None"}</span></div>
                {rollbackPreview.warnings.map((warning) => <p className="bundy-rollback-warning" key={warning}>{warning}</p>)}
                {rollbackPreview.blockingReasons.length ? (
                  <div className="bundy-rollback-blocked" role="alert">
                    <strong>Undo is blocked</strong>
                    <ul>{rollbackPreview.blockingReasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
                  </div>
                ) : <p className="bundy-rollback-safe" role="status">Server-side ownership and dependency checks passed. Confirm to remove this import&apos;s raw events.</p>}
                <div className="button-row bundy-rollback-actions">
                  <button type="button" className="button-secondary" onClick={() => { setRollbackTarget(null); setRollbackPreview(null); }} disabled={rollbackState !== "idle"}>Cancel</button>
                  <button type="button" className="button-primary" onClick={() => void confirmRollback()} disabled={!rollbackPreview.canRollback || rollbackState !== "idle"}>
                    {rollbackState === "rolling_back" ? "Undoing import…" : "Confirm undo import"}
                  </button>
                </div>
              </>
            ) : null}
          </section>
        </div>
      ) : null}

      <p className="page-feedback"><Icon name="info" /> Duplicate scan window: {BUNDY_DUPLICATE_SCAN_WINDOW_SECONDS} seconds, same device Employee ID, event direction, and device. This is technical ETL metadata, not a late or attendance policy.</p>
    </div>
  );
}

const BUNDY_DUPLICATE_SCAN_WINDOW_SECONDS = 60;
