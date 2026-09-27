import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { AdminAuditLog, AdminAuditOutcome } from "@/data/admin-audit-logs";
import type { StatusTone } from "@/types/ui";

type AuditLogsTableProps = {
  logs: readonly AdminAuditLog[];
  onSelectEvent: (eventId: string) => void;
};

const outcomeTones: Record<AdminAuditOutcome, StatusTone> = {
  Successful: "success",
  Blocked: "warning",
  Failed: "danger",
};

export function AuditLogsTable({ logs, onSelectEvent }: AuditLogsTableProps) {
  return (
    <div className="audit-logs-table-wrap">
      <table className="data-table audit-logs-table">
        <caption className="sr-only">Recorded administrator audit activity</caption>
        <thead>
          <tr>
            <th>Recorded</th>
            <th>Action</th>
            <th>Actor</th>
            <th>Module</th>
            <th>Target / reference</th>
            <th>Outcome</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {logs.length > 0 ? (
            logs.map((event) => (
              <tr key={event.id}>
                <td>
                  <span className="audit-logs-date">{event.occurredAt}</span>
                  <small className="audit-logs-event-id">{event.id}</small>
                </td>
                <td>
                  <strong className="audit-logs-action">{event.action}</strong>
                  {event.changes.length > 0 ? (
                    <small className="audit-logs-change-count">
                      {event.changes.length} field change{event.changes.length === 1 ? "" : "s"}
                    </small>
                  ) : null}
                </td>
                <td>
                  <strong className="audit-logs-actor">{event.actor.name}</strong>
                  <small>{event.actor.role}</small>
                </td>
                <td>{event.module}</td>
                <td>
                  <strong className="audit-logs-target">{event.target.label}</strong>
                  <small>{event.target.reference}</small>
                </td>
                <td>
                  <StatusBadge tone={outcomeTones[event.outcome]}>{event.outcome}</StatusBadge>
                </td>
                <td>
                  <button
                    type="button"
                    className="button-link audit-logs-view-button"
                    onClick={() => onSelectEvent(event.id)}
                    aria-label={`View details for ${event.id}`}
                  >
                    <Icon name="file" />
                    View
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="audit-logs-empty-row" colSpan={7}>
                No recorded activity matches the selected filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
