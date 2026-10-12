import "server-only";

import type {
  PayrollHandoffSubmissionPayload,
  PayrollIntegrationResponse,
} from "@/types/payroll-handoff";

export interface PayrollIntegrationAdapter {
  submitBatch(payload: PayrollHandoffSubmissionPayload): Promise<PayrollIntegrationResponse>;
}

class SimulatedPayrollIntegrationAdapter implements PayrollIntegrationAdapter {
  async submitBatch(payload: PayrollHandoffSubmissionPayload): Promise<PayrollIntegrationResponse> {
    if (payload.records.length === 0) {
      return {
        accepted: false,
        acknowledgementStatus: "rejected",
        externalReference: null,
        provider: "simulated-payroll-adapter",
        failureCode: "EMPTY_BATCH",
        failureSummary: "The payroll handoff did not contain any prepared attendance records.",
      };
    }

    if (process.env.PAYROLL_INTEGRATION_MODE === "simulated-failure") {
      return {
        accepted: false,
        acknowledgementStatus: "rejected",
        externalReference: null,
        provider: "simulated-payroll-adapter",
        failureCode: "SIMULATED_FAILURE",
        failureSummary: "The development payroll adapter was configured to return a failure.",
      };
    }

    const externalReference = `SIM-${payload.batchId}-${payload.period.start.replaceAll("-", "")}`;
    const partialResult = process.env.PAYROLL_INTEGRATION_MODE === "simulated-partial-result";
    const items = payload.records.map((record, index) => {
      const isRejected = partialResult && index % 5 === 4;
      const isPending = partialResult && index % 5 === 3;
      const processingStatus = isRejected
        ? "rejected" as const
        : isPending
          ? "pending" as const
          : "processed" as const;
      const payslipStatus = processingStatus === "processed"
        ? "available" as const
        : processingStatus === "pending"
          ? "not_yet_available" as const
          : "unavailable" as const;
      const employeeReference = `SIM-EMP-${record.employeeId}`;

      return {
        employeeId: record.employeeId,
        externalEmployeeReference: employeeReference,
        externalPayrollReference: processingStatus === "rejected"
          ? null
          : `${externalReference}-${record.employeeId}`,
        processingStatus,
        payslipStatus,
        payslipId: payslipStatus === "available"
          ? `payslip-${record.employeeId}-${record.payrollPeriod.start}`
          : null,
        issueCode: isRejected ? "EMPLOYEE_REJECTED" : isPending ? "RESULT_PENDING" : null,
        issueSummary: isRejected
          ? "The simulated Payroll System rejected this employee result."
          : isPending
            ? "The simulated Payroll System has not finalized this employee result."
            : null,
      };
    });
    const rejectedCount = items.filter((item) => item.processingStatus === "rejected").length;
    const pendingCount = items.filter((item) => item.processingStatus === "pending").length;

    return {
      accepted: true,
      acknowledgementStatus: "accepted",
      externalReference,
      provider: "simulated-payroll-adapter",
      result: {
        batchId: payload.batchId,
        transferId: payload.transferId,
        externalResultReference: `${externalReference}-RESULT`,
        status: rejectedCount === items.length
          ? "rejected"
          : pendingCount > 0 || rejectedCount > 0
            ? "completed_with_issues"
            : "completed",
        items,
      },
    };
  }
}

const simulatedPayrollIntegrationAdapter = new SimulatedPayrollIntegrationAdapter();

export function getPayrollIntegrationAdapter(): PayrollIntegrationAdapter {
  return simulatedPayrollIntegrationAdapter;
}

export const payrollIntegrationProviderNote =
  "Development mode uses a deterministic simulated payroll adapter; no live university Payroll API is configured.";
