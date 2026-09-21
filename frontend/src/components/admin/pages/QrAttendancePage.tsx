import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { FlowDiagram } from "@/components/admin/shared/FlowDiagram";
import { ProgressList } from "@/components/admin/shared/ProgressList";
import { ActionButton } from "@/components/ui/ActionButton";
import { FilterableTable } from "@/components/ui/FilterableTable";
import { Icon } from "@/components/ui/Icon";
import type { IconName } from "@/types/ui";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SummaryCard } from "@/components/ui/SummaryCard";
import { qrEvents } from "@/data/admin";

const qrMetrics = [
  { label: "Scans today", value: "486", note: "Across 3 stations", icon: "qr" as const, tone: "info" as const },
  { label: "Valid scans", value: "472", note: "97.1% accepted", icon: "check" as const, tone: "success" as const },
  { label: "Rejected scans", value: "8", note: "Validation failed", icon: "warning" as const, tone: "danger" as const },
  { label: "Needs review", value: "6", note: "Duplicate or incomplete", icon: "activity" as const, tone: "warning" as const },
];

export function QrAttendancePage() {
  return (
    <div className="admin-page qr-page">
      <AdminPageHeader eyebrow="Additional attendance source" title="QR Attendance" description="Monitor QR attendance stations, employee validation, and accepted records entering the integration layer." actions={<><ActionButton icon="refresh" action="QR source data refreshed.">Refresh source</ActionButton><ActionButton variant="secondary" action="Station health check completed.">Check stations</ActionButton></>} />
      <section className="notice"><Icon name="info" /><p><strong>QR Attendance is an additional source.</strong> Validated scans are standardized alongside Bundy records; invalid or duplicate scans stay out of the unified output.</p></section>
      <div className="metric-grid qr-metrics">{qrMetrics.map((metric) => <SummaryCard key={metric.label} {...metric} />)}</div>

      <div className="two-column">
        <SectionCard title="QR service health" eyebrow="Station status"><div className="panel-body station-grid">{[["QR-STATION-01", "Main lobby", "Online", "10:42 AM"], ["QR-STATION-02", "Admin building", "Online", "10:41 AM"], ["QR-STATION-03", "Library entrance", "Warning", "10:36 AM"]].map(([station, location, status, sync]) => <article className="station-card" key={station}><div><strong>{station}</strong><p>{location}</p></div><StatusBadge tone={status === "Online" ? "success" : "warning"}>{status}</StatusBadge><small>Last event {sync}</small></article>)}</div></SectionCard>
        <SectionCard title="Validation summary" eyebrow="Today"><div className="panel-body"><ProgressList items={[{ label: "Valid employee QR", value: "472 scans", percent: 97, tone: "success" }, { label: "Invalid QR / inactive", value: "8 scans", percent: 10, tone: "warning" }, { label: "Duplicate attempts", value: "6 scans", percent: 8, tone: "warning" }]} /></div></SectionCard>
      </div>

      <SectionCard title="QR processing flow" eyebrow="Scan to standardized attendance"><FlowDiagram nodes={[{ label: "QR station", detail: "Scan event", icon: "qr", status: "Live", tone: "success" }, { label: "Validate QR", detail: "Signature + expiry", icon: "shield", status: "Checked", tone: "success" }, { label: "Validate employee", detail: "HRPS reference", icon: "users", status: "Matched", tone: "info" }, { label: "Deduplicate", detail: "Existing events", icon: "layers", status: "Review", tone: "warning" }, { label: "Unified Attendance", detail: "Standard output", icon: "unified", status: "Ready", tone: "success" }]} /></SectionCard>

      <SectionCard title="QR attendance activity" eyebrow="Filterable event log">
        <FilterableTable rows={qrEvents} columns={[{ key: "time", label: "Time" }, { key: "employeeId", label: "Employee ID" }, { key: "employee", label: "Employee" }, { key: "station", label: "Station" }, { key: "event", label: "Event" }, { key: "validation", label: "Validation" }, { key: "processing", label: "Processing" }]} filters={[{ key: "station", label: "Station", options: ["All", "QR-STATION-01", "QR-STATION-02", "QR-STATION-03"] }, { key: "validation", label: "Validation", options: ["All", "Valid", "Duplicate", "Invalid QR", "Inactive Employee"] }]} searchPlaceholder="Search QR events" caption="QR attendance activity" emptyMessage="No QR events match the selected filters." note="Sample QR events · prototype only" />
      </SectionCard>

      <div className="two-column">
        <SectionCard title="Employee validation and security" eyebrow="Acceptance rules"><div className="panel-body rule-list"><div><IconMark icon="check" title="Valid employee" text="QR token maps to an active HRPS employee." tone="success" /></div><div><IconMark icon="warning" title="Expired or invalid QR" text="The scan is rejected and never enters attendance output." tone="danger" /></div><div><IconMark icon="shield" title="Duplicate protection" text="Repeated events are held for review." tone="warning" /></div></div></SectionCard>
        <SectionCard title="Rejected attempts" eyebrow="Review queue"><div className="panel-body issue-list"><article className="issue-card danger"><div><h3>Invalid QR token</h3><p>One scan could not be verified against the station signing rule.</p></div><ActionButton variant="link" action="Rejected scan details opened.">Inspect</ActionButton></article><article className="issue-card warning"><div><h3>Inactive employee</h3><p>One scan matched an employee marked inactive in HRPS.</p></div><ActionButton variant="link" action="Validation details opened.">Inspect</ActionButton></article></div></SectionCard>
      </div>

      <SectionCard title="Standardized output" eyebrow="Accepted QR records"><div className="panel-body standard-output-grid"><div><strong>employeeId</strong><span>AU-EMP-2026-0418</span></div><div><strong>attendanceDate</strong><span>2026-09-16</span></div><div><strong>eventType</strong><span>TIME_IN</span></div><div><strong>source</strong><span>QR Attendance</span></div><div><strong>validationStatus</strong><span>Valid</span></div></div></SectionCard>
    </div>
  );
}

function IconMark({ icon, title, text, tone }: { icon: IconName; title: string; text: string; tone: "success" | "warning" | "danger" }) {
  return <div className={`rule-item ${tone}`}><span className="rule-symbol"><Icon name={icon} /></span><span><strong>{title}</strong><small>{text}</small></span></div>;
}
