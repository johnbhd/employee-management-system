import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type {
  PayrollBatchReadiness,
  PayrollBatchRecord,
} from "@/types/payroll-batches";

type PayrollBatchFreezeModalProps = {
  batch: PayrollBatchRecord | null;
  readiness: PayrollBatchReadiness | null;
  error: string | null;
  isLoading: boolean;
  isBusy: boolean;
  onClose: () => void;
  onRefresh: () => void;
  onConfirm: () => void;
};

export function PayrollBatchFreezeModal({
  batch,
  readiness,
  error,
  isLoading,
  isBusy,
  onClose,
  onRefresh,
  onConfirm,
}: PayrollBatchFreezeModalProps) {
  if (!batch) return null;

  const blockedItems = readiness?.items.filter((item) => !item.ready) ?? [];
  const canFreeze = readiness?.ready === true && !isLoading && !isBusy;

  return (
    <div
      className="payroll-batches__modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isBusy) onClose();
      }}
    >
      <section
        className="payroll-batches__modal is-wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="payroll-batch-freeze-title"
        aria-describedby="payroll-batch-freeze-description"
      >
        <header className="payroll-batches__modal-header">
          <div>
            <p className="section-kicker">Batch readiness</p>
            <h2 id="payroll-batch-freeze-title">Review and freeze {batch.id}</h2>
            <p id="payroll-batch-freeze-description">
              Revalidate every attendance record before creating the immutable Payroll snapshot.
            </p>
          </div>
          <button
            type="button"
            className="button-secondary"
            onClick={onClose}
            disabled={isBusy}
            aria-label="Close freeze review"
          >
            <Icon name="close" />
          </button>
        </header>

        <div className="payroll-batches__freeze-body">
          {isLoading ? (
            <p className="payroll-batches__freeze-loading" role="status">
              Checking current attendance and correction state…
            </p>
          ) : null}

          {error ? (
            <div className="payroll-batches__data-error" role="alert">
              <strong>Readiness could not be checked.</strong>
              <span>{error}</span>
            </div>
          ) : null}

          {readiness ? (
            <>
              <div className="payroll-batches__readiness-summary" aria-label="Payroll batch readiness summary">
                <div>
                  <span>Total records</span>
                  <strong>{readiness.totalItems}</strong>
                </div>
                <div>
                  <span>Ready</span>
                  <strong>{readiness.eligibleItems}</strong>
                </div>
                <div>
                  <span>Blocked</span>
                  <strong>{readiness.blockedItems}</strong>
                </div>
              </div>

              <p className={`payroll-batches__readiness-status ${readiness.ready ? "is-ready" : "is-blocked"}`}>
                <StatusBadge tone={readiness.ready ? "success" : "warning"}>
                  {readiness.ready ? "Ready to freeze" : "Blocked"}
                </StatusBadge>
                {readiness.ready
                  ? " All records passed the latest server-side checks."
                  : " Resolve the listed blockers before freezing this batch."}
              </p>

              {readiness.reasons.length > 0 ? (
                <ul className="payroll-batches__readiness-reasons">
                  {readiness.reasons.map((reason) => (
                    <li key={reason.code}>
                      <strong>{reason.code.replaceAll("_", " ")}</strong>
                      <span>{reason.label}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              {blockedItems.length > 0 ? (
                <div className="payroll-batches__blocked-items">
                  <h3>Blocked records</h3>
                  <ul>
                    {blockedItems.map((item) => (
                      <li key={item.itemId}>
                        <div>
                          <strong>{item.employeeName}</strong>
                          <span>{item.employeeId} · {item.sourceAttendanceIds.length} source record(s)</span>
                        </div>
                        <ul>
                          {item.reasons.map((reason) => (
                            <li key={`${item.itemId}-${reason.code}`}>
                              <span>{reason.label}</span>
                              <small>Owner: {reason.owner}</small>
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {readiness.ready ? (
                <p className="payroll-batches__confirm-copy">
                  <strong>Freeze this Payroll batch?</strong> All attendance records will be
                  revalidated inside one transaction, then their effective attendance,
                  schedule, and HR verification snapshots will be stored. After the batch
                  becomes Ready, normal add and remove operations are rejected.
                </p>
              ) : null}
            </>
          ) : null}
        </div>

        <footer className="payroll-batches__modal-footer">
          <button type="button" className="button-secondary" onClick={onClose} disabled={isBusy}>
            Cancel
          </button>
          <button type="button" className="button-secondary" onClick={onRefresh} disabled={isBusy || isLoading}>
            <Icon name="refresh" /> Refresh checks
          </button>
          {canFreeze ? (
            <button type="button" className="button-primary" onClick={onConfirm}>
              <Icon name="check" /> Freeze and mark Ready
            </button>
          ) : null}
        </footer>
      </section>
    </div>
  );
}
