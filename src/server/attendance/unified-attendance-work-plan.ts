export type UnifiedAttendanceWorkPlanEmployee = {
  internalId: string;
  employeeId: string;
  displayName: string;
  schedules: UnifiedAttendanceWorkPlanSchedule[];
};

export type UnifiedAttendanceWorkPlanSchedule = {
  internalId: string;
  scheduleId: string;
  workDays: string[];
  effectiveFrom: string | null;
  effectiveTo: string | null;
};

export type UnifiedAttendanceWorkPlanItem = {
  employeeRecordId: string;
  employeeId: string;
  employeeName: string;
  attendanceDate: string;
  scheduleId: string;
};

type Weekday = "Sunday" | "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";

const weekdayAliases: Record<string, Weekday> = {
  sun: "Sunday",
  sunday: "Sunday",
  mon: "Monday",
  monday: "Monday",
  tue: "Tuesday",
  tues: "Tuesday",
  tuesday: "Tuesday",
  wed: "Wednesday",
  weds: "Wednesday",
  wednesday: "Wednesday",
  thu: "Thursday",
  thur: "Thursday",
  thurs: "Thursday",
  thursday: "Thursday",
  fri: "Friday",
  friday: "Friday",
  sat: "Saturday",
  saturday: "Saturday",
};

export function dateKeyIsValid(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function listDateKeys(dateFrom: string, dateTo: string) {
  const result: string[] = [];
  const current = new Date(`${dateFrom}T00:00:00.000Z`);
  const end = new Date(`${dateTo}T00:00:00.000Z`);
  while (current <= end) {
    result.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return result;
}

function weekdayForCampusDate(dateKey: string) {
  // Date keys are campus-local dates. Noon in the campus timezone avoids a
  // UTC-midnight boundary changing the weekday in the formatter.
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: "Asia/Manila",
  }).format(new Date(`${dateKey}T12:00:00+08:00`));
}

function canonicalWeekday(value: string) {
  return weekdayAliases[value.trim().toLowerCase()] ?? null;
}

function scheduleIsEffective(schedule: UnifiedAttendanceWorkPlanSchedule, dateKey: string) {
  return (!schedule.effectiveFrom || schedule.effectiveFrom <= dateKey)
    && (!schedule.effectiveTo || schedule.effectiveTo >= dateKey);
}

function scheduleWorksOnDate(schedule: UnifiedAttendanceWorkPlanSchedule, dateKey: string) {
  const weekday = weekdayForCampusDate(dateKey);
  return schedule.workDays.some((value) => canonicalWeekday(value) === weekday)
    && scheduleIsEffective(schedule, dateKey);
}

export function buildUnifiedAttendanceWorkPlan(input: {
  dateFrom: string;
  dateTo: string;
  employees: readonly UnifiedAttendanceWorkPlanEmployee[];
}): UnifiedAttendanceWorkPlanItem[] {
  const dateKeys = listDateKeys(input.dateFrom, input.dateTo);
  const items: UnifiedAttendanceWorkPlanItem[] = [];

  for (const employee of input.employees) {
    for (const attendanceDate of dateKeys) {
      const schedule = employee.schedules.find((candidate) => scheduleWorksOnDate(candidate, attendanceDate));
      if (!schedule) continue;
      items.push({
        employeeRecordId: employee.internalId,
        employeeId: employee.employeeId,
        employeeName: employee.displayName,
        attendanceDate,
        scheduleId: schedule.scheduleId,
      });
    }
  }

  return items;
}
