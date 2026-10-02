import type { IconName } from "@/types/ui";

export const employeeQrProfile = {
  schedule: "7:30 AM – 5:00 PM",
} as const;

export const employeeQrSteps = [
  "Open your attendance QR code.",
  "Present it to the campus attendance scanner.",
  "Wait for the Time-In or Time-Out confirmation.",
] as const;

export const employeeQrInfo = {
  title: "How to Record Attendance",
  icon: "help" as IconName,
  securityTitle: "Security Notice",
  securityIcon: "shield" as IconName,
  securityMessage:
    "This QR code is personal, temporary, and valid only at authorized attendance stations. Do not share screenshots of your QR code.",
} as const;
