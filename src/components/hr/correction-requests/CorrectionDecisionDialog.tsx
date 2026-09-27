import { Icon } from "@/components/ui/Icon";
import type { HrCorrectionRequest } from "@/data/hr-correction-requests";

import type { CorrectionDecisionType } from "./types";

type CorrectionDecisionDialogProps = {
  request: HrCorrectionRequest | null;
  decision: CorrectionDecisionType | null;
  note: string;
  onNoteChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

const decisionCopy = {
  approve: {
    title: "Approve Correction Request?",
    description: "Confirm that the requested attendance correction can be approved for HR review processing.",
    confirm: "Approve Request",
    className: "hr-correction-dialog-approve",
    noteLabel: "Decision note (optional)",
    placeholder: "Add a short review note if needed.",
    required: false,
  },
  reject: {
    title: "Reject Correction Request",
    description: "Record why this attendance correction cannot be approved.",
    confirm: "Reject Request",
    className: "hr-correction-dialog-reject",
    noteLabel: "Rejection reason",
    placeholder: "Explain why the requested correction is being rejected.",
    required: true,
  },
  information: {
    title: "Request More Information",
    description: "Tell the employee what information is required before this request can be reviewed again.",
    confirm: "Send Request",
    className: "hr-correction-dialog-information",
    noteLabel: "Information needed",
    placeholder: "Please provide supporting documentation or clarify the requested attendance value.",
    required: true,
  },
} as const;

function formatDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function CorrectionDecisionDialog({
  request,
  decision,
  note,
  onNoteChange,
  onClose,
  onConfirm,
}: CorrectionDecisionDialogProps) {
  if (!request || !decision) return null;

  const copy = decisionCopy[decision];
  const isConfirmDisabled = copy.required && note.trim().length === 0;

  return (
    <div className="hr-correction-dialog-layer">
      <button type="button" className="hr-correction-dialog-backdrop" onClick={onClose} aria-label="Close decision dialog" />
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
          <button type="button" className="hr-correction-close-button" onClick={onClose} aria-label="Close decision dialog">
            <Icon name="close" />
          </button>
        </div>

        <p id="hr-correction-dialog-description" className="hr-correction-dialog-description">
          {copy.description}
        </p>

        <dl className="hr-correction-dialog-summary">
          <div>
            <dt>Employee</dt>
            <dd>{request.employeeName}</dd>
          </div>
          <div>
            <dt>Attendance date</dt>
            <dd>{formatDate(request.attendanceDate)}</dd>
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
          />
        </label>

        <div className="hr-correction-dialog-footer">
          <button type="button" className="button-secondary" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className={`hr-correction-dialog-confirm ${copy.className}`}
            onClick={onConfirm}
            disabled={isConfirmDisabled}
          >
            {copy.confirm}
          </button>
        </div>
      </section>
    </div>
  );
}
