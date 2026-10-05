export type CalendarAttendanceStatus =
  | "present"
  | "late"
  | "absent"
  | "no-record";

const demoAttendanceByDate: Record<string, CalendarAttendanceStatus> = {
  "2026-09-01": "present",
  "2026-09-02": "present",
  "2026-09-03": "late",
  "2026-09-04": "present",
  "2026-09-05": "present",
  "2026-09-06": "absent",
  "2026-09-07": "present",
  "2026-09-08": "present",
  "2026-09-09": "present",
  "2026-09-10": "late",
  "2026-09-11": "present",
  "2026-09-12": "present",
  "2026-09-13": "present",
  "2026-09-14": "present",
  "2026-09-15": "late",
  "2026-09-16": "present",
  "2026-09-17": "absent",
};

const prototypeHistoryStatusByDate: Record<
  string,
  Exclude<CalendarAttendanceStatus, "no-record">
> = {
  "2026-07-16": "late",
  "2026-07-17": "present",
  "2026-07-18": "present",
  "2026-07-19": "absent",
  "2026-07-20": "present",
  "2026-07-21": "absent",
  "2026-07-22": "late",
  "2026-07-23": "present",
};

export function getAttendanceCalendarStatus(
  year: number,
  month: number,
  day: number,
): CalendarAttendanceStatus {
  const dateKey = formatCalendarDateKey(year, month, day);
  const matchingHistoryStatus = prototypeHistoryStatusByDate[dateKey];

  if (matchingHistoryStatus) {
    return matchingHistoryStatus;
  }

  return demoAttendanceByDate[dateKey] ?? "no-record";
}

function formatCalendarDateKey(year: number, month: number, day: number) {
  return [
    year,
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

export function getCalendarStatusFromLabel(
  status: string,
): CalendarAttendanceStatus {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus === "late") {
    return "late";
  }

  if (normalizedStatus === "absent") {
    return "absent";
  }

  if (normalizedStatus === "present") {
    return "present";
  }

  return "no-record";
}
