import { hrAttendanceMonitoringRecords } from "./hr";
import { hrCorrectionRequests } from "./hr-correction-requests";
import {
  hrEmployeeSchedules,
  type HrEmployeeScheduleRecord,
  type HrpsReferenceStatus,
} from "./hr-employee-schedules";

export type EmployeeIdMatchStatus = "Matched" | "Needs Review" | "Unavailable";

export type HrEmployeeReference = {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  employmentStatus: HrEmployeeScheduleRecord["employmentStatus"];
  schedule?: string;
  startTime?: string;
  endTime?: string;
  workDays: string[];
  restDays: string[];
  restDayLabel: string;
  workLocation?: string;
  hrpsStatus: HrpsReferenceStatus;
  hrpsStatusTone: HrEmployeeScheduleRecord["hrpsStatusTone"];
  employeeIdMatch: EmployeeIdMatchStatus;
  attendanceRecordCount: number;
  openCorrectionRequestCount: number;
};

const closedCorrectionStatuses = new Set(["Approved", "Rejected"]);

function employeeIdMatchStatus(status: HrpsReferenceStatus): EmployeeIdMatchStatus {
  if (status === "Synchronized") return "Matched";
  if (status === "Needs Review") return "Needs Review";
  return "Unavailable";
}

export const hrEmployeeDirectory: HrEmployeeReference[] = hrEmployeeSchedules.map((schedule) => {
  const openCorrectionRequestCount = hrCorrectionRequests.filter((request) => (
    request.employeeId === schedule.employeeId && !closedCorrectionStatuses.has(request.status)
  )).length;
  const attendanceRecordCount = hrAttendanceMonitoringRecords.filter((record) => (
    record.employeeId === schedule.employeeId
  )).length;

  return {
    id: schedule.id,
    employeeId: schedule.employeeId,
    employeeName: schedule.employeeName,
    department: schedule.department,
    position: schedule.position,
    employmentStatus: schedule.employmentStatus,
    schedule: schedule.schedule,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    workDays: schedule.workDays,
    restDays: schedule.restDays,
    restDayLabel: schedule.restDayLabel,
    workLocation: schedule.workLocation,
    hrpsStatus: schedule.hrpsStatus,
    hrpsStatusTone: schedule.hrpsStatusTone,
    employeeIdMatch: employeeIdMatchStatus(schedule.hrpsStatus),
    attendanceRecordCount,
    openCorrectionRequestCount,
  };
});
