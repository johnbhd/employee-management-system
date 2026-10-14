export function EmployeeAnnouncementsPage() {
  return (
    <div className="employee-announcements-page">
      <header className="employee-announcements-heading">
        <span className="employee-announcements-heading-label">Campus updates</span>
        <p>Announcements are not configured for this employee portal.</p>
      </header>
      <section className="employee-panel" role="status">
        <div className="employee-panel-heading">
          <div>
            <p className="employee-section-kicker">No announcement source</p>
            <h2>Announcements are unavailable</h2>
          </div>
        </div>
        <p className="payroll-empty-state">
          Check the authorized HR or campus communication channel for current notices.
        </p>
      </section>
    </div>
  );
}
