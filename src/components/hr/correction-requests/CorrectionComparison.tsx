import type { HrCorrectionRequest } from "@/data/hr-correction-requests";

type CorrectionComparisonProps = {
  request: HrCorrectionRequest;
};

function displayValue(value?: string) {
  return value ?? "—";
}

export function CorrectionComparison({ request }: CorrectionComparisonProps) {
  const comparisons = [
    request.requestedValues.timeIn
      ? { label: "Time In", current: request.currentValues.timeIn, requested: request.requestedValues.timeIn }
      : null,
    request.requestedValues.timeOut
      ? { label: "Time Out", current: request.currentValues.timeOut, requested: request.requestedValues.timeOut }
      : null,
    request.requestedValues.source
      ? { label: "Source", current: request.currentValues.source, requested: request.requestedValues.source }
      : null,
  ].filter((comparison): comparison is NonNullable<typeof comparison> => Boolean(comparison));

  return (
    <div className="hr-correction-comparison">
      {comparisons.map((comparison) => (
        <div className="hr-correction-comparison-row" key={comparison.label}>
          <span className="hr-correction-comparison-label">{comparison.label}</span>
          <div className="hr-correction-comparison-value">
            <span>
              <small>Current</small>
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
