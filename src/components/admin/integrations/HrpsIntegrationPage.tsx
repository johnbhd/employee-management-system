"use client";

import { useCallback, useState } from "react";

import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { Icon } from "@/components/ui/Icon";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SummaryCard } from "@/components/ui/SummaryCard";
import { apiRequest } from "@/lib/api/client";
import type { ApiSuccessResponse } from "@/types/api/responses";
import type {
  HrpsImportHistoryData,
  HrpsImportHistoryItem,
  HrpsImportPreview,
  HrpsImportResult,
  HrpsRollbackPreview,
  HrpsRollbackResult,
} from "@/types/hrps-import";
import type { Metric, StatusTone } from "@/types/ui";

type HrpsIntegrationPageProps = {
  initialHistory: HrpsImportHistoryData | null;
  initialLoadError: boolean;
  canImport: boolean;
};

type ImportState = "idle" | "previewing" | "importing";

function formatTimestamp(value: string | null): string {
  if (!value) return "Not completed";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

function formatClassification(classification: string): string {
  return classification.replaceAll("_", " ");
}

function statusTone(status: HrpsImportHistoryItem["status"]): StatusTone {
  if (status === "COMPLETED") return "success";
  if (status === "ROLLED_BACK") return "muted";
  if (status === "FAILED" || status === "ROLLBACK_FAILED") return "danger";
  if (status === "COMPLETED_WITH_ERRORS") return "warning";
  return "info";
}

function getPreviewMetrics(preview: HrpsImportPreview): Metric[] {
  return [
    { label: "Total rows", value: String(preview.summary.totalRows), note: "Data rows found in this file", icon: "file", tone: "info" },
    { label: "New", value: String(preview.summary.newCount), note: "Eligible for Employee creation", icon: "users", tone: "success" },
    { label: "Updated", value: String(preview.summary.updatedCount), note: "HRPS-owned values changed", icon: "refresh", tone: "info" },
    { label: "Unchanged", value: String(preview.summary.unchangedCount), note: "No business write required", icon: "check", tone: "success" },
    { label: "Rejected", value: String(preview.summary.invalidCount + preview.summary.duplicateCount), note: "Invalid or duplicate rows", icon: "warning", tone: "danger" },
    { label: "Needs review", value: String(preview.summary.needsReviewCount), note: "Ambiguous account or identity state", icon: "clock", tone: "warning" },
  ];
}

function getResultMetrics(result: HrpsImportResult): Metric[] {
  return [
    { label: "Employees created", value: String(result.summary.createdEmployees), note: "Persisted in PostgreSQL", icon: "users", tone: "success" },
    { label: "Employees updated", value: String(result.summary.updatedEmployees), note: "HRPS-owned fields only", icon: "refresh", tone: "info" },
    { label: "Schedules changed", value: String(result.summary.schedulesCreated + result.summary.schedulesUpdated), note: "Structured schedule rows", icon: "calendar", tone: "info" },
    { label: "Accounts ready", value: String(result.summary.accountsProvisioned), note: "Existing linked identities retained", icon: "check", tone: "success" },
    { label: "Accounts failed", value: String(result.summary.accountsFailed), note: "Requires safe retry or review", icon: "warning", tone: result.summary.accountsFailed ? "danger" : "success" },
    { label: "Rejected/review", value: String(result.summary.invalidCount + result.summary.duplicateCount + result.summary.needsReviewCount), note: "No automatic synchronization", icon: "warning", tone: "danger" },
  ];
}

function HistoryTable({ history, canRollback, onRollback }: { history: HrpsImportHistoryData; canRollback: boolean; onRollback: (item: HrpsImportHistoryItem) => void }) {
  if (!history.items.length) {
    return <p className="empty-state">No HRPS imports have been confirmed yet.</p>;
  }

  return (
    <div className="table-scroll">
      <table className="data-table hrps-history-table">
        <thead>
          <tr>
            <th scope="col">File</th>
            <th scope="col">Started</th>
            <th scope="col">Initiated by</th>
            <th scope="col">Rows</th>
            <th scope="col">Result</th>
            <th scope="col"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {history.items.map((item) => (
            <tr key={item.id}>
              <td><strong>{item.filename}</strong><small>{item.id}</small></td>
              <td>{formatTimestamp(item.startedAt)}</td>
              <td>{item.initiatedBy?.displayName ?? "Unavailable"}</td>
              <td>
                <span>{item.summary.totalRows} total</span>
                <small>{item.summary.createdEmployees} new · {item.summary.updatedEmployees} updated</small>
              </td>
              <td><StatusBadge tone={statusTone(item.status)}>{item.status.replaceAll("_", " ")}</StatusBadge></td>
              <td>
                {canRollback && ["COMPLETED", "COMPLETED_WITH_ERRORS", "ROLLBACK_FAILED"].includes(item.status) ? (
                  <button type="button" className="button-secondary hrps-undo-import-button" onClick={() => onRollback(item)}>Undo import</button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function HrpsIntegrationPage({ initialHistory, initialLoadError, canImport }: HrpsIntegrationPageProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<HrpsImportPreview | null>(null);
  const [result, setResult] = useState<HrpsImportResult | null>(null);
  const [history, setHistory] = useState(initialHistory);
  const [state, setState] = useState<ImportState>("idle");
  const [feedback, setFeedback] = useState(initialLoadError ? "Import history could not be loaded." : "");
  const [error, setError] = useState("");
  const [rollbackPreview, setRollbackPreview] = useState<HrpsRollbackPreview | null>(null);
  const [rollbackTarget, setRollbackTarget] = useState<HrpsImportHistoryItem | null>(null);
  const [rollbackState, setRollbackState] = useState<"idle" | "loading" | "rolling_back">("idle");

  const refreshHistory = useCallback(async () => {
    try {
      const response = await apiRequest<ApiSuccessResponse<HrpsImportHistoryData>>(
        "/api/admin/hrps/imports?page=1&pageSize=10",
        { cache: "no-store" },
      );
      setHistory(response.data);
    } catch (refreshError) {
      setFeedback(refreshError instanceof Error ? refreshError.message : "Import history could not be refreshed.");
    }
  }, []);

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
      const response = await apiRequest<ApiSuccessResponse<HrpsImportPreview>>(
        "/api/admin/hrps/preview",
        { method: "POST", body: formData },
      );
      setPreview(response.data);
      setFeedback("Preview ready. No Employee, schedule, account, or Firebase write occurred.");
    } catch (previewError) {
      setPreview(null);
      setError(previewError instanceof Error ? previewError.message : "The CSV preview failed.");
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
      const response = await apiRequest<ApiSuccessResponse<HrpsImportResult>>(
        "/api/admin/hrps/import",
        { method: "POST", body: formData },
      );
      setResult(response.data);
      setPreview(response.data.preview);
      setFeedback(`Import ${response.data.importId} finished with status ${response.data.status.replaceAll("_", " ")}.`);
      await refreshHistory();
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "The HRPS synchronization failed.");
    } finally {
      setState("idle");
    }
  }

  async function openRollback(item: HrpsImportHistoryItem) {
    setRollbackTarget(item);
    setRollbackPreview(null);
    setError("");
    setRollbackState("loading");
    try {
      const response = await apiRequest<ApiSuccessResponse<HrpsRollbackPreview>>(
        `/api/admin/hrps/imports/${item.id}/rollback-preview`,
        { cache: "no-store" },
      );
      setRollbackPreview(response.data);
    } catch (previewError) {
      setRollbackTarget(null);
      setError(previewError instanceof Error ? previewError.message : "The rollback preview failed.");
    } finally {
      setRollbackState("idle");
    }
  }

  async function confirmRollback() {
    if (!rollbackTarget || !rollbackPreview?.rollbackAllowed) return;
    setRollbackState("rolling_back");
    setError("");
    try {
      const response = await apiRequest<ApiSuccessResponse<HrpsRollbackResult>>(
        `/api/admin/hrps/imports/${rollbackTarget.id}/rollback`,
        { method: "POST" },
      );
      setRollbackTarget(null);
      setRollbackPreview(null);
      setFeedback(`Import ${response.data.importId} was rolled back. No global database reset was performed.`);
      await refreshHistory();
    } catch (rollbackError) {
      setError(rollbackError instanceof Error ? rollbackError.message : "The rollback failed safely without completing.");
    } finally {
      setRollbackState("idle");
    }
  }

  const metrics = result ? getResultMetrics(result) : preview ? getPreviewMetrics(preview) : [];

  return (
    <div className="admin-page hrps-integration-page" aria-busy={state !== "idle"}>
      <AdminPageHeader
        eyebrow="Integration control"
        title="HRPS Integration"
        description="Upload an HRPS CSV, review the server-side comparison against PostgreSQL, and explicitly confirm synchronization. HRPS remains the source of truth for official employee data."
        actions={(
          <button type="button" className="button-secondary" onClick={() => void refreshHistory()} disabled={state !== "idle"}>
            <Icon name="refresh" /> Refresh history
          </button>
        )}
      />

      {error ? <div className="notice hrps-error" role="alert"><Icon name="warning" /><p>{error}</p></div> : null}
      {feedback ? <div className="notice hrps-feedback" role="status" aria-live="polite"><Icon name="info" /><p>{feedback}</p></div> : null}

      <div className="two-column hrps-import-top-grid">
        <SectionCard title="Upload and preview" eyebrow="Read-only until confirmed">
          <div className="panel-body hrps-upload-panel">
            <label className="hrps-file-field">
              <span>HRPS CSV file</span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => {
                  setFile(event.target.files?.[0] ?? null);
                  setPreview(null);
                  setResult(null);
                  setError("");
                  setFeedback("");
                }}
                disabled={state !== "idle"}
              />
              <small>UTF-8 CSV only, maximum 5 MB. Uploading and previewing do not write business data.</small>
            </label>
            <div className="button-row hrps-upload-actions">
              <button type="button" className="button-primary" onClick={() => void previewFile()} disabled={!file || state !== "idle"}>
                <Icon name="file" /> {state === "previewing" ? "Reading CSV…" : "Preview CSV"}
              </button>
              {preview ? (
                <button type="button" className="button-primary" onClick={() => void confirmImport()} disabled={!canImport || state !== "idle" || !preview.rows.some((row) => row.classification === "NEW" || row.classification === "UPDATED" || row.accountStatus === "will_create")}>
                  <Icon name="check" /> {state === "importing" ? "Synchronizing…" : "Confirm sync"}
                </button>
              ) : null}
            </div>
            {!canImport ? <p className="hrps-permission-note">Your account can preview HRPS files but does not have the server permission to confirm synchronization.</p> : null}
            <div className="hrps-boundary-note">
              <strong>Protected boundaries</strong>
              <span>PostgreSQL stores the application data. Firebase Authentication remains the credential provider. Supabase Auth and direct browser database access are not used.</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="CSV contract" eyebrow="Supported source fields">
          <div className="panel-body hrps-contract-panel">
            <p><strong>Required:</strong> employee_id, department, employment_status, and either full_name or first_name plus last_name.</p>
            <p><strong>Employee fields:</strong> employee_number, middle_name, suffix, work_email, office_unit, position, employee_category, employment_type, date_hired, assigned_office, and work_location are supported when supplied.</p>
            <p><strong>Schedule fields:</strong> work_days, rest_day, shift, work_start_time, work_end_time, break_start_time, break_end_time, work_location, schedule_effective_from, and schedule_effective_to. Weekdays may be supplied as single values, explicit lists, or ordered ranges such as Monday-Friday and Saturday-Sunday; ranges are normalized before validation. An optional schedule_id is accepted; otherwise it is derived from employee_id.</p>
            <p><strong>Role safety:</strong> sia_application_role is informational only. CSV values never grant application roles or permissions.</p>
            <p><strong>Identity rule:</strong> employee_id remains text, including leading zeros. Names, email, department, and position are never used as the matching key.</p>
            <p><strong>Account policy:</strong> new Employee accounts use the approved AU-JSC username mapping, receive the Employee role, and must change their temporary Firebase credential on first login. Credentials and Firebase IDs are never shown here.</p>
          </div>
        </SectionCard>
      </div>

      {preview ? (
        <>
          <div className="metric-grid hrps-import-metrics">
            {metrics.map((metric) => <SummaryCard key={metric.label} {...metric} />)}
          </div>
          <SectionCard title={result ? "Synchronization result" : "Preview review"} eyebrow={result ? "PostgreSQL write summary" : "No business writes yet"}>
            <div className="panel-body hrps-preview-panel">
              <div className="hrps-preview-meta">
                <span><strong>File:</strong> {preview.filename}</span>
                <span><strong>Preview token:</strong> <code>{preview.previewToken.slice(0, 16)}…</code></span>
                {preview.ignoredHeaders.length ? <span><strong>Ignored columns:</strong> {preview.ignoredHeaders.join(", ")}</span> : null}
              </div>
              {result ? <div className="hrps-account-policy"><Icon name="info" /><p>{result.accountPolicy}</p></div> : null}
              <div className="table-scroll">
                <table className="data-table hrps-preview-table">
                  <thead><tr><th scope="col">Row</th><th scope="col">Employee ID</th><th scope="col">Name</th><th scope="col">Department</th><th scope="col">Status</th><th scope="col">Account</th><th scope="col">Schedule</th><th scope="col">Classification</th><th scope="col">Issues / changes</th></tr></thead>
                  <tbody>
                    {preview.rows.map((row) => (
                      <tr key={row.rowNumber}>
                        <td>{row.rowNumber}</td>
                        <td><strong>{row.employeeId ?? "—"}</strong></td>
                        <td>{row.input?.displayName ?? "—"}</td>
                        <td>{row.input?.department ?? "—"}</td>
                        <td>{row.input?.employmentStatus ?? "—"}</td>
                        <td>
                          {row.accountStatus === "existing" ? <StatusBadge tone="success">Account ready</StatusBadge> : null}
                          {row.accountStatus === "will_create" ? <StatusBadge tone="info">Create Employee account</StatusBadge> : null}
                          {row.accountStatus === "needs_review" ? <StatusBadge tone="warning">Needs review</StatusBadge> : null}
                          {row.accountStatus === "not_applicable" ? <span>—</span> : null}
                        </td>
                        <td>{row.input?.schedule ? `${row.input.schedule.workStart}–${row.input.schedule.workEnd}` : "Not supplied"}</td>
                        <td><StatusBadge tone={row.classification === "INVALID" || row.classification === "DUPLICATE" ? "danger" : row.classification === "NEEDS_REVIEW" ? "warning" : row.classification === "UNCHANGED" ? "muted" : "success"}>{formatClassification(row.classification)}</StatusBadge></td>
                        <td>
                          {row.errors.length ? <ul className="hrps-row-messages">{row.errors.map((message) => <li key={message}>{message}</li>)}</ul> : null}
                          {row.changes.length ? <ul className="hrps-row-messages">{row.changes.map((change) => <li key={change.field}><strong>{change.field}:</strong> {change.from ?? "none"} → {change.to ?? "none"}</li>)}</ul> : null}
                          {row.warnings.length && !row.errors.length ? <ul className="hrps-row-messages is-warning">{row.warnings.map((message) => <li key={message}>{message}</li>)}</ul> : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </SectionCard>
        </>
      ) : null}

      <SectionCard title="Import history" eyebrow="Persisted PostgreSQL metadata" actions={<span className="hrps-history-count">{history?.total ?? 0} recorded</span>}>
        <div className="panel-body">
          {history ? <HistoryTable history={history} canRollback={canImport} onRollback={(item) => void openRollback(item)} /> : <p className="empty-state">Import history is temporarily unavailable.</p>}
        </div>
      </SectionCard>

      {rollbackTarget ? (
        <div className="hrps-rollback-backdrop" role="presentation">
          <section className="hrps-rollback-dialog" role="dialog" aria-modal="true" aria-labelledby="hrps-rollback-title">
            <div className="hrps-rollback-dialog-header">
              <div>
                <span className="section-eyebrow">Safety preview</span>
                <h2 id="hrps-rollback-title">Undo HRPS import</h2>
                <p>{rollbackTarget.filename}</p>
              </div>
            </div>
            {rollbackState === "loading" ? <p className="hrps-rollback-loading" role="status">Checking ownership, later imports, and downstream dependencies…</p> : null}
            {rollbackPreview ? (
              <>
                <div className="hrps-rollback-metrics">
                  <div><strong>{rollbackPreview.employeesToDelete}</strong><span>Employees to remove</span></div>
                  <div><strong>{rollbackPreview.employeesToRestore}</strong><span>Employees to restore</span></div>
                  <div><strong>{rollbackPreview.schedulesToDelete}</strong><span>Schedules to remove</span></div>
                  <div><strong>{rollbackPreview.schedulesToRestore}</strong><span>Schedules to restore</span></div>
                  <div><strong>{rollbackPreview.applicationUsersToDelete}</strong><span>Application users</span></div>
                  <div><strong>{rollbackPreview.firebaseUsersToDelete}</strong><span>Firebase accounts</span></div>
                </div>
                {rollbackPreview.warnings.map((warning) => <p className="hrps-rollback-warning" key={warning}>{warning}</p>)}
                {rollbackPreview.blockedRecords.length ? (
                  <div className="hrps-rollback-blocked" role="alert">
                    <strong>Rollback blocked</strong>
                    <ul>{rollbackPreview.blockedRecords.map((record) => <li key={`${record.rowNumber}-${record.employeeId}-${record.reason}`}>{record.employeeId ?? "Unknown row"}: {record.reason}</li>)}</ul>
                  </div>
                ) : <p className="hrps-rollback-safe" role="status">All targeted changes passed the server-side safety checks. Confirm to restore the previous state.</p>}
                <div className="button-row hrps-rollback-actions">
                  <button type="button" className="button-secondary" onClick={() => { setRollbackTarget(null); setRollbackPreview(null); }} disabled={rollbackState !== "idle"}>Cancel</button>
                  <button type="button" className="button-primary" onClick={() => void confirmRollback()} disabled={!rollbackPreview.rollbackAllowed || rollbackState !== "idle"}>
                    {rollbackState === "rolling_back" ? "Rolling back…" : "Confirm rollback"}
                  </button>
                </div>
              </>
            ) : null}
          </section>
        </div>
      ) : null}
    </div>
  );
}
