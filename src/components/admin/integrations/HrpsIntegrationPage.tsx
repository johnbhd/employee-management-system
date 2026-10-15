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
  if (status === "FAILED") return "danger";
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
    { label: "Accounts pending", value: String(result.summary.accountsPending), note: "Requires approved onboarding policy", icon: "clock", tone: "warning" },
    { label: "Rejected/review", value: String(result.summary.invalidCount + result.summary.duplicateCount + result.summary.needsReviewCount), note: "No automatic synchronization", icon: "warning", tone: "danger" },
  ];
}

function HistoryTable({ history }: { history: HrpsImportHistoryData }) {
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
                <button type="button" className="button-primary" onClick={() => void confirmImport()} disabled={!canImport || state !== "idle" || !preview.rows.some((row) => row.classification === "NEW" || row.classification === "UPDATED")}>
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
            <p><strong>Required:</strong> employee_id, name, department, employment_status.</p>
            <p><strong>Optional:</strong> position and structured schedule fields: schedule_id, work_days, rest_days, work_start, work_end, break_start, break_end, shift_label, work_location, effective_from, effective_to.</p>
            <p><strong>Identity rule:</strong> employee_id remains text, including leading zeros. Names, email, department, and position are never used as the matching key.</p>
            <p><strong>Account policy:</strong> imported employees without an existing linked account remain pending until an approved email and secure Firebase onboarding policy are supplied. No predictable password or fabricated Firebase UID is created.</p>
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
                  <thead><tr><th scope="col">Row</th><th scope="col">Employee ID</th><th scope="col">Name</th><th scope="col">Department</th><th scope="col">Status</th><th scope="col">Schedule</th><th scope="col">Classification</th><th scope="col">Issues / changes</th></tr></thead>
                  <tbody>
                    {preview.rows.map((row) => (
                      <tr key={row.rowNumber}>
                        <td>{row.rowNumber}</td>
                        <td><strong>{row.employeeId ?? "—"}</strong></td>
                        <td>{row.input?.displayName ?? "—"}</td>
                        <td>{row.input?.department ?? "—"}</td>
                        <td>{row.input?.employmentStatus ?? "—"}</td>
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
          {history ? <HistoryTable history={history} /> : <p className="empty-state">Import history is temporarily unavailable.</p>}
        </div>
      </SectionCard>
    </div>
  );
}
