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
        className="my-attendance-top-card"
        aria-labelledby="my-attendance-profile"
      >
        <div className="my-attendance-employee">
          <div className="my-attendance-avatar" aria-hidden="true">
            <Icon name="user" />
          </div>
          <div className="my-attendance-employee-copy">
            <h2 id="my-attendance-profile">
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

        <div className="my-attendance-divider" aria-hidden="true" />

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
        className="my-attendance-stats"
        aria-label="Attendance summary"
      >
        {employeeAttendanceStats.map((stat) => (
          <article className="my-attendance-stat" key={stat.label}>
            <div
              className={`my-attendance-stat-icon my-attendance-stat-icon-${stat.tone}`}
              aria-hidden="true"
            >
              <Icon name={stat.icon} />
            </div>
            <div className="my-attendance-stat-copy">
              <span className="my-attendance-label">{stat.label}</span>
              <strong className="my-attendance-stat-value">
                {stat.value}
              </strong>
              <span className="my-attendance-subtext">{stat.note}</span>
            </div>
          </article>
        ))}
      </section>

      <section
        className="my-attendance-quick-actions"
        aria-labelledby="my-attendance-quick-actions-title"
      >
        <span className="my-attendance-kicker">Quick actions</span>
        <h2 id="my-attendance-quick-actions-title">
          What would you like to do?
        </h2>
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
            <h2 id="my-attendance-reminders-title">
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
          className="my-attendance-note-card my-attendance-help-card"
          aria-labelledby="my-attendance-help-title"
        >
          <div className="my-attendance-note-heading">
            <Icon name="help" />
            <h2 id="my-attendance-help-title">Need Help?</h2>
          </div>
          <p>{employeeAttendanceHelp}</p>
        </article>
      </section>
    </div>
  );
}
