export default function AccountingIntegrationStatusLoading() {
  return (
    <div
      className="accounting-integration-status accounting-integration-status--loading"
      aria-busy="true"
      aria-label="Loading Accounting integration status"
    >
      <p className="page-eyebrow">System integration</p>
      <h1 className="page-title">Accounting Integration Status</h1>
      <p className="accounting-integration-status__loading-message">Loading transfer records...</p>
    </div>
  );
}
