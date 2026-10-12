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

    return {
      accepted: true,
      acknowledgementStatus: "accepted",
      externalReference: `SIM-${payload.batchId}-${payload.period.start.replaceAll("-", "")}`,
      provider: "simulated-payroll-adapter",
    };
  }
}

const simulatedPayrollIntegrationAdapter = new SimulatedPayrollIntegrationAdapter();

export function getPayrollIntegrationAdapter(): PayrollIntegrationAdapter {
  return simulatedPayrollIntegrationAdapter;
}

export const payrollIntegrationProviderNote =
  "Development mode uses a deterministic simulated payroll adapter; no live university Payroll API is configured.";
