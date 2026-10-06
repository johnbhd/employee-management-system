import { Icon } from "@/components/ui/Icon";

import type { EmployeeScheduleItem } from "@/types/hr-employee-schedule";

import { formatList, formatSchedule } from "./schedule-display";

type EmployeeSchedulesTableProps = {
  records: readonly EmployeeScheduleItem[];
  onSelectSchedule: (record: EmployeeScheduleItem) => void;
};

export function EmployeeSchedulesTable({
  records,
  onSelectSchedule,
}: EmployeeSchedulesTableProps) {
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
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.employee.employeeId}>
              <td>
                <strong className="hr-schedules-employee-name">
                  {record.employee.displayName}
                </strong>
                <span className="hr-schedules-employee-meta">
                  {record.employee.employeeId} · {record.employee.position ?? "—"}
                </span>
              </td>
              <td>{record.employee.department}</td>
              <td>
                <strong className="hr-schedules-value">
                  {formatSchedule(record.schedule)}
                </strong>
                {record.schedule ? (
                  <span className="hr-schedules-cell-meta">
                    {record.schedule.shiftLabel ?? "Schedule reference"}
                  </span>
                ) : null}
              </td>
              <td>{record.schedule?.workLocation ?? "—"}</td>
              <td>{formatList(record.schedule?.restDays ?? [])}</td>
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
              <td colSpan={6} className="hr-schedules-empty-row">
                No employee schedules match the selected filters.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
