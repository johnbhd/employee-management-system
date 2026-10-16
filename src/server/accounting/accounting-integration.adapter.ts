import "server-only";

import type {
  AccountingAcknowledgementStatus,
  AccountingTransferSnapshot,
} from "@/types/accounting-transfers";

export type AccountingHandoffPayload = {
  transfer: {
    transferReference: string;
    preparedAt: string;
    idempotencyKey: string;
  };
  payroll: {
    batchReference: string;
    payrollResultReference: string;
    externalPayrollReference: string;
    periodStart: string;
    periodEnd: string;
    resultStatus: AccountingTransferSnapshot["payroll"]["resultStatus"];
  };
  summary: AccountingTransferSnapshot["summary"];
  source: AccountingTransferSnapshot["source"];
  items: AccountingTransferSnapshot["items"];
};

export type AccountingSubmissionResponse = {
  outcome: "submitted" | "rejected";
  acknowledgementStatus: AccountingAcknowledgementStatus;
  externalAccountingReference: string | null;
  provider: string;
  failureCode?: string;
  failureSummary?: string;
};

export type AccountingAcknowledgementRequest = {
  transferReference: string;
  externalAccountingReference: string | null;
  idempotencyKey: string;
};

export type AccountingAcknowledgementResponse = {
  acknowledgementStatus: AccountingAcknowledgementStatus;
  externalAccountingReference: string | null;
  provider: string;
  failureCode?: string;
  failureSummary?: string;
};

export class AccountingAdapterTechnicalError extends Error {
  readonly code = "ACCOUNTING_ADAPTER_UNAVAILABLE";

  constructor(message = "The Accounting adapter did not return a response.") {
    super(message);
    this.name = "AccountingAdapterTechnicalError";
  }
}

export interface AccountingIntegrationAdapter {
  submitTransfer(
    payload: AccountingHandoffPayload,
  ): Promise<AccountingSubmissionResponse>;
  checkAcknowledgement(
    request: AccountingAcknowledgementRequest,
  ): Promise<AccountingAcknowledgementResponse>;
}

type SimulationMode =
  | "simulated-success"
  | "simulated-pending"
  | "simulated-failure"
  | "simulated-rejection"
  | "simulated-not-received";

const provider = "simulated-accounting-adapter";

function getSimulationMode(): SimulationMode {
  const mode = process.env.ACCOUNTING_INTEGRATION_MODE?.trim().toLowerCase();

  if (
    mode === "simulated-pending"
    || mode === "simulated-failure"
    || mode === "simulated-rejection"
    || mode === "simulated-not-received"
  ) {
    return mode;
  }

  return "simulated-success";
}

function getAcknowledgementMode(): SimulationMode {
  const mode = process.env.ACCOUNTING_ACKNOWLEDGEMENT_MODE?.trim().toLowerCase();

  if (
    mode === "simulated-pending"
    || mode === "simulated-rejection"
    || mode === "simulated-not-received"
  ) {
    return mode;
  }

  return getSimulationMode();
}

function simulatedReference(transferReference: string) {
  return `SIM-ACC-${transferReference}`;
}

class SimulatedAccountingAdapter implements AccountingIntegrationAdapter {
  async submitTransfer(
    payload: AccountingHandoffPayload,
  ): Promise<AccountingSubmissionResponse> {
    const mode = getSimulationMode();
    const externalAccountingReference = simulatedReference(
      payload.transfer.transferReference,
    );

    if (mode === "simulated-failure") {
      throw new AccountingAdapterTechnicalError(
        "The simulated Accounting adapter is unavailable by configuration.",
      );
    }

    if (mode === "simulated-rejection") {
      return {
        outcome: "rejected",
        acknowledgementStatus: "rejected",
        externalAccountingReference,
        provider,
        failureCode: "SIMULATED_BUSINESS_REJECTION",
        failureSummary: "The simulated Accounting System received but rejected this transfer.",
      };
    }

    return {
      outcome: "submitted",
      acknowledgementStatus: "pending",
      externalAccountingReference,
      provider,
    };
  }

  async checkAcknowledgement(
    request: AccountingAcknowledgementRequest,
  ): Promise<AccountingAcknowledgementResponse> {
    const mode = getAcknowledgementMode();

    if (mode === "simulated-failure") {
      throw new AccountingAdapterTechnicalError(
        "The simulated Accounting acknowledgement endpoint is unavailable by configuration.",
      );
    }

    const acknowledgementStatus = mode === "simulated-rejection"
      ? "rejected"
      : mode === "simulated-not-received"
        ? "not_received"
        : mode === "simulated-pending"
          ? "pending"
          : "accepted";

    return {
      acknowledgementStatus,
      externalAccountingReference:
        request.externalAccountingReference ?? simulatedReference(request.transferReference),
      provider,
      ...(acknowledgementStatus === "rejected"
        ? {
          failureCode: "SIMULATED_BUSINESS_REJECTION",
          failureSummary: "The simulated Accounting System rejected this transfer acknowledgement.",
        }
        : acknowledgementStatus === "not_received"
          ? {
            failureCode: "SIMULATED_NOT_RECEIVED",
            failureSummary: "The simulated Accounting System has not acknowledged this transfer.",
          }
          : {}),
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
  "Accounting handoff uses the deterministic simulated adapter. The outgoing payload is the immutable ACCOUNTING-017A snapshot; no live Accounting API is configured.";
