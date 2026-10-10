import type { EmployeeScheduleDetails } from "@/types/hr-employee-schedule";

export const scheduleWeekdays = [
  { day: "Monday", shortDay: "Mon" },
  { day: "Tuesday", shortDay: "Tue" },
  { day: "Wednesday", shortDay: "Wed" },
  { day: "Thursday", shortDay: "Thu" },
  { day: "Friday", shortDay: "Fri" },
  { day: "Saturday", shortDay: "Sat" },
  { day: "Sunday", shortDay: "Sun" },
] as const;

export function formatScheduleTime(value: string | null): string {
  if (!value) return "—";

  const [hourValue, minute] = value.split(":");
  const hour = Number(hourValue);

  if (!Number.isInteger(hour) || !minute || hour < 0 || hour > 23) {
    return value;
  }

  const meridiem = hour >= 12 ? "PM" : "AM";
  const twelveHour = hour % 12 || 12;

  return `${twelveHour}:${minute} ${meridiem}`;
}

export function formatTimeRange(
  start: string | null,
  end: string | null,
): string {
  if (!start && !end) return "—";
  if (!start || !end) return "Unavailable";

  return `${formatScheduleTime(start)} – ${formatScheduleTime(end)}`;
}

export function formatSchedule(schedule: EmployeeScheduleDetails | null): string {
  if (!schedule) return "No schedule reference available.";

  return formatTimeRange(schedule.workStart, schedule.workEnd);
}

export function formatList(values: readonly string[]): string {
  return values.length > 0 ? values.join(" · ") : "—";
}

export function getWeeklySchedule(schedule: EmployeeScheduleDetails) {
  return scheduleWeekdays.map(({ day, shortDay }) => ({
    day,
    shortDay,
    isWorkDay: schedule.workDays.includes(day),
  }));
}
