import { AuditHistoryExplorer } from "./AuditHistoryExplorer";

export function AuditHistoryPage() {
  return (
    <div className="hr-dashboard-page hr-audit-history-page">
      <header className="hr-dashboard-header">
        <div className="hr-dashboard-heading">
          <p className="hr-dashboard-eyebrow">Attendance operations</p>
          <h1>Audit History</h1>
          <p className="hr-dashboard-description">
            Review attendance-related actions, corrections, decisions, and record changes.
          </p>
        </div>
      </header>

      <AuditHistoryExplorer />
    </div>
  );
}
