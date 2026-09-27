import { Icon } from "@/components/ui/Icon";
import type { IconName } from "@/types/ui";

import type { AttendanceReportType } from "@/data/hr-attendance-reports";

type ReportTypeOption = {
  id: AttendanceReportType;
  label: string;
  shortLabel: string;
};

type AttendanceReportSelectorProps = {
  reportTypes: readonly ReportTypeOption[];
  selectedReport: AttendanceReportType;
  onSelectReport: (report: AttendanceReportType) => void;
};

const reportIcons: Record<AttendanceReportType, IconName> = {
  daily: "calendar",
  monthly: "calendar",
  late: "clock",
  undertime: "clock",
  "missing-time-out": "warning",
  "source-usage": "unified",
  "correction-summary": "comment",
};

export function AttendanceReportSelector({ reportTypes, selectedReport, onSelectReport }: AttendanceReportSelectorProps) {
  return (
    <section className="hr-reports-selector-panel" aria-labelledby="hr-reports-selector-heading">
      <div className="hr-reports-selector-heading">
        <div>
          <p className="hr-section-kicker">Report workspace</p>
          <h2 id="hr-reports-selector-heading">Choose a report</h2>
        </div>
        <label className="hr-reports-mobile-selector">
          <span>Report type</span>
          <select value={selectedReport} onChange={(event) => onSelectReport(event.target.value as AttendanceReportType)}>
            {reportTypes.map((report) => <option value={report.id} key={report.id}>{report.label}</option>)}
          </select>
        </label>
      </div>

      <div className="hr-reports-desktop-selector" role="tablist" aria-label="Attendance report types">
        {reportTypes.map((report) => {
          const active = selectedReport === report.id;

          return (
            <button
              type="button"
              role="tab"
              aria-selected={active}
              className={`hr-reports-report-tab ${active ? "is-active" : ""}`}
              key={report.id}
              onClick={() => onSelectReport(report.id)}
            >
              <Icon name={reportIcons[report.id]} />
              {report.shortLabel}
            </button>
          );
        })}
      </div>
    </section>
  );
}
