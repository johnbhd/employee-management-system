import type { PayrollResultRecord } from "@/types/payroll-results";
import type {
  AccountingReadinessStatus,
} from "@/types/accounting-approved-payroll";

export type AccountingReadiness = {
  status: AccountingReadinessStatus;
  reasons: string[];
};

function getIssueReason(
  result: Pick<PayrollResultRecord, "rejectedCount" | "failedCount">,
): string {
  const issueCount = result.rejectedCount + result.failedCount;

  if (issueCount > 0) {
    return `${issueCount} employee payroll result${issueCount === 1 ? " requires" : "s require"} Payroll follow-up.`;
  }

  return "The Payroll result completed with unresolved issues.";
}

export function getAccountingReadiness(
  result: Pick<
    PayrollResultRecord,
    | "status"
    | "externalPayrollReference"
    | "rejectedCount"
    | "failedCount"
  >,
): AccountingReadiness {
  if (!result.externalPayrollReference) {
    return {
      status: "blocked",
      reasons: ["The Payroll result has no external Payroll reference."],
    };
  }

  switch (result.status) {
    case "completed":
      return {
        status: "ready",
        reasons: [],
      };
    case "processing":
      return {
        status: "blocked",
        reasons: ["The Payroll result is still processing."],
      };
    case "rejected":
      return {
        status: "blocked",
        reasons: ["The Payroll result was rejected by the Existing Payroll System."],
      };
    case "failed":
      return {
        status: "blocked",
        reasons: ["The Payroll result failed in the Existing Payroll System."],
      };
    case "completed_with_issues":
    case "partially_completed":
      return {
        status: "blocked",
        reasons: [getIssueReason(result)],
      };
  }
}
