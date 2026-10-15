export const payrollEligibilityReasonCodes = [
  "ATTENDANCE_NOT_FOUND",
  "EMPLOYEE_NOT_FOUND",
  "PROCESSING_INCOMPLETE",
  "NOT_FINAL_VERIFIED",
  "PENDING_CORRECTION",
  "MISSING_EFFECTIVE_TIME",
  "MISSING_REQUIRED_IDENTIFIER",
  "ALREADY_IN_PAYROLL_BATCH",
] as const;

export type PayrollEligibilityReasonCode = typeof payrollEligibilityReasonCodes[number];
export type PayrollEligibilityOwner = "HR" | "PAYROLL" | "SYSTEM";

export type PayrollEligibilityReason = {
  code: PayrollEligibilityReasonCode;
  owner: PayrollEligibilityOwner;
  label: string;
};

export type PayrollEligibilityInput = {
  attendanceExists: boolean;
  employeeExists: boolean;
  processingComplete: boolean;
  finalVerificationStatus: "pending" | "verified" | null;
  hasFinalVerificationTimestamp: boolean;
  pendingCorrection: boolean;
  hasEffectiveTimeIn: boolean;
  hasEffectiveTimeOut: boolean;
  hasRequiredIdentifier: boolean;
  existingBatchReference: string | null;
};

const reasonDefinitions: Record<PayrollEligibilityReasonCode, Omit<PayrollEligibilityReason, "code">> = {
  ATTENDANCE_NOT_FOUND: {
    owner: "SYSTEM",
    label: "The attendance record could not be found.",
  },
  EMPLOYEE_NOT_FOUND: {
    owner: "SYSTEM",
    label: "The linked employee record could not be found.",
  },
  PROCESSING_INCOMPLETE: {
    owner: "SYSTEM",
    label: "Unified Attendance processing is not complete.",
  },
  NOT_FINAL_VERIFIED: {
    owner: "HR",
    label: "The attendance record is not final-verified by HR.",
  },
  PENDING_CORRECTION: {
    owner: "HR",
    label: "A correction request is still pending.",
  },
  MISSING_EFFECTIVE_TIME: {
    owner: "HR",
    label: "Effective time-in and time-out values are required.",
  },
  MISSING_REQUIRED_IDENTIFIER: {
    owner: "SYSTEM",
    label: "A required employee or attendance identifier is missing.",
  },
  ALREADY_IN_PAYROLL_BATCH: {
    owner: "PAYROLL",
    label: "This employee-period is already owned by a Payroll batch.",
  },
};

function reason(code: PayrollEligibilityReasonCode): PayrollEligibilityReason {
  return { code, ...reasonDefinitions[code] };
}

export function evaluatePayrollEligibility(input: PayrollEligibilityInput) {
  const reasons: PayrollEligibilityReason[] = [];

  if (!input.attendanceExists) reasons.push(reason("ATTENDANCE_NOT_FOUND"));
  if (!input.employeeExists) reasons.push(reason("EMPLOYEE_NOT_FOUND"));
  if (!input.processingComplete) reasons.push(reason("PROCESSING_INCOMPLETE"));
  if (input.finalVerificationStatus !== "verified" || !input.hasFinalVerificationTimestamp) {
    reasons.push(reason("NOT_FINAL_VERIFIED"));
  }
  if (input.pendingCorrection) reasons.push(reason("PENDING_CORRECTION"));
  if (!input.hasEffectiveTimeIn || !input.hasEffectiveTimeOut) {
    reasons.push(reason("MISSING_EFFECTIVE_TIME"));
  }
  if (!input.hasRequiredIdentifier) reasons.push(reason("MISSING_REQUIRED_IDENTIFIER"));
  if (input.existingBatchReference) reasons.push(reason("ALREADY_IN_PAYROLL_BATCH"));

  return {
    eligible: reasons.length === 0,
    status: reasons.length === 0 ? "ready" as const : "blocked" as const,
    reasons,
  };
}
