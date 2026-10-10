import { formatCampusTime } from "@/lib/campus-time";
import type { QrAttendanceData } from "@/types/attendance-qr";
import type { StatusTone } from "@/types/ui";

export const unavailableAttendanceValue = "\u2014";

export type TodayAttendancePresentation = {
  status: string;
  statusTone: StatusTone;
  statusNote: string;
  timeIn: string;
  timeInNote: string;
  timeOut: string;
  timeOutNote: string;
  sourceValue: string;
  sourceNote: string;
};

export function getTodayAttendancePresentation(
  attendance: QrAttendanceData | null,
  isUnavailable: boolean,
): TodayAttendancePresentation {
  const hasAttendance = attendance !== null;
  const status = isUnavailable
    ? "Unavailable"
    : attendance?.status === "completed"
      ? "Completed"
      : hasAttendance
        ? "Present"
        : "Not Yet Timed-In";
  const statusTone: StatusTone = isUnavailable
    ? "danger"
    : hasAttendance
      ? "success"
      : "muted";
  const statusNote = isUnavailable
    ? "Unable to load today's attendance. Please try again."
    : hasAttendance
      ? attendance.status === "completed"
        ? "Time-In and Time-Out recorded"
        : "Time-In recorded; Time-Out is still pending"
      : "No attendance recorded for today";
  const source = getAttendanceSource(attendance, isUnavailable);

  return {
    status,
    statusTone,
    statusNote,
    timeIn: attendance ? formatAttendanceTime(attendance.timeIn) : unavailableAttendanceValue,
    timeInNote: isUnavailable
      ? "Unavailable"
      : attendance
        ? `Recorded via ${attendance.timeInSource}`
        : "No attendance record",
    timeOut: attendance?.timeOut
      ? formatAttendanceTime(attendance.timeOut)
      : unavailableAttendanceValue,
    timeOutNote: isUnavailable
      ? "Unavailable"
      : attendance?.timeOut
        ? `Recorded via ${attendance.timeOutSource ?? "attendance source"}`
        : attendance
          ? "Not yet timed out"
          : "No attendance record",
    sourceValue: source.value,
    sourceNote: source.note,
  };
}

export function formatAttendanceTime(value: string | null) {
  if (!value) {
    return unavailableAttendanceValue;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Time unavailable"
    : formatCampusTime(date);
}

function getAttendanceSource(
  attendance: QrAttendanceData | null,
  isUnavailable: boolean,
) {
  if (isUnavailable) {
    return {
      value: unavailableAttendanceValue,
      note: "Unavailable",
    };
  }

  if (!attendance) {
    return {
      value: unavailableAttendanceValue,
      note: "No attendance source",
    };
  }

  if (
    attendance.timeOutSource === null
    || attendance.timeInSource === attendance.timeOutSource
  ) {
    return {
      value: attendance.timeInSource,
      note: attendance.timeOutSource
        ? `Time-In and Time-Out via ${attendance.timeInSource}`
        : `Time-In via ${attendance.timeInSource}`,
    };
  }

  return {
    value: "Mixed",
    note: `Time-In: ${attendance.timeInSource}; Time-Out: ${attendance.timeOutSource}`,
  };
}
