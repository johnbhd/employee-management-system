export default function Loading() {
  return (
    <div
      className="payroll-dashboard payroll-dashboard--loading"
      aria-busy="true"
      aria-live="polite"
    >
      <header className="page-header">
        <div className="page-heading">
          <p className="page-eyebrow">Payroll operations</p>
          <h1 className="page-title">Payroll Dashboard</h1>
          <p className="page-subtitle">Loading current payroll data…</p>
        </div>
      </header>

      <div className="metric-grid payroll-dashboard__summary">
        {Array.from({ length: 6 }, (_, index) => (
          <div className="metric-card payroll-dashboard__loading-card" key={index}>
            <span className="payroll-dashboard__loading-block payroll-dashboard__loading-icon" />
            <span className="payroll-dashboard__loading-content">
              <span className="payroll-dashboard__loading-block payroll-dashboard__loading-label" />
              <span className="payroll-dashboard__loading-block payroll-dashboard__loading-value" />
              <span className="payroll-dashboard__loading-block payroll-dashboard__loading-note" />
            </span>
          </div>
        ))}
      </div>

      <div className="payroll-dashboard__loading-panel" aria-hidden="true" />
      <div className="payroll-dashboard__loading-panel" aria-hidden="true" />
    </div>
  );
}
