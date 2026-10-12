export default function UserAccountsLoading() {
  return (
    <div className="admin-page user-accounts-hrps-page" aria-busy="true">
      <header className="page-header">
        <div className="page-heading">
          <p className="page-eyebrow">Application access</p>
          <h1 className="page-title">User Accounts</h1>
          <p className="page-subtitle">Loading Firebase Authentication and application profiles…</p>
        </div>
      </header>
      <div className="metric-grid user-accounts-hrps-metrics">
        {Array.from({ length: 5 }, (_, index) => <div className="metric-card user-accounts-skeleton" key={index} />)}
      </div>
      <div className="dashboard-card user-accounts-skeleton user-accounts-skeleton-table" />
    </div>
  );
}
