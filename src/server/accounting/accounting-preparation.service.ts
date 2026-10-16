import "server-only";

import { recordPrismaAuditEvent } from "@/server/repositories/audit/prisma-audit.repository";
import {
  prepareAccountingTransfer as prepareAccountingTransferRepository,
} from "@/server/repositories/accounting-transfers/accounting-transfer.repository";
import {
  getPayrollResultById,
  PayrollResultDataError,
} from "@/server/repositories/payroll-results/payroll-result.repository";
import { getPayrollHandoffByTransferId } from "@/server/repositories/payroll-handoffs/payroll-handoff.repository";
import { getAccountingReadiness } from "@/server/accounting/accounting-readiness.service";
import { getAccountingTransferByPayrollResultId } from "@/server/repositories/accounting-transfers/accounting-transfer.repository";
import type { SessionUser } from "@/types/auth";
import type { PayrollResultRecord } from "@/types/payroll-results";
import type { AccountingTransferRecord } from "@/types/accounting-transfers";

export type AccountingEligibilityReasonCode =
  | "PAYROLL_RESULT_MISSING"
  | "PAYROLL_NOT_COMPLETED"
  | "PAYROLL_HANDOFF_MISSING"
  | "PAYROLL_HANDOFF_NOT_ACKNOWLEDGED"
  | "MISSING_EXTERNAL_PAYROLL_REFERENCE"
  | "PAYROLL_RESULT_HAS_UNRESOLVED_ITEMS"
  | "ACCOUNTING_TRANSFER_ALREADY_EXISTS";

export type AccountingEligibilityReason = {
  code: AccountingEligibilityReasonCode;
  message: string;
  owner: "Payroll" | "Accounting";
};

export type AccountingEligibilityResult = {
  eligible: boolean;
  payrollResultId: string;
  payrollResult: PayrollResultRecord | null;
  existingTransferId: string | null;
  reasons: AccountingEligibilityReason[];
};

type AccountingActor = Pick<SessionUser, "uid" | "displayName" | "role"> & {
  username?: string;
};

export class AccountingEligibilityBlockedError extends Error {
  readonly code = "ACCOUNTING_ELIGIBILITY_BLOCKED";
  readonly eligibility: AccountingEligibilityResult;

  constructor(eligibility: AccountingEligibilityResult) {
    super("The Payroll Result is blocked from Accounting preparation.");
    this.name = "AccountingEligibilityBlockedError";
    this.eligibility = eligibility;
  }
}

function sourceReference(result: PayrollResultRecord | null) {
  return result?.resultId ?? "unknown";
}

async function writeEligibilityAudit(
  eligibility: AccountingEligibilityResult,
  actor: AccountingActor,
) {
  await recordPrismaAuditEvent({
    eventType: "accounting.eligibility.evaluated",
    action: "Accounting Eligibility Evaluated",
    module: "Accounting Integration",
    actor: {
      type: "user",
      uid: actor.uid,
      displayName: actor.displayName,
      role: actor.role,
    },
    target: {
      type: "payroll_result",
      id: null,
      reference: eligibility.payrollResultId,
      label: eligibility.payrollResultId,
    },
    outcome: eligibility.eligible ? "Successful" : "Blocked",
    summary: eligibility.eligible
      ? "Payroll Result is eligible for local Accounting preparation."
      : "Payroll Result is blocked from local Accounting preparation.",
    metadata: {
      payrollResultId: eligibility.payrollResultId,
      eligible: eligibility.eligible,
      existingTransferId: eligibility.existingTransferId,
      reasonCodes: eligibility.reasons.map((reason) => reason.code),
    },
  });
}

async function writePreparationBlockedAudit(
  eligibility: AccountingEligibilityResult,
  actor: AccountingActor,
) {
  await recordPrismaAuditEvent({
    eventType: "accounting.transfer.preparation_blocked",
    action: "Accounting Transfer Preparation Blocked",
    module: "Accounting Integration",
    actor: {
      type: "user",
      uid: actor.uid,
      displayName: actor.displayName,
      role: actor.role,
    },
    target: {
      type: "payroll_result",
      id: null,
      reference: eligibility.payrollResultId,
      label: eligibility.payrollResultId,
    },
    outcome: "Blocked",
    summary: "Accounting transfer preparation was blocked by server-side eligibility checks.",
    metadata: {
      payrollResultId: eligibility.payrollResultId,
      existingTransferId: eligibility.existingTransferId,
      reasonCodes: eligibility.reasons.map((reason) => reason.code),
    },
  });
}

function addReason(
  reasons: AccountingEligibilityReason[],
  reason: AccountingEligibilityReason,
) {
  if (!reasons.some((item) => item.code === reason.code)) {
    reasons.push(reason);
  }
}

export async function evaluateAccountingEligibility(input: {
  payrollResultId: string;
  actor?: AccountingActor;
}): Promise<AccountingEligibilityResult> {
  let result: PayrollResultRecord | null = null;
  try {
    result = await getPayrollResultById(input.payrollResultId);
  } catch (error) {
    if (error instanceof PayrollResultDataError) {
      throw error;
    }
    throw error;
  }

  const reasons: AccountingEligibilityReason[] = [];
  let existingTransfer: AccountingTransferRecord | null = null;
  let handoff = null;

  if (!result) {
    addReason(reasons, {
      code: "PAYROLL_RESULT_MISSING",
      message: "The Payroll Result could not be found.",
      owner: "Payroll",
    });
  } else {
    existingTransfer = await getAccountingTransferByPayrollResultId(result.resultId);
    handoff = await getPayrollHandoffByTransferId(result.transferId);
    const readiness = getAccountingReadiness(result);

    if (!result.externalPayrollReference) {
      addReason(reasons, {
        code: "MISSING_EXTERNAL_PAYROLL_REFERENCE",
        message: "The Payroll Result has no external Payroll reference.",
        owner: "Payroll",
      });
    }

    if (result.status !== "completed") {
      addReason(reasons, {
        code: "PAYROLL_NOT_COMPLETED",
        message: readiness.reasons[0] ?? "The Payroll Result is not completed.",
        owner: "Payroll",
      });
    }

    if (result.status === "completed_with_issues" || result.status === "partially_completed") {
      addReason(reasons, {
        code: "PAYROLL_RESULT_HAS_UNRESOLVED_ITEMS",
        message: readiness.reasons[0] ?? "The Payroll Result contains unresolved employee results.",
        owner: "Payroll",
      });
    }

    if (!handoff) {
      addReason(reasons, {
        code: "PAYROLL_HANDOFF_MISSING",
        message: "The Payroll handoff record is missing.",
        owner: "Payroll",
      });
    } else if (handoff.acknowledgementStatus !== "accepted") {
      addReason(reasons, {
        code: "PAYROLL_HANDOFF_NOT_ACKNOWLEDGED",
        message: "The Payroll handoff has not reached the accepted acknowledgement state.",
        owner: "Payroll",
      });
    }

    if (existingTransfer) {
      addReason(reasons, {
        code: "ACCOUNTING_TRANSFER_ALREADY_EXISTS",
        message: `An Accounting transfer already exists for this Payroll Result: ${existingTransfer.transferId}.`,
        owner: "Accounting",
      });
    }
  }

  const eligibility: AccountingEligibilityResult = {
    eligible: reasons.length === 0,
    payrollResultId: input.payrollResultId,
    payrollResult: result,
    existingTransferId: existingTransfer?.transferId ?? null,
    reasons,
  };

  if (input.actor) {
    await writeEligibilityAudit(eligibility, input.actor);
  }

  return eligibility;
}

export async function prepareAccountingTransfer(input: {
  payrollResultId: string;
  actor: AccountingActor;
}) {
  const eligibility = await evaluateAccountingEligibility(input);
  if (!eligibility.eligible) {
    await writePreparationBlockedAudit(eligibility, input.actor);
    throw new AccountingEligibilityBlockedError(eligibility);
  }

  return prepareAccountingTransferRepository({
    payrollResultId: input.payrollResultId,
    actor: {
      ...input.actor,
      username: input.actor.username ?? input.actor.uid,
    },
  });
}

export function getAccountingEligibilitySummary(
  eligibility: AccountingEligibilityResult,
) {
  return {
    eligible: eligibility.eligible,
    payrollResultId: eligibility.payrollResultId,
    existingTransferId: eligibility.existingTransferId,
    reasons: eligibility.reasons,
    source: sourceReference(eligibility.payrollResult),
  };
}
