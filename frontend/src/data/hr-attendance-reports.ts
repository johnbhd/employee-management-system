import {
  hrCorrectionRequests,
  type HrCorrectionRequest,
  type HrCorrectionRequestStatus,
} from "./hr-correction-requests";
import {
  hrAttendanceMonitoringDate,
  hrAttendanceMonitoringRecords,
  type HrAttendanceMonitoringRecord,
} from "./hr";

export type AttendanceReportType =
  | "daily"
  | "monthly"
  | "late"
  | "undertime"
  | "missing-time-out"
  | "source-usage"
  | "correction-summary";

export type AttendanceReportRecord = HrAttendanceMonitoringRecord & {
  correctionRequestId?: string;
  correctionStatus?: HrCorrectionRequestStatus;
};

export type MonthlyAttendanceRow = {
  employeeId: string;
  employeeName: string;
  department: string;
  scheduledDays: number;
  present: number;
  late: number;
  absent: number;
  undertimeMinutes: number;
  missingTimeOut: number;
};

export type SourceUsageSummary = {
  bundy: number;
  qr: number;
  noSource: number;
  total: number;
  sourceConflicts: number;
};

export const attendanceReportTypes: readonly { id: AttendanceReportType; label: string; shortLabel: string }[] = [
  { id: "daily", label: "Daily Attendance", shortLabel: "Daily" },
  { id: "monthly", label: "Monthly Attendance", shortLabel: "Monthly" },
  { id: "late", label: "Late Report", shortLabel: "Late" },
  { id: "undertime", label: "Undertime Report", shortLabel: "Undertime" },
  { id: "missing-time-out", label: "Missing Time-Out", shortLabel: "Missing Time-Out" },
  { id: "source-usage", label: "Attendance Source Usage", shortLabel: "Source Usage" },
  { id: "correction-summary", label: "Correction Summary", shortLabel: "Corrections" },
];

export const defaultAttendanceReportDate = hrAttendanceMonitoringDate;
export const defaultAttendanceReportMonth = hrAttendanceMonitoringDate.slice(0, 7);

const correctionRequestByAttendanceId = new Map(
  hrCorrectionRequests.map((request) => [request.attendanceRecordId, request]),
);

export const hrAttendanceReportRecords: AttendanceReportRecord[] = hrAttendanceMonitoringRecords.map((record) => {
  const correctionRequest = correctionRequestByAttendanceId.get(record.id);

  return {
    ...record,
    correctionRequestId: correctionRequest?.id,
    correctionStatus: correctionRequest?.status,
  };
});

export function buildMonthlyAttendanceRows(records: readonly AttendanceReportRecord[]): MonthlyAttendanceRow[] {
  const rows = new Map<string, MonthlyAttendanceRow>();

  records.forEach((record) => {
    const current = rows.get(record.employeeId) ?? {
      employeeId: record.employeeId,
      employeeName: record.employeeName,
      department: record.department,
      scheduledDays: 0,
      present: 0,
      late: 0,
      absent: 0,
      undertimeMinutes: 0,
      missingTimeOut: 0,
    };

    current.scheduledDays += 1;
    if (record.status === "Present") current.present += 1;
    if (record.status === "Late") current.late += 1;
    if (record.status === "Absent") current.absent += 1;
    if (record.status === "Missing Time-Out") current.missingTimeOut += 1;
    current.undertimeMinutes += record.undertimeMinutes ?? 0;
    rows.set(record.employeeId, current);
  });

  return Array.from(rows.values()).sort((first, second) => first.employeeName.localeCompare(second.employeeName));
}

export function buildSourceUsageSummary(records: readonly AttendanceReportRecord[]): SourceUsageSummary {
  return records.reduce<SourceUsageSummary>((summary, record) => {
    if (record.source === "Bundy") summary.bundy += 1;
    else if (record.source === "QR") summary.qr += 1;
    else summary.noSource += 1;

    if (record.validationStatus === "Source Conflict") summary.sourceConflicts += 1;
    summary.total += 1;
    return summary;
  }, { bundy: 0, qr: 0, noSource: 0, total: 0, sourceConflicts: 0 });
}

export function buildCorrectionSummary(requests: readonly HrCorrectionRequest[]) {
  return {
    total: requests.length,
    open: requests.filter((request) => request.status !== "Approved" && request.status !== "Rejected").length,
    approved: requests.filter((request) => request.status === "Approved").length,
    rejected: requests.filter((request) => request.status === "Rejected").length,
    needsInformation: requests.filter((request) => request.status === "Needs Additional Information").length,
  };
}
