import { hrAttendanceMonitoringDate, hrAttendanceMonitoringRecords } from "./hr";

export type ScheduleDayStatus = "Working Day" | "Rest Day" | "Leave" | "Holiday" | "Schedule Unavailable";
export type HrpsReferenceStatus = "Synchronized" | "Needs Review" | "Unavailable";

export type WeeklyScheduleDay = {
  day: string;
  shortDay: string;
  isWorkDay: boolean;
  startTime?: string;
  endTime?: string;
};

export type ScheduleException = {
  date: string;
  type: "Leave" | "Holiday";
  label: string;
};

export type HrEmployeeScheduleRecord = {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  employmentStatus: "Active" | "Inactive";
  schedule: string;
  startTime?: string;
  endTime?: string;
  workDays: string[];
  restDays: string[];
  restDayLabel: string;
  workLocation: string;
  todayStatus: ScheduleDayStatus;
  todayStatusTone: "success" | "warning" | "danger" | "info" | "muted";
  hrpsStatus: HrpsReferenceStatus;
  hrpsStatusTone: "success" | "warning" | "danger" | "info" | "muted";
  scheduleReviewReason?: string;
  weeklySchedule: WeeklyScheduleDay[];
  exceptions: ScheduleException[];
};

const weekdays = [
  { day: "Monday", shortDay: "Mon" },
  { day: "Tuesday", shortDay: "Tue" },
  { day: "Wednesday", shortDay: "Wed" },
  { day: "Thursday", shortDay: "Thu" },
  { day: "Friday", shortDay: "Fri" },
  { day: "Saturday", shortDay: "Sat" },
  { day: "Sunday", shortDay: "Sun" },
];

const scheduleReferenceByEmployeeId: Record<string, {
  workLocation: string;
  hrpsStatus: HrpsReferenceStatus;
  scheduleReviewReason?: string;
  exceptions?: ScheduleException[];
}> = {
  "AU-EMP-2026-0087": {
    workLocation: "Main Campus · Administration Office",
    hrpsStatus: "Needs Review",
    scheduleReviewReason: "The employee record is inactive and needs HRPS reference review.",
  },
  "AU-EMP-2026-0208": {
    workLocation: "Main Campus · Human Resources Office",
    hrpsStatus: "Needs Review",
    scheduleReviewReason: "Attendance sources previously reported a schedule reference conflict.",
    exceptions: [
      { date: "2026-09-18", type: "Leave", label: "Approved personal leave" },
    ],
  },
  "AU-EMP-2026-0271": {
    workLocation: "Main Campus · Office Support Unit",
    hrpsStatus: "Synchronized",
    exceptions: [
      { date: "2026-09-21", type: "Holiday", label: "University holiday" },
    ],
  },
  "AU-EMP-2026-0360": {
    workLocation: "Main Campus · Information Technology Office",
    hrpsStatus: "Needs Review",
    scheduleReviewReason: "No attendance event was available for the current monitoring date.",
  },
};

function parseSchedule(schedule: string) {
  const [startTime, endTime] = schedule.split(" – ");

  return { startTime, endTime };
}

function createWeeklySchedule(schedule: string): WeeklyScheduleDay[] {
  const { startTime, endTime } = parseSchedule(schedule);

  return weekdays.map(({ day, shortDay }, index) => ({
    day,
    shortDay,
    isWorkDay: index < 5,
    startTime: index < 5 ? startTime : undefined,
    endTime: index < 5 ? endTime : undefined,
  }));
}

export const hrEmployeeSchedules: HrEmployeeScheduleRecord[] = hrAttendanceMonitoringRecords.map((record) => {
  const reference = scheduleReferenceByEmployeeId[record.employeeId];
  const { startTime, endTime } = parseSchedule(record.schedule);
  const workDays = weekdays.slice(0, 5).map(({ day }) => day);
  const restDays = weekdays.slice(5).map(({ day }) => day);

  return {
    id: record.id,
    employeeId: record.employeeId,
    employeeName: record.employeeName,
    department: record.department,
    position: record.position,
    employmentStatus: record.employmentStatus,
    schedule: record.schedule,
    startTime,
    endTime,
    workDays,
    restDays,
    restDayLabel: "Saturday – Sunday",
    workLocation: reference?.workLocation ?? `Main Campus · ${record.department} Office`,
    todayStatus: "Working Day",
    todayStatusTone: "success",
    hrpsStatus: reference?.hrpsStatus ?? "Synchronized",
    hrpsStatusTone: reference?.hrpsStatus === "Needs Review" ? "warning" : "success",
    scheduleReviewReason: reference?.scheduleReviewReason,
    weeklySchedule: createWeeklySchedule(record.schedule),
    exceptions: reference?.exceptions ?? [],
  };
});

export { hrAttendanceMonitoringDate };
