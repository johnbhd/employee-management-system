import {
  attendanceHistoryRecords,
  type AttendanceHistoryStatus,
} from "@/data/attendance-history";

export type CalendarAttendanceStatus =
  | "present"
  | "late"
  | "absent"
  | "no-record";

const demoAttendanceByDay: Record<number, CalendarAttendanceStatus> = {
  1: "present",
  2: "present",
  3: "late",
  4: "present",
  5: "present",
  6: "absent",
  7: "present",
  8: "present",
  9: "present",
  10: "late",
  11: "present",
  12: "present",
  13: "present",
  14: "present",
  15: "late",
  16: "present",
  17: "absent",
};

function mapHistoryStatus(
  status: AttendanceHistoryStatus,
): CalendarAttendanceStatus {
  if (status === "late") {
    return "late";
  }

  if (status === "absent") {
    return "absent";
  }

  return "present";
}

export function getAttendanceCalendarStatus(
  year: number,
  month: number,
  day: number,
): CalendarAttendanceStatus {
  const matchingHistoryRecord = attendanceHistoryRecords.find((record) => {
    const [recordYear, recordMonth, recordDay] = record.id
      .split("-")
      .map(Number);

    return (
      recordYear === year &&
      recordMonth === month &&
      recordDay === day
    );
  });

  if (matchingHistoryRecord) {
    return mapHistoryStatus(matchingHistoryRecord.status);
  }

  return demoAttendanceByDay[day] ?? "no-record";
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
