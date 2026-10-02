import type { IconName } from "@/types/ui";

export const employeeQrSteps = [
  "Open your attendance QR code.",
  "Present it to the campus attendance scanner.",
  "The scanner verifies your identity; attendance recording is handled separately.",
] as const;

export const employeeQrInfo = {
  title: "How to Record Attendance",
  icon: "help" as IconName,
  securityTitle: "Security Notice",
  securityIcon: "shield" as IconName,
  securityMessage:
    "This signed QR code is personal and valid only at authorized attendance stations. Do not share screenshots of your QR code.",
} as const;
