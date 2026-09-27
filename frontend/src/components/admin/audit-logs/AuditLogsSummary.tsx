import { SummaryCard } from "@/components/ui/SummaryCard";
import type { AdminAuditLog } from "@/data/admin-audit-logs";

type AuditLogsSummaryProps = {
  events: readonly AdminAuditLog[];
};

export function AuditLogsSummary({ events }: AuditLogsSummaryProps) {
  const successfulEvents = events.filter((event) => event.outcome === "Successful").length;
  const failedEvents = events.filter((event) => event.outcome === "Failed").length;
  const blockedEvents = events.filter((event) => event.outcome === "Blocked").length;
  const moduleCount = new Set(events.map((event) => event.module)).size;

  return (
    <section className="metric-grid admin-audit-summary-grid" aria-label="Audit log summary">
      <SummaryCard
        label="Total events"
        value={String(events.length)}
        note="Recorded activity"
        icon="audit"
        tone="info"
      />
      <SummaryCard
        label="Successful"
        value={String(successfulEvents)}
        note="Completed activity"
        icon="check"
        tone="success"
      />
      <SummaryCard
        label="Blocked"
        value={String(blockedEvents)}
        note="Needs attention"
        icon="warning"
        tone="warning"
      />
      <SummaryCard
        label="Failed"
        value={String(failedEvents)}
        note="Recorded failures"
        icon="close"
        tone="danger"
      />
      <SummaryCard
        label="Modules covered"
        value={String(moduleCount)}
        note="Across the workspace"
        icon="layers"
        tone="muted"
      />
    </section>
  );
}
