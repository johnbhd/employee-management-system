export default function Loading() {
  return (
    <div className="payroll-history payroll-history--loading" aria-busy="true" aria-label="Loading payroll history">
      <div className="payroll-history__loading-block" />
      <div className="payroll-history__loading-metrics" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((item) => <div className="payroll-history__loading-card" key={item} />)}
      </div>
      <div className="payroll-history__loading-block payroll-history__loading-panel" />
    </div>
  );
}
