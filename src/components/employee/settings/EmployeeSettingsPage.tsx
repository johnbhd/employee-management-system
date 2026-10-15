"use client";

import Link from "next/link";
import { useState } from "react";

import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { Icon } from "@/components/ui/Icon";
import { getRoleLabel } from "@/lib/auth/roles";
import type { SessionUser } from "@/types/auth";
import type { EmployeeReference } from "@/types/employee";

type EmployeeSettings = {
  attendanceReminders: boolean;
};

type EmployeeSettingsPageProps = {
  user: SessionUser;
  employee: EmployeeReference | null;
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
}: EmployeeSettingsPageProps) {
  const [settings, setSettings] = useState<EmployeeSettings>(() => (
    typeof window === "undefined" ? defaultSettings : readSavedSettings()
  ));
  const [feedback, setFeedback] = useState("");

  function updateSetting(key: keyof EmployeeSettings, value: boolean) {
    const nextSettings = { ...settings, [key]: value };

    setSettings(nextSettings);
    setFeedback(saveSettings(nextSettings));
  }

  function resetSettings() {
    setSettings(defaultSettings);
    setFeedback(saveSettings(defaultSettings));
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
