export default function AccountingTransactionHistoryLoading() {
  return (
    <div
      className="accounting-transaction-history accounting-transaction-history--loading"
      aria-busy="true"
      aria-label="Loading Accounting transaction history"
    >
      <p className="page-eyebrow">Accounting records</p>
      <h1 className="page-title">Transaction History</h1>
      <p className="accounting-transaction-history__loading-message">
        Loading persisted transfer records...
      </p>
    </div>
  );
}
