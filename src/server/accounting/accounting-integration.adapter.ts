import "server-only";

import type { AccountingAcknowledgementStatus } from "@/types/accounting-transfers";

export type AccountingSubmissionPayload = {
  transferId: string;
  payrollResultId: string;
  payrollBatchId: string;
  payrollHandoffId: string;
  period: { start: string; end: string; label: string };
  externalPayrollReference: string;
  employeeCount: number;
  payrollResultStatus: string;
};

export type AccountingIntegrationResponse = {
  accepted: boolean;
  acknowledgementStatus: AccountingAcknowledgementStatus;
  externalAccountingReference: string | null;
  provider: string;
  failureCode?: string;
  failureSummary?: string;
};

export interface AccountingIntegrationAdapter {
  submitPayrollResult(payload: AccountingSubmissionPayload): Promise<AccountingIntegrationResponse>;
}

function getMode() {
  const mode = process.env.ACCOUNTING_INTEGRATION_MODE?.trim().toLowerCase();
  return mode === "simulated-failure" || mode === "simulated-pending"
    ? mode
    : "simulated-success";
}

class SimulatedAccountingAdapter implements AccountingIntegrationAdapter {
  async submitPayrollResult(
    payload: AccountingSubmissionPayload,
  ): Promise<AccountingIntegrationResponse> {
    const mode = getMode();

    if (mode === "simulated-failure") {
      return {
        accepted: false,
        acknowledgementStatus: "rejected",
        externalAccountingReference: null,
        provider: "simulated-accounting-adapter",
        failureCode: "SIMULATED_VALIDATION_FAILURE",
        failureSummary: "The simulated Accounting adapter rejected this transfer by configuration.",
      };
    }

    if (mode === "simulated-pending") {
      return {
        accepted: true,
        acknowledgementStatus: "pending",
        externalAccountingReference: `SIM-ACC-${payload.payrollResultId}-${payload.period.start}`,
        provider: "simulated-accounting-adapter",
      };
    }

    return {
      accepted: true,
      acknowledgementStatus: "accepted",
      externalAccountingReference: `SIM-ACC-${payload.payrollResultId}-${payload.period.start}`,
      provider: "simulated-accounting-adapter",
    };
  }
}

export function getAccountingIntegrationMode(): "simulated" {
  return "simulated";
}

export function getAccountingIntegrationAdapter(): AccountingIntegrationAdapter {
  return new SimulatedAccountingAdapter();
}

export const accountingIntegrationProviderNote =
  "Accounting transfers are persisted in Firestore and submitted through the deterministic simulated adapter. No live Accounting API credentials are configured.";
