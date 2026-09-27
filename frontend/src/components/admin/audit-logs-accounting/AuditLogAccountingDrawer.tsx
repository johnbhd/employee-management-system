import type { ReactNode } from "react";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { AdminAuditLog, AdminAuditOutcome } from "@/data/admin-audit-logs";

type AuditLogAccountingDrawerProps = {
  event: AdminAuditLog | null;
  relatedEvents: readonly AdminAuditLog[];
  onClose: () => void;
};

function outcomeTone(outcome: AdminAuditOutcome) {
  if (outcome === "Successful") return "success" as const;
  if (outcome === "Failed") return "danger" as const;
  return "warning" as const;
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="admin-audit-accounting-detail-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function ChangeDetails({ event }: { event: AdminAuditLog }) {
  if (event.changes.length === 0) {
    return (
      <p className="admin-audit-accounting-drawer-note">
        {event.details ?? "This event records activity without a field-value change."}
      </p>
    );
  }

  return (
    <div className="admin-audit-accounting-change-list">
      {event.changes.map((change) => (
        <div className="admin-audit-accounting-change-row" key={`${change.field}-${change.newValue}`}>
          <strong>{change.field}</strong>
          <div>
            <span>Previous</span>
            <p>{change.previousValue}</p>
          </div>
          <div>
            <span>New value</span>
            <p>{change.newValue}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function RelatedActivity({ events }: { events: readonly AdminAuditLog[] }) {
  return (
    <ol className="admin-audit-accounting-activity-list">
      {events.map((event) => (
        <li key={event.id}>
          <span className="admin-audit-accounting-activity-marker" aria-hidden="true" />
          <div>
            <div className="admin-audit-accounting-activity-heading">
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

export function AuditLogAccountingDrawer({
  event,
  relatedEvents,
  onClose,
}: AuditLogAccountingDrawerProps) {
  if (!event) return null;

  return (
    <div className="admin-audit-accounting-drawer-layer">
      <button
        type="button"
        className="admin-audit-accounting-drawer-backdrop"
        onClick={onClose}
        aria-label="Close audit event details"
      />
      <aside
        className="admin-audit-accounting-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-audit-accounting-drawer-title"
      >
        <div className="admin-audit-accounting-drawer-header">
          <div>
            <p className="section-kicker">Audit event</p>
            <h2 id="admin-audit-accounting-drawer-title">{event.action}</h2>
            <p>{event.id} · {event.occurredAt}</p>
          </div>
          <button
            type="button"
            className="icon-button admin-audit-accounting-close-button"
            onClick={onClose}
            aria-label="Close audit event details"
            autoFocus
          >
            <Icon name="close" />
          </button>
        </div>

        <section className="admin-audit-accounting-drawer-section" aria-labelledby="admin-audit-event-summary">
          <h3 id="admin-audit-event-summary">Event summary</h3>
          <dl className="admin-audit-accounting-detail-list">
            <DetailRow label="Audit event ID" value={event.id} />
            <DetailRow label="Action" value={event.action} />
            <DetailRow label="Date / time" value={event.occurredAt} />
            <DetailRow label="Module" value={event.module} />
            <DetailRow
              label="Outcome"
              value={<StatusBadge tone={outcomeTone(event.outcome)}>{event.outcome}</StatusBadge>}
            />
          </dl>
        </section>

        <section className="admin-audit-accounting-drawer-section" aria-labelledby="admin-audit-event-actor">
          <h3 id="admin-audit-event-actor">Performed by</h3>
          <dl className="admin-audit-accounting-detail-list">
            <DetailRow label="Actor" value={event.actor.name} />
            <DetailRow label="Actor role" value={event.actor.role} />
            {event.actor.userId ? <DetailRow label="Actor reference" value={event.actor.userId} /> : null}
          </dl>
        </section>

        <section className="admin-audit-accounting-drawer-section" aria-labelledby="admin-audit-event-target">
          <h3 id="admin-audit-event-target">Affected module and target</h3>
          <dl className="admin-audit-accounting-detail-list">
            <DetailRow label="Module" value={event.module} />
            <DetailRow label="Target type" value={event.target.type} />
            <DetailRow label="Target" value={event.target.label} />
            <DetailRow label="Reference" value={event.target.reference} />
          </dl>
        </section>

        <section className="admin-audit-accounting-drawer-section" aria-labelledby="admin-audit-event-change">
          <h3 id="admin-audit-event-change">
            {event.changes.length > 0 ? "Change details" : "Action details"}
          </h3>
          <ChangeDetails event={event} />
        </section>

        {event.changes.length > 0 && event.details ? (
          <section className="admin-audit-accounting-drawer-section" aria-labelledby="admin-audit-event-context">
            <h3 id="admin-audit-event-context">Context</h3>
            <p className="admin-audit-accounting-drawer-note">{event.details}</p>
          </section>
        ) : null}

        {relatedEvents.length > 1 ? (
          <section className="admin-audit-accounting-drawer-section" aria-labelledby="admin-audit-event-related">
            <h3 id="admin-audit-event-related">Related activity</h3>
            <RelatedActivity events={relatedEvents} />
          </section>
        ) : null}

        <div className="admin-audit-accounting-drawer-footer">
          <button type="button" className="button-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </aside>
    </div>
  );
}
