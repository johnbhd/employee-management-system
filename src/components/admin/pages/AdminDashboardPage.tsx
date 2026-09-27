import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { FlowDiagram } from "@/components/admin/shared/FlowDiagram";
import { ProgressList } from "@/components/admin/shared/ProgressList";
import { ActionButton } from "@/components/ui/ActionButton";
import { Icon } from "@/components/ui/Icon";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SummaryCard } from "@/components/ui/SummaryCard";
import { adminIssues, activityEvents, auditEvents, dashboardMetrics, integrationHealth } from "@/data/admin";

export function AdminDashboardPage() {
  return (
    <div className="admin-page admin-dashboard-page">
      <AdminPageHeader
        eyebrow="Integration control center"
        title="IT Administrator Dashboard"
        description="Monitor the employee data boundary, attendance sources, and downstream integration readiness from one workspace."
        actions={<><ActionButton icon="refresh" action="Dashboard data refreshed.">Refresh data</ActionButton><Link className="button-primary" href="/admin/unified-attendance">Open unified attendance</Link></>}
      />

      <div className="metric-grid">
        {dashboardMetrics.map((metric) => <SummaryCard key={metric.label} {...metric} />)}
      </div>

      <div className="two-column">
        <SectionCard title="Integration health" eyebrow="Connected systems">
          <div className="panel-body list-stack">
            {integrationHealth.map((system) => (
              <div className="list-row" key={system.name}>
                <div><strong>{system.name}</strong><p>{system.purpose}</p><small>{system.detail} · Last sync {system.lastSync}</small></div>
                <StatusBadge tone={system.tone}>{system.status}</StatusBadge>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Synchronization overview" eyebrow="Today">
          <div className="panel-body"><ProgressList items={[{ label: "Successful transfers", value: "1,248 records", percent: 94, tone: "success" }, { label: "Pending validation", value: "14 records", percent: 28, tone: "warning" }, { label: "Failed transfers", value: "3 records", percent: 8, tone: "warning" }]} /></div>
        </SectionCard>
      </div>

      <SectionCard title="Attendance data flow" eyebrow="Source to standardized layer">
        <FlowDiagram nodes={[{ label: "HRPS", detail: "Employee master", icon: "hrps", status: "Authoritative", tone: "info" }, { label: "Bundy / QR", detail: "Attendance sources", icon: "layers", status: "Ingest", tone: "success" }, { label: "Integration layer", detail: "Validate + match", icon: "shield", status: "Prototype", tone: "warning" }, { label: "Unified Attendance", detail: "Standard records", icon: "unified", status: "Ready", tone: "success" }, { label: "Downstream", detail: "Payroll / accounting", icon: "payroll", status: "External", tone: "muted" }]} />
        <p className="data-flow-note">HRPS remains the employee information source of truth. Bundy and QR records are standardized before any verified attendance is sent to existing downstream systems.</p>
      </SectionCard>

      <SectionCard title="Recent integration events" eyebrow="Latest activity" actions={<Link className="button-link" href="/admin/integration-monitoring">View monitoring</Link>}>
        <div className="table-wrap">
          <table className="data-table"><caption className="sr-only">Recent integration events</caption><thead><tr><th>Time</th><th>Source</th><th>Destination</th><th>Operation</th><th>Records</th><th>Status</th></tr></thead><tbody>
            {activityEvents.slice(0, 5).map((event) => <tr key={`${event.time}-${event.operation}`}><td>{event.time}</td><td>{event.source}</td><td>{event.destination}</td><td>{event.operation}</td><td>{event.records}</td><td><StatusBadge tone={event.tone}>{event.status}</StatusBadge></td></tr>)}
          </tbody></table>
        </div>
      </SectionCard>

      <div className="two-column-wide">
        <SectionCard title="Integration errors" eyebrow="Needs attention">
          <div className="panel-body issue-list">
            {adminIssues.map((issue) => <article className={`issue-card ${issue.tone}`} key={issue.title}><div><h3>{issue.title}</h3><p>{issue.message}</p><small>{issue.time}</small></div><StatusBadge tone={issue.tone}>{issue.status}</StatusBadge></article>)}
          </div>
        </SectionCard>
        <SectionCard title="Quick actions" eyebrow="Prototype controls">
          <div className="panel-body quick-action-grid">
            <ActionButton icon="refresh" action="All mock integrations queued for refresh." variant="primary">Refresh integrations</ActionButton>
            <Link className="quick-action-link" href="/admin/hrps-integration">Review HRPS records <Icon name="arrow" /></Link>
            <Link className="quick-action-link" href="/admin/bundy-biometric-etl">Review Bundy ETL <Icon name="arrow" /></Link>
            <Link className="quick-action-link" href="/admin/qr-attendance">Review QR activity <Icon name="arrow" /></Link>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Recent audit activity" eyebrow="Traceability">
        <div className="panel-body timeline-list">
          {auditEvents.map((event) => <div className="timeline-item" key={event.event}><div><strong>{event.event}</strong><p>{event.actor}</p></div><small>{event.time}</small></div>)}
        </div>
      </SectionCard>
    </div>
  );
}
