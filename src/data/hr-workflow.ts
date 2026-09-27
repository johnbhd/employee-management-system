import type {
  HrAttendanceMonitoringRecord,
  HrValidationStatus,
} from "./hr";
import type {
  HrCorrectionRequest,
  HrCorrectionRequestStatus,
} from "./hr-correction-requests";

export type HrVerificationStatus = "Pending Review" | "Needs Correction" | "Verified";
export type PayrollReadiness = "Not Ready" | "Ready for Payroll";
export type HrWorkflowCorrectionStatus = HrCorrectionRequestStatus | "No Correction Request";

export type HrWorkflowAttendanceRecord = HrAttendanceMonitoringRecord & {
  correctionStatus: HrWorkflowCorrectionStatus;
  hrVerificationStatus: HrVerificationStatus;
  payrollReadiness: PayrollReadiness;
};

const initialVerifiedRecordIds = new Set([
  "AU-EMP-2026-0418",
  "AU-EMP-2026-0102",
]);

export function getInitialHrVerificationStatus(
  record: HrAttendanceMonitoringRecord,
  correctionRequest?: HrCorrectionRequest,
): HrVerificationStatus {
  if (correctionRequest) {
    return correctionRequest.status === "Approved" ? "Pending Review" : "Needs Correction";
  }

  const hasUnresolvedAttendanceIssue = record.validationStatus !== "Verified"
    || record.status === "Absent"
    || record.status === "Missing Time-Out";

  if (hasUnresolvedAttendanceIssue) return "Needs Correction";
  if (initialVerifiedRecordIds.has(record.id)) return "Verified";

  return "Pending Review";
}

export function getPayrollReadiness({
  hrVerificationStatus,
  validationStatus,
  correctionStatus,
}: {
  hrVerificationStatus: HrVerificationStatus;
  validationStatus: HrValidationStatus;
  correctionStatus: HrWorkflowCorrectionStatus;
}): PayrollReadiness {
  const correctionIsResolved = correctionStatus === "No Correction Request" || correctionStatus === "Approved";

  if (hrVerificationStatus === "Verified" && validationStatus === "Verified" && correctionIsResolved) {
    return "Ready for Payroll";
  }

  return "Not Ready";
}

export function getCorrectionStatus(correctionRequest?: HrCorrectionRequest): HrWorkflowCorrectionStatus {
  return correctionRequest?.status ?? "No Correction Request";
}
