export default function IntegrationMonitoringLoading() {
  return (
    <div className="admin-page monitoring-page monitoring-page--loading" aria-busy="true">
      <header className="page-header">
        <div className="page-heading">
          <p className="page-eyebrow">Operations</p>
          <h1 className="page-title">Integration Monitoring</h1>
          <p className="page-subtitle">Loading current integration health…</p>
        </div>
      </header>
      <div className="metric-grid monitoring-metrics">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="metric-card monitoring-skeleton-card" key={index}>
            <span className="monitoring-skeleton monitoring-skeleton-icon" />
            <span className="monitoring-skeleton-copy">
              <span className="monitoring-skeleton monitoring-skeleton-label" />
              <span className="monitoring-skeleton monitoring-skeleton-value" />
              <span className="monitoring-skeleton monitoring-skeleton-note" />
            </span>
          </div>
        ))}
      </div>
      <div className="dashboard-card monitoring-skeleton-panel" />
      <div className="dashboard-card monitoring-skeleton-panel" />
    </div>
  );
}
