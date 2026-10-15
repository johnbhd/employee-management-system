export default function Loading() {
  return (
    <div
      className="payroll-verified-attendance payroll-verified-attendance--loading"
      aria-busy="true"
      aria-live="polite"
    >
      <header className="page-header">
        <div className="page-heading">
          <p className="page-eyebrow">Payroll readiness</p>
          <h1 className="page-title">Verified Attendance</h1>
          <p className="page-subtitle">Loading HR-verified attendance…</p>
        </div>
      </header>

      <div className="metric-grid payroll-verified-attendance__summary">
        {Array.from({ length: 5 }, (_, index) => (
          <div className="metric-card payroll-verified-attendance__loading-card" key={index}>
            <span className="payroll-verified-attendance__loading-block payroll-verified-attendance__loading-icon" />
            <span className="payroll-verified-attendance__loading-content">
              <span className="payroll-verified-attendance__loading-block payroll-verified-attendance__loading-label" />
              <span className="payroll-verified-attendance__loading-block payroll-verified-attendance__loading-value" />
              <span className="payroll-verified-attendance__loading-block payroll-verified-attendance__loading-note" />
            </span>
          </div>
        ))}
      </div>

      <div className="payroll-verified-attendance__loading-panel" aria-hidden="true" />
    </div>
  );
}
