import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { AdminAuditLog, AdminAuditOutcome } from "@/data/admin-audit-logs";

type AuditLogAccountingTableProps = {
  events: readonly AdminAuditLog[];
  onSelectEvent: (eventId: string) => void;
};

function outcomeTone(outcome: AdminAuditOutcome) {
  if (outcome === "Successful") return "success" as const;
  if (outcome === "Failed") return "danger" as const;
  return "warning" as const;
}

export function AuditLogAccountingTable({ events, onSelectEvent }: AuditLogAccountingTableProps) {
  return (
    <div className="admin-audit-accounting-table-wrap">
      <table className="data-table admin-audit-accounting-table">
        <caption className="sr-only">Application-wide administrator audit events</caption>
        <thead>
          <tr>
            <th scope="col">Date / time</th>
            <th scope="col">Action</th>
            <th scope="col">Actor</th>
            <th scope="col">Role</th>
            <th scope="col">Module</th>
            <th scope="col">Target / reference</th>
            <th scope="col">Outcome</th>
            <th scope="col">
              <span className="sr-only">Event action</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => {
            const [date, time] = event.occurredAt.split(" · ");

            return (
              <tr key={event.id}>
                <td>
                  <strong>{date}</strong>
                  <span className="admin-audit-accounting-cell-meta">{time}</span>
                </td>
                <td>
                  <StatusBadge tone={outcomeTone(event.outcome)}>{event.action}</StatusBadge>
                </td>
                <td>
                  <strong>{event.actor.name}</strong>
                  {event.actor.userId ? (
                    <span className="admin-audit-accounting-cell-meta">{event.actor.userId}</span>
                  ) : null}
                </td>
                <td>{event.actor.role}</td>
                <td>{event.module}</td>
                <td>
                  <strong>{event.target.label}</strong>
                  <span className="admin-audit-accounting-cell-meta">{event.target.reference}</span>
                </td>
                <td>
                  <StatusBadge tone={outcomeTone(event.outcome)}>{event.outcome}</StatusBadge>
                </td>
                <td>
                  <button
                    type="button"
                    className="button-secondary admin-audit-accounting-view-button"
                    onClick={() => onSelectEvent(event.id)}
                  >
                    <Icon name="file" />
                    View
                  </button>
                </td>
              </tr>
            );
          })}
          {events.length === 0 ? (
            <tr>
              <td colSpan={8} className="admin-audit-accounting-empty-state">
                No audit events match the selected filters.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
