import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { FlowDiagram } from "@/components/admin/shared/FlowDiagram";
import { ProgressList } from "@/components/admin/shared/ProgressList";
import { ActionButton } from "@/components/ui/ActionButton";
import { FilterableTable } from "@/components/ui/FilterableTable";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SummaryCard } from "@/components/ui/SummaryCard";
import { unifiedRecords } from "@/data/admin";

const unifiedMetrics = [
  { label: "Records today", value: "1,102", note: "Bundy + QR", icon: "unified" as const, tone: "info" as const },
  { label: "Ready for downstream", value: "1,084", note: "98.4% validated", icon: "check" as const, tone: "success" as const },
  { label: "Needs review", value: "14", note: "Incomplete or conflict", icon: "warning" as const, tone: "warning" as const },
  { label: "Not ready", value: "4", note: "Held from transfer", icon: "errors" as const, tone: "danger" as const },
];

export function UnifiedAttendancePage() {
  return (
    <div className="admin-page unified-page">
      <AdminPageHeader eyebrow="Standardized attendance layer" title="Unified Attendance" description="Review normalized attendance records from Bundy and QR sources before verified downstream transfer." actions={<><ActionButton icon="refresh" action="Unified attendance processing queued.">Process records</ActionButton><ActionButton variant="secondary" action="Transfer preview opened.">Preview transfer</ActionButton></>} />
      <div className="metric-grid unified-metrics">{unifiedMetrics.map((metric) => <SummaryCard key={metric.label} {...metric} />)}</div>

      <SectionCard title="Unified data flow" eyebrow="Source normalization"><FlowDiagram nodes={[{ label: "HRPS", detail: "Employee reference", icon: "hrps", status: "Reference", tone: "info" }, { label: "Bundy", detail: "Biometric source", icon: "bundy", status: "Ingested", tone: "success" }, { label: "QR Attendance", detail: "Additional source", icon: "qr", status: "Ingested", tone: "success" }, { label: "Validate + unify", detail: "Deduplicate + review", icon: "shield", status: "Processing", tone: "warning" }, { label: "Downstream systems", detail: "Existing payroll / accounting", icon: "building", status: "Verified only", tone: "muted" }]} /></SectionCard>

      <div className="two-column">
        <SectionCard title="Source distribution" eyebrow="Today"><div className="panel-body"><ProgressList items={[{ label: "Bundy records", value: "714 · 64.8%", percent: 65, tone: "success" }, { label: "QR records", value: "388 · 35.2%", percent: 35, tone: "default" }]} /></div></SectionCard>
        <SectionCard title="Validation readiness" eyebrow="Transfer gate"><div className="panel-body"><ProgressList items={[{ label: "Valid and complete", value: "1,084", percent: 98, tone: "success" }, { label: "Review queue", value: "14", percent: 22, tone: "warning" }, { label: "Not ready", value: "4", percent: 8, tone: "warning" }]} /></div></SectionCard>
      </div>

      <SectionCard title="Unified attendance records" eyebrow="Filterable standardized view">
        <FilterableTable rows={unifiedRecords} columns={[{ key: "employeeId", label: "Employee ID" }, { key: "employee", label: "Employee" }, { key: "date", label: "Date" }, { key: "timeIn", label: "Time in" }, { key: "timeOut", label: "Time out" }, { key: "source", label: "Source" }, { key: "validation", label: "Validation" }, { key: "processing", label: "Processing" }]} filters={[{ key: "source", label: "Source", options: ["All", "Bundy", "QR"] }, { key: "processing", label: "Processing", options: ["All", "Processed", "Needs Review", "Not Ready"] }]} searchPlaceholder="Search unified records" caption="Unified attendance records" emptyMessage="No unified attendance records match the selected filters." note="Sample standardized records · no downstream transfer" />
      </SectionCard>

      <div className="two-column">
        <SectionCard title="Duplicates and conflicts" eyebrow="Data quality queue"><div className="panel-body issue-list"><article className="issue-card warning"><div><h3>Duplicate employee event</h3><p>Two QR records for AU-EMP-2026-0332 share the same attendance window.</p></div><ActionButton variant="link" action="Duplicate review opened.">Review</ActionButton></article><article className="issue-card warning"><div><h3>Incomplete attendance pair</h3><p>One Bundy record has a time out without a matching time in.</p></div><ActionButton variant="link" action="Incomplete record review opened.">Review</ActionButton></article></div></SectionCard>
        <SectionCard title="Processing status" eyebrow="Current run"><div className="panel-body timeline-list"><div className="timeline-item"><div><strong>Standardization run completed</strong><p>1,102 source records checked; 1,084 are ready for downstream review.</p></div><StatusBadge tone="success">Complete</StatusBadge></div><div className="timeline-item"><div><strong>Downstream transfer</strong><p>Awaiting administrator approval and existing system availability.</p></div><StatusBadge tone="warning">Pending</StatusBadge></div></div></SectionCard>
      </div>

      <SectionCard title="Processed preview" eyebrow="Ready records"><div className="panel-body preview-strip"><div><span>Ready records</span><strong>1,084</strong></div><div><span>Review records</span><strong>14</strong></div><div><span>Not ready</span><strong>4</strong></div><div><span>Last run</span><strong>10:42 AM</strong></div></div></SectionCard>

      <SectionCard title="Standard format" eyebrow="Internal attendance contract"><div className="panel-body standard-output-grid"><div><strong>employeeId</strong><span>AU-EMP-2026-0418</span></div><div><strong>attendanceDate</strong><span>2026-09-16</span></div><div><strong>timeIn / timeOut</strong><span>07:24 / 17:03</span></div><div><strong>source</strong><span>Bundy or QR</span></div><div><strong>validationStatus</strong><span>Valid / Review</span></div><div><strong>readyForTransfer</strong><span>Boolean gate</span></div></div></SectionCard>

      <div className="two-column">
        <SectionCard title="Validation rules and correction" eyebrow="Review guidance"><div className="panel-body guide-grid"><div><strong>Employee identity</strong><p>Record must match an active HRPS employee identifier.</p></div><div><strong>Event completeness</strong><p>Time in and time out are checked independently.</p></div><div><strong>Source traceability</strong><p>Every standardized record keeps its original source.</p></div><div><strong>Duplicate protection</strong><p>Conflicts are held for review before transfer.</p></div></div></SectionCard>
        <SectionCard title="Quality by source" eyebrow="Current batch"><div className="panel-body"><ProgressList items={[{ label: "Bundy quality", value: "98.1%", percent: 98, tone: "success" }, { label: "QR quality", value: "98.9%", percent: 99, tone: "success" }, { label: "Cross-source conflict rate", value: "1.2%", percent: 12, tone: "warning" }]} /></div></SectionCard>
      </div>

      <SectionCard title="Processing history and events" eyebrow="Traceability"><div className="panel-body timeline-list"><div className="timeline-item"><div><strong>Unified processing completed</strong><p>Bundy and QR records normalized into the shared attendance contract.</p></div><small>10:42 AM</small></div><div className="timeline-item"><div><strong>Review queue updated</strong><p>14 records held for incomplete attendance or source conflict.</p></div><small>10:40 AM</small></div></div></SectionCard>
    </div>
  );
}
