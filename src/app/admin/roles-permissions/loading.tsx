export default function RolesPermissionsLoading() {
  return (
    <div className="admin-page roles-permissions-page" aria-busy="true">
      <header className="page-header"><div className="page-heading"><p className="page-eyebrow">Access management</p><h1 className="page-title">Roles &amp; Permissions</h1><p className="page-subtitle">Loading the server permission catalog…</p></div></header>
      <div className="metric-grid roles-permissions-metrics">{Array.from({ length: 4 }, (_, index) => <div className="metric-card roles-permissions-skeleton" key={index} />)}</div>
      <div className="dashboard-card roles-permissions-skeleton roles-permissions-skeleton-workspace" />
    </div>
  );
}
