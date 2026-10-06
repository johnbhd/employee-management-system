import type { StatusTone } from "@/types/ui";

export type AttendanceReportType =
  | "daily"
  | "monthly"
  | "missing-time-out"
  | "source-usage"
  | "correction-summary";

export type AttendanceReportRecord = {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string;
  dateLabel: string;
  timeIn: string;
  timeOut: string | null;
  source: "QR";
  status: "Present" | "Completed";
  statusTone: StatusTone;
  timeInSource: "QR";
  timeOutSource: "QR" | null;
};

export type AttendanceReportCorrectionRecord = {
  id: string;
  attendanceRecordId: string;
  employeeId: string;
  employeeName: string;
  department: string;
  attendanceDate: string;
  attendanceDateLabel: string;
  submittedDate: string;
  submittedAt: string;
  issueType: string;
  status: "Pending" | "Approved" | "Rejected";
  statusTone: StatusTone;
  decisionAt: string | null;
};

export type MonthlyAttendanceRow = {
  employeeId: string;
  employeeName: string;
  department: string;
  attendanceRecords: number;
  completed: number;
  awaitingTimeOut: number;
  qrRecords: number;
};

export type AttendanceReportSummary = {
  totalRecords: number;
  timedIn: number;
  completed: number;
  awaitingTimeOut: number;
};

export type SourceUsageSummary = {
  qr: number;
  total: number;
};

export const attendanceReportTypes: readonly {
  id: AttendanceReportType;
  label: string;
  shortLabel: string;
}[] = [
  { id: "daily", label: "Daily Attendance", shortLabel: "Daily" },
  { id: "monthly", label: "Monthly Attendance", shortLabel: "Monthly" },
  {
    id: "missing-time-out",
    label: "Missing Time-Out",
    shortLabel: "Missing Time-Out",
  },
  { id: "source-usage", label: "Attendance Source Usage", shortLabel: "Source Usage" },
  { id: "correction-summary", label: "Correction Summary", shortLabel: "Corrections" },
];

export function buildMonthlyAttendanceRows(
  records: readonly AttendanceReportRecord[],
): MonthlyAttendanceRow[] {
  const rows = new Map<string, MonthlyAttendanceRow>();

  records.forEach((record) => {
    const current = rows.get(record.employeeId) ?? {
      employeeId: record.employeeId,
      employeeName: record.employeeName,
      department: record.department,
      attendanceRecords: 0,
      completed: 0,
      awaitingTimeOut: 0,
      qrRecords: 0,
    };

    current.attendanceRecords += 1;
    current.completed += record.status === "Completed" ? 1 : 0;
    current.awaitingTimeOut += record.timeOut ? 0 : 1;
    current.qrRecords += 1;
    rows.set(record.employeeId, current);
  });

  return Array.from(rows.values()).sort((left, right) => (
    left.employeeName.localeCompare(right.employeeName)
  ));
}

export function buildAttendanceReportSummary(
  records: readonly AttendanceReportRecord[],
): AttendanceReportSummary {
  return {
    totalRecords: records.length,
    timedIn: records.filter((record) => Boolean(record.timeIn)).length,
    completed: records.filter((record) => record.status === "Completed").length,
    awaitingTimeOut: records.filter((record) => record.timeOut === null).length,
  };
}

export function buildSourceUsageSummary(
  records: readonly AttendanceReportRecord[],
): SourceUsageSummary {
  return {
    qr: records.length,
    total: records.length,
  };
}

export function buildCorrectionSummary(
  requests: readonly AttendanceReportCorrectionRecord[],
) {
  return {
    total: requests.length,
    pending: requests.filter((request) => request.status === "Pending").length,
    approved: requests.filter((request) => request.status === "Approved").length,
    rejected: requests.filter((request) => request.status === "Rejected").length,
  };
}
