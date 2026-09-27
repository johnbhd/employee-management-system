import { Icon } from "@/components/ui/Icon";

type AttendanceReportToolbarProps = {
  reportLabel: string;
  periodLabel: string;
  departmentLabel: string;
  employeeLabel?: string;
  exportHref?: string;
  exportFileName: string;
  hasRows: boolean;
  onPrint: () => void;
};

export function AttendanceReportToolbar({
  reportLabel,
  periodLabel,
  departmentLabel,
  employeeLabel,
  exportHref,
  exportFileName,
  hasRows,
  onPrint,
}: AttendanceReportToolbarProps) {
  return (
    <div className="hr-reports-result-toolbar">
      <div>
        <p className="hr-section-kicker">Selected report</p>
        <h2>{reportLabel}</h2>
        <p className="hr-reports-result-meta">
          Period: {periodLabel} · Department: {departmentLabel}{employeeLabel ? ` · Employee: ${employeeLabel}` : ""}
        </p>
      </div>
      <div className="hr-reports-actions">
        {hasRows && exportHref ? (
          <a className="button-secondary" href={exportHref} download={exportFileName}>
            <Icon name="download" />
            Export CSV
          </a>
        ) : null}
        <button type="button" className="button-secondary" onClick={onPrint}>
          <Icon name="file" />
          Print report
        </button>
      </div>
    </div>
  );
}
