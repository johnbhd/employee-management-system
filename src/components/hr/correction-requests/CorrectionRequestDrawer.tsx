import type { ReactNode } from "react";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type {
  AttendanceCorrectionAttendance,
  AttendanceCorrectionRecord,
  AttendanceCorrectionDecision,
} from "@/types/attendance-correction";

import { CorrectionComparison } from "./CorrectionComparison";
import { CorrectionEvidence } from "./CorrectionEvidence";
import { CorrectionHistory } from "./CorrectionHistory";

type CorrectionRequestDrawerProps = {
  request: AttendanceCorrectionRecord | null;
  onClose: () => void;
  onDecision: (decision: AttendanceCorrectionDecision) => void;
};

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="hr-correction-detail-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function AttendanceDetails({
  attendance,
}: {
  attendance: AttendanceCorrectionAttendance | null;
}) {
  if (!attendance) {
    return <p className="hr-correction-muted-copy">Attendance data is unavailable.</p>;
  }

  return (
    <dl className="hr-correction-detail-list">
      <DetailRow label="Record reference" value={attendance.attendanceRecordId} />
      <DetailRow label="Date" value={attendance.attendanceDate} />
      <DetailRow label="Time In" value={attendance.timeIn ?? "—"} />
      <DetailRow label="Time Out" value={attendance.timeOut ?? "—"} />
      <DetailRow label="Time In source" value={attendance.timeInSource} />
      <DetailRow label="Time Out source" value={attendance.timeOutSource ?? "No source recorded"} />
      <DetailRow
        label="Attendance status"
        value={
          <StatusBadge tone={attendance.status === "completed" ? "success" : "warning"}>
            {attendance.status === "completed" ? "Completed" : "Present"}
          </StatusBadge>
        }
      />
    </dl>
  );
}

export function CorrectionRequestDrawer({
  request,
  onClose,
  onDecision,
}: CorrectionRequestDrawerProps) {
  if (!request) return null;

  const canDecide = request.status === "pending";

  return (
    <div className="hr-correction-drawer-layer">
      <button
        type="button"
        className="hr-correction-drawer-backdrop"
        onClick={onClose}
        aria-label="Close correction request details"
      />
      <aside
        className="hr-correction-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hr-correction-drawer-title"
      >
        <div className="hr-correction-drawer-header">
          <div>
            <p className="hr-section-kicker">Correction request</p>
            <h2 id="hr-correction-drawer-title">{request.id}</h2>
            <StatusBadge tone={request.statusTone}>{request.statusLabel}</StatusBadge>
          </div>
          <button
            type="button"
            className="hr-correction-close-button"
            onClick={onClose}
            aria-label="Close correction request details"
            autoFocus
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="hr-correction-drawer-employee">
          <strong>{request.employee?.displayName ?? "Employee reference unavailable"}</strong>
          <span>{request.employeeId} · {request.employee?.department ?? "Unavailable"}</span>
        </div>

        <section className="hr-correction-detail-section" aria-labelledby="hr-correction-summary-heading">
          <h3 id="hr-correction-summary-heading">Request summary</h3>
          <dl className="hr-correction-detail-list">
            <DetailRow label="Attendance date" value={request.attendanceDateLabel} />
            <DetailRow label="Submitted" value={request.submittedAt} />
            <DetailRow label="Issue type" value={request.issueType} />
            <DetailRow label="Request status" value={<StatusBadge tone={request.statusTone}>{request.statusLabel}</StatusBadge>} />
            <DetailRow label="Reason" value={request.reason} />
          </dl>
        </section>

        <section className="hr-correction-detail-section" aria-labelledby="hr-correction-current-heading">
          <h3 id="hr-correction-current-heading">Current attendance record</h3>
          <AttendanceDetails attendance={request.currentAttendance} />
        </section>

        <section className="hr-correction-detail-section" aria-labelledby="hr-correction-original-heading">
          <h3 id="hr-correction-original-heading">Original attendance</h3>
          <AttendanceDetails attendance={request.originalAttendance} />
        </section>

        <section className="hr-correction-detail-section" aria-labelledby="hr-correction-requested-heading">
          <h3 id="hr-correction-requested-heading">Requested correction</h3>
          <CorrectionComparison request={request} />
        </section>

        {request.status === "approved" ? (
          <section className="hr-correction-detail-section" aria-labelledby="hr-correction-resulting-heading">
            <h3 id="hr-correction-resulting-heading">Resulting attendance</h3>
            <AttendanceDetails attendance={request.resultingAttendance} />
          </section>
        ) : null}

        <section className="hr-correction-detail-section" aria-labelledby="hr-correction-evidence-heading">
          <h3 id="hr-correction-evidence-heading">Supporting evidence</h3>
          <CorrectionEvidence evidence={request.evidence} />
        </section>

        <section className="hr-correction-detail-section" aria-labelledby="hr-correction-history-heading">
          <h3 id="hr-correction-history-heading">Correction history</h3>
          <CorrectionHistory history={request.history} />
        </section>

        {request.reviewedBy && request.reviewedAt ? (
          <section className="hr-correction-detail-section" aria-labelledby="hr-correction-review-heading">
            <h3 id="hr-correction-review-heading">Review metadata</h3>
            <dl className="hr-correction-detail-list">
              <DetailRow label="Reviewed by" value={request.reviewedBy.displayName} />
              <DetailRow label="Reviewed at" value={request.reviewedAt} />
              {request.reviewNote ? <DetailRow label="Review note" value={request.reviewNote} /> : null}
              {request.changedFields.length > 0 ? (
                <DetailRow
                  label="Changed fields"
                  value={request.changedFields.map((field) => field.field).join(" · ")}
                />
              ) : null}
            </dl>
          </section>
        ) : null}

        <section className="hr-correction-detail-section hr-correction-decision-section" aria-labelledby="hr-correction-decision-heading">
          <h3 id="hr-correction-decision-heading">Decision actions</h3>
          {canDecide ? (
            <div className="hr-correction-decision-actions">
              <button
                type="button"
                className="hr-correction-approve-button"
                onClick={() => onDecision("approve")}
              >
                <Icon name="check" />
                Approve
              </button>
              <button
                type="button"
                className="hr-correction-reject-button"
                onClick={() => onDecision("reject")}
              >
                <Icon name="close" />
                Reject
              </button>
            </div>
          ) : (
            <p className="hr-correction-muted-copy">
              This request has been resolved. Review its history and metadata for the recorded decision.
            </p>
          )}
        </section>

        <div className="hr-correction-drawer-footer">
          <button type="button" className="button-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </aside>
    </div>
  );
}
