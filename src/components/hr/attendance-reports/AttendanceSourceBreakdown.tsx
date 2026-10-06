import type { SourceUsageSummary } from "@/data/hr-attendance-reports";

type AttendanceSourceBreakdownProps = {
  summary: SourceUsageSummary;
};

export function AttendanceSourceBreakdown({ summary }: AttendanceSourceBreakdownProps) {
  const percentage = summary.total ? Math.round((summary.qr / summary.total) * 100) : 0;

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
        <div className="hr-reports-source-row">
          <div className="hr-reports-source-label">
            <strong>QR</strong>
            <span>{summary.qr} records · {percentage}%</span>
          </div>
          <div
            className="hr-reports-source-track"
            aria-label={`QR: ${summary.qr} records, ${percentage}%`}
          >
            <span
              className="hr-reports-source-bar is-qr"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
      <p className="hr-reports-source-note">
        Only QR attendance records are currently persisted in the canonical attendance collection.
      </p>
    </section>
  );
}
