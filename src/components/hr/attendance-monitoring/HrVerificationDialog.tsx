import { Icon } from "@/components/ui/Icon";
import type { HrWorkflowAttendanceRecord } from "@/data/hr-workflow";

type HrVerificationDialogProps = {
  record: HrWorkflowAttendanceRecord | null;
  onClose: () => void;
  onConfirm: () => void;
};

export function HrVerificationDialog({ record, onClose, onConfirm }: HrVerificationDialogProps) {
  if (!record) return null;

  return (
    <div className="hr-monitoring-verification-dialog-layer">
      <button type="button" className="hr-monitoring-drawer-backdrop" onClick={onClose} aria-label="Close verification confirmation" />
      <section className="hr-monitoring-verification-dialog" role="dialog" aria-modal="true" aria-labelledby="hr-verification-dialog-title">
        <div className="hr-monitoring-verification-dialog-icon" aria-hidden="true"><Icon name="check" /></div>
        <p className="hr-section-kicker">Final HR review</p>
        <h2 id="hr-verification-dialog-title">Verify attendance record?</h2>
        <p>
          Confirm that <strong>{record.employeeName}</strong>&apos;s attendance for {record.date} is accurate and may proceed to payroll handoff.
        </p>
        <div className="hr-monitoring-verification-dialog-actions">
          <button type="button" className="button-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="button-primary" onClick={onConfirm}><Icon name="check" /> Verify Attendance</button>
        </div>
      </section>
    </div>
  );
}
