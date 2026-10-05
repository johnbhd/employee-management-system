import { StatusBadge } from "@/components/ui/StatusBadge";
import type { HrDashboardAttendanceItem } from "@/types/hr-dashboard";

type HrTodayAttendanceProps = {
  records: readonly HrDashboardAttendanceItem[];
  dataLoadError?: boolean;
};

export function HrTodayAttendance({
  dataLoadError = false,
  records,
}: HrTodayAttendanceProps) {
  return (
    <section className="hr-dashboard-panel hr-attendance-panel" aria-labelledby="hr-today-attendance-heading">
      <div className="hr-panel-header">
        <div>
          <p className="hr-section-kicker">Operational records</p>
          <h2 id="hr-today-attendance-heading">Today&apos;s Attendance</h2>
          <p className="hr-panel-description">Latest attendance records for today&apos;s Asia/Manila business date.</p>
        </div>
      </div>

      {records.length > 0 ? (
        <div className="hr-dashboard-table-scroll">
          <table className="hr-dashboard-table">
            <caption className="sr-only">Today&apos;s employee attendance records</caption>
            <thead>
              <tr>
                <th scope="col">Employee</th>
                <th scope="col">Schedule</th>
                <th scope="col">Time In</th>
                <th scope="col">Time Out</th>
                <th scope="col">Source</th>
                <th scope="col">Status</th>
                <th scope="col">Validation</th>
                <th scope="col">HR Verification</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td>
                    <strong className="hr-employee-name">{record.employeeName}</strong>
                    <span className="hr-employee-id">{record.employeeId}</span>
                  </td>
                  <td>{record.schedule}</td>
                  <td>{record.timeIn}</td>
                  <td>{record.timeOut}</td>
                  <td>{record.source ?? "—"}</td>
                  <td><StatusBadge tone={record.statusTone}>{record.status}</StatusBadge></td>
                  <td><StatusBadge tone={record.validationTone}>{record.validationStatus}</StatusBadge></td>
                  <td><StatusBadge tone="muted">{record.hrVerificationStatus}</StatusBadge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className={`hr-empty-state${dataLoadError ? " is-error" : ""}`} role={dataLoadError ? "alert" : undefined}>
          {dataLoadError
            ? "Unable to load current attendance records. Please try again."
            : "No attendance records available for today."}
        </p>
      )}
    </section>
  );
}
