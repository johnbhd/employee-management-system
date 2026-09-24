import type { IconName, StatusTone } from "@/types/ui";

export type HrAttendanceSource = "Bundy" | "QR" | null;
export type HrAttendanceStatus = "Present" | "Late" | "Absent" | "Missing Time-Out";
export type HrValidationStatus = "Verified" | "Needs Review" | "Missing Data" | "Source Conflict" | "Schedule Mismatch";

export type HrSummaryMetric = {
  label: string;
  value: string;
  note: string;
  icon: IconName;
  tone: StatusTone;
};

export type HrAttendanceRecord = {
  id: string;
  employeeId: string;
  employeeName: string;
  schedule: string;
  timeIn: string;
  timeOut: string;
  source: HrAttendanceSource;
  status: HrAttendanceStatus;
  statusTone: StatusTone;
  validationStatus: HrValidationStatus;
  validationTone: StatusTone;
};

export type HrPendingAction = {
  label: string;
  count: string;
  note: string;
  icon: IconName;
  tone: StatusTone;
};

export type HrAttendanceIssue = {
  id: string;
  employeeName: string;
  title: string;
  description: string;
  time: string;
  status: string;
  tone: StatusTone;
};

export const hrDashboardDate = "Wednesday, September 16, 2026";

export const hrSummaryMetrics: HrSummaryMetric[] = [
  { label: "Present Today", value: "124", note: "Employees recorded", icon: "check", tone: "success" },
  { label: "Late Today", value: "8", note: "Needs monitoring", icon: "clock", tone: "warning" },
  { label: "Absent", value: "4", note: "Needs review", icon: "close", tone: "danger" },
  { label: "Missing Time-Out", value: "6", note: "Open attendance gaps", icon: "warning", tone: "warning" },
  { label: "Pending Corrections", value: "5", note: "Awaiting review", icon: "comment", tone: "info" },
  { label: "Pending Approval", value: "3", note: "Needs authorized action", icon: "check", tone: "warning" },
];

export const hrTodayAttendance: HrAttendanceRecord[] = [
  {
    id: "AU-EMP-2026-0418",
    employeeId: "AU-EMP-2026-0418",
    employeeName: "John Benedict M. Villegas",
    schedule: "7:30 AM – 5:00 PM",
    timeIn: "7:24 AM",
    timeOut: "5:03 PM",
    source: "Bundy",
    status: "Present",
    statusTone: "success",
    validationStatus: "Verified",
    validationTone: "success",
  },
  {
    id: "AU-EMP-2026-0194",
    employeeId: "AU-EMP-2026-0194",
    employeeName: "Maria Santos",
    schedule: "7:30 AM – 5:00 PM",
    timeIn: "7:31 AM",
    timeOut: "5:08 PM",
    source: "QR",
    status: "Late",
    statusTone: "warning",
    validationStatus: "Verified",
    validationTone: "success",
  },
  {
    id: "AU-EMP-2026-0332",
    employeeId: "AU-EMP-2026-0332",
    employeeName: "Robert Cruz",
    schedule: "7:30 AM – 5:00 PM",
    timeIn: "7:42 AM",
    timeOut: "—",
    source: "QR",
    status: "Missing Time-Out",
    statusTone: "warning",
    validationStatus: "Needs Review",
    validationTone: "warning",
  },
  {
    id: "AU-EMP-2026-0177",
    employeeId: "AU-EMP-2026-0177",
    employeeName: "Ana Reyes",
    schedule: "7:30 AM – 5:00 PM",
    timeIn: "—",
    timeOut: "5:04 PM",
    source: "Bundy",
    status: "Absent",
    statusTone: "danger",
    validationStatus: "Missing Data",
    validationTone: "danger",
  },
  {
    id: "AU-EMP-2026-0087",
    employeeId: "AU-EMP-2026-0087",
    employeeName: "Inactive Employee",
    schedule: "7:30 AM – 5:00 PM",
    timeIn: "7:49 AM",
    timeOut: "—",
    source: null,
    status: "Absent",
    statusTone: "danger",
    validationStatus: "Schedule Mismatch",
    validationTone: "warning",
  },
];

export const hrPendingActions: HrPendingAction[] = [
  { label: "Correction Requests", count: "5", note: "Awaiting HR review", icon: "comment", tone: "info" },
  { label: "Missing Time-Out", count: "6", note: "Attendance gaps today", icon: "warning", tone: "warning" },
  { label: "Attendance Needs Review", count: "3", note: "Validation exceptions", icon: "clock", tone: "warning" },
  { label: "Source Conflicts", count: "2", note: "Bundy and QR records", icon: "unified", tone: "danger" },
  { label: "Schedule Mismatch", count: "1", note: "Check assigned schedule", icon: "calendar", tone: "warning" },
];

export const hrRecentIssues: HrAttendanceIssue[] = [
  {
    id: "AU-EMP-2026-0332",
    employeeName: "Robert Cruz",
    title: "Missing Time-Out",
    description: "Time-in was recorded, but no time-out is available for the scheduled shift.",
    time: "Today · 5:00 PM expected",
    status: "Needs Review",
    tone: "warning",
  },
  {
    id: "AU-EMP-2026-0177",
    employeeName: "Ana Reyes",
    title: "Missing Time-In",
    description: "A time-out record was received without a matching time-in record.",
    time: "Today · 5:04 PM",
    status: "Missing Data",
    tone: "danger",
  },
  {
    id: "AU-EMP-2026-0087",
    employeeName: "Inactive Employee",
    title: "Schedule Mismatch",
    description: "The attendance event does not match the current employee reference.",
    time: "Today · 7:49 AM",
    status: "Needs Review",
    tone: "warning",
  },
];
