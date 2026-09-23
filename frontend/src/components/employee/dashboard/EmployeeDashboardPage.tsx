import Link from "next/link";

import { announcements, attendanceHistory, employeeStats } from "@/data/employee";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SummaryCard } from "@/components/ui/SummaryCard";

export function EmployeeDashboardPage() {
  return (
    <div className="employee-dashboard-page">
      <section className="employee-welcome">
        <div>
          <p className="employee-welcome-kicker">Thursday, July 23, 2026</p>
          <h2>Welcome back, John Benedict!</h2>
          <p>Here is your employee dashboard for today.</p>
          <p className="muted">Employee ID: <strong>AU-EMP-2026-001</strong> · Information Technology</p>
        </div>
      </section>

      <section className="employee-stats-grid" aria-label="Attendance summary">
        {employeeStats.map((stat) => (
          <SummaryCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="employee-panel attendance-card">
        <div className="employee-panel-heading">
          <div>
            <p className="employee-section-kicker">My attendance</p>
            <h2>Today&apos;s attendance</h2>
          </div>
          <StatusBadge tone="success">On time</StatusBadge>
        </div>
        <div className="attendance-summary">
          <div><span>Time in</span><strong>7:24 AM</strong><small>Recorded via Bundy</small></div>
          <div><span>Time out</span><strong>—</strong><small>Not recorded yet</small></div>
          <div><span>Work hours</span><strong>—</strong><small>Calculated after time out</small></div>
        </div>
        <div className="attendance-actions">
          <Link href="/employee/attendance-qr" className="employee-primary-button"><Icon name="qr" /> Show attendance QR</Link>
          <button type="button" className="employee-secondary-button"><Icon name="clock" /> View history</button>
        </div>
      </section>

      <section className="employee-panel">
        <div className="employee-panel-heading">
          <div>
            <p className="employee-section-kicker">Recent records</p>
            <h2>Attendance history</h2>
          </div>
          <button type="button" className="employee-text-button">View all <Icon name="arrow" /></button>
        </div>
        <div className="table-wrap employee-table-wrap">
          <table className="data-table employee-data-table">
            <caption className="sr-only">Recent employee attendance history</caption>
            <thead><tr><th>Date</th><th>Time in</th><th>Time out</th><th>Hours</th><th>Status</th></tr></thead>
            <tbody>
              {attendanceHistory.map((record) => (
                <tr key={record.date}>
                  <td>{record.date}</td><td>{record.timeIn}</td><td>{record.timeOut}</td><td>{record.hours}</td>
                  <td><StatusBadge tone={record.tone}>{record.status}</StatusBadge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="employee-bottom-grid">
        <section className="employee-panel payroll-card">
          <div className="employee-panel-heading">
            <div><p className="employee-section-kicker">Payroll</p><h2>Latest payslip</h2></div>
            <Icon name="payroll" />
          </div>
          <p className="payroll-period">July 1–15, 2026</p>
          <strong className="payroll-amount">₱24,850.00</strong>
          <div className="payroll-meta"><span>Released July 18, 2026</span><StatusBadge tone="success">Available</StatusBadge></div>
          <button type="button" className="employee-secondary-button full-width"><Icon name="file" /> View payslip</button>
        </section>

        <section className="employee-panel announcements-card">
          <div className="employee-panel-heading">
            <div><p className="employee-section-kicker">Campus updates</p><h2>Announcements</h2></div>
            <button type="button" className="employee-text-button">View all <Icon name="arrow" /></button>
          </div>
          <div className="announcement-list">
            {announcements.map((announcement) => (
              <article className="announcement-item" key={announcement.title}>
                <div className={`announcement-icon ${announcement.tone}`}><Icon name="info" /></div>
                <div><div className="announcement-meta"><StatusBadge tone={announcement.tone}>{announcement.category}</StatusBadge><time>{announcement.date}</time></div><h3>{announcement.title}</h3><p>{announcement.message}</p></div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
