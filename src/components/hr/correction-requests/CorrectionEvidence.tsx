import type { AttendanceCorrectionEvidence } from "@/types/attendance-correction";

type CorrectionEvidenceProps = {
  evidence: readonly AttendanceCorrectionEvidence[];
};

export function CorrectionEvidence({ evidence }: CorrectionEvidenceProps) {
  return evidence.length > 0 ? (
    <div className="hr-correction-evidence-list">
      {evidence.map((item) => (
        <div className="hr-correction-evidence-row" key={item.id}>
          <div>
            <strong>{item.fileName}</strong>
            <span>{item.fileType} · Submitted {item.submittedAt}</span>
          </div>
          <span className="hr-correction-evidence-state">Attached</span>
        </div>
      ))}
    </div>
  ) : (
    <p className="hr-correction-muted-copy">No supporting evidence was attached.</p>
  );
}
