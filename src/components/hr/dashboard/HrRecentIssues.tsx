import { StatusBadge } from "@/components/ui/StatusBadge";
import type { HrDashboardIssue } from "@/types/hr-dashboard";

type HrRecentIssuesProps = {
  dataLoadError?: boolean;
  issues: readonly HrDashboardIssue[];
};

export function HrRecentIssues({
  dataLoadError = false,
  issues,
}: HrRecentIssuesProps) {
  return (
    <section className="hr-dashboard-panel hr-issues-panel" aria-labelledby="hr-recent-issues-heading">
      <div className="hr-panel-header">
        <div>
          <p className="hr-section-kicker">Review attention</p>
          <h2 id="hr-recent-issues-heading">Recent Attendance Issues</h2>
        </div>
      </div>
      {issues.length > 0 ? (
        <div className="hr-issue-list">
          {issues.map((issue) => (
            <article className="hr-issue-row" key={issue.id}>
              <span className={`hr-issue-marker hr-issue-marker-${issue.tone}`} aria-hidden="true" />
              <div className="hr-issue-copy">
                <div className="hr-issue-heading">
                  <strong>{issue.employeeName}</strong>
                  <span>{issue.id}</span>
                </div>
                <h3>{issue.title}</h3>
                <p>{issue.description}</p>
                <small>{issue.time}</small>
              </div>
              <StatusBadge tone={issue.tone}>{issue.status}</StatusBadge>
            </article>
          ))}
        </div>
      ) : (
        <p className={`hr-empty-state${dataLoadError ? " is-error" : ""}`} role={dataLoadError ? "alert" : undefined}>
          {dataLoadError
            ? "Unable to load attendance issues. Please try again."
            : "No current attendance issues."}
        </p>
      )}
    </section>
  );
}
