import type { SourceUsageSummary } from "@/data/hr-attendance-reports";

type AttendanceSourceBreakdownProps = {
  summary: SourceUsageSummary;
};

export function AttendanceSourceBreakdown({ summary }: AttendanceSourceBreakdownProps) {
  const rows = [
    { label: "Bundy", value: summary.bundy, tone: "bundy" },
    { label: "QR", value: summary.qr, tone: "qr" },
    { label: "No source", value: summary.noSource, tone: "none" },
  ];

  return (
    <section className="hr-reports-source-breakdown" aria-labelledby="hr-source-breakdown-heading">
      <div className="hr-reports-subsection-heading">
        <div>
          <p className="hr-section-kicker">Source usage</p>
          <h3 id="hr-source-breakdown-heading">How attendance records were captured</h3>
        </div>
        <span>{summary.total} records</span>
      </div>
      <div className="hr-reports-source-list">
        {rows.map((row) => {
          const percentage = summary.total ? Math.round((row.value / summary.total) * 100) : 0;

          return (
            <div className="hr-reports-source-row" key={row.label}>
              <div className="hr-reports-source-label">
                <strong>{row.label}</strong>
                <span>{row.value} records · {percentage}%</span>
              </div>
              <div className="hr-reports-source-track" aria-label={`${row.label}: ${row.value} records, ${percentage}%`}>
                <span className={`hr-reports-source-bar is-${row.tone}`} style={{ width: `${percentage}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <p className="hr-reports-source-note">
        {summary.sourceConflicts} source {summary.sourceConflicts === 1 ? "conflict requires" : "conflicts require"} reconciliation.
      </p>
    </section>
  );
}
