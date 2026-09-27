import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { AttendanceAuditAction, AttendanceAuditEvent } from "@/data/hr-attendance-audit";

type AuditHistoryTableProps = {
  events: readonly AttendanceAuditEvent[];
  onSelectEvent: (eventId: string) => void;
};

function actionTone(action: AttendanceAuditAction) {
  if (action === "Correction Approved") return "success" as const;
  if (action === "Correction Rejected") return "danger" as const;
  if (action === "Information Requested") return "warning" as const;
  if (action === "Correction Reviewed") return "info" as const;
  if (action === "Attendance Verified") return "success" as const;
  return "muted" as const;
}

function changeSummary(event: AttendanceAuditEvent) {
  if (event.changes.length > 0) {
    return event.changes
      .map((change) => `${change.field}: ${change.previousValue} → ${change.newValue}`)
      .join(" · ");
  }

  return event.note ?? "Workflow activity recorded";
}

export function AuditHistoryTable({ events, onSelectEvent }: AuditHistoryTableProps) {
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
                <strong className="hr-audit-date">{event.occurredAt.split(" · ")[0]}</strong>
                <span className="hr-audit-cell-meta">{event.occurredAt.split(" · ")[1]}</span>
              </td>
              <td>
                <StatusBadge tone={actionTone(event.action)}>{event.action}</StatusBadge>
              </td>
              <td>
                <strong>{event.employee.name}</strong>
                <span className="hr-audit-cell-meta">{event.employee.employeeId} · {event.employee.department}</span>
              </td>
              <td>
                <strong>{event.actor.name}</strong>
                <span className="hr-audit-cell-meta">{event.actor.role}</span>
              </td>
              <td>{event.area}</td>
              <td className="hr-audit-change-cell">{changeSummary(event)}</td>
              <td>
                <strong className="hr-audit-reference">{event.correctionRequest?.id ?? "Attendance record"}</strong>
                <span className="hr-audit-cell-meta">{event.attendanceRecordId}</span>
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
              <td colSpan={8} className="hr-audit-empty-row">No audit events match the selected filters.</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
