import type { AdminAuditChange } from "@/data/admin-audit-logs";

export function AuditLogChangeComparison({ changes }: { changes: readonly AdminAuditChange[] }) {
  return (
    <div className="admin-audit-change-table" role="table" aria-label="Recorded value changes">
      <div className="admin-audit-change-row admin-audit-change-heading" role="row">
        <span role="columnheader">Field</span>
        <span role="columnheader">Previous</span>
        <span role="columnheader">New value</span>
      </div>
      {changes.map((change) => (
        <div className="admin-audit-change-row" role="row" key={`${change.field}-${change.newValue}`}>
          <strong role="cell">{change.field}</strong>
          <span role="cell">{change.previousValue}</span>
          <span role="cell">{change.newValue}</span>
        </div>
      ))}
    </div>
  );
}
