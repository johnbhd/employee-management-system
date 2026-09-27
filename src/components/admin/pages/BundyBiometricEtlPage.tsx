import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { FlowDiagram } from "@/components/admin/shared/FlowDiagram";
import { ProgressList } from "@/components/admin/shared/ProgressList";
import { ActionButton } from "@/components/ui/ActionButton";
import { FilterableTable } from "@/components/ui/FilterableTable";
import { Icon } from "@/components/ui/Icon";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SummaryCard } from "@/components/ui/SummaryCard";
import { bundyLogs } from "@/data/admin";

const bundyMetrics = [
  { label: "Records in latest batch", value: "326", note: "Sep 15, 2026", icon: "file" as const, tone: "info" as const },
  { label: "Matched to HRPS", value: "319", note: "97.9% match rate", icon: "check" as const, tone: "success" as const },
  { label: "Unmatched records", value: "3", note: "Needs review", icon: "warning" as const, tone: "warning" as const },
  { label: "Duplicate records", value: "4", note: "Held from output", icon: "layers" as const, tone: "danger" as const },
];

export function BundyBiometricEtlPage() {
  return (
    <div className="admin-page bundy-page">
      <AdminPageHeader eyebrow="Attendance source ingestion" title="Bundy / Biometric ETL" description="Inspect the imported biometric logs, employee ID matching, and standardized attendance output." actions={<><ActionButton icon="refresh" action="Bundy ETL batch processing queued.">Run ETL</ActionButton><ActionButton variant="secondary" action="Latest Bundy file preview opened.">View source file</ActionButton></>} />
      <div className="metric-grid bundy-metrics">{bundyMetrics.map((metric) => <SummaryCard key={metric.label} {...metric} />)}</div>

      <div className="two-column">
        <SectionCard title="Source and latest batch" eyebrow="Existing source"><div className="panel-body source-summary"><div className="source-summary-heading"><div className="source-icon"><Icon name="bundy" /></div><div><strong>Main Office Biometric Export</strong><p>bundy_attendance_2026-09-15.csv</p></div><StatusBadge tone="success">Imported</StatusBadge></div><dl className="detail-list"><div><dt>Source system</dt><dd>Existing Bundy / biometric device</dd></div><div><dt>Batch received</dt><dd>September 15, 2026 · 8:10 AM</dd></div><div><dt>Last processed</dt><dd>September 15, 2026 · 8:14 AM</dd></div><div><dt>Output</dt><dd>Standardized attendance queue</dd></div></dl></div></SectionCard>
        <SectionCard title="ETL progress" eyebrow="Latest batch"><div className="panel-body"><ProgressList items={[{ label: "Imported", value: "326 / 326", percent: 100, tone: "success" }, { label: "Matched", value: "319 / 326", percent: 98, tone: "success" }, { label: "Ready for unified layer", value: "315 / 326", percent: 97, tone: "success" }]} /></div></SectionCard>
      </div>

      <SectionCard title="ETL pipeline" eyebrow="Import to standard output"><FlowDiagram nodes={[{ label: "Bundy export", detail: "Raw biometric logs", icon: "bundy", status: "Received", tone: "info" }, { label: "Parse + normalize", detail: "Date and event format", icon: "file", status: "Complete", tone: "success" }, { label: "Match HRPS IDs", detail: "Employee reference", icon: "users", status: "97.9%", tone: "success" }, { label: "Review queue", detail: "Exceptions held", icon: "warning", status: "7 records", tone: "warning" }, { label: "Unified Attendance", detail: "Standard records", icon: "unified", status: "315 ready", tone: "success" }]} /></SectionCard>

      <SectionCard title="Imported attendance logs" eyebrow="Latest batch">
        <FilterableTable rows={bundyLogs} columns={[{ key: "timestamp", label: "Timestamp" }, { key: "deviceId", label: "Device ID" }, { key: "employeeId", label: "Employee ID" }, { key: "device", label: "Device" }, { key: "event", label: "Event" }, { key: "match", label: "ID match" }, { key: "processing", label: "Processing" }]} filters={[{ key: "match", label: "ID match", options: ["All", "Matched", "Unmatched", "Duplicate"] }, { key: "processing", label: "Processing", options: ["All", "Processed", "Needs Review", "Failed"] }]} searchPlaceholder="Search imported logs" caption="Bundy imported attendance logs" emptyMessage="No imported logs match the selected filters." note="Sample source rows · no file is imported at runtime" />
      </SectionCard>

      <div className="two-column">
        <SectionCard title="ID matching" eyebrow="HRPS reference check"><div className="panel-body"><ProgressList items={[{ label: "Matched", value: "319 records", percent: 98, tone: "success" }, { label: "Unmatched", value: "3 records", percent: 12, tone: "warning" }, { label: "Duplicate", value: "4 records", percent: 14, tone: "warning" }]} /></div></SectionCard>
        <SectionCard title="ETL issues" eyebrow="Exceptions"><div className="panel-body issue-list"><article className="issue-card warning"><div><h3>3 unmatched records</h3><p>Temporary or incomplete device IDs cannot be mapped to HRPS employee IDs.</p></div><ActionButton variant="link" action="Unmatched record queue opened.">Review</ActionButton></article><article className="issue-card danger"><div><h3>4 duplicate events</h3><p>Duplicate timestamps are held from standardized attendance output.</p></div><ActionButton variant="link" action="Duplicate record queue opened.">Review</ActionButton></article></div></SectionCard>
      </div>

      <SectionCard title="Standardized output" eyebrow="Downstream contract"><div className="panel-body standard-output-grid"><div><strong>employeeId</strong><span>AU-EMP-2026-0418</span></div><div><strong>attendanceDate</strong><span>2026-09-15</span></div><div><strong>timeIn / timeOut</strong><span>07:24 / 17:03</span></div><div><strong>source</strong><span>Bundy</span></div><div><strong>validationStatus</strong><span>Valid</span></div></div></SectionCard>
      <SectionCard title="Processing guide" eyebrow="Source boundaries"><div className="panel-body guide-grid"><div><strong>1. Import</strong><p>Receive the existing source export without changing the source system.</p></div><div><strong>2. Normalize</strong><p>Convert timestamps and event labels into the shared attendance format.</p></div><div><strong>3. Match</strong><p>Use HRPS employee identifiers and hold exceptions for review.</p></div><div><strong>4. Publish</strong><p>Send only validated records to the Unified Attendance layer.</p></div></div></SectionCard>
    </div>
  );
}
