import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { HrWorkflowAttendanceRecord } from "@/data/hr-workflow";

type AttendanceMonitoringTableProps = {
  records: readonly HrWorkflowAttendanceRecord[];
  onSelectRecord: (record: HrWorkflowAttendanceRecord) => void;
};

function formatDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function sourceTone(source: HrWorkflowAttendanceRecord["source"]) {
  if (source === "QR") return "info" as const;
  if (source === "Bundy") return "muted" as const;
  return "danger" as const;
}

export function AttendanceMonitoringTable({ records, onSelectRecord }: AttendanceMonitoringTableProps) {
  return (
    <div className="hr-monitoring-table-scroll">
      <table className="hr-monitoring-table">
        <caption className="sr-only">Employee attendance monitoring records</caption>
        <thead>
          <tr>
            <th scope="col">Employee</th>
            <th scope="col">Date</th>
            <th scope="col">Schedule</th>
            <th scope="col">Time In</th>
            <th scope="col">Time Out</th>
            <th scope="col">Source</th>
            <th scope="col">Status</th>
            <th scope="col">Validation</th>
            <th scope="col">HR Verification</th>
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id}>
              <td>
                <strong className="hr-monitoring-employee-name">{record.employeeName}</strong>
                <span className="hr-monitoring-employee-meta">{record.employeeId} · {record.department}</span>
              </td>
              <td>{formatDate(record.date)}</td>
              <td>{record.schedule}</td>
              <td className={record.timeIn === "—" ? "hr-monitoring-missing-value" : undefined}>
                {record.timeIn}
              </td>
              <td className={record.timeOut === "—" ? "hr-monitoring-missing-value" : undefined}>
                {record.timeOut}
              </td>
              <td>
                {record.source ? (
                  <StatusBadge tone={sourceTone(record.source)}>{record.source}</StatusBadge>
                ) : (
                  <span className="hr-monitoring-missing-value">—</span>
                )}
              </td>
              <td>
                <StatusBadge tone={record.statusTone}>{record.status}</StatusBadge>
              </td>
              <td>
                <StatusBadge tone={record.validationTone}>{record.validationStatus}</StatusBadge>
              </td>
              <td>
                <StatusBadge tone={record.hrVerificationStatus === "Verified" ? "success" : record.hrVerificationStatus === "Needs Correction" ? "warning" : "info"}>
                  {record.hrVerificationStatus}
                </StatusBadge>
              </td>
              <td>
                <button
                  type="button"
                  className="button-secondary hr-monitoring-view-button"
                  onClick={() => onSelectRecord(record)}
                >
                  <Icon name="file" />
                  View details
                </button>
              </td>
            </tr>
          ))}
          {records.length === 0 ? (
            <tr>
              <td colSpan={10} className="hr-monitoring-empty-row">
                No attendance records match the selected filters.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
