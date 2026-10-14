"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";

import { FlowDiagram } from "@/components/admin/shared/FlowDiagram";
import { ProgressList } from "@/components/admin/shared/ProgressList";
import { Icon } from "@/components/ui/Icon";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SummaryCard } from "@/components/ui/SummaryCard";
import { ApiClientError } from "@/lib/api/errors";
import { apiRequest } from "@/lib/api/client";
import type { ApiSuccessResponse } from "@/types/api/responses";
import type {
  AdminSettingKey,
  AdminSettingValue,
  AdminSettingsData,
  AdminSettingsIntegration,
} from "@/types/admin-settings";
import type { IconName } from "@/types/ui";

type SettingsSectionId = "general" | "interface" | "attendance" | "integration" | "audit" | "system-info";
type SettingsState = Record<AdminSettingKey, AdminSettingValue>;

type SettingsSection = {
  id: SettingsSectionId;
  label: string;
  description: string;
  icon: IconName;
};

const settingsSections: readonly SettingsSection[] = [
  { id: "general", label: "General", description: "Application identity and display formats", icon: "settings" },
  { id: "interface", label: "Interface", description: "Admin workspace presentation", icon: "activity" },
  { id: "attendance", label: "Attendance", description: "Safe workspace defaults", icon: "clock" },
  { id: "integration", label: "Integration", description: "Monitored application boundaries", icon: "monitoring" },
  { id: "audit", label: "Audit & Logs", description: "Activity display preferences", icon: "audit" },
  { id: "system-info", label: "System Information", description: "Safe application metadata", icon: "info" },
];

const runtimeKeys: readonly AdminSettingKey[] = [
  "application.display_name",
  "application.date_format",
  "application.time_format",
  "admin.settings.density",
  "admin.settings.show_status_descriptions",
  "admin.attendance.default_view",
  "admin.attendance.default_source",
  "admin.attendance.show_verification_status",
  "admin.audit.page_size",
  "admin.audit.default_outcome",
];

function stateFromData(data: AdminSettingsData): SettingsState {
  return Object.fromEntries(
    runtimeKeys.map((key) => {
      const setting = data.settings.find((item) => item.key === key);
      return [key, setting?.value ?? setting?.defaultValue ?? ""];
    }),
  ) as SettingsState;
}

function settingValue<T extends AdminSettingValue>(data: AdminSettingsData, key: string, fallback: T): T {
  const value = data.settings.find((item) => item.key === key)?.value;
  return (value ?? fallback) as T;
}

function settingDefault(data: AdminSettingsData, key: AdminSettingKey) {
  return data.settings.find((item) => item.key === key)?.defaultValue ?? null;
}

function formatTimePreview(timeFormat: string) {
  return timeFormat === "24-hour" ? "16:30" : "4:30 PM";
}

function formatDatePreview(dateFormat: string) {
  return dateFormat === "long"
    ? "September 27, 2026"
    : dateFormat === "iso"
      ? "2026-09-27"
      : "Sep 27, 2026";
}

type SettingRowProps = {
  label: string;
  description: string;
  children: ReactNode;
};

function SettingRow({ label, description, children }: SettingRowProps) {
  return (
    <div className="admin-settings-row">
      <div className="admin-settings-row-copy"><strong>{label}</strong><p>{description}</p></div>
      <div className="admin-settings-row-control">{children}</div>
    </div>
  );
}

function ToggleControl({
  id,
  checked,
  label,
  disabled,
  onChange,
}: {
  id: string;
  checked: boolean;
  label: string;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={`admin-settings-toggle${disabled ? " is-disabled" : ""}`} htmlFor={id}>
      <input id={id} type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
      <span className="admin-settings-toggle-track" aria-hidden="true"><span /></span>
      <span className="admin-settings-toggle-state">{checked ? "On" : "Off"}</span>
      <span className="sr-only">{label}</span>
    </label>
  );
}

function IntegrationCard({ integration }: { integration: AdminSettingsIntegration }) {
  const tone = integration.status === "Simulated" ? "warning" : integration.status === "Configured" ? "success" : "muted";

  return (
    <div className="admin-settings-integration-card">
      <div className="admin-settings-integration-card-heading"><div><strong>{integration.name}</strong><small>{integration.provider ?? "No provider configured"}</small></div><StatusBadge tone={tone}>{integration.status}</StatusBadge></div>
      <p>{integration.detail}</p>
      <div className="admin-settings-integration-card-footer"><span>{integration.credentialsStatus} credentials</span><Link href={integration.monitoringHref}>Open integration <Icon name="arrow" /></Link></div>
    </div>
  );
}

export function SystemSettingsManager({
  initialData,
  loadError: initialLoadError,
  canManage,
}: {
  initialData: AdminSettingsData | null;
  loadError: boolean;
  canManage: boolean;
}) {
  const [data, setData] = useState(initialData);
  const [activeSection, setActiveSection] = useState<SettingsSectionId>("general");
  const [savedSettings, setSavedSettings] = useState<SettingsState | null>(initialData ? stateFromData(initialData) : null);
  const [draftSettings, setDraftSettings] = useState<SettingsState | null>(initialData ? stateFromData(initialData) : null);
  const [loadError, setLoadError] = useState(initialLoadError);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [fieldError, setFieldError] = useState("");

  const feedbackIsError = feedback.includes("could not")
    || feedback.includes("changed after")
    || feedback.includes("temporarily")
    || feedback.includes("failed");

  const isDirty = useMemo(() => Boolean(savedSettings && draftSettings && JSON.stringify(savedSettings) !== JSON.stringify(draftSettings)), [draftSettings, savedSettings]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest<ApiSuccessResponse<AdminSettingsData>>("/api/admin/settings", { cache: "no-store" });
      const nextSettings = stateFromData(response.data);
      setData(response.data);
      setSavedSettings(nextSettings);
      setDraftSettings(nextSettings);
      setLoadError(false);
      setFeedback("");
      setFieldError("");
    } catch (error) {
      setLoadError(true);
      setFeedback(error instanceof Error ? error.message : "System settings could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  function updateSetting(key: AdminSettingKey, value: AdminSettingValue) {
    setDraftSettings((current) => current ? { ...current, [key]: value } : current);
    setFeedback("");
    setFieldError("");
  }

  async function saveSettings() {
    if (!data || !draftSettings || !canManage) return;
    const displayName = draftSettings["application.display_name"];
    if (typeof displayName !== "string" || displayName.trim().length < 3) {
      setActiveSection("general");
      setFieldError("System display name must be at least 3 characters.");
      return;
    }

    setIsSaving(true);
    setFeedback("");
    try {
      const response = await apiRequest<ApiSuccessResponse<AdminSettingsData>>("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({ expectedVersion: data.version, settings: draftSettings }),
      });
      const nextSettings = stateFromData(response.data);
      setData(response.data);
      setSavedSettings(nextSettings);
      setDraftSettings(nextSettings);
      setFeedback("Settings saved on the server.");
      setFieldError("");
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 409) {
        setFeedback("These settings changed after you opened the page. Refresh before saving again.");
      } else {
        setFeedback(error instanceof Error ? error.message : "Settings could not be saved.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  function discardSettings() {
    if (!savedSettings) return;
    setDraftSettings(savedSettings);
    setFieldError("");
    setFeedback("Unsaved changes discarded.");
  }

  function resetToDefaults() {
    if (!data || !draftSettings || !canManage || !window.confirm("Reset supported runtime settings to their controlled defaults?")) return;
    const nextSettings = { ...draftSettings };
    runtimeKeys.forEach((key) => {
      const fallback = settingDefault(data, key);
      if (fallback !== null) nextSettings[key] = fallback;
    });
    setDraftSettings(nextSettings);
    setFeedback("Controlled defaults are ready to review. Save to apply them.");
    setFieldError("");
  }

  function renderGeneralSection() {
    if (!data || !draftSettings) return null;
    const displayNameErrorId = "system-display-name-error";
    return (
      <>
        <div className="admin-settings-section-heading"><p className="section-kicker">Application identity</p><h2 id="settings-section-title">General settings</h2><p>Keep the application identity and date/time presentation consistent across the administrator workspace.</p></div>
        <div className="admin-settings-form">
          <SettingRow label="System display name" description="A server-persisted display value for this application settings workspace."><div className="admin-settings-input-group"><input className={fieldError ? "has-error" : ""} value={String(draftSettings["application.display_name"])} disabled={!canManage || isSaving} onChange={(event) => updateSetting("application.display_name", event.target.value)} aria-describedby={fieldError ? displayNameErrorId : "system-display-name-help"} /><small id="system-display-name-help">Stored in the controlled runtime settings document; it does not rename routes or secrets.</small>{fieldError ? <small id={displayNameErrorId} className="admin-settings-field-error">{fieldError}</small> : null}</div></SettingRow>
          <SettingRow label="Campus / institution" description="The current project context is fixed to the AU-JSC campus."><div className="admin-settings-readonly-value"><strong>{settingValue(data, "application.campus", "Arellano University – Juan Sumulong Campus")}</strong><small>Derived, read-only application context</small></div></SettingRow>
          <SettingRow label="Application timezone" description="The current project uses the AU-JSC local display timezone."><div className="admin-settings-readonly-value"><strong>{settingValue(data, "application.timezone", "Asia/Manila")}</strong><small>Derived, read-only display context</small></div></SettingRow>
          <SettingRow label="Date format" description="Preview the date format used by this settings workspace."><select value={String(draftSettings["application.date_format"])} disabled={!canManage || isSaving} onChange={(event) => updateSetting("application.date_format", event.target.value)}><option value="short">Sep 27, 2026</option><option value="long">September 27, 2026</option><option value="iso">2026-09-27</option></select></SettingRow>
          <SettingRow label="Time format" description="Preview the time format used by this settings workspace."><select value={String(draftSettings["application.time_format"])} disabled={!canManage || isSaving} onChange={(event) => updateSetting("application.time_format", event.target.value)}><option value="12-hour">12-hour · 4:30 PM</option><option value="24-hour">24-hour · 16:30</option></select></SettingRow>
        </div>
        <div className="admin-settings-preview" aria-live="polite"><Icon name="calendar" /><span>Format preview</span><strong>{formatDatePreview(String(draftSettings["application.date_format"]))} · {formatTimePreview(String(draftSettings["application.time_format"]))}</strong></div>
      </>
    );
  }

  function renderInterfaceSection() {
    if (!draftSettings) return null;
    const descriptionsVisible = Boolean(draftSettings["admin.settings.show_status_descriptions"]);
    return (
      <>
        <div className="admin-settings-section-heading"><p className="section-kicker">Workspace presentation</p><h2 id="settings-section-title">Interface preferences</h2><p>Adjust the density and supporting descriptions used while reviewing application settings.</p></div>
        <div className="admin-settings-form"><SettingRow label="Settings density" description="Choose the amount of spacing between settings rows on this workspace."><select value={String(draftSettings["admin.settings.density"])} disabled={!canManage || isSaving} onChange={(event) => updateSetting("admin.settings.density", event.target.value)}><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select></SettingRow><SettingRow label="Status descriptions" description="Keep supporting state descriptions visible beside settings feedback."><ToggleControl id="show-status-descriptions" checked={descriptionsVisible} disabled={!canManage || isSaving} label="Show status descriptions" onChange={(checked) => updateSetting("admin.settings.show_status_descriptions", checked)} /></SettingRow></div>
        <div className="admin-settings-status-preview"><StatusBadge tone={descriptionsVisible ? "success" : "muted"}>{descriptionsVisible ? "Descriptions visible" : "Compact status only"}</StatusBadge>{descriptionsVisible ? <span>Supporting descriptions remain available beside controls.</span> : null}</div>
      </>
    );
  }

  function renderAttendanceSection() {
    if (!draftSettings) return null;
    return (
      <>
        <div className="admin-settings-section-heading"><p className="section-kicker">Attendance workspace</p><h2 id="settings-section-title">Attendance preferences</h2><p>Choose safe administrator viewing defaults without changing attendance rules, verification authority, or source ownership.</p></div>
        <div className="admin-settings-form"><SettingRow label="Default attendance view" description="The time range to select when the administrator opens an attendance workspace."><select value={String(draftSettings["admin.attendance.default_view"])} disabled={!canManage || isSaving} onChange={(event) => updateSetting("admin.attendance.default_view", event.target.value)}><option value="today">Today</option><option value="week">Current week</option><option value="month">Current month</option></select></SettingRow><SettingRow label="Default attendance source" description="Bundy and QR remain coexisting sources; this only sets a viewing preference."><select value={String(draftSettings["admin.attendance.default_source"])} disabled={!canManage || isSaving} onChange={(event) => updateSetting("admin.attendance.default_source", event.target.value)}><option value="all">All attendance sources</option><option value="bundy">Bundy / Biometric</option><option value="qr">QR Attendance</option><option value="unified">Unified Attendance</option></select></SettingRow><SettingRow label="Show verification status" description="Keep HR verification context visible in attendance workspace summaries."><ToggleControl id="show-verification-status" checked={Boolean(draftSettings["admin.attendance.show_verification_status"])} disabled={!canManage || isSaving} label="Show verification status" onChange={(checked) => updateSetting("admin.attendance.show_verification_status", checked)} /></SettingRow></div>
        <div className="admin-settings-boundary-note"><Icon name="shield" /><span>These are administrator viewing preferences only. Attendance policy thresholds, correction approval, HR verification, and payroll readiness remain outside System &amp; Settings.</span></div>
      </>
    );
  }

  function renderIntegrationSection() {
    if (!data) return null;
    return (
      <>
        <div className="admin-settings-section-heading"><p className="section-kicker">Integration boundary</p><h2 id="settings-section-title">Integration workspace</h2><p>Review safe provider and mode facts without exposing credentials, endpoints, or external-system configuration.</p></div>
        <div className="admin-settings-form"><SettingRow label="Integration monitoring" description="Connection health and synchronization activity remain in the dedicated monitoring workspace."><Link className="button-secondary" href="/admin/integration-monitoring">Open monitoring <Icon name="arrow" /></Link></SettingRow><SettingRow label="External system configuration" description="HRPS, Bundy, Payroll, and Accounting retain ownership of their own systems."><div className="admin-settings-readonly-value"><strong>Read-only here</strong><small>Safe status only; credentials and endpoints are not exposed</small></div></SettingRow></div>
        <div className="admin-settings-integration-grid">{data.integrations.map((integration) => <IntegrationCard key={integration.key} integration={integration} />)}</div>
      </>
    );
  }

  function renderAuditSection() {
    if (!draftSettings) return null;
    return (
      <>
        <div className="admin-settings-section-heading"><p className="section-kicker">Traceability workspace</p><h2 id="settings-section-title">Audit &amp; Logs preferences</h2><p>Set safe viewing defaults for recorded activity. Audit records remain read-only and are never deleted here.</p></div>
        <div className="admin-settings-form"><SettingRow label="Default audit page size" description="Choose how many activity rows the Audit Logs workspace requests at a time."><select value={String(draftSettings["admin.audit.page_size"])} disabled={!canManage || isSaving} onChange={(event) => updateSetting("admin.audit.page_size", Number(event.target.value))}><option value="10">10 rows</option><option value="25">25 rows</option><option value="50">50 rows</option></select></SettingRow><SettingRow label="Default audit outcome" description="Preselect a non-destructive outcome filter when opening Audit Logs."><select value={String(draftSettings["admin.audit.default_outcome"])} disabled={!canManage || isSaving} onChange={(event) => updateSetting("admin.audit.default_outcome", event.target.value)}><option value="all">All outcomes</option><option value="Successful">Successful</option><option value="Blocked">Blocked</option><option value="Failed">Failed</option></select></SettingRow></div>
        <div className="admin-settings-status-preview"><StatusBadge tone="muted">Read-only activity</StatusBadge><Link href="/admin/audit-logs">Open Audit Logs <Icon name="arrow" /></Link></div>
      </>
    );
  }

  function renderSystemInfoSection() {
    if (!data) return null;
    return (
      <>
        <div className="admin-settings-section-heading"><p className="section-kicker">Safe application metadata</p><h2 id="settings-section-title">System information</h2><p>Review non-sensitive application details and navigate to the workspaces that own operational records.</p></div>
        <div className="admin-settings-info-grid"><div><span>Application name</span><strong>{settingValue(data, "application.display_name", "AU-JSC Employee Attendance Integration System")}</strong></div><div><span>Application version</span><strong>{data.systemInfo.version}</strong></div><div><span>Frontend framework</span><strong>Next.js 16.3.5 · React 19.2.8</strong></div><div><span>Environment</span><strong>{data.systemInfo.environment}</strong></div><div><span>Current campus</span><strong>AU-JSC · {data.systemInfo.timezone}</strong></div><div><span>Application status</span><StatusBadge tone="success">{data.systemInfo.status}</StatusBadge></div></div>
        <div className="admin-settings-system-links"><Link href="/admin/integration-monitoring"><Icon name="monitoring" /><span>Integration Monitoring</span><Icon name="arrow" /></Link><Link href="/admin/audit-logs"><Icon name="audit" /><span>Audit Logs</span><Icon name="arrow" /></Link><Link href="/admin/user-accounts"><Icon name="users" /><span>User Accounts</span><Icon name="arrow" /></Link><Link href="/admin/roles-permissions"><Icon name="roles" /><span>Roles &amp; Permissions</span><Icon name="arrow" /></Link></div>
      </>
    );
  }

  function renderActiveSection() {
    switch (activeSection) {
      case "general": return renderGeneralSection();
      case "interface": return renderInterfaceSection();
      case "attendance": return renderAttendanceSection();
      case "integration": return renderIntegrationSection();
      case "audit": return renderAuditSection();
      case "system-info": return renderSystemInfoSection();
      default: return renderGeneralSection();
    }
  }

  if (loadError && !data) {
    return <SectionCard title="System settings could not be loaded" eyebrow="Configuration unavailable"><div className="panel-body admin-settings-load-error"><p>{feedback || "The settings registry or persisted configuration is temporarily unavailable."}</p><button type="button" className="button-secondary" onClick={() => void loadData()} disabled={isLoading}>{isLoading ? "Loading…" : "Try again"}</button></div></SectionCard>;
  }

  if (!data || !draftSettings || !savedSettings) return null;

  const summaryMetrics = [
    { label: "Registered settings", value: String(data.summary.totalSettings), note: "Controlled registry", icon: "settings" as const, tone: "info" as const },
    { label: "Runtime editable", value: String(data.summary.editableSettings), note: canManage ? "Permission available" : "Read-only access", icon: "key" as const, tone: "success" as const },
    { label: "Read-only boundaries", value: String(data.summary.readOnlySettings), note: "Environment and derived", icon: "shield" as const, tone: "success" as const },
    { label: "Change state", value: isDirty ? "Draft" : "Saved", note: isDirty ? "Review before saving" : "Canonical values loaded", icon: isDirty ? ("warning" as const) : ("check" as const), tone: isDirty ? ("warning" as const) : ("success" as const) },
  ];

  return (
    <div className={isLoading || isSaving ? "admin-settings-manager is-loading" : "admin-settings-manager"} aria-busy={isLoading || isSaving}>
      <section className="metric-grid admin-settings-summary" aria-label="Settings workspace summary">{summaryMetrics.map((metric) => <SummaryCard key={metric.label} {...metric} />)}</section>
      <SectionCard title="Settings ownership flow" eyebrow="Application preferences to safe boundaries"><FlowDiagram className="admin-settings-flow" nodes={[{ label: "IT Administrator", detail: "Select supported values", icon: "user", status: canManage ? "Authorized" : "View only", tone: "info" }, { label: "Settings API", detail: "Validate and persist", icon: "settings", status: "Controlled", tone: "success" }, { label: "Runtime behavior", detail: "Resolve canonical values", icon: "activity", status: "Applied", tone: "warning" }, { label: "Source boundaries", detail: "External ownership", icon: "shield", status: "Protected", tone: "muted" }]} /><p className="data-flow-note admin-settings-flow-note">System &amp; Settings controls this integration application only. HRPS, Bundy, Payroll, and Accounting remain independent systems with their own ownership and configuration boundaries.</p></SectionCard>
      <SectionCard title="Settings workspace" eyebrow="Application-level configuration">
        <div className={`admin-settings-workspace admin-settings-density-${String(draftSettings["admin.settings.density"])}`}>
          <nav className="admin-settings-nav" aria-label="Settings sections"><div className="admin-settings-nav-heading"><span className="admin-settings-nav-icon"><Icon name="settings" /></span><div><strong>{String(draftSettings["application.display_name"])}</strong><small>{canManage ? "IT Administrator" : "Read-only administrator access"}</small></div></div><div className="admin-settings-nav-list">{settingsSections.map((section) => <button type="button" className={`admin-settings-nav-item ${activeSection === section.id ? "is-active" : ""}`} key={section.id} aria-current={activeSection === section.id ? "page" : undefined} onClick={() => { setActiveSection(section.id); setFeedback(""); }}><Icon name={section.icon} /><span><strong>{section.label}</strong><small>{section.description}</small></span></button>)}</div></nav>
          <div className="admin-settings-panel" aria-labelledby="settings-section-title"><div className="admin-settings-panel-content">{renderActiveSection()}</div><div className={`admin-settings-save-bar ${isDirty ? "is-dirty" : ""}`} aria-live="polite"><div><strong>{isDirty ? "Unsaved changes" : "Settings are up to date"}</strong><small>{data.updatedAt ? `Last saved ${data.updatedBy ? `by ${data.updatedBy} ` : ""}on the server.` : "No runtime override has been saved; controlled defaults are active."}</small></div><div className="admin-settings-save-actions"><button type="button" className="button-secondary" onClick={resetToDefaults} disabled={!canManage || isSaving}>Reset defaults</button><button type="button" className="button-secondary" onClick={discardSettings} disabled={!isDirty || isSaving}>Discard</button><button type="button" className="button-primary" onClick={() => void saveSettings()} disabled={!canManage || !isDirty || isSaving}><Icon name="check" />{isSaving ? "Saving…" : "Save changes"}</button></div></div><p className={`admin-settings-feedback${feedbackIsError ? " is-error" : ""}`} aria-live="polite">{feedback}</p></div>
        </div>
      </SectionCard>
      <SectionCard title="Application readiness" eyebrow="Safe settings coverage"><div className="panel-body admin-settings-readiness"><ProgressList items={[{ label: "Controlled settings registry", value: "Ready", percent: 100, tone: "success" }, { label: "Server validation and persistence", value: canManage ? "Available" : "Read-only", percent: 100, tone: "success" }, { label: "External-system boundaries", value: "Protected", percent: 100, tone: "success" }]} /></div></SectionCard>
    </div>
  );
}
