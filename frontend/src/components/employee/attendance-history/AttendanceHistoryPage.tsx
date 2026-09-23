import {
  employeeAttendanceHelp,
  employeeAttendanceProfile,
  employeeAttendanceReminders,
  employeeAttendanceStats,
} from "@/data/employee-attendance";
import { Icon } from "@/components/ui/Icon";

import { AttendanceQuickActions } from "./AttendanceQuickActions";

export function AttendanceHistoryPage() {
  return (
    <div className="attendance-history-page">
      <section
        className="attendance-history-top-card"
        aria-labelledby="attendance-history-profile"
      >
        <div className="attendance-history-employee">
          <div className="attendance-history-avatar" aria-hidden="true">
            <Icon name="user" />
          </div>
          <div className="attendance-history-employee-copy">
            <h2 id="attendance-history-profile">
              {employeeAttendanceProfile.name}
            </h2>
            <p>
              Employee ID: <strong>{employeeAttendanceProfile.employeeId}</strong>
            </p>
            <p>
              Department: <strong>{employeeAttendanceProfile.department}</strong>
            </p>
          </div>
        </div>

        <div className="attendance-history-divider" aria-hidden="true" />

        <div className="attendance-history-schedule">
          <Icon name="calendar" />
          <div>
            <span className="attendance-history-label">Today&apos;s Schedule</span>
            <strong className="attendance-history-value">
              {employeeAttendanceProfile.schedule}
            </strong>
            <span className="attendance-history-subtext">
              {employeeAttendanceProfile.scheduleType}
            </span>
          </div>
        </div>

        <div className="attendance-history-status-box">
          <span className="attendance-history-label">Current Status</span>
          <strong className="attendance-history-status-value">
            <span className="attendance-history-status-dot" aria-hidden="true" />
            {employeeAttendanceProfile.status}
          </strong>
          <span className="attendance-history-subtext">
            {employeeAttendanceProfile.statusNote}
          </span>
        </div>
      </section>

      <section
        className="attendance-history-stats"
        aria-label="Attendance summary"
      >
        {employeeAttendanceStats.map((stat) => (
          <article className="attendance-history-stat" key={stat.label}>
            <div
              className={`attendance-history-stat-icon attendance-history-stat-icon-${stat.tone}`}
              aria-hidden="true"
            >
              <Icon name={stat.icon} />
            </div>
            <div className="attendance-history-stat-copy">
              <span className="attendance-history-label">{stat.label}</span>
              <strong className="attendance-history-stat-value">
                {stat.value}
              </strong>
              <span className="attendance-history-subtext">{stat.note}</span>
            </div>
          </article>
        ))}
      </section>

      <section
        className="attendance-history-quick-actions"
        aria-labelledby="attendance-history-quick-actions-title"
      >
        <span className="attendance-history-kicker">Quick actions</span>
        <h2 id="attendance-history-quick-actions-title">
          What would you like to do?
        </h2>
        <AttendanceQuickActions />
      </section>

      <section
        className="attendance-history-notes"
        aria-label="Attendance reminders and help"
      >
        <article
          className="attendance-history-note-card attendance-history-reminder-card"
          aria-labelledby="attendance-history-reminders-title"
        >
          <div className="attendance-history-note-heading">
            <Icon name="activity" />
            <h2 id="attendance-history-reminders-title">
              Important Reminders
            </h2>
          </div>
          <ul>
            {employeeAttendanceReminders.map((reminder) => (
              <li key={reminder}>{reminder}</li>
            ))}
          </ul>
        </article>

        <article
          className="attendance-history-note-card attendance-history-help-card"
          aria-labelledby="attendance-history-help-title"
        >
          <div className="attendance-history-note-heading">
            <Icon name="help" />
            <h2 id="attendance-history-help-title">Need Help?</h2>
          </div>
          <p>{employeeAttendanceHelp}</p>
        </article>
      </section>
    </div>
  );
}
