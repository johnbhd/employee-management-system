import type { ReactNode } from "react";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { HrWorkflowAttendanceRecord } from "@/data/hr-workflow";
import type { HrCorrectionRequest } from "@/data/hr-correction-requests";

import { CorrectionComparison } from "./CorrectionComparison";
import { CorrectionEvidence } from "./CorrectionEvidence";
import { CorrectionHistory } from "./CorrectionHistory";
import type { CorrectionDecisionType } from "./types";

type CorrectionRequestDrawerProps = {
  request: HrCorrectionRequest | null;
  attendanceRecord: HrWorkflowAttendanceRecord | null;
  onClose: () => void;
  onDecision: (decision: CorrectionDecisionType) => void;
};

function formatDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="hr-correction-detail-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export function CorrectionRequestDrawer({
  request,
  attendanceRecord,
  onClose,
  onDecision,
}: CorrectionRequestDrawerProps) {
  if (!request) return null;

  const canDecide = ["Submitted", "Under Review", "Needs Additional Information"].includes(request.status);

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
            <StatusBadge tone={request.statusTone}>{request.status}</StatusBadge>
          </div>
          <button type="button" className="hr-correction-close-button" onClick={onClose} aria-label="Close correction request details" autoFocus>
            <Icon name="close" />
          </button>
        </div>

        <div className="hr-correction-drawer-employee">
          <strong>{request.employeeName}</strong>
          <span>{request.employeeId} · {request.department}</span>
        </div>

        <section className="hr-correction-detail-section" aria-labelledby="hr-correction-summary-heading">
          <h3 id="hr-correction-summary-heading">Request summary</h3>
          <dl className="hr-correction-detail-list">
            <DetailRow label="Attendance date" value={formatDate(request.attendanceDate)} />
            <DetailRow label="Submitted" value={request.submittedAt} />
            <DetailRow label="Issue type" value={request.issueType} />
            <DetailRow label="Request status" value={<StatusBadge tone={request.statusTone}>{request.status}</StatusBadge>} />
          </dl>
        </section>

        <section className="hr-correction-detail-section" aria-labelledby="hr-correction-current-heading">
          <h3 id="hr-correction-current-heading">Current attendance record</h3>
          {attendanceRecord ? (
            <dl className="hr-correction-detail-list">
              <DetailRow label="Record reference" value={attendanceRecord.id} />
              <DetailRow label="Assigned schedule" value={attendanceRecord.schedule} />
              <DetailRow label="Time In" value={attendanceRecord.timeIn} />
              <DetailRow label="Time Out" value={attendanceRecord.timeOut} />
              <DetailRow label="Source" value={attendanceRecord.source ?? "No source recorded"} />
              <DetailRow label="Attendance status" value={<StatusBadge tone={attendanceRecord.statusTone}>{attendanceRecord.status}</StatusBadge>} />
              <DetailRow label="Validation status" value={<StatusBadge tone={attendanceRecord.validationTone}>{attendanceRecord.validationStatus}</StatusBadge>} />
              <DetailRow label="Correction status" value={attendanceRecord.correctionStatus === "No Correction Request" ? "No correction request" : attendanceRecord.correctionStatus} />
              <DetailRow label="HR verification" value={<StatusBadge tone={attendanceRecord.hrVerificationStatus === "Verified" ? "success" : attendanceRecord.hrVerificationStatus === "Needs Correction" ? "warning" : "info"}>{attendanceRecord.hrVerificationStatus}</StatusBadge>} />
              <DetailRow label="Payroll readiness" value={<StatusBadge tone={attendanceRecord.payrollReadiness === "Ready for Payroll" ? "success" : "muted"}>{attendanceRecord.payrollReadiness}</StatusBadge>} />
              {attendanceRecord.lateMinutes !== undefined ? <DetailRow label="Late minutes" value={`${attendanceRecord.lateMinutes} min`} /> : null}
              {attendanceRecord.undertimeMinutes !== undefined ? <DetailRow label="Undertime minutes" value={`${attendanceRecord.undertimeMinutes} min`} /> : null}
            </dl>
          ) : (
            <p className="hr-correction-muted-copy">The linked attendance record is not available.</p>
          )}
        </section>

        <section className="hr-correction-detail-section" aria-labelledby="hr-correction-requested-heading">
          <h3 id="hr-correction-requested-heading">Requested correction</h3>
          <CorrectionComparison request={request} />
        </section>

        <section className="hr-correction-detail-section" aria-labelledby="hr-correction-explanation-heading">
          <h3 id="hr-correction-explanation-heading">Employee explanation</h3>
          <p className="hr-correction-explanation">{request.explanation || "No explanation provided."}</p>
        </section>

        <section className="hr-correction-detail-section" aria-labelledby="hr-correction-evidence-heading">
          <h3 id="hr-correction-evidence-heading">Supporting evidence</h3>
          <CorrectionEvidence evidence={request.evidence} />
        </section>

        <section className="hr-correction-detail-section" aria-labelledby="hr-correction-history-heading">
          <h3 id="hr-correction-history-heading">Correction history</h3>
          <CorrectionHistory history={request.history} />
        </section>

        <section className="hr-correction-detail-section hr-correction-decision-section" aria-labelledby="hr-correction-decision-heading">
          <h3 id="hr-correction-decision-heading">Decision actions</h3>
          {canDecide ? (
            <div className="hr-correction-decision-actions">
              <button type="button" className="hr-correction-approve-button" onClick={() => onDecision("approve")}>
                <Icon name="check" />
                Approve
              </button>
              <button type="button" className="hr-correction-information-button" onClick={() => onDecision("information")}>
                <Icon name="comment" />
                Request More Information
              </button>
              <button type="button" className="hr-correction-reject-button" onClick={() => onDecision("reject")}>
                <Icon name="close" />
                Reject
              </button>
            </div>
          ) : (
            <p className="hr-correction-muted-copy">This request has been resolved. Review its history for the recorded decision.</p>
          )}
        </section>

        <div className="hr-correction-drawer-footer">
          <button type="button" className="button-secondary" onClick={onClose}>Close</button>
        </div>
      </aside>
    </div>
  );
}
