import type { AttendanceAuditChange } from "@/data/hr-attendance-audit";

type AuditChangeComparisonProps = {
  changes: readonly AttendanceAuditChange[];
};

export function AuditChangeComparison({ changes }: AuditChangeComparisonProps) {
  return (
    <div className="hr-audit-change-comparison">
      {changes.map((change) => (
        <div className="hr-audit-change-row" key={`${change.field}-${change.previousValue}-${change.newValue}`}>
          <strong>{change.field}</strong>
          <div className="hr-audit-change-values">
            <span>
              <small>Previous</small>
              <b>{change.previousValue || "—"}</b>
            </span>
            <span className="hr-audit-change-arrow" aria-hidden="true">→</span>
            <span className="is-new">
              <small>New</small>
              <b>{change.newValue || "—"}</b>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
