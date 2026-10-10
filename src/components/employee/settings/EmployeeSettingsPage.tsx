"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Icon } from "@/components/ui/Icon";

type EmployeeSettings = {
  attendanceReminders: boolean;
  announcementUpdates: boolean;
};

const settingsStorageKey = "au-jsc-employee-settings";
const defaultSettings: EmployeeSettings = {
  attendanceReminders: true,
  announcementUpdates: true,
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
      announcementUpdates:
        typeof parsedValue.announcementUpdates === "boolean"
          ? parsedValue.announcementUpdates
          : defaultSettings.announcementUpdates,
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

export function EmployeeSettingsPage() {
  const [settings, setSettings] = useState<EmployeeSettings>(defaultSettings);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSettings(readSavedSettings());
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  function updateSetting(key: keyof EmployeeSettings, value: boolean) {
    const nextSettings = { ...settings, [key]: value };

    setSettings(nextSettings);
    setFeedback(saveSettings(nextSettings));
  }

  function resetSettings() {
    setSettings(defaultSettings);
    setFeedback(saveSettings(defaultSettings));
  }

  return (
    <div className="employee-settings-page">
      <div className="employee-settings-intro">
        <span className="employee-settings-kicker">Personal preferences</span>
        <p>
          Manage the employee portal preferences saved for this device. Official
          employee information remains managed by the HR Office.
        </p>
      </div>

      <section className="employee-settings-section" aria-labelledby="employee-settings-notifications-heading">
        <div className="employee-settings-section-heading">
          <div>
            <span className="employee-settings-kicker">Notifications</span>
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

          <div className="employee-settings-row">
            <div className="employee-settings-row-copy">
              <h3 id="announcement-updates-label">Announcement updates</h3>
              <p id="announcement-updates-description">
                Keep new campus announcements available in your employee portal.
              </p>
            </div>
            <label className="employee-settings-switch">
              <input
                type="checkbox"
                checked={settings.announcementUpdates}
                onChange={(event) => updateSetting("announcementUpdates", event.target.checked)}
                aria-labelledby="announcement-updates-label"
                aria-describedby="announcement-updates-description"
              />
              <span className="employee-settings-switch-track" aria-hidden="true" />
              <span className="employee-settings-switch-state" aria-hidden="true">
                {settings.announcementUpdates ? "On" : "Off"}
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

      <section className="employee-settings-section" aria-labelledby="employee-settings-account-heading">
        <div className="employee-settings-section-heading">
          <div>
            <span className="employee-settings-kicker">Account</span>
            <h2 id="employee-settings-account-heading">Account and support</h2>
          </div>
          <p>Review your account details or get help with attendance.</p>
        </div>

        <div className="employee-settings-link-grid">
          <Link href="/employee/profile" className="employee-settings-link">
            <span className="employee-settings-link-icon" aria-hidden="true"><Icon name="user" /></span>
            <span>
              <strong>View profile</strong>
              <small>Review your official employee information.</small>
            </span>
            <Icon name="arrow" />
          </Link>
          <Link href="/employee/help-support" className="employee-settings-link">
            <span className="employee-settings-link-icon" aria-hidden="true"><Icon name="help" /></span>
            <span>
              <strong>Help and support</strong>
              <small>Contact support or review attendance guidance.</small>
            </span>
            <Icon name="arrow" />
          </Link>
        </div>

        <p className="employee-settings-note">
          Password and official profile changes are handled through the authorized
          support process.
        </p>
      </section>
    </div>
  );
}
