import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { HrAuditHistoryItem } from "@/types/hr-audit-history";

type AuditHistoryTableProps = {
  events: readonly HrAuditHistoryItem[];
  onSelectEvent: (eventId: string) => void;
  emptyMessage?: string;
};

function actionTone(event: HrAuditHistoryItem) {
  if (event.outcome === "Approved" || event.outcome === "Recorded") return "success" as const;
  if (event.outcome === "Rejected") return "danger" as const;
  if (event.outcome === "Submitted") return "info" as const;
  return "muted" as const;
}

function changeSummary(event: HrAuditHistoryItem) {
  if (event.changes.length > 0) {
    return event.changes
      .map((change) => `${change.field}: ${change.previousValue ?? "—"} -> ${change.newValue ?? "—"}`)
      .join(" · ");
  }

  return event.note ?? "Workflow activity recorded";
}

export function AuditHistoryTable({
  events,
  onSelectEvent,
  emptyMessage = "No audit events match the selected filters.",
}: AuditHistoryTableProps) {
  return (
    <div className="hr-audit-table-scroll">
      <table className="hr-audit-table">
        <caption className="sr-only">Attendance workflow audit history</caption>
        <thead>
          <tr>
            <th scope="col">Date / time</th>
            <th scope="col">Action</th>
            <th scope="col">Employee</th>
            <th scope="col">Performed by</th>
            <th scope="col">Area</th>
            <th scope="col">Change summary</th>
            <th scope="col">Reference</th>
            <th scope="col"><span className="sr-only">Event action</span></th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id}>
              <td>
                <strong className="hr-audit-date">{event.occurredAt}</strong>
              </td>
              <td>
                <StatusBadge tone={actionTone(event)}>{event.action}</StatusBadge>
              </td>
              <td>
                <strong>{event.employee?.displayName ?? "Unknown / unavailable"}</strong>
                {event.employee ? (
                  <span className="hr-audit-cell-meta">{event.employee.employeeId} · {event.employee.department}</span>
                ) : null}
              </td>
              <td>
                <strong>{event.actor.displayName ?? "Unknown / unavailable"}</strong>
                {event.actor.role ? <span className="hr-audit-cell-meta">{event.actor.role}</span> : null}
              </td>
              <td>{event.area}</td>
              <td className="hr-audit-change-cell">{changeSummary(event)}</td>
              <td>
                <strong className="hr-audit-reference">{event.correctionRequest?.id ?? "Attendance record"}</strong>
                {event.attendanceRecordId ? <span className="hr-audit-cell-meta">{event.attendanceRecordId}</span> : null}
              </td>
              <td>
                <button type="button" className="button-secondary hr-audit-view-button" onClick={() => onSelectEvent(event.id)}>
                  <Icon name="file" />
                  View details
                </button>
              </td>
            </tr>
          ))}
          {events.length === 0 ? (
            <tr>
              <td colSpan={8} className="hr-audit-empty-row">{emptyMessage}</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
