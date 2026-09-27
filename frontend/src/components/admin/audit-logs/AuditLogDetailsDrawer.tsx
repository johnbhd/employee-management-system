import type { ReactNode } from "react";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { AdminAuditLog, AdminAuditOutcome } from "@/data/admin-audit-logs";

import { AuditLogActivityTimeline } from "./AuditLogActivityTimeline";
import { AuditLogChangeComparison } from "./AuditLogChangeComparison";

type AuditLogDetailsDrawerProps = {
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
    <div className="admin-audit-detail-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export function AuditLogDetailsDrawer({ event, relatedEvents, onClose }: AuditLogDetailsDrawerProps) {
  if (!event) return null;

  return (
    <div className="admin-audit-drawer-layer">
      <button
        type="button"
        className="admin-audit-drawer-backdrop"
        onClick={onClose}
        aria-label="Close audit event details"
      />
      <aside
        className="admin-audit-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-audit-drawer-title"
      >
        <div className="admin-audit-drawer-header">
          <div>
            <p className="section-kicker">Audit event</p>
            <h2 id="admin-audit-drawer-title">{event.action}</h2>
            <p className="admin-audit-drawer-meta">{event.id} · {event.occurredAt}</p>
          </div>
          <button
            type="button"
            className="icon-button admin-audit-close-button"
            onClick={onClose}
            aria-label="Close audit event details"
            autoFocus
          >
            <Icon name="close" />
          </button>
        </div>

        <section className="admin-audit-detail-section" aria-labelledby="admin-audit-summary-heading">
          <h3 id="admin-audit-summary-heading">Event summary</h3>
          <dl className="admin-audit-detail-list">
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

        <section className="admin-audit-detail-section" aria-labelledby="admin-audit-actor-heading">
          <h3 id="admin-audit-actor-heading">Performed by</h3>
          <dl className="admin-audit-detail-list">
            <DetailRow label="Actor" value={event.actor.name} />
            <DetailRow label="Actor role" value={event.actor.role} />
            {event.actor.userId ? <DetailRow label="Actor reference" value={event.actor.userId} /> : null}
          </dl>
        </section>

        <section className="admin-audit-detail-section" aria-labelledby="admin-audit-target-heading">
          <h3 id="admin-audit-target-heading">Affected module and target</h3>
          <dl className="admin-audit-detail-list">
            <DetailRow label="Module" value={event.module} />
            <DetailRow label="Target type" value={event.target.type} />
            <DetailRow label="Target" value={event.target.label} />
            <DetailRow label="Reference" value={event.target.reference} />
          </dl>
        </section>

        <section className="admin-audit-detail-section" aria-labelledby="admin-audit-change-heading">
          <h3 id="admin-audit-change-heading">
            {event.changes.length > 0 ? "Change details" : "Action details"}
          </h3>
          {event.changes.length > 0 ? (
            <AuditLogChangeComparison changes={event.changes} />
          ) : (
            <p className="admin-audit-note">
              {event.details ?? "This event records activity without a field-value change."}
            </p>
          )}
        </section>

        {event.changes.length > 0 && event.details ? (
          <section className="admin-audit-detail-section" aria-labelledby="admin-audit-context-heading">
            <h3 id="admin-audit-context-heading">Context</h3>
            <p className="admin-audit-note">{event.details}</p>
          </section>
        ) : null}

        {relatedEvents.length > 1 ? (
          <section className="admin-audit-detail-section" aria-labelledby="admin-audit-related-heading">
            <h3 id="admin-audit-related-heading">Related activity</h3>
            <AuditLogActivityTimeline events={relatedEvents} />
          </section>
        ) : null}

        <div className="admin-audit-drawer-footer">
          <button type="button" className="button-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </aside>
    </div>
  );
}
