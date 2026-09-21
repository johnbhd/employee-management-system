import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { FlowDiagram } from "@/components/admin/shared/FlowDiagram";
import { ProgressList } from "@/components/admin/shared/ProgressList";
import { ActionButton } from "@/components/ui/ActionButton";
import { FilterableTable } from "@/components/ui/FilterableTable";
import { Icon } from "@/components/ui/Icon";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SummaryCard } from "@/components/ui/SummaryCard";
import { activityEvents, adminIssues, integrationHealth } from "@/data/admin";

const monitoringMetrics = [
  { label: "Systems online", value: "5 / 6", note: "Connected now", icon: "monitoring" as const, tone: "success" as const },
  { label: "Events today", value: "1,248", note: "Across all sources", icon: "activity" as const, tone: "info" as const },
  { label: "Success rate", value: "98.4%", note: "Last 24 hours", icon: "check" as const, tone: "success" as const },
  { label: "Open issues", value: "3", note: "Review required", icon: "warning" as const, tone: "warning" as const },
];

export function IntegrationMonitoringPage() {
  return (
    <div className="admin-page monitoring-page">
      <AdminPageHeader eyebrow="Operations" title="Integration Monitoring" description="Observe connection health, synchronization activity, and transfer quality across the employee management system." actions={<ActionButton icon="refresh" action="Monitoring data refreshed.">Refresh monitoring</ActionButton>} />
      <section className="notice"><Icon name="info" /><p>Monitoring is read-only in this prototype. Refresh and retry controls provide interface feedback without contacting external systems.</p></section>
      <div className="metric-grid monitoring-metrics">{monitoringMetrics.map((metric) => <SummaryCard key={metric.label} {...metric} />)}</div>

      <SectionCard title="Connected systems" eyebrow="Current health">
        <div className="panel-body system-health-grid">{integrationHealth.map((system) => <article className="system-health-card" key={system.name}><div className="system-health-heading"><strong>{system.name}</strong><StatusBadge tone={system.tone}>{system.status}</StatusBadge></div><p>{system.purpose}</p><small>{system.detail}</small><span>Last sync: {system.lastSync}</span></article>)}</div>
      </SectionCard>

      <SectionCard title="Data flow" eyebrow="End-to-end path">
        <FlowDiagram nodes={[{ label: "Source systems", detail: "HRPS · Bundy · QR", icon: "layers", status: "Connected", tone: "success" }, { label: "Integration layer", detail: "Queue + validation", icon: "activity", status: "Processing", tone: "info" }, { label: "Unified Attendance", detail: "Standard output", icon: "unified", status: "Ready", tone: "success" }, { label: "Downstream", detail: "Existing systems", icon: "building", status: "One warning", tone: "warning" }]} />
      </SectionCard>

      <SectionCard title="Synchronization activity" eyebrow="Filterable event log">
        <FilterableTable rows={activityEvents} columns={[{ key: "time", label: "Time" }, { key: "source", label: "Source" }, { key: "destination", label: "Destination" }, { key: "operation", label: "Operation" }, { key: "records", label: "Records" }, { key: "status", label: "Status" }]} filters={[{ key: "source", label: "Source", options: ["All", "Bundy ETL", "HRPS", "Unified Attendance", "QR Attendance", "Integration Layer"] }, { key: "status", label: "Status", options: ["All", "Success", "Failed", "Pending", "Warning"] }]} searchPlaceholder="Search synchronization events" caption="Synchronization activity" emptyMessage="No synchronization events match the selected filters." note="Mock data · no live integration calls" />
      </SectionCard>

      <div className="two-column">
        <SectionCard title="Recent issues" eyebrow="Operational queue"><div className="panel-body issue-list">{adminIssues.map((issue) => <article className={`issue-card ${issue.tone}`} key={issue.title}><div><h3>{issue.title}</h3><p>{issue.message}</p></div><ActionButton variant="link" action={`${issue.title} retry queued.`}>Retry</ActionButton></article>)}</div></SectionCard>
        <SectionCard title="Attendance integration quality" eyebrow="Last 24 hours"><div className="panel-body"><ProgressList items={[{ label: "Records validated", value: "98.4%", percent: 98, tone: "success" }, { label: "Employee ID match rate", value: "96.8%", percent: 97, tone: "success" }, { label: "Records needing review", value: "1.6%", percent: 16, tone: "warning" }]} /></div></SectionCard>
      </div>
      <p className="page-feedback"><Icon name="info" /> Last mock refresh completed at 10:42 AM. Source metrics are illustrative.</p>
    </div>
  );
}
