import {
  employeeAttendanceHelp,
  employeeAttendanceProfile,
  employeeAttendanceReminders,
  employeeAttendanceStats,
} from "@/data/my-attendance";
import { Icon } from "@/components/ui/Icon";

import { MyAttendanceQuickActions } from "./MyAttendanceQuickActions";

export function MyAttendancePage() {
  return (
    <div className="my-attendance-page">
      <section
        className="my-attendance-overview"
        aria-labelledby="my-attendance-profile"
      >
        <div className="my-attendance-employee">
          <div className="my-attendance-avatar" aria-hidden="true">
            <Icon name="user" />
          </div>
          <div className="my-attendance-employee-copy">
            <span className="my-attendance-kicker">Employee attendance</span>
            <h2 id="my-attendance-profile">
              {employeeAttendanceProfile.name}
            </h2>
            <p className="my-attendance-employee-meta">
              <span>{employeeAttendanceProfile.employeeId}</span>
              <span aria-hidden="true">·</span>
              <span>{employeeAttendanceProfile.department}</span>
            </p>
          </div>
        </div>

        <div className="my-attendance-overview-divider" aria-hidden="true" />

        <div className="my-attendance-schedule">
          <Icon name="calendar" />
          <div>
            <span className="my-attendance-label">Today&apos;s Schedule</span>
            <strong className="my-attendance-value">
              {employeeAttendanceProfile.schedule}
            </strong>
            <span className="my-attendance-subtext">
              {employeeAttendanceProfile.scheduleType}
            </span>
          </div>
        </div>

        <div className="my-attendance-status-box">
          <span className="my-attendance-label">Current Status</span>
          <strong className="my-attendance-status-value">
            <span className="my-attendance-status-dot" aria-hidden="true" />
            {employeeAttendanceProfile.status}
          </strong>
          <span className="my-attendance-subtext">
            {employeeAttendanceProfile.statusNote}
          </span>
        </div>
      </section>

      <section
        className="my-attendance-details-section"
        aria-labelledby="my-attendance-details-title"
      >
        <div className="my-attendance-section-heading">
          <div>
            <span className="my-attendance-kicker">Today</span>
            <h2 id="my-attendance-details-title">Attendance details</h2>
          </div>
          <span className="my-attendance-section-note">
            Authorized attendance record
          </span>
        </div>

        <div className="my-attendance-details-grid">
          {employeeAttendanceStats.map((stat) => (
            <article className="my-attendance-detail" key={stat.label}>
              <span className="my-attendance-label">{stat.label}</span>
              <strong className="my-attendance-detail-value">
                {stat.value}
              </strong>
              <span className="my-attendance-subtext">{stat.note}</span>
            </article>
          ))}
        </div>
      </section>

      <section
        className="my-attendance-quick-actions"
        aria-labelledby="my-attendance-quick-actions-title"
      >
        <div className="my-attendance-section-heading">
          <div>
            <span className="my-attendance-kicker">Next steps</span>
            <h2 id="my-attendance-quick-actions-title">Attendance actions</h2>
          </div>
          <span className="my-attendance-section-note">
            Choose an action to continue
          </span>
        </div>
        <MyAttendanceQuickActions />
      </section>

      <section
        className="my-attendance-notes"
        aria-label="Attendance reminders and help"
      >
        <article
          className="my-attendance-note-card my-attendance-reminder-card"
          aria-labelledby="my-attendance-reminders-title"
        >
          <div className="my-attendance-note-heading">
            <Icon name="activity" />
            <div>
              <span className="my-attendance-note-kicker">Keep in mind</span>
              <h2 id="my-attendance-reminders-title">Important reminders</h2>
            </div>
          </div>
          <ul>
            {employeeAttendanceReminders.map((reminder) => (
              <li key={reminder}>{reminder}</li>
            ))}
          </ul>
        </article>

        <article
          className="my-attendance-note-card my-attendance-help-card"
          aria-labelledby="my-attendance-help-title"
        >
          <div className="my-attendance-note-heading">
            <Icon name="help" />
            <div>
              <span className="my-attendance-note-kicker">Support</span>
              <h2 id="my-attendance-help-title">Need help?</h2>
            </div>
          </div>
          <p>{employeeAttendanceHelp}</p>
        </article>
      </section>
    </div>
  );
}
