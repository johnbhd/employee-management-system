import type { AttendanceCorrectionRecord } from "@/types/attendance-correction";

type CorrectionComparisonProps = {
  request: AttendanceCorrectionRecord;
};

function displayValue(value: string | null | undefined) {
  return value ?? "—";
}

export function CorrectionComparison({ request }: CorrectionComparisonProps) {
  const comparisons = [
    request.requestedChanges.timeIn
      ? {
          label: "Time In",
          current: request.originalAttendance?.timeIn,
          requested: request.requestedChanges.timeIn,
        }
      : null,
    request.requestedChanges.timeOut
      ? {
          label: "Time Out",
          current: request.originalAttendance?.timeOut,
          requested: request.requestedChanges.timeOut,
        }
      : null,
  ].filter((comparison): comparison is NonNullable<typeof comparison> => Boolean(comparison));

  if (comparisons.length === 0) {
    return <p className="hr-correction-muted-copy">No persisted requested time change is available.</p>;
  }

  return (
    <div className="hr-correction-comparison">
      {comparisons.map((comparison) => (
        <div className="hr-correction-comparison-row" key={comparison.label}>
          <span className="hr-correction-comparison-label">{comparison.label}</span>
          <div className="hr-correction-comparison-value">
            <span>
              <small>Original</small>
              <strong>{displayValue(comparison.current)}</strong>
            </span>
            <span className="hr-correction-comparison-arrow" aria-hidden="true">→</span>
            <span className="is-requested">
              <small>Requested</small>
              <strong>{displayValue(comparison.requested)}</strong>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
