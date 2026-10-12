import "server-only";

import {
  getPayrollBatchById,
  listPayrollBatches,
  markPayrollBatchSubmittedFromHandoff,
} from "@/server/repositories/payroll-batches/payroll-batch.repository";
import {
  claimPayrollHandoff,
  getPayrollHandoffByTransferId,
  listPayrollHandoffs,
  PayrollHandoffConflictError,
  PayrollHandoffDataError,
  PayrollHandoffNotFoundError,
  updatePayrollHandoffResult,
  type PayrollStoredHandoff,
} from "@/server/repositories/payroll-handoffs/payroll-handoff.repository";
import type { SessionUser } from "@/types/auth";
import type { PayrollBatchRecord } from "@/types/payroll-batches";
import type {
  PayrollHandoffData,
  PayrollHandoffQuery,
  PayrollHandoffRecord,
  PayrollHandoffSummary,
} from "@/types/payroll-handoff";

import {
  getPayrollIntegrationAdapter,
  payrollIntegrationProviderNote,
} from "./integration/payroll-integration-adapter";
import {
  ingestPayrollResult,
  PayrollResultConflictError,
  PayrollResultDataError,
  PayrollResultValidationError,
} from "./payroll-result.service";
import { getCurrentPayrollPeriod } from "./payroll-dashboard.service";
import { recordAuditEvent } from "@/server/repositories/audit/audit.repository";

export class PayrollHandoffValidationError extends Error {
  readonly code = "PAYROLL_HANDOFF_VALIDATION_ERROR";

  constructor(message: string) {
    super(message);
    this.name = "PayrollHandoffValidationError";
  }
}

export class PayrollHandoffIntegrationError extends Error {
  readonly code = "PAYROLL_HANDOFF_INTEGRATION_FAILED";

  constructor(message = "Payroll handoff could not be completed. Technical follow-up is required.") {
    super(message);
    this.name = "PayrollHandoffIntegrationError";
  }
}

export function getDefaultPayrollHandoffQuery(): PayrollHandoffQuery {
  return {
    search: "",
    periodStart: null,
    transferStatus: null,
    fromDate: null,
    toDate: null,
    page: 1,
    pageSize: 5,
  };
}

function toPublicHandoff(
  handoff: PayrollStoredHandoff,
  currentBatch: PayrollBatchRecord | undefined,
): PayrollHandoffRecord {
  return {
    transferId: handoff.transferId,
    batchId: handoff.batchId,
    period: handoff.period,
    submittedBy: handoff.submittedBy,
    submittedAt: handoff.submittedAt,
    readyAt: handoff.readyAt,
    acknowledgedAt: handoff.acknowledgedAt,
    failedAt: handoff.failedAt,
    transferStatus: handoff.transferStatus,
    acknowledgementStatus: handoff.acknowledgementStatus,
    externalReference: handoff.externalReference,
    provider: handoff.provider,
    failureCode: handoff.failureCode,
    failureSummary: handoff.failureSummary,
    attemptCount: handoff.attemptCount,
    createdAt: handoff.createdAt,
    updatedAt: handoff.updatedAt,
    batchSummary: {
      ...handoff.batchSummary,
      batchStatus: currentBatch?.status ?? handoff.batchSummary.batchStatus,
    },
    timeline: handoff.timeline,
  };
}

function isEligibleReadyBatch(
  batch: PayrollBatchRecord,
  handoff: PayrollStoredHandoff | undefined,
) {
  return batch.status === "Ready"
    && batch.recordCount > 0
    && batch.recordCount === batch.includedRecords.length
    && batch.blockedCount === 0
    && batch.includedRecords.every((record) => (
      record.hrVerificationStatus === "verified"
      && record.payrollReadiness === "ready"
      && record.payrollPeriod.start === batch.period.start
      && record.payrollPeriod.end === batch.period.end
      && record.sourceAttendanceIds.length > 0
    ))
    && !handoff;
}

function toReadyBatch(batch: PayrollBatchRecord) {
  return {
    id: batch.id,
    period: batch.period,
    employees: batch.recordCount,
    includedRecords: batch.recordCount,
    departments: batch.departmentNames.length,
    createdBy: batch.createdBy.displayName,
    createdAt: batch.createdAt,
    blockedRecords: batch.blockedCount,
  };
}

function getPeriodOptions(
  batches: readonly PayrollBatchRecord[],
  handoffs: readonly PayrollStoredHandoff[],
) {
  const periods = new Map<string, PayrollBatchRecord["period"]>();
  for (const batch of batches) periods.set(batch.period.start, batch.period);
  for (const handoff of handoffs) periods.set(handoff.period.start, handoff.period);
  return Array.from(periods.values()).sort((left, right) => right.start.localeCompare(left.start));
}

function getSummary(
  batches: readonly PayrollBatchRecord[],
  handoffs: readonly PayrollStoredHandoff[],
): PayrollHandoffSummary {
  const handoffsByBatch = new Map(handoffs.map((handoff) => [handoff.batchId, handoff]));
  return {
    readyForHandoff: batches.filter((batch) => isEligibleReadyBatch(batch, handoffsByBatch.get(batch.id))).length,
    inProgress: handoffs.filter((handoff) => handoff.transferStatus === "preparing" || handoff.transferStatus === "submitting").length,
    acknowledged: handoffs.filter((handoff) => handoff.acknowledgementStatus === "accepted").length,
    failed: handoffs.filter((handoff) => handoff.transferStatus === "failed").length,
    awaitingAcknowledgement: handoffs.filter((handoff) => handoff.transferStatus === "submitted" && handoff.acknowledgementStatus === "pending").length,
  };
}

function matchesQuery(handoff: PayrollStoredHandoff, query: PayrollHandoffQuery) {
  const search = query.search.trim().toLowerCase();
  const submittedDate = handoff.submittedAt.slice(0, 10);
  return (!search || handoff.transferId.toLowerCase().includes(search) || handoff.batchId.toLowerCase().includes(search))
    && (!query.periodStart || handoff.period.start === query.periodStart)
    && (!query.transferStatus || handoff.transferStatus === query.transferStatus)
    && (!query.fromDate || submittedDate >= query.fromDate)
    && (!query.toDate || submittedDate <= query.toDate);
}

export async function getPayrollHandoffData(
  query: PayrollHandoffQuery = getDefaultPayrollHandoffQuery(),
): Promise<PayrollHandoffData> {
  if (query.page < 1 || query.pageSize < 1 || query.pageSize > 50) {
    throw new PayrollHandoffValidationError("The handoff pagination values are invalid.");
  }
  if (query.fromDate && query.toDate && query.fromDate > query.toDate) {
    throw new PayrollHandoffValidationError("The start date must be on or before the end date.");
  }

  const [batches, handoffs] = await Promise.all([listPayrollBatches(), listPayrollHandoffs()]);
  const handoffsByBatch = new Map(handoffs.map((handoff) => [handoff.batchId, handoff]));
  const batchesById = new Map(batches.map((batch) => [batch.id, batch]));
  const readyBatches = batches
    .filter((batch) => isEligibleReadyBatch(batch, handoffsByBatch.get(batch.id)))
    .map(toReadyBatch);
  const filtered = handoffs
    .filter((handoff) => matchesQuery(handoff, query));
  const totalPages = Math.max(1, Math.ceil(filtered.length / query.pageSize));
  const page = Math.min(query.page, totalPages);
  const start = (page - 1) * query.pageSize;
  const history = filtered
    .slice(start, start + query.pageSize)
    .map((handoff) => toPublicHandoff(handoff, batchesById.get(handoff.batchId)));

  return {
    period: getCurrentPayrollPeriod(),
    readyBatches,
    history,
    total: filtered.length,
    page,
    pageSize: query.pageSize,
    hasNext: page < totalPages,
    periodOptions: getPeriodOptions(batches, handoffs),
    summary: getSummary(batches, handoffs),
    providerNote: payrollIntegrationProviderNote,
  };
}

async function getValidatedReadyBatch(batchId: string, handoffs: readonly PayrollStoredHandoff[]) {
  const batch = await getPayrollBatchById(batchId);
  if (!batch) throw new PayrollHandoffValidationError("The payroll batch could not be found.");

  const existing = handoffs.find((handoff) => handoff.batchId === batch.id);
  if (!isEligibleReadyBatch(batch, existing)) {
    if (batch.status !== "Ready") throw new PayrollHandoffValidationError("Only Ready batches can be submitted for payroll handoff.");
    if (batch.blockedCount > 0) throw new PayrollHandoffValidationError("This batch contains blocked attendance records.");
    if (batch.recordCount < 1 || batch.recordCount !== batch.includedRecords.length) throw new PayrollHandoffValidationError("This batch does not contain a complete attendance snapshot.");
    if (existing?.transferStatus === "submitted") throw new PayrollHandoffConflictError("This batch already has a successful payroll handoff.");
    if (existing) throw new PayrollHandoffConflictError("A previous payroll handoff failed. Technical follow-up is required before another attempt.");
    throw new PayrollHandoffValidationError("This batch is not eligible for payroll handoff.");
  }

  return batch;
}

export async function submitPayrollHandoff(input: {
  batchId: string;
  actor: SessionUser;
}) {
  const handoffs = await listPayrollHandoffs();
  const batch = await getValidatedReadyBatch(input.batchId, handoffs);
  const handoff = await claimPayrollHandoff({
    batchId: batch.id,
    period: batch.period,
    readyAt: batch.updatedAt,
    actor: input.actor,
    batchSnapshot: batch.includedRecords,
    batchSummary: {
      employeeCount: batch.recordCount,
      includedRecordCount: batch.includedRecords.length,
      blockedRecordCount: batch.blockedCount,
      departmentCount: batch.departmentNames.length,
      batchStatus: batch.status,
    },
  });
  const adapter = getPayrollIntegrationAdapter();
  let result;

  try {
    result = await adapter.submitBatch({
      batchId: batch.id,
      transferId: handoff.transferId,
      period: batch.period,
      records: handoff.batchSnapshot,
    });
  } catch {
    const failed = await updatePayrollHandoffResult({
      batchId: batch.id,
      transferStatus: "failed",
      acknowledgementStatus: "not_received",
      provider: "simulated-payroll-adapter",
      failureCode: "ADAPTER_UNAVAILABLE",
      failureSummary: "Payroll handoff could not be completed. Technical follow-up is required.",
    });
    await recordAuditEvent({
      id: `${failed.transferId}:failed`,
      eventType: "payroll.handoff.failed",
      action: "Payroll Handoff Failed",
      module: "Payroll Integration",
      actor: { type: "user", uid: input.actor.uid, displayName: input.actor.displayName, role: input.actor.role },
      target: { type: "payroll_handoff", id: failed.transferId, reference: failed.transferId, label: failed.batchId },
      outcome: "Failed",
      summary: "The Payroll handoff failed and requires technical follow-up.",
      metadata: { batchId: failed.batchId, transferId: failed.transferId, failureCode: failed.failureCode },
      occurredAt: new Date(failed.failedAt ?? failed.updatedAt),
    });
    throw new PayrollHandoffIntegrationError();
  }

  const persisted = await updatePayrollHandoffResult({
    batchId: batch.id,
    transferStatus: result.accepted ? "submitted" : "failed",
    acknowledgementStatus: result.accepted
      ? result.acknowledgementStatus
      : "not_received",
    provider: result.provider,
    externalReference: result.externalReference,
    failureCode: result.failureCode ?? null,
    failureSummary: result.failureSummary ?? null,
  });

  await recordAuditEvent({
    id: `${persisted.transferId}:submitted`,
    eventType: "payroll.handoff.submitted",
    action: "Payroll Handoff Submitted",
    module: "Payroll Integration",
    actor: { type: "user", uid: input.actor.uid, displayName: input.actor.displayName, role: input.actor.role },
    target: { type: "payroll_handoff", id: persisted.transferId, reference: persisted.externalReference ?? persisted.transferId, label: persisted.batchId },
    outcome: result.accepted ? "Successful" : "Failed",
    summary: result.accepted ? "A Payroll batch was submitted to the configured integration adapter." : "A Payroll handoff was rejected by the configured integration adapter.",
    metadata: { batchId: persisted.batchId, transferId: persisted.transferId, failureCode: persisted.failureCode },
    occurredAt: new Date(persisted.updatedAt),
  });

  if (result.accepted && persisted.acknowledgementStatus === "accepted") {
    await recordAuditEvent({
      id: `${persisted.transferId}:acknowledged`,
      eventType: "payroll.handoff.acknowledged",
      action: "Payroll Handoff Acknowledged",
      module: "Payroll Integration",
      actor: { type: "integration", uid: `integration:${persisted.provider}`, displayName: "Payroll Integration", role: "system" },
      target: { type: "payroll_handoff", id: persisted.transferId, reference: persisted.externalReference ?? persisted.transferId, label: persisted.batchId },
      outcome: "Successful",
      summary: "The Payroll integration acknowledged the handoff.",
      metadata: { batchId: persisted.batchId, transferId: persisted.transferId },
      occurredAt: new Date(persisted.acknowledgedAt ?? persisted.updatedAt),
    });
  }

  if (!result.accepted) {
    throw new PayrollHandoffIntegrationError(result.failureSummary ?? undefined);
  }

  if (result.result) {
    await ingestPayrollResult({
      batchSnapshot: handoff.batchSnapshot,
      handoff: {
        resultId: `RES-${batch.id}`,
        batchId: batch.id,
        transferId: handoff.transferId,
        period: batch.period,
        provider: result.provider,
        externalReference: result.externalReference ?? "",
      },
      result: result.result,
    });
  }

  await markPayrollBatchSubmittedFromHandoff({
    batchId: batch.id,
    actor: input.actor,
  });

  return persisted;
}

export async function getPayrollHandoffDetail(transferId: string) {
  const handoff = await getPayrollHandoffByTransferId(transferId);
  if (!handoff) return null;
  const batch = await getPayrollBatchById(handoff.batchId);
  return toPublicHandoff(handoff, batch ?? undefined);
}

export {
  PayrollHandoffConflictError,
  PayrollHandoffDataError,
  PayrollHandoffNotFoundError,
  PayrollResultConflictError,
  PayrollResultDataError,
  PayrollResultValidationError,
};
