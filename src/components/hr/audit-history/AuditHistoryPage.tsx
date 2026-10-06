import { AuditHistoryExplorer } from "./AuditHistoryExplorer";
import type { HrAuditHistoryData } from "@/server/hr/audit-history.service";
import type { HrAuditHistoryQuery } from "@/types/hr-audit-history";

type AuditHistoryPageProps = {
  data: HrAuditHistoryData;
  query: HrAuditHistoryQuery;
  loadError?: boolean;
};

export function AuditHistoryPage({
  data,
  query,
  loadError = false,
}: AuditHistoryPageProps) {
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

      <AuditHistoryExplorer data={data} query={query} loadError={loadError} />
    </div>
  );
}
