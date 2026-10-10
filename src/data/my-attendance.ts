import type { IconName, StatusTone } from "@/types/ui";

export type EmployeeAttendanceStat = {
  label: string;
  value: string;
  note: string;
  icon: IconName;
  tone: StatusTone;
};

export const employeeAttendanceProfile = {
  schedule: "7:30 AM – 5:00 PM",
  scheduleType: "Regular Shift",
  status: "Present",
  statusNote: "On time",
} as const;

export const employeeAttendanceStats: EmployeeAttendanceStat[] = [
  {
    label: "Time-In",
    value: "7:24 AM",
    note: "via Bundy",
    icon: "check",
    tone: "success",
  },
  {
    label: "Time-Out",
    value: "—",
    note: "Not yet timed out",
    icon: "logout",
    tone: "muted",
  },
  {
    label: "Attendance Source",
    value: "Bundy",
    note: "Time-in recorded via Bundy Clock",
    icon: "bundy",
    tone: "muted",
  },
  {
    label: "Late Minutes",
    value: "0 min",
    note: "On time",
    icon: "clock",
    tone: "danger",
  },
  {
    label: "Undertime",
    value: "—",
    note: "Not applicable yet",
    icon: "clock",
    tone: "warning",
  },
];
