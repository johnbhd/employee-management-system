export default function PayrollResultsLoading() {
  return (
    <div className="payroll-results payroll-results--loading" aria-busy="true">
      <p className="page-eyebrow">Payroll output</p>
      <h1 className="page-title">Payroll Results</h1>
      <p className="payroll-results__loading-message">Loading returned payroll results…</p>
    </div>
  );
}
