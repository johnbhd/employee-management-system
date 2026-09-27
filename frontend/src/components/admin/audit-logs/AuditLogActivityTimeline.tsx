import { StatusBadge } from "@/components/ui/StatusBadge";
import type { AdminAuditLog, AdminAuditOutcome } from "@/data/admin-audit-logs";

type AuditLogActivityTimelineProps = {
  events: readonly AdminAuditLog[];
};

function outcomeTone(outcome: AdminAuditOutcome) {
  if (outcome === "Successful") return "success" as const;
  if (outcome === "Failed") return "danger" as const;
  return "warning" as const;
}

export function AuditLogActivityTimeline({ events }: AuditLogActivityTimelineProps) {
  return (
    <ol className="admin-audit-timeline">
      {events.map((event) => (
        <li className="admin-audit-timeline-item" key={event.id}>
          <span className="admin-audit-timeline-marker" aria-hidden="true" />
          <div>
            <div className="admin-audit-timeline-heading">
              <strong>{event.action}</strong>
              <StatusBadge tone={outcomeTone(event.outcome)}>{event.outcome}</StatusBadge>
            </div>
            <p>{event.occurredAt}</p>
            <small>{event.actor.name} · {event.id}</small>
          </div>
        </li>
      ))}
    </ol>
  );
}
