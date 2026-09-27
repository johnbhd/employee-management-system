"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import { FlowDiagram } from "@/components/admin/shared/FlowDiagram";
import { ProgressList } from "@/components/admin/shared/ProgressList";
import { Icon } from "@/components/ui/Icon";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SummaryCard } from "@/components/ui/SummaryCard";
import type { AdminAuditOutcome } from "@/data/admin-audit-logs";
import type { IconName } from "@/types/ui";

type SettingsSectionId = "general" | "interface" | "attendance" | "integration" | "audit" | "system-info";
type DateFormat = "short" | "long" | "iso";
type TimeFormat = "12-hour" | "24-hour";
type SettingsDensity = "comfortable" | "compact";
type AttendanceView = "today" | "week" | "month";
type AttendanceSource = "all" | "bundy" | "qr" | "unified";
type AuditOutcomePreference = "all" | AdminAuditOutcome;
type SupportedPageSize = 10 | 25 | 50;

type SettingsState = {
  systemDisplayName: string;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  settingsDensity: SettingsDensity;
  showStatusDescriptions: boolean;
  attendanceView: AttendanceView;
  attendanceSource: AttendanceSource;
  showVerificationStatus: boolean;
  auditPageSize: SupportedPageSize;
  auditOutcome: AuditOutcomePreference;
};

type SettingsSection = {
  id: SettingsSectionId;
  label: string;
  description: string;
  icon: IconName;
};

const settingsStorageKey = "au-jsc-admin-settings";

const defaultSettings: SettingsState = {
  systemDisplayName: "AU-JSC Employee Attendance Integration System",
  dateFormat: "short",
  timeFormat: "12-hour",
  settingsDensity: "comfortable",
  showStatusDescriptions: true,
  attendanceView: "today",
  attendanceSource: "all",
  showVerificationStatus: true,
  auditPageSize: 10,
  auditOutcome: "all",
};

const settingsSections: readonly SettingsSection[] = [
  {
    id: "general",
    label: "General",
    description: "Application identity and display formats",
    icon: "settings",
  },
  {
    id: "interface",
    label: "Interface",
    description: "Admin workspace presentation",
    icon: "activity",
  },
  {
    id: "attendance",
    label: "Attendance",
    description: "Safe workspace defaults",
    icon: "clock",
  },
  {
    id: "integration",
    label: "Integration",
    description: "Monitored application boundaries",
    icon: "monitoring",
  },
  {
    id: "audit",
    label: "Audit & Logs",
    description: "Activity display preferences",
    icon: "audit",
  },
  {
    id: "system-info",
    label: "System Information",
    description: "Safe application metadata",
    icon: "info",
  },
];

const dateFormatOptions: readonly { value: DateFormat; label: string }[] = [
  { value: "short", label: "Sep 27, 2026" },
  { value: "long", label: "September 27, 2026" },
  { value: "iso", label: "2026-09-27" },
];

const attendanceViewOptions: readonly { value: AttendanceView; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "Current week" },
  { value: "month", label: "Current month" },
];

const attendanceSourceOptions: readonly { value: AttendanceSource; label: string }[] = [
  { value: "all", label: "All attendance sources" },
  { value: "bundy", label: "Bundy / Biometric" },
  { value: "qr", label: "QR Attendance" },
  { value: "unified", label: "Unified Attendance" },
];

const pageSizeOptions: readonly SupportedPageSize[] = [10, 25, 50];
const auditOutcomeOptions: readonly { value: AuditOutcomePreference; label: string }[] = [
  { value: "all", label: "All outcomes" },
  { value: "Successful", label: "Successful" },
  { value: "Blocked", label: "Blocked" },
  { value: "Failed", label: "Failed" },
];

function isValue<T extends string>(value: unknown, options: readonly T[]): value is T {
  return typeof value === "string" && options.includes(value as T);
}

function readSavedSettings(): SettingsState {
  if (typeof window === "undefined") return defaultSettings;

  const storedValue = window.localStorage.getItem(settingsStorageKey);
  if (!storedValue) return defaultSettings;

  try {
    const stored = JSON.parse(storedValue) as Partial<SettingsState>;

    return {
      ...defaultSettings,
      systemDisplayName: typeof stored.systemDisplayName === "string"
        ? stored.systemDisplayName
        : defaultSettings.systemDisplayName,
      dateFormat: isValue(stored.dateFormat, dateFormatOptions.map((option) => option.value))
        ? stored.dateFormat
        : defaultSettings.dateFormat,
      timeFormat: isValue(stored.timeFormat, ["12-hour", "24-hour"])
        ? stored.timeFormat
        : defaultSettings.timeFormat,
      settingsDensity: isValue(stored.settingsDensity, ["comfortable", "compact"])
        ? stored.settingsDensity
        : defaultSettings.settingsDensity,
      showStatusDescriptions: typeof stored.showStatusDescriptions === "boolean"
        ? stored.showStatusDescriptions
        : defaultSettings.showStatusDescriptions,
      attendanceView: isValue(stored.attendanceView, attendanceViewOptions.map((option) => option.value))
        ? stored.attendanceView
        : defaultSettings.attendanceView,
      attendanceSource: isValue(stored.attendanceSource, attendanceSourceOptions.map((option) => option.value))
        ? stored.attendanceSource
        : defaultSettings.attendanceSource,
      showVerificationStatus: typeof stored.showVerificationStatus === "boolean"
        ? stored.showVerificationStatus
        : defaultSettings.showVerificationStatus,
      auditPageSize: pageSizeOptions.includes(stored.auditPageSize as SupportedPageSize)
        ? stored.auditPageSize as SupportedPageSize
        : defaultSettings.auditPageSize,
      auditOutcome: isValue(stored.auditOutcome, auditOutcomeOptions.map((option) => option.value))
        ? stored.auditOutcome
        : defaultSettings.auditOutcome,
    };
  } catch {
    return defaultSettings;
  }
}

function formatTimePreview(timeFormat: TimeFormat) {
  return timeFormat === "24-hour" ? "16:30" : "4:30 PM";
}

function formatDatePreview(dateFormat: DateFormat) {
  return dateFormatOptions.find((option) => option.value === dateFormat)?.label ?? "Sep 27, 2026";
}

type SettingRowProps = {
  label: string;
  description: string;
  children: ReactNode;
};

function SettingRow({ label, description, children }: SettingRowProps) {
  return (
    <div className="admin-settings-row">
      <div className="admin-settings-row-copy">
        <strong>{label}</strong>
        <p>{description}</p>
      </div>
      <div className="admin-settings-row-control">{children}</div>
    </div>
  );
}

type ToggleControlProps = {
  id: string;
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
};

function ToggleControl({ id, checked, label, onChange }: ToggleControlProps) {
  return (
    <label className="admin-settings-toggle" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="admin-settings-toggle-track" aria-hidden="true">
        <span />
      </span>
      <span className="admin-settings-toggle-state">{checked ? "On" : "Off"}</span>
      <span className="sr-only">{label}</span>
    </label>
  );
}

export function SystemSettingsManager() {
  const [activeSection, setActiveSection] = useState<SettingsSectionId>("general");
  const [savedSettings, setSavedSettings] = useState<SettingsState>(defaultSettings);
  const [draftSettings, setDraftSettings] = useState<SettingsState>(defaultSettings);
  const [fieldError, setFieldError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const settings = readSavedSettings();
    const hydrationId = window.setTimeout(() => {
      setSavedSettings(settings);
      setDraftSettings(settings);
      setIsHydrated(true);
    }, 0);

    return () => window.clearTimeout(hydrationId);
  }, []);

  const isDirty = useMemo(
    () => JSON.stringify(savedSettings) !== JSON.stringify(draftSettings),
    [draftSettings, savedSettings],
  );

  const summaryMetrics = [
    {
      label: "Settings areas",
      value: String(settingsSections.length),
      note: "Application preferences",
      icon: "settings" as const,
      tone: "info" as const,
    },
    {
      label: "Read-only boundaries",
      value: "4",
      note: "External systems protected",
      icon: "shield" as const,
      tone: "success" as const,
    },
    {
      label: "Audit page size",
      value: `${draftSettings.auditPageSize}`,
      note: "Rows per activity page",
      icon: "audit" as const,
      tone: "warning" as const,
    },
    {
      label: "Change state",
      value: isDirty ? "Draft" : "Saved",
      note: isDirty ? "Review before saving" : "Preferences up to date",
      icon: isDirty ? ("warning" as const) : ("check" as const),
      tone: isDirty ? ("warning" as const) : ("success" as const),
    },
  ];

  function updateSetting<Key extends keyof SettingsState>(key: Key, value: SettingsState[Key]) {
    setDraftSettings((current) => ({ ...current, [key]: value }));
    setFeedback("");

    if (key === "systemDisplayName" && typeof value === "string" && value.trim()) {
      setFieldError("");
    }
  }

  function saveSettings() {
    if (!draftSettings.systemDisplayName.trim()) {
      setFieldError("System display name is required.");
      setActiveSection("general");
      return;
    }

    const normalizedSettings = {
      ...draftSettings,
      systemDisplayName: draftSettings.systemDisplayName.trim(),
    };

    window.localStorage.setItem(settingsStorageKey, JSON.stringify(normalizedSettings));
    setSavedSettings(normalizedSettings);
    setDraftSettings(normalizedSettings);
    setFeedback("Settings updated.");
    setFieldError("");
  }

  function discardSettings() {
    setDraftSettings(savedSettings);
    setFieldError("");
    setFeedback("Unsaved changes discarded.");
  }

  function renderGeneralSection() {
    return (
      <>
        <div className="admin-settings-section-heading">
          <p className="section-kicker">Application identity</p>
          <h2 id="settings-section-title">General settings</h2>
          <p>Keep the application identity and date/time presentation consistent across the administrator workspace.</p>
        </div>
        <div className="admin-settings-form">
          <SettingRow label="System display name" description="The application name shown in this settings workspace.">
            <div className="admin-settings-input-group">
              <input
                className={fieldError ? "has-error" : ""}
                value={draftSettings.systemDisplayName}
                onChange={(event) => updateSetting("systemDisplayName", event.target.value)}
                aria-describedby={fieldError ? "system-display-name-error" : "system-display-name-help"}
              />
              <small id="system-display-name-help">Display text only; it does not rename the project package or routes.</small>
              {fieldError ? <small id="system-display-name-error" className="admin-settings-field-error">{fieldError}</small> : null}
            </div>
          </SettingRow>
          <SettingRow label="Campus / institution" description="The current project context is fixed to the AU-JSC campus.">
            <div className="admin-settings-readonly-value">
              <strong>Arellano University – Juan Sumulong Campus</strong>
              <small>Read-only application context</small>
            </div>
          </SettingRow>
          <SettingRow label="Application timezone" description="The current project uses the AU-JSC local display timezone.">
            <div className="admin-settings-readonly-value">
              <strong>Asia/Manila</strong>
              <small>Read-only display context</small>
            </div>
          </SettingRow>
          <SettingRow label="Date format" description="Preview the date format used by this settings workspace.">
            <select
              value={draftSettings.dateFormat}
              onChange={(event) => updateSetting("dateFormat", event.target.value as DateFormat)}
            >
              {dateFormatOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </SettingRow>
          <SettingRow label="Time format" description="Preview the time format used by this settings workspace.">
            <select
              value={draftSettings.timeFormat}
              onChange={(event) => updateSetting("timeFormat", event.target.value as TimeFormat)}
            >
              <option value="12-hour">12-hour · 4:30 PM</option>
              <option value="24-hour">24-hour · 16:30</option>
            </select>
          </SettingRow>
        </div>
        <div className="admin-settings-preview" aria-live="polite">
          <Icon name="calendar" />
          <span>Format preview</span>
          <strong>{formatDatePreview(draftSettings.dateFormat)} · {formatTimePreview(draftSettings.timeFormat)}</strong>
        </div>
      </>
    );
  }

  function renderInterfaceSection() {
    return (
      <>
        <div className="admin-settings-section-heading">
          <p className="section-kicker">Workspace presentation</p>
          <h2 id="settings-section-title">Interface preferences</h2>
          <p>Adjust the density and supporting descriptions used while reviewing application settings.</p>
        </div>
        <div className="admin-settings-form">
          <SettingRow label="Settings density" description="Choose the amount of spacing between settings rows on this workspace.">
            <select
              value={draftSettings.settingsDensity}
              onChange={(event) => updateSetting("settingsDensity", event.target.value as SettingsDensity)}
            >
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
            </select>
          </SettingRow>
          <SettingRow label="Status descriptions" description="Keep supporting state descriptions visible beside settings feedback.">
            <ToggleControl
              id="show-status-descriptions"
              checked={draftSettings.showStatusDescriptions}
              label="Show status descriptions"
              onChange={(checked) => updateSetting("showStatusDescriptions", checked)}
            />
          </SettingRow>
        </div>
        <div className="admin-settings-status-preview">
          <StatusBadge tone={draftSettings.showStatusDescriptions ? "success" : "muted"}>
            {draftSettings.showStatusDescriptions ? "Descriptions visible" : "Compact status only"}
          </StatusBadge>
          {draftSettings.showStatusDescriptions ? <span>Supporting descriptions remain available beside controls.</span> : null}
        </div>
      </>
    );
  }

  function renderAttendanceSection() {
    return (
      <>
        <div className="admin-settings-section-heading">
          <p className="section-kicker">Attendance workspace</p>
          <h2 id="settings-section-title">Attendance preferences</h2>
          <p>Choose safe viewing defaults without changing attendance rules, verification authority, or source ownership.</p>
        </div>
        <div className="admin-settings-form">
          <SettingRow label="Default attendance view" description="The time range to select when opening an attendance workspace.">
            <select
              value={draftSettings.attendanceView}
              onChange={(event) => updateSetting("attendanceView", event.target.value as AttendanceView)}
            >
              {attendanceViewOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </SettingRow>
          <SettingRow label="Default attendance source" description="Bundy and QR remain coexisting sources; this only sets a viewing preference.">
            <select
              value={draftSettings.attendanceSource}
              onChange={(event) => updateSetting("attendanceSource", event.target.value as AttendanceSource)}
            >
              {attendanceSourceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </SettingRow>
          <SettingRow label="Show verification status" description="Keep HR verification context visible in attendance workspace summaries.">
            <ToggleControl
              id="show-verification-status"
              checked={draftSettings.showVerificationStatus}
              label="Show verification status"
              onChange={(checked) => updateSetting("showVerificationStatus", checked)}
            />
          </SettingRow>
        </div>
        <div className="admin-settings-boundary-note">
          <Icon name="shield" />
          <span>Attendance policy thresholds, correction approval, HR verification, and payroll readiness remain outside System &amp; Settings.</span>
        </div>
      </>
    );
  }

  function renderIntegrationSection() {
    return (
      <>
        <div className="admin-settings-section-heading">
          <p className="section-kicker">Integration boundary</p>
          <h2 id="settings-section-title">Integration workspace</h2>
          <p>Review where operational monitoring lives without exposing credentials, endpoints, or external-system configuration.</p>
        </div>
        <div className="admin-settings-form">
          <SettingRow label="Integration monitoring" description="Connection health and synchronization activity remain in the dedicated monitoring workspace.">
            <Link className="button-secondary" href="/admin/integration-monitoring">
              Open monitoring
              <Icon name="arrow" />
            </Link>
          </SettingRow>
          <SettingRow label="External system configuration" description="HRPS, Bundy, Payroll, and Accounting retain ownership of their own systems.">
            <div className="admin-settings-readonly-value">
              <strong>Not managed here</strong>
              <small>Credentials and endpoints are not exposed</small>
            </div>
          </SettingRow>
        </div>
        <div className="admin-settings-link-grid">
          <Link href="/admin/hrps-integration">
            <Icon name="hrps" />
            <span>HRPS Integration</span>
            <Icon name="arrow" />
          </Link>
          <Link href="/admin/bundy-biometric-etl">
            <Icon name="bundy" />
            <span>Bundy / Biometric ETL</span>
            <Icon name="arrow" />
          </Link>
          <Link href="/admin/payroll-integration">
            <Icon name="payroll" />
            <span>Payroll Integration</span>
            <Icon name="arrow" />
          </Link>
          <Link href="/admin/accounting-integration">
            <Icon name="accounting" />
            <span>Accounting Integration</span>
            <Icon name="arrow" />
          </Link>
        </div>
      </>
    );
  }

  function renderAuditSection() {
    return (
      <>
        <div className="admin-settings-section-heading">
          <p className="section-kicker">Traceability workspace</p>
          <h2 id="settings-section-title">Audit &amp; Logs preferences</h2>
          <p>Set safe viewing defaults for recorded activity. Audit records remain read-only and are never deleted here.</p>
        </div>
        <div className="admin-settings-form">
          <SettingRow label="Default audit page size" description="Choose how many activity rows the Audit Logs workspace shows at a time.">
            <select
              value={draftSettings.auditPageSize}
              onChange={(event) => updateSetting("auditPageSize", Number(event.target.value) as SupportedPageSize)}
            >
              {pageSizeOptions.map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize} rows
                </option>
              ))}
            </select>
          </SettingRow>
          <SettingRow label="Default audit outcome" description="Preselect a non-destructive outcome filter when opening Audit Logs.">
            <select
              value={draftSettings.auditOutcome}
              onChange={(event) => updateSetting("auditOutcome", event.target.value as AuditOutcomePreference)}
            >
              {auditOutcomeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </SettingRow>
        </div>
        <div className="admin-settings-status-preview">
          <StatusBadge tone="muted">Read-only activity</StatusBadge>
          <Link href="/admin/audit-logs">Open Audit Logs <Icon name="arrow" /></Link>
        </div>
      </>
    );
  }

  function renderSystemInfoSection() {
    const environment = process.env.NODE_ENV === "production" ? "Production" : "Development";

    return (
      <>
        <div className="admin-settings-section-heading">
          <p className="section-kicker">Safe application metadata</p>
          <h2 id="settings-section-title">System information</h2>
          <p>Review non-sensitive application details and navigate to the workspaces that own operational records.</p>
        </div>
        <div className="admin-settings-info-grid">
          <div>
            <span>Application name</span>
            <strong>{draftSettings.systemDisplayName}</strong>
          </div>
          <div>
            <span>Application version</span>
            <strong>0.1.0</strong>
          </div>
          <div>
            <span>Frontend framework</span>
            <strong>Next.js 16.3.5 · React 19.2.8</strong>
          </div>
          <div>
            <span>Environment</span>
            <strong>{environment}</strong>
          </div>
          <div>
            <span>Current campus</span>
            <strong>AU-JSC · Asia/Manila</strong>
          </div>
          <div>
            <span>Application status</span>
            <StatusBadge tone="success">Operational</StatusBadge>
          </div>
        </div>
        <div className="admin-settings-system-links">
          <Link href="/admin/integration-monitoring">
            <Icon name="monitoring" />
            <span>Integration Monitoring</span>
            <Icon name="arrow" />
          </Link>
          <Link href="/admin/audit-logs">
            <Icon name="audit" />
            <span>Audit Logs</span>
            <Icon name="arrow" />
          </Link>
          <Link href="/admin/user-accounts">
            <Icon name="users" />
            <span>User Accounts</span>
            <Icon name="arrow" />
          </Link>
          <Link href="/admin/roles-permissions">
            <Icon name="roles" />
            <span>Roles &amp; Permissions</span>
            <Icon name="arrow" />
          </Link>
        </div>
      </>
    );
  }

  function renderActiveSection() {
    switch (activeSection) {
      case "general":
        return renderGeneralSection();
      case "interface":
        return renderInterfaceSection();
      case "attendance":
        return renderAttendanceSection();
      case "integration":
        return renderIntegrationSection();
      case "audit":
        return renderAuditSection();
      case "system-info":
        return renderSystemInfoSection();
      default:
        return renderGeneralSection();
    }
  }

  return (
    <>
      <section className="metric-grid admin-settings-summary" aria-label="Settings workspace summary">
        {summaryMetrics.map((metric) => (
          <SummaryCard key={metric.label} {...metric} />
        ))}
      </section>

      <SectionCard title="Settings ownership flow" eyebrow="Application preferences to safe boundaries">
        <FlowDiagram
          className="admin-settings-flow"
          nodes={[
            {
              label: "IT Administrator",
              detail: "Select preferences",
              icon: "user",
              status: "Authorized",
              tone: "info",
            },
            {
              label: "Application settings",
              detail: "Save safe values",
              icon: "settings",
              status: "Controlled",
              tone: "success",
            },
            {
              label: "Workspace behavior",
              detail: "Display defaults",
              icon: "activity",
              status: "Applied",
              tone: "warning",
            },
            {
              label: "Source boundaries",
              detail: "External ownership",
              icon: "shield",
              status: "Protected",
              tone: "muted",
            },
          ]}
        />
        <p className="data-flow-note admin-settings-flow-note">
          System &amp; Settings controls this integration application only. HRPS, Bundy, Payroll, and Accounting remain
          independent systems with their own ownership and configuration boundaries.
        </p>
      </SectionCard>

      <SectionCard title="Settings workspace" eyebrow="Application-level configuration">
        <div className={`admin-settings-workspace admin-settings-density-${draftSettings.settingsDensity}`}>
          <nav className="admin-settings-nav" aria-label="Settings sections">
            <div className="admin-settings-nav-heading">
              <span className="admin-settings-nav-icon"><Icon name="settings" /></span>
              <div>
                <strong>Application settings</strong>
                <small>IT Administrator</small>
              </div>
            </div>
            <div className="admin-settings-nav-list">
              {settingsSections.map((section) => (
                <button
                  type="button"
                  className={`admin-settings-nav-item ${activeSection === section.id ? "is-active" : ""}`}
                  key={section.id}
                  aria-current={activeSection === section.id ? "page" : undefined}
                  onClick={() => {
                    setActiveSection(section.id);
                    setFeedback("");
                  }}
                >
                  <Icon name={section.icon} />
                  <span>
                    <strong>{section.label}</strong>
                    <small>{section.description}</small>
                  </span>
                </button>
              ))}
            </div>
          </nav>

          <div className="admin-settings-panel" aria-labelledby="settings-section-title">
            <div className="admin-settings-panel-content">{renderActiveSection()}</div>
            <div className={`admin-settings-save-bar ${isDirty ? "is-dirty" : ""}`} aria-live="polite">
              <div>
                <strong>{isDirty ? "Unsaved changes" : "Settings are up to date"}</strong>
                <small>{isHydrated ? "Safe preferences are stored in this browser." : "Loading saved preferences..."}</small>
              </div>
              <div className="admin-settings-save-actions">
                <button type="button" className="button-secondary" onClick={discardSettings} disabled={!isDirty}>
                  Discard
                </button>
                <button type="button" className="button-primary" onClick={saveSettings} disabled={!isDirty}>
                  <Icon name="check" />
                  Save changes
                </button>
              </div>
            </div>
            <p className="admin-settings-feedback" aria-live="polite">{feedback}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Application readiness" eyebrow="Safe settings coverage">
        <div className="panel-body admin-settings-readiness">
          <ProgressList
            items={[
              {
                label: "Application identity",
                value: "Ready",
                percent: 100,
                tone: "success",
              },
              {
                label: "Workspace preferences",
                value: "Available",
                percent: 78,
                tone: "success",
              },
              {
                label: "External-system boundaries",
                value: "Protected",
                percent: 100,
                tone: "success",
              },
            ]}
          />
        </div>
      </SectionCard>
    </>
  );
}
