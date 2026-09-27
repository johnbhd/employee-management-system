import type { IconName, StatusTone } from "@/types/ui";

export type AttendanceHistoryStatus = "ontime" | "late" | "absent" | "overtime";
export type AttendanceTimeState = "ok" | "late" | "none";

export type AttendanceHistoryRecord = {
  id: string;
  date: string;
  fullDate: string;
  schedule: string;
  timeIn: string;
  timeInState: AttendanceTimeState;
  timeOut: string;
  timeOutState: AttendanceTimeState;
  totalHours: string;
  overtime: string;
  status: AttendanceHistoryStatus;
  statusLabel: string;
  remarks: string;
  scannerLocation: string;
};

export type AttendanceHistoryStat = {
  label: string;
  value: string;
  unit: string;
  note: string;
  icon: IconName;
  tone: StatusTone;
};

export const attendanceHistoryStats: AttendanceHistoryStat[] = [
  { label: "Days Present", value: "18", unit: "days", note: "This Month", icon: "calendar", tone: "info" },
  { label: "Days Late", value: "2", unit: "days", note: "This Month", icon: "clock", tone: "warning" },
  { label: "Days Absent", value: "1", unit: "day", note: "This Month", icon: "close", tone: "danger" },
  { label: "Overtime Hours", value: "6.5", unit: "hours", note: "This Month", icon: "clock", tone: "info" },
];

export const attendanceHistoryRecords: AttendanceHistoryRecord[] = [
  { id: "2026-07-23", date: "July 23, 2026 (Wed)", fullDate: "July 23, 2026 (Wednesday)", schedule: "7:30 AM – 5:00 PM", timeIn: "7:24 AM", timeInState: "ok", timeOut: "5:05 PM", timeOutState: "ok", totalHours: "9h 41m", overtime: "0h", status: "ontime", statusLabel: "On Time", remarks: "—", scannerLocation: "3rd Floor – Main Entrance" },
  { id: "2026-07-22", date: "July 22, 2026 (Tue)", fullDate: "July 22, 2026 (Tuesday)", schedule: "7:30 AM – 5:00 PM", timeIn: "7:42 AM", timeInState: "late", timeOut: "5:10 PM", timeOutState: "ok", totalHours: "9h 28m", overtime: "0h", status: "late", statusLabel: "Late", remarks: "Arrived past grace period", scannerLocation: "3rd Floor – Main Entrance" },
  { id: "2026-07-21", date: "July 21, 2026 (Mon)", fullDate: "July 21, 2026 (Monday)", schedule: "7:30 AM – 5:00 PM", timeIn: "Not Recorded", timeInState: "none", timeOut: "Not Recorded", timeOutState: "none", totalHours: "0h 0m", overtime: "0h", status: "absent", statusLabel: "Absent", remarks: "No time record on file", scannerLocation: "3rd Floor – Main Entrance" },
  { id: "2026-07-20", date: "July 20, 2026 (Sun)", fullDate: "July 20, 2026 (Sunday)", schedule: "7:30 AM – 5:00 PM", timeIn: "7:31 AM", timeInState: "ok", timeOut: "5:02 PM", timeOutState: "ok", totalHours: "9h 31m", overtime: "0h", status: "ontime", statusLabel: "On Time", remarks: "—", scannerLocation: "3rd Floor – Main Entrance" },
  { id: "2026-07-19", date: "July 19, 2026 (Sat)", fullDate: "July 19, 2026 (Saturday)", schedule: "7:30 AM – 5:00 PM", timeIn: "Not Recorded", timeInState: "none", timeOut: "Not Recorded", timeOutState: "none", totalHours: "0h 0m", overtime: "0h", status: "absent", statusLabel: "Absent", remarks: "No time record on file", scannerLocation: "3rd Floor – Main Entrance" },
  { id: "2026-07-18", date: "July 18, 2026 (Fri)", fullDate: "July 18, 2026 (Friday)", schedule: "7:30 AM – 5:00 PM", timeIn: "7:20 AM", timeInState: "ok", timeOut: "5:35 PM", timeOutState: "late", totalHours: "10h 15m", overtime: "1h 15m", status: "overtime", statusLabel: "Overtime", remarks: "Approved overtime for release", scannerLocation: "3rd Floor – Main Entrance" },
  { id: "2026-07-17", date: "July 17, 2026 (Thu)", fullDate: "July 17, 2026 (Thursday)", schedule: "7:30 AM – 5:00 PM", timeIn: "7:33 AM", timeInState: "ok", timeOut: "5:04 PM", timeOutState: "ok", totalHours: "9h 31m", overtime: "0h", status: "ontime", statusLabel: "On Time", remarks: "—", scannerLocation: "3rd Floor – Main Entrance" },
  { id: "2026-07-16", date: "July 16, 2026 (Wed)", fullDate: "July 16, 2026 (Wednesday)", schedule: "7:30 AM – 5:00 PM", timeIn: "7:48 AM", timeInState: "late", timeOut: "5:08 PM", timeOutState: "ok", totalHours: "9h 20m", overtime: "0h", status: "late", statusLabel: "Late", remarks: "Arrived past grace period", scannerLocation: "3rd Floor – Main Entrance" },
];

export const attendanceHistoryFilterLabels = {
  dateRange: "July 1 – July 23, 2026",
  month: "July 2026",
} as const;
