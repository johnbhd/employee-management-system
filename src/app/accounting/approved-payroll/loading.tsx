export default function ApprovedPayrollLoading() {
  return (
    <div
      className="accounting-approved-payroll accounting-approved-payroll--loading"
      aria-busy="true"
      aria-label="Loading approved payroll information"
    >
      <p className="page-eyebrow">Approved payroll</p>
      <h1 className="page-title">Approved Payroll Information</h1>
      <p className="accounting-approved-payroll__loading-message">
        Loading approved payroll information…
      </p>
    </div>
  );
}
