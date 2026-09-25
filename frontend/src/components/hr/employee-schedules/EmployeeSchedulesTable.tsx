import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";

import type { HrEmployeeScheduleRecord, ScheduleDayStatus, HrpsReferenceStatus } from "@/data/hr-employee-schedules";

type EmployeeSchedulesTableProps = {
  records: readonly HrEmployeeScheduleRecord[];
  onSelectSchedule: (record: HrEmployeeScheduleRecord) => void;
};

function dayStatusTone(status: ScheduleDayStatus) {
  if (status === "Working Day") return "success" as const;
  if (status === "Leave" || status === "Holiday") return "info" as const;
  if (status === "Schedule Unavailable") return "danger" as const;
  return "muted" as const;
}

function referenceStatusTone(status: HrpsReferenceStatus) {
  if (status === "Synchronized") return "success" as const;
  if (status === "Needs Review") return "warning" as const;
  return "danger" as const;
}

export function EmployeeSchedulesTable({ records, onSelectSchedule }: EmployeeSchedulesTableProps) {
  return (
    <div className="hr-schedules-table-scroll">
      <table className="hr-schedules-table">
        <caption className="sr-only">Employee work schedule references</caption>
        <thead>
          <tr>
            <th scope="col">Employee</th>
            <th scope="col">Department</th>
            <th scope="col">Work schedule</th>
            <th scope="col">Work location</th>
            <th scope="col">Rest day</th>
            <th scope="col">Today&apos;s schedule status</th>
            <th scope="col">HRPS status</th>
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id}>
              <td>
                <strong className="hr-schedules-employee-name">{record.employeeName}</strong>
                <span className="hr-schedules-employee-meta">{record.employeeId} · {record.position}</span>
              </td>
              <td>{record.department}</td>
              <td>
                <strong className="hr-schedules-value">{record.schedule}</strong>
                <span className="hr-schedules-cell-meta">Monday – Friday</span>
              </td>
              <td>{record.workLocation}</td>
              <td>{record.restDayLabel}</td>
              <td><StatusBadge tone={dayStatusTone(record.todayStatus)}>{record.todayStatus}</StatusBadge></td>
              <td><StatusBadge tone={referenceStatusTone(record.hrpsStatus)}>{record.hrpsStatus}</StatusBadge></td>
              <td>
                <button
                  type="button"
                  className="button-secondary hr-schedules-view-button"
                  onClick={() => onSelectSchedule(record)}
                >
                  <Icon name="calendar" />
                  View schedule
                </button>
              </td>
            </tr>
          ))}
          {records.length === 0 ? (
            <tr>
              <td colSpan={8} className="hr-schedules-empty-row">
                No employee schedules match the selected filters.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
