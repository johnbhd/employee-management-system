import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { FlowDiagram } from "@/components/admin/shared/FlowDiagram";
import { ProgressList } from "@/components/admin/shared/ProgressList";
import { ActionButton } from "@/components/ui/ActionButton";
import { FilterableTable } from "@/components/ui/FilterableTable";
import { Icon } from "@/components/ui/Icon";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SummaryCard } from "@/components/ui/SummaryCard";
import { hrpsEmployees } from "@/data/admin";

const hrpsMetrics = [
  { label: "Employees in HRPS", value: "1,284", note: "Official source", icon: "users" as const, tone: "info" as const },
  { label: "Updated this sync", value: "12", note: "Latest batch", icon: "check" as const, tone: "success" as const },
  { label: "Needs review", value: "4", note: "Data quality queue", icon: "warning" as const, tone: "warning" as const },
  { label: "Last sync", value: "10:38", note: "AM · 0.9 seconds", icon: "clock" as const, tone: "info" as const },
];

export function HrpsIntegrationPage() {
  return (
    <div className="admin-page hrps-page">
      <AdminPageHeader eyebrow="Employee master data" title="HRPS Integration" description="Review the HRPS connection and the employee records synchronized into the integration layer." actions={<><ActionButton icon="refresh" action="HRPS synchronization queued.">Sync now</ActionButton><ActionButton variant="secondary" action="Connection test completed successfully.">Test connection</ActionButton></>} />
      <section className="notice"><Icon name="info" /><p><strong>HRPS is the authoritative employee information source.</strong> This page shows a mock synchronization view; employee records are not written to or fetched from a live HRPS service.</p></section>
      <div className="metric-grid hrps-metrics">{hrpsMetrics.map((metric) => <SummaryCard key={metric.label} {...metric} />)}</div>

      <div className="two-column">
        <SectionCard title="Connection status" eyebrow="HRPS endpoint"><div className="panel-body connection-summary"><div className="connection-status"><span className="status-dot status-success" /><strong>Connected</strong><StatusBadge tone="success">Healthy</StatusBadge></div><dl className="detail-list"><div><dt>Endpoint</dt><dd>hrps.aujsc.edu.ph · prototype</dd></div><div><dt>Authentication</dt><dd>Service account boundary</dd></div><div><dt>Last successful sync</dt><dd>Today at 10:38 AM</dd></div><div><dt>Sync duration</dt><dd>0.9 seconds</dd></div></dl></div></SectionCard>
        <SectionCard title="Latest sync" eyebrow="Employee master data"><div className="panel-body"><ProgressList items={[{ label: "Records received", value: "1,284", percent: 100, tone: "success" }, { label: "Records updated", value: "12", percent: 82, tone: "success" }, { label: "Records requiring review", value: "4", percent: 18, tone: "warning" }]} /></div></SectionCard>
      </div>

      <SectionCard title="HRPS data flow" eyebrow="Authoritative source">
        <FlowDiagram nodes={[{ label: "HRPS", detail: "Employee master data", icon: "hrps", status: "Source of truth", tone: "info" }, { label: "Integration layer", detail: "Map + validate", icon: "shield", status: "Validated", tone: "success" }, { label: "Employee directory", detail: "Internal reference", icon: "users", status: "Updated", tone: "success" }]} />
      </SectionCard>

      <SectionCard title="Field mapping" eyebrow="Prototype contract"><div className="panel-body mapping-grid">{[["HRPS employee number", "employeeId"], ["Full name", "employeeName"], ["Department", "department"], ["Position title", "position"], ["Employment status", "employmentStatus"], ["Updated timestamp", "updatedAt"]].map(([source, target]) => <div className="mapping-row" key={source}><span>{source}</span><strong><Icon name="arrow" /></strong><span>{target}</span></div>)}</div></SectionCard>

      <SectionCard title="Synchronized employees" eyebrow="Latest sample records">
        <FilterableTable rows={hrpsEmployees} columns={[{ key: "id", label: "Employee ID" }, { key: "employee", label: "Employee" }, { key: "department", label: "Department" }, { key: "position", label: "Position" }, { key: "employment", label: "Employment" }, { key: "result", label: "Result" }, { key: "time", label: "Sync time" }]} filters={[{ key: "employment", label: "Employment", options: ["All", "Active", "Inactive"] }, { key: "result", label: "Result", options: ["All", "Updated", "No Change", "Needs Review"] }]} searchPlaceholder="Search employee records" caption="Synchronized HRPS employee records" emptyMessage="No employee records match the selected filters." note="Sample HRPS records · prototype only" />
      </SectionCard>

      <div className="two-column">
        <SectionCard title="Records requiring review" eyebrow="Data quality"><div className="panel-body issue-list"><article className="issue-card warning"><div><h3>Missing position value</h3><p>AU-EMP-2026-233 has an incomplete position field in the latest sample.</p></div><ActionButton variant="link" action="Review queue opened.">Review</ActionButton></article><article className="issue-card warning"><div><h3>Inactive employee change</h3><p>One inactive employee record requires downstream review before attendance use.</p></div><ActionButton variant="link" action="Review queue opened.">Review</ActionButton></article></div></SectionCard>
        <SectionCard title="Connection and error handling" eyebrow="Operational notes"><div className="panel-body list-stack"><div className="list-row"><div><strong>Retry policy</strong><p>Manual retry is available after a failed mock sync.</p></div><StatusBadge tone="info">Manual</StatusBadge></div><div className="list-row"><div><strong>Failure boundary</strong><p>Connection errors remain in the integration queue.</p></div><StatusBadge tone="muted">Isolated</StatusBadge></div></div></SectionCard>
      </div>

      <SectionCard title="Synchronization history" eyebrow="Recent HRPS activity"><div className="panel-body timeline-list"><div className="timeline-item"><div><strong>Employee master data synchronization</strong><p>1,284 records checked · 12 updated · 4 review items</p></div><small>10:38 AM</small></div><div className="timeline-item"><div><strong>Connection test completed</strong><p>Endpoint responded within the expected mock threshold.</p></div><small>09:20 AM</small></div></div></SectionCard>
    </div>
  );
}
