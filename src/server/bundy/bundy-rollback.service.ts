import "server-only";

import type { BundyImportStatus, Prisma } from "@prisma/client";

import { recordAuditEvent } from "@/server/repositories/audit/audit.repository";
import { getRepositoryPrisma, findUserIdByFirebaseUid, toActorSnapshot, toJson } from "@/server/repositories/prisma/prisma-repository-helpers";
import type { SessionUser } from "@/types/auth";
import type {
  BundyRollbackPreview,
  BundyRollbackResult,
  BundyRollbackSummary,
} from "@/types/bundy-import";

export class BundyRollbackError extends Error {
  readonly code: string;
  readonly status: 400 | 404 | 409 | 503;

  constructor(code: string, message: string, status: 400 | 404 | 409 | 503 = 409) {
    super(message);
    this.name = "BundyRollbackError";
    this.code = code;
    this.status = status;
  }
}

type BundyRollbackRecord = {
  id: string;
  filename: string;
  status: BundyImportStatus;
  rollbackSummary: Prisma.JsonValue | null;
  rollbackErrorSummary: string | null;
};

type OwnedEventCounts = {
  rawEventsOwned: number;
  matchedEvents: number;
  unmatchedEvents: number;
  inactiveEvents: number;
  duplicateScans: number;
  devices: string[];
  sourceBatches: string[];
};

const rollbackStatuses: BundyImportStatus[] = ["COMPLETED", "COMPLETED_WITH_ERRORS", "ROLLBACK_FAILED"];

function objectValue(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function numberValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function storedSummary(value: Prisma.JsonValue | null): BundyRollbackSummary {
  const summary = objectValue(value);
  return {
    rawEventsDeleted: numberValue(summary.rawEventsDeleted),
    matchedDeleted: numberValue(summary.matchedDeleted),
    unmatchedDeleted: numberValue(summary.unmatchedDeleted),
    inactiveDeleted: numberValue(summary.inactiveDeleted),
    duplicateScansDeleted: numberValue(summary.duplicateScansDeleted),
    remainingEvents: numberValue(summary.remainingEvents),
  };
}

async function findBundyRollbackRecord(importId: string): Promise<BundyRollbackRecord> {
  const record = await getRepositoryPrisma().bundyImport.findUnique({
    where: { id: importId },
    select: {
      id: true,
      filename: true,
      status: true,
      rollbackSummary: true,
      rollbackErrorSummary: true,
    },
  });
  if (!record) throw new BundyRollbackError("BUNDY_IMPORT_NOT_FOUND", "The Bundy import record was not found.", 404);
  return record;
}

async function countOwnedEvents(importId: string): Promise<OwnedEventCounts> {
  const prisma = getRepositoryPrisma();
  const where = { importId };
  const [rawEventsOwned, matchedEvents, unmatchedEvents, inactiveEvents, duplicateScans, deviceRows, sourceBatchRows] = await Promise.all([
    prisma.bundyRawEvent.count({ where }),
    prisma.bundyRawEvent.count({ where: { ...where, matchStatus: "MATCHED" } }),
    prisma.bundyRawEvent.count({ where: { ...where, matchStatus: "UNMATCHED" } }),
    prisma.bundyRawEvent.count({ where: { ...where, matchStatus: "EMPLOYEE_INACTIVE" } }),
    prisma.bundyRawEvent.count({ where: { ...where, duplicateStatus: "DUPLICATE_SCAN" } }),
    prisma.bundyRawEvent.findMany({ where, distinct: ["deviceId"], select: { deviceId: true }, orderBy: { deviceId: "asc" } }),
    prisma.bundyRawEvent.findMany({ where: { ...where, sourceBatch: { not: null } }, distinct: ["sourceBatch"], select: { sourceBatch: true }, orderBy: { sourceBatch: "asc" } }),
  ]);
  return {
    rawEventsOwned,
    matchedEvents,
    unmatchedEvents,
    inactiveEvents,
    duplicateScans,
    devices: deviceRows.map((row) => row.deviceId),
    sourceBatches: sourceBatchRows.map((row) => row.sourceBatch).filter((value): value is string => Boolean(value)),
  };
}

export type BundyRollbackDependencyReport = {
  rawEventsOwned: number;
  downstreamDependencies: number;
  blockingReasons: string[];
};

/**
 * Unified Attendance does not yet persist a relation to BundyRawEvent. Keep
 * this check explicit so the future relation can be enforced here without
 * guessing ownership from employee, device, or timestamp fields.
 */
export async function inspectBundyRollbackDependencies(importId: string): Promise<BundyRollbackDependencyReport> {
  const rawEventsOwned = await getRepositoryPrisma().bundyRawEvent.count({ where: { importId } });
  return { rawEventsOwned, downstreamDependencies: 0, blockingReasons: [] };
}

function statusBlockingReason(status: BundyImportStatus): string | null {
  if (status === "PROCESSING") return "This import is still processing and cannot be undone yet.";
  if (status === "FAILED") return "Failed imports cannot be undone because no complete ownership result is available.";
  if (status === "ROLLING_BACK") return "This import is already being rolled back or needs recovery review.";
  return null;
}

async function buildRollbackPlan(importId: string, allowRollingBack = false): Promise<BundyRollbackPreview & { record: BundyRollbackRecord }> {
  const record = await findBundyRollbackRecord(importId);
  const counts = await countOwnedEvents(importId);
  const dependencies = await inspectBundyRollbackDependencies(importId);
  const warnings: string[] = [];
  const blockingReasons = [...dependencies.blockingReasons];

  if (record.status === "ROLLED_BACK") {
    warnings.push("This import has already been rolled back. No additional raw events will be removed.");
  } else {
    const stateReason = statusBlockingReason(record.status);
    if (stateReason && !(allowRollingBack && record.status === "ROLLING_BACK")) blockingReasons.push(stateReason);
    if (!stateReason && !rollbackStatuses.includes(record.status)) {
      blockingReasons.push(`Imports with status ${record.status} cannot be rolled back.`);
    }
    if (record.rollbackErrorSummary) warnings.push(`Previous rollback attempt: ${record.rollbackErrorSummary}`);
    if (!counts.rawEventsOwned) warnings.push("No raw Bundy events are currently owned by this import.");
  }

  return {
    record,
    importId: record.id,
    filename: record.filename,
    status: record.status,
    canRollback: record.status !== "ROLLED_BACK" && blockingReasons.length === 0,
    alreadyRolledBack: record.status === "ROLLED_BACK",
    rawEventsOwned: counts.rawEventsOwned,
    matchedEvents: counts.matchedEvents,
    unmatchedEvents: counts.unmatchedEvents,
    inactiveEvents: counts.inactiveEvents,
    duplicateScans: counts.duplicateScans,
    devices: counts.devices,
    sourceBatches: counts.sourceBatches,
    downstreamDependencies: dependencies.downstreamDependencies,
    blockingReasons,
    warnings,
  };
}

export async function getBundyRollbackPreview(importId: string): Promise<BundyRollbackPreview> {
  const plan = await buildRollbackPlan(importId);
  return {
    importId: plan.importId,
    filename: plan.filename,
    status: plan.status,
    canRollback: plan.canRollback,
    alreadyRolledBack: plan.alreadyRolledBack,
    rawEventsOwned: plan.rawEventsOwned,
    matchedEvents: plan.matchedEvents,
    unmatchedEvents: plan.unmatchedEvents,
    inactiveEvents: plan.inactiveEvents,
    duplicateScans: plan.duplicateScans,
    devices: plan.devices,
    sourceBatches: plan.sourceBatches,
    downstreamDependencies: plan.downstreamDependencies,
    blockingReasons: plan.blockingReasons,
    warnings: plan.warnings,
  };
}

function rollbackErrorMessage(error: unknown): string {
  if (error instanceof BundyRollbackError) return error.message;
  if (error && typeof error === "object" && "code" in error && typeof error.code === "string") {
    return `Rollback operation failed (${error.code}).`;
  }
  return "The Bundy rollback could not be completed safely.";
}

async function recordRollbackAttempt(input: {
  importId: string;
  actor: SessionUser;
  outcome: "Blocked" | "Failed";
  summary: string;
}) {
  try {
    await recordAuditEvent({
      eventType: input.outcome === "Blocked" ? "bundy.import.rollback_blocked" : "bundy.import.rollback_failed",
      action: input.outcome === "Blocked" ? "Bundy Import Rollback Blocked" : "Bundy Import Rollback Failed",
      module: "Bundy Integration",
      actor: { type: "user", uid: input.actor.uid, displayName: input.actor.displayName, role: input.actor.role },
      target: { type: "bundy_import", id: input.importId, reference: input.importId, label: input.importId },
      outcome: input.outcome,
      summary: input.summary,
      metadata: { importId: input.importId },
    });
  } catch {
    // Audit failure must not replace the safe rollback response.
  }
}

async function markRollbackFailed(input: {
  importId: string;
  actor: SessionUser;
  message: string;
  outcome: "Blocked" | "Failed";
}) {
  await getRepositoryPrisma().bundyImport.updateMany({
    where: { id: input.importId, status: "ROLLING_BACK" },
    data: { status: "ROLLBACK_FAILED", rollbackErrorSummary: input.message },
  }).catch(() => undefined);
  await recordRollbackAttempt({ importId: input.importId, actor: input.actor, outcome: input.outcome, summary: input.message });
}

function rollbackSummaryFromRecord(record: BundyRollbackRecord): BundyRollbackSummary {
  return storedSummary(record.rollbackSummary);
}

export async function rollbackBundyImport(input: {
  importId: string;
  actor: SessionUser;
}): Promise<BundyRollbackResult> {
  const prisma = getRepositoryPrisma();
  const actorUserId = await findUserIdByFirebaseUid(input.actor.uid);
  const initialPlan = await buildRollbackPlan(input.importId);
  if (initialPlan.alreadyRolledBack) {
    return { importId: input.importId, status: "ROLLED_BACK", summary: rollbackSummaryFromRecord(initialPlan.record) };
  }
  if (!initialPlan.canRollback) {
    const message = initialPlan.blockingReasons[0] ?? "Rollback is blocked by a server-side safety check.";
    await recordRollbackAttempt({ importId: input.importId, actor: input.actor, outcome: "Blocked", summary: message });
    throw new BundyRollbackError("BUNDY_ROLLBACK_BLOCKED", message);
  }

  const claim = await prisma.bundyImport.updateMany({
    where: { id: input.importId, status: { in: rollbackStatuses } },
    data: { status: "ROLLING_BACK", rollbackStartedAt: new Date(), rollbackErrorSummary: null },
  });
  if (claim.count !== 1) {
    const current = await prisma.bundyImport.findUnique({ where: { id: input.importId }, select: { status: true, rollbackSummary: true } });
    if (current?.status === "ROLLED_BACK") {
      return { importId: input.importId, status: "ROLLED_BACK", summary: storedSummary(current.rollbackSummary) };
    }
    throw new BundyRollbackError("BUNDY_ROLLBACK_CONCURRENT", "Another rollback is already processing this import.");
  }

  try {
    const plan = await buildRollbackPlan(input.importId, true);
    if (plan.downstreamDependencies > 0 || plan.blockingReasons.length > 0) {
      throw new BundyRollbackError("BUNDY_ROLLBACK_BLOCKED", plan.blockingReasons[0] ?? "Rollback is blocked by a downstream dependency.");
    }
    if (plan.rawEventsOwned !== initialPlan.rawEventsOwned) {
      throw new BundyRollbackError("BUNDY_ROLLBACK_STALE", "The owned Bundy event count changed after the safety preview. Review the import again before retrying.");
    }

    const summary = await prisma.$transaction(async (transaction) => {
      const current = await transaction.bundyImport.findUnique({ where: { id: input.importId }, select: { status: true } });
      if (current?.status !== "ROLLING_BACK") {
        throw new BundyRollbackError("BUNDY_ROLLBACK_CONCURRENT", "The Bundy import changed before rollback could be committed.");
      }

      const ownedWhere = { importId: input.importId };
      const grouped = await transaction.bundyRawEvent.groupBy({
        by: ["matchStatus", "duplicateStatus"],
        where: ownedWhere,
        _count: { _all: true },
      });
      const ownedBefore = grouped.reduce((total, row) => total + row._count._all, 0);
      if (ownedBefore !== plan.rawEventsOwned) {
        throw new BundyRollbackError("BUNDY_ROLLBACK_STALE", "The owned Bundy events changed before deletion. No raw events were removed.");
      }
      const deleted = await transaction.bundyRawEvent.deleteMany({ where: ownedWhere });
      const remainingEvents = await transaction.bundyRawEvent.count({ where: ownedWhere });
      if (remainingEvents !== 0 || deleted.count !== ownedBefore) {
        throw new BundyRollbackError("BUNDY_ROLLBACK_INCOMPLETE", "The Bundy raw-event rollback did not remove exactly the selected import ownership set.");
      }

      const summary: BundyRollbackSummary = {
        rawEventsDeleted: deleted.count,
        matchedDeleted: grouped.filter((row) => row.matchStatus === "MATCHED").reduce((total, row) => total + row._count._all, 0),
        unmatchedDeleted: grouped.filter((row) => row.matchStatus === "UNMATCHED").reduce((total, row) => total + row._count._all, 0),
        inactiveDeleted: grouped.filter((row) => row.matchStatus === "EMPLOYEE_INACTIVE").reduce((total, row) => total + row._count._all, 0),
        duplicateScansDeleted: grouped.filter((row) => row.duplicateStatus === "DUPLICATE_SCAN").reduce((total, row) => total + row._count._all, 0),
        remainingEvents,
      };
      await transaction.bundyImport.update({
        where: { id: input.importId },
        data: {
          status: "ROLLED_BACK",
          rolledBackAt: new Date(),
          rolledBackByUserId: actorUserId,
          rolledBackBySnapshot: toJson(toActorSnapshot(input.actor)),
          rollbackSummary: toJson(summary),
          rollbackErrorSummary: null,
        },
      });
      await transaction.auditEvent.create({
        data: {
          eventType: "bundy.import.rolled_back",
          action: "Bundy Import Rolled Back",
          module: "Bundy Integration",
          actorType: "user",
          actorUserId,
          actorUid: input.actor.uid,
          actorSnapshot: toJson(toActorSnapshot(input.actor)),
          targetType: "bundy_import",
          targetId: input.importId,
          targetReference: input.importId,
          targetLabel: plan.filename,
          outcome: "Successful",
          summary: `Bundy import rolled back. ${deleted.count} raw source event${deleted.count === 1 ? "" : "s"} removed.`,
          metadata: toJson({ importId: input.importId, ...summary }),
          occurredAt: new Date(),
        },
      });
      return summary;
    });

    return { importId: input.importId, status: "ROLLED_BACK", summary };
  } catch (error) {
    const message = rollbackErrorMessage(error);
    await markRollbackFailed({
      importId: input.importId,
      actor: input.actor,
      message,
      outcome: error instanceof BundyRollbackError && error.code === "BUNDY_ROLLBACK_BLOCKED" ? "Blocked" : "Failed",
    });
    if (error instanceof BundyRollbackError) throw error;
    throw new BundyRollbackError("BUNDY_ROLLBACK_FAILED", message, 503);
  }
}
