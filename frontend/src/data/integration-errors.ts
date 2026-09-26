import type { IconName, StatusTone } from "@/types/ui";

export type IntegrationErrorRecord = {
  id: string;
  source: string;
  category: string;
  summary: string;
  affected: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  status: "Open" | "Retry pending" | "Under review" | "Resolved";
  occurredAt: string;
  tone: StatusTone;
};

export type IntegrationErrorSystem = {
  name: string;
  purpose: string;
  status: string;
  lastCheck: string;
  tone: StatusTone;
  icon: IconName;
  href: string;
};

export const integrationErrorSystems: readonly IntegrationErrorSystem[] = [
  {
    name: "HRPS",
    purpose: "Employee master-data source",
    status: "Stable",
    lastCheck: "10:42 AM",
    tone: "success",
    icon: "hrps",
    href: "/admin/hrps-integration",
  },
  {
    name: "Bundy / Biometric",
    purpose: "Attendance device ingestion",
    status: "Review needed",
    lastCheck: "10:38 AM",
    tone: "warning",
    icon: "bundy",
    href: "/admin/bundy-biometric-etl",
  },
  {
    name: "QR Attendance",
    purpose: "Additional attendance source",
    status: "Stable",
    lastCheck: "10:40 AM",
    tone: "success",
    icon: "qr",
    href: "/admin/qr-attendance",
  },
  {
    name: "Unified Attendance",
    purpose: "Standardized attendance layer",
    status: "Review needed",
    lastCheck: "10:36 AM",
    tone: "warning",
    icon: "unified",
    href: "/admin/unified-attendance",
  },
  {
    name: "Payroll Integration",
    purpose: "Verified attendance transfer",
    status: "Retry pending",
    lastCheck: "10:31 AM",
    tone: "danger",
    icon: "payroll",
    href: "/admin/payroll-integration",
  },
  {
    name: "Accounting Integration",
    purpose: "Approved payroll transfer",
    status: "Stable",
    lastCheck: "10:29 AM",
    tone: "success",
    icon: "accounting",
    href: "/admin/accounting-integration",
  },
];

export const integrationErrorRecords: readonly IntegrationErrorRecord[] = [
  {
    id: "ERR-2026-0204",
    source: "Payroll Integration",
    category: "Acknowledgement",
    summary: "Existing Payroll has not acknowledged a verified attendance batch.",
    affected: "PAY-2026-09-B",
    severity: "Critical",
    status: "Retry pending",
    occurredAt: "Sep 16 · 10:31 AM",
    tone: "danger",
  },
  {
    id: "ERR-2026-0203",
    source: "Bundy / Biometric",
    category: "Employee matching",
    summary: "Imported device employee ID could not be matched to HRPS.",
    affected: "BND-00482",
    severity: "High",
    status: "Under review",
    occurredAt: "Sep 16 · 10:18 AM",
    tone: "warning",
  },
  {
    id: "ERR-2026-0202",
    source: "Unified Attendance",
    category: "Source conflict",
    summary: "Bundy and QR events disagree for the same attendance record.",
    affected: "ATT-2026-0916-0332",
    severity: "Medium",
    status: "Open",
    occurredAt: "Sep 16 · 9:42 AM",
    tone: "danger",
  },
  {
    id: "ERR-2026-0201",
    source: "HRPS",
    category: "Missing data",
    summary: "Employee record is missing a department assignment.",
    affected: "AU-EMP-2026-0233",
    severity: "High",
    status: "Under review",
    occurredAt: "Sep 16 · 9:24 AM",
    tone: "warning",
  },
  {
    id: "ERR-2026-0200",
    source: "Accounting Integration",
    category: "Timeout",
    summary: "Existing Accounting did not respond before the transfer timeout.",
    affected: "ACC-2026-09-002",
    severity: "Medium",
    status: "Resolved",
    occurredAt: "Sep 16 · 8:12 AM",
    tone: "success",
  },
];

export const integrationErrorResolutionEvents = [
  {
    time: "10:36 AM",
    event: "Payroll batch isolated",
    detail: "The unacknowledged transfer was held before another downstream attempt.",
    status: "Pending",
    tone: "warning" as const,
  },
  {
    time: "10:18 AM",
    event: "Bundy record routed to review",
    detail: "The unmatched device identifier remains outside the transfer queue.",
    status: "Review",
    tone: "warning" as const,
  },
  {
    time: "8:27 AM",
    event: "Accounting timeout resolved",
    detail: "The approved payroll batch received a downstream acknowledgement.",
    status: "Resolved",
    tone: "success" as const,
  },
] as const;
