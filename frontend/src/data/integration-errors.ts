import type { StatusTone } from "@/types/ui";

export type IntegrationErrorSource =
  | "HRPS"
  | "Bundy / Biometric"
  | "QR Attendance"
  | "Unified Attendance"
  | "Payroll Integration"
  | "Accounting Integration";

export type IntegrationErrorSeverity = "Critical" | "High" | "Medium" | "Low";
export type IntegrationErrorStatus = "Open" | "Under Review" | "Retry Pending" | "Resolved";

export type IntegrationErrorTimelineEvent = {
  time: string;
  event: string;
  detail: string;
  tone: StatusTone;
};

export type IntegrationError = {
  id: string;
  source: IntegrationErrorSource;
  category: string;
  severity: IntegrationErrorSeverity;
  status: IntegrationErrorStatus;
  stage: string;
  summary: string;
  technicalMessage: string;
  affectedReference: string;
  occurredAt: string;
  retryable: boolean;
  retryCount: number;
  lastRetry?: string;
  resolutionStatus: string;
  relatedBatch?: string;
  relatedEmployeeId?: string;
  relatedRecordId?: string;
  timeline: readonly IntegrationErrorTimelineEvent[];
};

export const integrationErrorSources = [
  { source: "HRPS", detail: "Employee master-data synchronization", href: "/admin/hrps-integration" },
  { source: "Bundy / Biometric", detail: "Attendance device ingestion and matching", href: "/admin/bundy-biometric-etl" },
  { source: "QR Attendance", detail: "QR scan validation and synchronization", href: "/admin/qr-attendance" },
  { source: "Unified Attendance", detail: "Standardized attendance processing", href: "/admin/unified-attendance" },
  { source: "Payroll Integration", detail: "Verified attendance transfer boundary", href: "/admin/payroll-integration" },
  { source: "Accounting Integration", detail: "Approved payroll transfer boundary", href: "/admin/accounting-integration" },
] as const satisfies ReadonlyArray<{ source: IntegrationErrorSource; detail: string; href: string }>;

export const integrationErrors: readonly IntegrationError[] = [
  {
    id: "ERR-2026-0142",
    source: "Bundy / Biometric",
    category: "Employee Matching",
    severity: "High",
    status: "Open",
    stage: "Employee matching",
    summary: "Device employee ID could not be matched to an HRPS employee.",
    technicalMessage: "The imported device identifier did not resolve to a known HRPS employee record.",
    affectedReference: "Device BND-00482 · Import BND-2026-0916-07",
    occurredAt: "Sep 16, 2026 · 10:18 AM",
    retryable: false,
    retryCount: 0,
    resolutionStatus: "Needs review",
    relatedBatch: "BND-2026-0916-07",
    timeline: [
      { time: "10:18 AM", event: "Error detected", detail: "Employee matching rejected the imported identifier.", tone: "danger" },
      { time: "10:19 AM", event: "Queued for review", detail: "Automatic retry was not attempted because the reference is unknown.", tone: "warning" },
    ],
  },
  {
    id: "ERR-2026-0141",
    source: "Payroll Integration",
    category: "Acknowledgement",
    severity: "Critical",
    status: "Retry Pending",
    stage: "Transfer acknowledgement",
    summary: "Existing Payroll has not acknowledged the verified attendance batch.",
    technicalMessage: "The transfer completed at the integration boundary, but no acknowledgement was received within the expected window.",
    affectedReference: "Transfer batch PAY-2026-09-B",
    occurredAt: "Sep 16, 2026 · 10:04 AM",
    retryable: true,
    retryCount: 2,
    lastRetry: "Sep 16, 2026 · 10:27 AM",
    resolutionStatus: "Retry queued",
    relatedBatch: "PAY-2026-09-B",
    timeline: [
      { time: "10:04 AM", event: "Transfer sent", detail: "Verified attendance batch was sent to the Existing Payroll boundary.", tone: "info" },
      { time: "10:12 AM", event: "Acknowledgement window exceeded", detail: "The expected response was not received.", tone: "danger" },
      { time: "10:27 AM", event: "Retry scheduled", detail: "A manual retry is eligible for this transfer boundary error.", tone: "warning" },
    ],
  },
  {
    id: "ERR-2026-0140",
    source: "HRPS",
    category: "Missing Data",
    severity: "High",
    status: "Under Review",
    stage: "Employee synchronization",
    summary: "Employee record is missing a required department assignment.",
    technicalMessage: "The employee payload was received, but the department field required by the integration contract was empty.",
    affectedReference: "Employee AU-EMP-2026-0233",
    occurredAt: "Sep 16, 2026 · 9:56 AM",
    retryable: false,
    retryCount: 0,
    resolutionStatus: "Waiting for source correction",
    relatedEmployeeId: "AU-EMP-2026-0233",
    timeline: [
      { time: "9:56 AM", event: "Payload validated", detail: "The employee record did not meet the required field checks.", tone: "danger" },
      { time: "9:58 AM", event: "Review assigned", detail: "Source data correction is required before another sync.", tone: "warning" },
    ],
  },
  {
    id: "ERR-2026-0139",
    source: "Unified Attendance",
    category: "Source Conflict",
    severity: "Medium",
    status: "Under Review",
    stage: "Attendance normalization",
    summary: "Bundy and QR events disagree for the same attendance record.",
    technicalMessage: "Two approved source events were received with conflicting time-in values for the same employee and date.",
    affectedReference: "Attendance record ATT-2026-0916-0332",
    occurredAt: "Sep 16, 2026 · 9:42 AM",
    retryable: false,
    retryCount: 0,
    resolutionStatus: "Needs attendance review",
    relatedEmployeeId: "AU-EMP-2026-0332",
    relatedRecordId: "ATT-2026-0916-0332",
    timeline: [
      { time: "9:42 AM", event: "Conflict detected", detail: "Source reconciliation found different time-in values.", tone: "danger" },
      { time: "9:45 AM", event: "Held from downstream transfer", detail: "The record remains isolated until the source conflict is reviewed.", tone: "warning" },
    ],
  },
  {
    id: "ERR-2026-0138",
    source: "QR Attendance",
    category: "Duplicate",
    severity: "Medium",
    status: "Resolved",
    stage: "QR scan validation",
    summary: "A duplicate QR scan was safely excluded from the unified record.",
    technicalMessage: "The same employee and station combination was received twice inside the duplicate detection window.",
    affectedReference: "Employee AU-EMP-2026-1042 · Station QR-STATION-02",
    occurredAt: "Sep 16, 2026 · 8:34 AM",
    retryable: false,
    retryCount: 0,
    resolutionStatus: "Resolved automatically",
    relatedEmployeeId: "AU-EMP-2026-1042",
    relatedRecordId: "QR-2026-0916-8841",
    timeline: [
      { time: "8:34 AM", event: "Duplicate detected", detail: "The scan matched an event already accepted for the same window.", tone: "warning" },
      { time: "8:34 AM", event: "Resolved", detail: "The duplicate was excluded without changing the accepted attendance record.", tone: "success" },
    ],
  },
  {
    id: "ERR-2026-0137",
    source: "Accounting Integration",
    category: "Timeout",
    severity: "High",
    status: "Retry Pending",
    stage: "Accounting transfer",
    summary: "Existing Accounting did not respond before the transfer timeout.",
    technicalMessage: "The approved payroll transfer remained pending at the external Accounting boundary until the request window elapsed.",
    affectedReference: "Transfer batch ACC-2026-09-002",
    occurredAt: "Sep 16, 2026 · 8:12 AM",
    retryable: true,
    retryCount: 1,
    lastRetry: "Sep 16, 2026 · 8:25 AM",
    resolutionStatus: "Retry queued",
    relatedBatch: "ACC-2026-09-002",
    timeline: [
      { time: "8:12 AM", event: "Transfer timed out", detail: "No response was received from the Existing Accounting boundary.", tone: "danger" },
      { time: "8:25 AM", event: "Retry scheduled", detail: "A manual retry remains eligible for this transient connection error.", tone: "warning" },
    ],
  },
];

export const resolutionHistory = [
  { id: "ERR-2026-0138", source: "QR Attendance", resolution: "Duplicate scan excluded", actor: "Integration Layer", time: "Sep 16, 2026 · 8:34 AM" },
  { id: "ERR-2026-0135", source: "Bundy / Biometric", resolution: "Employee reference corrected and reprocessed", actor: "IT Administrator", time: "Sep 15, 2026 · 4:18 PM" },
  { id: "ERR-2026-0132", source: "HRPS", resolution: "Required department value supplied by source", actor: "HRPS Integration", time: "Sep 15, 2026 · 2:07 PM" },
] as const;
