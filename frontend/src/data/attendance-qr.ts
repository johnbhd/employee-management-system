import type { IconName } from "@/types/ui";

export const employeeQrProfile = {
  name: "John Benedict M. Villegas",
  employeeId: "AU-EMP-2026-001",
  department: "Information Technology Department",
  schedule: "7:30 AM – 5:00 PM",
  status: "Not Yet Timed In",
  timeIn: "Not Recorded",
  timeOut: "Not Recorded",
  dateTime: "July 23, 2026 · 7:24 AM",
} as const;

export const employeeQrSteps = [
  "Open your attendance QR code.",
  "Present it to the campus attendance scanner.",
  "Wait for the Time-In or Time-Out confirmation.",
] as const;

export const employeeQrStatus = [
  { label: "Current Status", value: employeeQrProfile.status, isPill: true },
  { label: "Schedule", value: employeeQrProfile.schedule, isPill: false },
  { label: "Time-In", value: employeeQrProfile.timeIn, isPill: true },
  { label: "Time-Out", value: employeeQrProfile.timeOut, isPill: true },
] as const satisfies ReadonlyArray<{
  label: string;
  value: string;
  isPill: boolean;
}>;

export const employeeQrInfo = {
  title: "How to Record Attendance",
  icon: "help" as IconName,
  securityTitle: "Security Notice",
  securityIcon: "shield" as IconName,
  securityMessage:
    "This QR code is personal, temporary, and valid only at authorized attendance stations. Do not share screenshots of your QR code.",
} as const;
