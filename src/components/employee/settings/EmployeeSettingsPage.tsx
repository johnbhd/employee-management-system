"use client";

import Link from "next/link";
import { useState } from "react";

import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { Icon } from "@/components/ui/Icon";
import { formatCampusDateKeyLabel } from "@/lib/campus-time";
import { getRoleLabel } from "@/lib/auth/roles";
import type { ApiErrorResponse } from "@/types/api/responses";
import type {
  AttendanceDemoSettingsData,
  AttendanceDemoSettingsSuccessResponse,
} from "@/types/attendance-demo";
import type { SessionUser } from "@/types/auth";
import type { EmployeeReference } from "@/types/employee";

type EmployeeSettings = {
  attendanceReminders: boolean;
};

type EmployeeSettingsPageProps = {
  user: SessionUser;
  employee: EmployeeReference | null;
  initialDemoSettings: AttendanceDemoSettingsData;
};

const settingsStorageKey = "au-jsc-employee-settings";
const defaultSettings: EmployeeSettings = {
  attendanceReminders: true,
};

function readSavedSettings(): EmployeeSettings {
  try {
    const storedValue = window.localStorage.getItem(settingsStorageKey);

    if (!storedValue) {
      return defaultSettings;
    }

    const parsedValue = JSON.parse(storedValue) as Partial<EmployeeSettings>;

    return {
      attendanceReminders:
        typeof parsedValue.attendanceReminders === "boolean"
          ? parsedValue.attendanceReminders
          : defaultSettings.attendanceReminders,
    };
  } catch {
    return defaultSettings;
  }
}

function saveSettings(settings: EmployeeSettings) {
  try {
    window.localStorage.setItem(settingsStorageKey, JSON.stringify(settings));
    return "Saved on this device.";
  } catch {
    return "Preference changed for this session.";
  }
}

export function EmployeeSettingsPage({
  user,
  employee,
  initialDemoSettings,
}: EmployeeSettingsPageProps) {
  const [settings, setSettings] = useState<EmployeeSettings>(() => (
    typeof window === "undefined" ? defaultSettings : readSavedSettings()
  ));
  const [feedback, setFeedback] = useState("");
  const [demoSettings, setDemoSettings] = useState(initialDemoSettings);
  const [demoEnabled, setDemoEnabled] = useState(initialDemoSettings.enabled);
  const [demoTime, setDemoTime] = useState(initialDemoSettings.customTime ?? "07:30");
  const [demoFeedback, setDemoFeedback] = useState("");
  const [demoSaving, setDemoSaving] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resettingDemo, setResettingDemo] = useState(false);

  function updateSetting(key: keyof EmployeeSettings, value: boolean) {
    const nextSettings = { ...settings, [key]: value };

    setSettings(nextSettings);
    setFeedback(saveSettings(nextSettings));
  }

  function resetSettings() {
    setSettings(defaultSettings);
    setFeedback(saveSettings(defaultSettings));
  }

  async function saveDemoAttendanceSettings() {
    if (demoEnabled && !demoTime) {
      setDemoFeedback("Choose a custom attendance time before saving.");
      return;
    }

    setDemoSaving(true);
    setDemoFeedback("");

    try {
      const response = await fetch("/api/employee/attendance-demo", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          enabled: demoEnabled,
          customTime: demoEnabled ? demoTime : null,
        }),
      });
      const body = await response.json() as AttendanceDemoSettingsSuccessResponse | ApiErrorResponse;

      if (!response.ok || !body.success) {
        throw new Error(body.success ? "Demo settings could not be saved." : body.error.message);
      }

      setDemoSettings(body.data);
      setDemoEnabled(body.data.enabled);
      setDemoTime(body.data.customTime ?? demoTime);
      setDemoFeedback("Demo attendance settings saved.");
    } catch (error) {
      setDemoFeedback(
        error instanceof Error
          ? error.message
          : "Demo attendance settings could not be saved.",
      );
    } finally {
      setDemoSaving(false);
    }
  }

  async function resetDemoAttendance() {
    setResettingDemo(true);
    setDemoFeedback("");

    try {
      const response = await fetch("/api/employee/attendance-demo/reset", {
        method: "POST",
        headers: { Accept: "application/json" },
      });
      const body = await response.json() as AttendanceDemoSettingsSuccessResponse | ApiErrorResponse;

      if (!response.ok || !body.success) {
        throw new Error(body.success ? "The simulated attendance could not be reset." : body.error.message);
      }

      setDemoSettings(body.data);
      setDemoEnabled(body.data.enabled);
      setDemoTime(body.data.customTime ?? demoTime);
      setResetDialogOpen(false);
      setDemoFeedback("Today's simulated QR attendance was reset.");
    } catch (error) {
      setDemoFeedback(
        error instanceof Error
          ? error.message
          : "The simulated attendance could not be reset.",
      );
    } finally {
      setResettingDemo(false);
    }
  }

  const accountDetails = [
    ["Display name", user.displayName],
    ["Username", user.username],
    ["Employee ID", employee?.employeeId ?? user.employeeId ?? "Not linked"],
    ["Department", employee?.department ?? "Not available"],
    ["Position", employee?.position ?? "Not assigned"],
    ["Role", getRoleLabel(user.role)],
    ["Account status", "Active"],
  ] as const;

  return (
    <div className="employee-settings-page">
      <div className="employee-settings-intro">
        <span className="employee-settings-kicker">Personal settings</span>
        <p>
          Review your official account information, update your password, and
          manage the employee portal preferences saved for this device.
        </p>
      </div>

      <section
        className="employee-settings-section"
        aria-labelledby="employee-settings-account-heading"
      >
        <div className="employee-settings-section-heading">
          <div>
            <span className="employee-settings-kicker">Account</span>
            <h2 id="employee-settings-account-heading">Account information</h2>
          </div>
          <p>Official employee information is managed through HRPS.</p>
        </div>

        <dl className="employee-settings-account-details">
          {accountDetails.map(([label, value]) => (
            <div className="employee-settings-account-item" key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>

        <div className="employee-settings-link-grid">
          <Link href="/employee/profile" className="employee-settings-link">
            <span className="employee-settings-link-icon" aria-hidden="true">
              <Icon name="user" />
            </span>
            <span>
              <strong>View profile</strong>
              <small>Review your official employee information.</small>
            </span>
            <Icon name="arrow" />
          </Link>
        </div>

        <p className="employee-settings-note">
          HRPS-owned employee details are read-only in this portal.
        </p>
      </section>

      <section
        className="employee-settings-section employee-settings-demo"
        aria-labelledby="employee-settings-demo-heading"
      >
        <div className="employee-settings-section-heading">
          <div>
            <span className="employee-settings-kicker">Prototype</span>
            <h2 id="employee-settings-demo-heading">Attendance Demo Settings</h2>
          </div>
          <p>Use only for demonstrating the QR attendance workflow.</p>
        </div>

        <div className="employee-settings-demo-body">
          <div className="employee-settings-demo-notice" role="note">
            <span className="employee-settings-demo-badge">DEMO MODE</span>
            <p>
              Prototype demonstration only. When enabled, your next QR attendance action
              uses the saved time while the actual server capture time remains auditable.
            </p>
          </div>

          {!demoSettings.featureEnabled ? (
            <p className="employee-settings-demo-disabled" role="status">
              Prototype attendance demonstration is currently disabled.
            </p>
          ) : (
            <>
              <div className="employee-settings-row employee-settings-demo-row">
                <div className="employee-settings-row-copy">
                  <h3 id="demo-attendance-enabled-label">Use custom attendance time</h3>
                  <p id="demo-attendance-enabled-description">
                    Apply your personal configured time to the next simulated QR action.
                  </p>
                </div>
                <label className="employee-settings-switch">
                  <input
                    type="checkbox"
                    checked={demoEnabled}
                    onChange={(event) => setDemoEnabled(event.target.checked)}
                    aria-labelledby="demo-attendance-enabled-label"
                    aria-describedby="demo-attendance-enabled-description"
                  />
                  <span className="employee-settings-switch-track" aria-hidden="true" />
                  <span className="employee-settings-switch-state" aria-hidden="true">
                    {demoEnabled ? "On" : "Off"}
                  </span>
                </label>
              </div>

              <div className="employee-settings-demo-time-row">
                <label htmlFor="employee-demo-attendance-time">Custom attendance time</label>
                <input
                  id="employee-demo-attendance-time"
                  type="time"
                  value={demoTime}
                  onChange={(event) => setDemoTime(event.target.value)}
                  disabled={!demoEnabled || demoSaving}
                  aria-describedby="employee-demo-attendance-time-help"
                />
                <p id="employee-demo-attendance-time-help">
                  The existing QR Time-In / Time-Out state machine decides which action this time represents.
                </p>
              </div>

              <div className="employee-settings-demo-actions">
                <button
                  type="button"
                  className="employee-settings-primary-button"
                  onClick={() => void saveDemoAttendanceSettings()}
                  disabled={demoSaving}
                >
                  {demoSaving ? "Saving…" : "Save Changes"}
                </button>
                <p className="employee-settings-feedback" role="status" aria-live="polite">
                  {demoFeedback}
                </p>
              </div>

              <div className="employee-settings-demo-summary">
                <div className="employee-settings-demo-summary-heading">
                  <div>
                    <span className="employee-settings-kicker">Today</span>
                    <h3>Today&apos;s Demo Attendance</h3>
                  </div>
                  <span className="employee-settings-demo-date">
                    {formatCampusDateKeyLabel(demoSettings.attendanceDate, "long")}
                  </span>
                </div>

                <dl className="employee-settings-demo-details">
                  <div>
                    <dt>Time-In</dt>
                    <dd>{formatDemoTime(demoSettings.attendance?.timeIn)}</dd>
                  </div>
                  <div>
                    <dt>Time-Out</dt>
                    <dd>{formatDemoTime(demoSettings.attendance?.timeOut)}</dd>
                  </div>
                  <div>
                    <dt>Status</dt>
                    <dd>{getDemoAttendanceStatus(demoSettings.attendance)}</dd>
                  </div>
                </dl>

                <div className="employee-settings-demo-reset-row">
                  <p>
                    {demoSettings.resetBlockedReason ?? "Reset only eligible simulated QR attendance for today."}
                  </p>
                  <button
                    type="button"
                    className="employee-settings-danger-button"
                    onClick={() => setResetDialogOpen(true)}
                    disabled={!demoSettings.resetAvailable || resettingDemo}
                  >
                    Reset This Day
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {resetDialogOpen ? (
        <div className="employee-settings-modal-layer">
          <button
            type="button"
            className="employee-settings-modal-backdrop"
            onClick={() => setResetDialogOpen(false)}
            aria-label="Close reset confirmation"
          />
          <div
            className="employee-settings-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="employee-demo-reset-title"
            aria-describedby="employee-demo-reset-description"
          >
            <div className="employee-settings-modal-heading">
              <div>
                <span className="employee-settings-kicker">Confirm reset</span>
                <h2 id="employee-demo-reset-title">Reset Demo Attendance?</h2>
              </div>
              <button
                type="button"
                className="employee-settings-modal-close"
                onClick={() => setResetDialogOpen(false)}
                disabled={resettingDemo}
                aria-label="Close reset confirmation"
              >
                <Icon name="close" />
              </button>
            </div>
            <p id="employee-demo-reset-description">
              This resets only your eligible simulated QR attendance for {formatCampusDateKeyLabel(demoSettings.attendanceDate, "long")}.
              Bundy, real QR, HR verification, Payroll, and other employees remain unchanged.
            </p>
            <div className="employee-settings-modal-actions">
              <button
                type="button"
                className="employee-settings-secondary-button"
                onClick={() => setResetDialogOpen(false)}
                disabled={resettingDemo}
              >
                Cancel
              </button>
              <button
                type="button"
                className="employee-settings-danger-button"
                onClick={() => void resetDemoAttendance()}
                disabled={resettingDemo}
              >
                {resettingDemo ? "Resetting…" : "Reset This Day"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section
        className="employee-settings-section"
        aria-labelledby="employee-settings-notifications-heading"
      >
        <div className="employee-settings-section-heading">
          <div>
            <span className="employee-settings-kicker">Preferences</span>
            <h2 id="employee-settings-notifications-heading">Stay informed</h2>
          </div>
          <p>Choose which updates you want the portal to keep ready for you.</p>
        </div>

        <div className="employee-settings-list">
          <div className="employee-settings-row">
            <div className="employee-settings-row-copy">
              <h3 id="attendance-reminders-label">Attendance reminders</h3>
              <p id="attendance-reminders-description">
                Keep attendance reminders available when this feature is supported.
              </p>
            </div>
            <label className="employee-settings-switch">
              <input
                type="checkbox"
                checked={settings.attendanceReminders}
                onChange={(event) => updateSetting("attendanceReminders", event.target.checked)}
                aria-labelledby="attendance-reminders-label"
                aria-describedby="attendance-reminders-description"
              />
              <span className="employee-settings-switch-track" aria-hidden="true" />
              <span className="employee-settings-switch-state" aria-hidden="true">
                {settings.attendanceReminders ? "On" : "Off"}
              </span>
            </label>
          </div>

        </div>

        <div className="employee-settings-footer">
          <p className="employee-settings-feedback" role="status" aria-live="polite">
            {feedback}
          </p>
          <button type="button" className="employee-settings-reset" onClick={resetSettings}>
            Reset preferences
          </button>
        </div>
      </section>

      <section
        className="employee-settings-section employee-settings-security"
        aria-labelledby="employee-settings-security-heading"
      >
        <div className="employee-settings-section-heading">
          <div>
            <span className="employee-settings-kicker">Security</span>
            <h2 id="employee-settings-security-heading">Change password</h2>
          </div>
          <p>Update the password used to sign in to your Employee account.</p>
        </div>

        <div className="employee-settings-security-body">
          <ChangePasswordForm user={user} />
        </div>
      </section>
    </div>
  );
}

function formatDemoTime(value: string | null | undefined) {
  if (!value) {
    return "Not recorded";
  }

  const [hours, minutes] = value.slice(0, 16).split("T").at(-1)?.split(":") ?? [];
  const hour = Number(hours);
  if (!Number.isInteger(hour) || !minutes) {
    return "Time unavailable";
  }

  const normalizedHour = hour % 12 || 12;
  return `${normalizedHour}:${minutes} ${hour >= 12 ? "PM" : "AM"}`;
}

function getDemoAttendanceStatus(
  attendance: AttendanceDemoSettingsData["attendance"],
) {
  if (!attendance) {
    return "Ready for attendance";
  }

  return attendance.timeOut ? "Completed" : "Time-In recorded";
}
