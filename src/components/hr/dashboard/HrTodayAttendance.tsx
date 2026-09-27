import type { HrWorkflowAttendanceRecord } from "@/data/hr-workflow";

import { StatusBadge } from "@/components/ui/StatusBadge";

type HrTodayAttendanceProps = {
  records: readonly HrWorkflowAttendanceRecord[];
};

export function HrTodayAttendance({ records }: HrTodayAttendanceProps) {
  return (
    <section className="hr-dashboard-panel hr-attendance-panel" aria-labelledby="hr-today-attendance-heading">
      <div className="hr-panel-header">
        <div>
          <p className="hr-section-kicker">Operational records</p>
          <h2 id="hr-today-attendance-heading">Today&apos;s Attendance</h2>
          <p className="hr-panel-description">Latest attendance records from the Bundy and QR source views.</p>
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
                  <td><StatusBadge tone={record.hrVerificationStatus === "Verified" ? "success" : record.hrVerificationStatus === "Needs Correction" ? "warning" : "info"}>{record.hrVerificationStatus}</StatusBadge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="hr-empty-state">No attendance records available for today.</p>
      )}
    </section>
  );
}
