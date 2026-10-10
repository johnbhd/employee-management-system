import { Icon } from "@/components/ui/Icon";
import type {
  AttendanceCorrectionDecision,
  AttendanceCorrectionRecord,
} from "@/types/attendance-correction";

type CorrectionDecisionDialogProps = {
  request: AttendanceCorrectionRecord | null;
  decision: AttendanceCorrectionDecision | null;
  note: string;
  isSubmitting: boolean;
  onNoteChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

const decisionCopy = {
  approve: {
    title: "Approve Attendance Correction?",
    description: "The persisted employee request will update the canonical attendance record. The original attendance will remain preserved in correction history.",
    confirm: "Approve Request",
    processing: "Approving...",
    className: "hr-correction-dialog-approve",
    noteLabel: "Review note (optional)",
    placeholder: "Add a short review note if needed.",
    required: false,
  },
  reject: {
    title: "Reject Attendance Correction?",
    description: "The correction request will be marked rejected. The canonical attendance record will remain unchanged.",
    confirm: "Reject Request",
    processing: "Rejecting...",
    className: "hr-correction-dialog-reject",
    noteLabel: "Rejection reason",
    placeholder: "Explain why the requested correction is being rejected.",
    required: true,
  },
} as const;

export function CorrectionDecisionDialog({
  request,
  decision,
  note,
  isSubmitting,
  onNoteChange,
  onClose,
  onConfirm,
}: CorrectionDecisionDialogProps) {
  if (!request || !decision) return null;

  const copy = decisionCopy[decision];
  const isConfirmDisabled = isSubmitting || (copy.required && note.trim().length === 0);

  return (
    <div className="hr-correction-dialog-layer">
      <button
        type="button"
        className="hr-correction-dialog-backdrop"
        onClick={onClose}
        aria-label="Close decision dialog"
        disabled={isSubmitting}
      />
      <section
        className="hr-correction-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hr-correction-dialog-title"
        aria-describedby="hr-correction-dialog-description"
      >
        <div className="hr-correction-dialog-header">
          <div>
            <p className="hr-section-kicker">Review decision</p>
            <h2 id="hr-correction-dialog-title">{copy.title}</h2>
          </div>
          <button
            type="button"
            className="hr-correction-close-button"
            onClick={onClose}
            aria-label="Close decision dialog"
            disabled={isSubmitting}
          >
            <Icon name="close" />
          </button>
        </div>

        <p id="hr-correction-dialog-description" className="hr-correction-dialog-description">
          {copy.description}
        </p>

        <dl className="hr-correction-dialog-summary">
          <div>
            <dt>Employee</dt>
            <dd>{request.employee?.displayName ?? request.employeeId}</dd>
          </div>
          <div>
            <dt>Attendance date</dt>
            <dd>{request.attendanceDateLabel}</dd>
          </div>
          <div>
            <dt>Requested change</dt>
            <dd>{request.issueType}</dd>
          </div>
        </dl>

        <label className="hr-correction-dialog-field">
          <span>{copy.noteLabel}{copy.required ? " *" : ""}</span>
          <textarea
            value={note}
            onChange={(event) => onNoteChange(event.target.value)}
            placeholder={copy.placeholder}
            required={copy.required}
            rows={4}
            maxLength={1000}
            disabled={isSubmitting}
          />
        </label>

        <div className="hr-correction-dialog-footer">
          <button type="button" className="button-secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button
            type="button"
            className={`hr-correction-dialog-confirm ${copy.className}`}
            onClick={onConfirm}
            disabled={isConfirmDisabled}
          >
            {isSubmitting ? copy.processing : copy.confirm}
          </button>
        </div>
      </section>
    </div>
  );
}
