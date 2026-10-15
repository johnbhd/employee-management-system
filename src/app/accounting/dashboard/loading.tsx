export default function AccountingDashboardLoading() {
  return (
    <div
      className="accounting-dashboard accounting-dashboard--loading"
      aria-busy="true"
      aria-live="polite"
    >
      <header className="page-header">
        <div className="page-heading">
          <p className="page-eyebrow">Accounting integration</p>
          <h1 className="page-title">Accounting Dashboard</h1>
          <p className="page-subtitle">Loading current Accounting data…</p>
        </div>
      </header>

      <div className="metric-grid accounting-dashboard__summary">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="metric-card accounting-dashboard__loading-card" key={index}>
            <span className="accounting-dashboard__loading-block accounting-dashboard__loading-icon" />
            <span className="accounting-dashboard__loading-content">
              <span className="accounting-dashboard__loading-block accounting-dashboard__loading-label" />
              <span className="accounting-dashboard__loading-block accounting-dashboard__loading-value" />
              <span className="accounting-dashboard__loading-block accounting-dashboard__loading-note" />
            </span>
          </div>
        ))}
      </div>

      <div className="accounting-dashboard__loading-panel" aria-hidden="true" />
      <div className="accounting-dashboard__loading-panel" aria-hidden="true" />
    </div>
  );
}
