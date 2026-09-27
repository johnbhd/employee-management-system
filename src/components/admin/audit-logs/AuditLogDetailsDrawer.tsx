import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { AdminAuditLog, AdminAuditOutcome } from "@/data/admin-audit-logs";
import type { StatusTone } from "@/types/ui";

type AuditLogDetailsDrawerProps = {
  event: AdminAuditLog;
  relatedEvents: readonly AdminAuditLog[];
  onClose: () => void;
};

const outcomeTones: Record<AdminAuditOutcome, StatusTone> = {
  Successful: "success",
  Blocked: "warning",
  Failed: "danger",
};

export function AuditLogDetailsDrawer({ event, relatedEvents, onClose }: AuditLogDetailsDrawerProps) {
  return (
    <div className="audit-logs-drawer-layer">
      <button type="button" className="audit-logs-drawer-backdrop" onClick={onClose} aria-label="Close audit details" />
      <aside className="audit-logs-drawer" role="dialog" aria-modal="true" aria-labelledby="audit-logs-drawer-title">
        <header className="audit-logs-drawer-header">
          <div>
            <p className="section-kicker">Recorded event</p>
            <h2 id="audit-logs-drawer-title">{event.action}</h2>
            <p className="audit-logs-drawer-meta">{event.id} · {event.occurredAt}</p>
          </div>
          <button type="button" className="button-secondary audit-logs-drawer-close" onClick={onClose} aria-label="Close audit details">
            <Icon name="close" />
          </button>
        </header>

        <div className="audit-logs-drawer-content">
          <div className="audit-logs-drawer-status-row">
            <StatusBadge tone={outcomeTones[event.outcome]}>{event.outcome}</StatusBadge>
            <span>{event.module}</span>
          </div>

          <section className="audit-logs-detail-section">
            <h3>Event context</h3>
            <dl className="audit-logs-detail-list">
              <div>
                <dt>Performed by</dt>
                <dd>{event.actor.name}</dd>
                <small>{event.actor.role}{event.actor.userId ? ` · ${event.actor.userId}` : ""}</small>
              </div>
              <div>
                <dt>Target</dt>
                <dd>{event.target.label}</dd>
                <small>{event.target.type} · {event.target.reference}</small>
              </div>
            </dl>
          </section>

          <section className="audit-logs-detail-section">
            <h3>Change details</h3>
            {event.changes.length > 0 ? (
              <div className="audit-logs-change-list">
                {event.changes.map((change) => (
                  <div className="audit-logs-change-row" key={change.field}>
                    <strong>{change.field}</strong>
                    <div>
                      <span>{change.previousValue}</span>
                      <Icon name="arrow" />
                      <span>{change.newValue}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="audit-logs-muted-copy">No field-level changes were recorded for this event.</p>
            )}
            {event.details ? <p className="audit-logs-event-detail">{event.details}</p> : null}
          </section>

          <section className="audit-logs-detail-section">
            <h3>Related activity</h3>
            {relatedEvents.length > 0 ? (
              <div className="audit-logs-related-list">
                {relatedEvents.map((relatedEvent) => (
                  <div className="audit-logs-related-item" key={relatedEvent.id}>
                    <span className="audit-logs-related-icon" aria-hidden="true">
                      <Icon name="activity" />
                    </span>
                    <div>
                      <strong>{relatedEvent.action}</strong>
                      <small>{relatedEvent.id} · {relatedEvent.occurredAt}</small>
                    </div>
                    <StatusBadge tone={outcomeTones[relatedEvent.outcome]}>{relatedEvent.outcome}</StatusBadge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="audit-logs-muted-copy">No related activity is linked to this event.</p>
            )}
          </section>
        </div>

        <footer className="audit-logs-drawer-footer">
          <span>Read-only prototype record</span>
          <button type="button" className="button-secondary" onClick={onClose}>Close details</button>
        </footer>
      </aside>
    </div>
  );
}
