import "server-only";

import { randomUUID } from "node:crypto";

import type { SessionUser } from "@/types/auth";
import {
  getDisabledLegacyStore as getFirebaseAdminDb,
  RepositoryTimestamp as Timestamp,
  type DocumentData,
} from "@/server/repositories/prisma/prisma-compat";
import type {
  PayrollAcknowledgementStatus,
  PayrollHandoffActor,
  PayrollHandoffBatchSummary,
  PayrollHandoffRecord,
  PayrollHandoffTimelineEvent,
  PayrollTransferStatus,
} from "@/types/payroll-handoff";
import {
  payrollAcknowledgementStatuses,
  payrollTransferStatuses,
} from "@/types/payroll-handoff";
import {
  payrollBatchStatuses,
  type PayrollBatchItemSnapshot,
  type PayrollBatchPeriod,
  type PayrollBatchStatus,
} from "@/types/payroll-batches";
import { parsePayrollBatchItemSnapshot } from "@/server/repositories/payroll-batches/payroll-batch.repository";
import {
  claimPrismaPayrollHandoff,
  getPrismaPayrollHandoffByBatchId,
  getPrismaPayrollHandoffByTransferId,
  listPrismaPayrollHandoffs,
  updatePrismaPayrollHandoffResult,
  PrismaPayrollHandoffConflictError,
  PrismaPayrollHandoffNotFoundError,
} from "@/server/repositories/payroll-handoffs/prisma-payroll-handoff.repository";

const handoffCollection = "payrollHandoffs";

type HandoffActor = Pick<SessionUser, "uid" | "username" | "displayName" | "role">;

export class PayrollHandoffDataError extends Error {
  readonly code = "PAYROLL_HANDOFF_DATA_INVALID";

  constructor() {
    super("The payroll handoff record has an invalid shape.");
    this.name = "PayrollHandoffDataError";
  }
}

export class PayrollHandoffNotFoundError extends Error {
  readonly code = "PAYROLL_HANDOFF_NOT_FOUND";

  constructor() {
    super("The payroll handoff could not be found.");
    this.name = "PayrollHandoffNotFoundError";
  }
}

export class PayrollHandoffConflictError extends Error {
  readonly code = "PAYROLL_HANDOFF_CONFLICT";

  constructor(message: string) {
    super(message);
    this.name = "PayrollHandoffConflictError";
  }
}

function mapPrismaHandoffError(error: unknown): never {
  if (error instanceof PrismaPayrollHandoffNotFoundError) throw new PayrollHandoffNotFoundError();
  if (error instanceof PrismaPayrollHandoffConflictError) throw new PayrollHandoffConflictError(error.message);
  throw error;
}

export type PayrollStoredHandoff = PayrollHandoffRecord & {
  batchSnapshot: PayrollBatchItemSnapshot[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getRequiredString(data: Record<string, unknown>, field: string): string | null {
  const value = data[field];
  return typeof value === "string" && value.trim() ? value : null;
}

function getNullableString(data: Record<string, unknown>, field: string): string | null {
  const value = data[field];
  return value === null || value === undefined
    ? null
    : typeof value === "string" && value.trim()
      ? value
      : null;
}

function getTimestamp(value: unknown): Timestamp | null {
  return value instanceof Timestamp ? value : null;
}

function getRequiredNumber(data: Record<string, unknown>, field: string): number | null {
  const value = data[field];
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

function parsePeriod(value: unknown): PayrollBatchPeriod | null {
  if (!isRecord(value)) return null;

  const start = getRequiredString(value, "start");
  const end = getRequiredString(value, "end");
  const label = getRequiredString(value, "label");

  return start && end && label && start <= end ? { start, end, label } : null;
}

function parseActor(value: unknown): PayrollHandoffActor | null {
  if (!isRecord(value)) return null;

  const uid = getRequiredString(value, "uid");
  const username = getRequiredString(value, "username");
  const displayName = getRequiredString(value, "displayName");
  const role = getRequiredString(value, "role");

  return uid && username && displayName && role
    ? { uid, username, displayName, role }
    : null;
}

function parseBatchSummary(value: unknown): PayrollHandoffBatchSummary | null {
  if (!isRecord(value)) return null;

  const employeeCount = getRequiredNumber(value, "employeeCount");
  const includedRecordCount = getRequiredNumber(value, "includedRecordCount");
  const blockedRecordCount = getRequiredNumber(value, "blockedRecordCount");
  const departmentCount = getRequiredNumber(value, "departmentCount");
  const rawBatchStatus = getRequiredString(value, "batchStatus");
  const batchStatus = rawBatchStatus && payrollBatchStatuses.includes(rawBatchStatus as PayrollBatchStatus)
    ? rawBatchStatus as PayrollBatchStatus
    : null;

  return employeeCount !== null
    && includedRecordCount !== null
    && blockedRecordCount !== null
    && departmentCount !== null
    && batchStatus !== null
    ? { employeeCount, includedRecordCount, blockedRecordCount, departmentCount, batchStatus }
    : null;
}

function parseHandoff(id: string, data: DocumentData | undefined): PayrollStoredHandoff | null {
  if (!data) return null;

  const transferId = getRequiredString(data, "transferId");
  const batchId = getRequiredString(data, "batchId");
  const period = parsePeriod(data.period);
  const submittedBy = parseActor(data.submittedBy);
  const submittedAt = getTimestamp(data.submittedAt);
  const readyAt = getTimestamp(data.readyAt);
  const acknowledgedAt = data.acknowledgedAt === null || data.acknowledgedAt === undefined
    ? null
    : getTimestamp(data.acknowledgedAt);
  const failedAt = data.failedAt === null || data.failedAt === undefined
    ? null
    : getTimestamp(data.failedAt);
  const createdAt = getTimestamp(data.createdAt);
  const updatedAt = getTimestamp(data.updatedAt);
  const transferStatus = data.transferStatus as PayrollTransferStatus;
  const acknowledgementStatus = data.acknowledgementStatus as PayrollAcknowledgementStatus;
  const provider = getRequiredString(data, "provider");
  const attemptCount = getRequiredNumber(data, "attemptCount");
  const batchSummary = parseBatchSummary(data.batchSummary);
  const batchSnapshot = Array.isArray(data.batchSnapshot)
    ? data.batchSnapshot.map(parsePayrollBatchItemSnapshot)
    : null;

  if (
    !transferId
    || !batchId
    || id !== batchId
    || !period
    || !submittedBy
    || !submittedAt
    || !readyAt
    || (data.acknowledgedAt !== null && data.acknowledgedAt !== undefined && !acknowledgedAt)
    || (data.failedAt !== null && data.failedAt !== undefined && !failedAt)
    || !createdAt
    || !updatedAt
    || !payrollTransferStatuses.includes(transferStatus)
    || !payrollAcknowledgementStatuses.includes(acknowledgementStatus)
    || !provider
    || attemptCount === null
    || !batchSummary
    || !batchSnapshot
    || batchSnapshot.some((snapshot) => snapshot === null)
  ) {
    return null;
  }

  return {
    transferId,
    batchId,
    period,
    submittedBy,
    submittedAt: submittedAt.toDate().toISOString(),
    readyAt: readyAt.toDate().toISOString(),
    acknowledgedAt: acknowledgedAt?.toDate().toISOString() ?? null,
    failedAt: failedAt?.toDate().toISOString() ?? null,
    transferStatus,
    acknowledgementStatus,
    externalReference: getNullableString(data, "externalReference"),
    provider,
    failureCode: getNullableString(data, "failureCode"),
    failureSummary: getNullableString(data, "failureSummary"),
    attemptCount,
    createdAt: createdAt.toDate().toISOString(),
    updatedAt: updatedAt.toDate().toISOString(),
    batchSummary,
    timeline: [],
    batchSnapshot: batchSnapshot as PayrollBatchItemSnapshot[],
  };
}

function toActor(actor: HandoffActor): PayrollHandoffActor {
  return {
    uid: actor.uid,
    username: actor.username,
    displayName: actor.displayName,
    role: actor.role,
  };
}

function createTransferId(batchId: string) {
  return `TRF-${batchId}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

function toIso(value: Timestamp) {
  return value.toDate().toISOString();
}

function withTimeline(record: PayrollStoredHandoff): PayrollStoredHandoff {
  const timeline: PayrollHandoffTimelineEvent[] = [
    { id: "ready", label: "Batch ready for handoff", occurredAt: record.readyAt },
    { id: "submitted", label: "Submitted for handoff", occurredAt: record.submittedAt },
  ];

  if (record.acknowledgedAt) {
    timeline.push({ id: "acknowledged", label: "Acknowledgement received", occurredAt: record.acknowledgedAt });
  }
  if (record.failedAt) {
    timeline.push({ id: "failed", label: "Handoff failed", occurredAt: record.failedAt });
  }

  return { ...record, timeline: timeline.sort((left, right) => left.occurredAt.localeCompare(right.occurredAt)) };
}

export function parsePayrollHandoff(
  id: string,
  data: DocumentData | undefined,
): PayrollStoredHandoff | null {
  const parsed = parseHandoff(id, data);
  return parsed ? withTimeline(parsed) : null;
}

export async function listPayrollHandoffs(): Promise<PayrollStoredHandoff[]> {
  const result = await listPrismaPayrollHandoffs({ page: 1, pageSize: 100 });
  return result.rows as PayrollStoredHandoff[];

  /* istanbul ignore next -- legacy Firestore implementation retained below for migration reference. */
  const snapshots = await getFirebaseAdminDb().collection(handoffCollection).get();

  return snapshots.docs
    .map((snapshot) => {
      const handoff = parsePayrollHandoff(snapshot.id, snapshot.data());
      if (!handoff) throw new PayrollHandoffDataError();
      return handoff;
    })
    .sort((left, right) => right.submittedAt.localeCompare(left.submittedAt));
}

export async function getPayrollHandoffByBatchId(batchId: string) {
  return getPrismaPayrollHandoffByBatchId(batchId) as Promise<PayrollStoredHandoff | null>;

  /* istanbul ignore next -- legacy Firestore implementation retained below for migration reference. */
  const snapshot = await getFirebaseAdminDb().collection(handoffCollection).doc(batchId).get();
  if (!snapshot.exists) return null;

  const handoff = parsePayrollHandoff(snapshot.id, snapshot.data());
  if (!handoff) throw new PayrollHandoffDataError();
  return handoff;
}

export async function getPayrollHandoffByTransferId(transferId: string) {
  return getPrismaPayrollHandoffByTransferId(transferId) as Promise<PayrollStoredHandoff | null>;

  /* istanbul ignore next -- legacy Firestore implementation retained below for migration reference. */
  const snapshots = await getFirebaseAdminDb()
    .collection(handoffCollection)
    .where("transferId", "==", transferId)
    .limit(1)
    .get();
  const snapshot = snapshots.docs[0];
  if (!snapshot) return null;

  const handoff = parsePayrollHandoff(snapshot.id, snapshot.data());
  if (!handoff) throw new PayrollHandoffDataError();
  return handoff;
}

export async function claimPayrollHandoff(input: {
  batchId: string;
  period: PayrollBatchPeriod;
  readyAt: string;
  actor: HandoffActor;
  batchSnapshot: PayrollBatchItemSnapshot[];
  batchSummary: PayrollHandoffBatchSummary;
}) {
  try {
    return await claimPrismaPayrollHandoff(input) as PayrollStoredHandoff;
  } catch (error) {
    return mapPrismaHandoffError(error);
  }

  /* istanbul ignore next -- legacy Firestore implementation retained below for migration reference. */
  const db = getFirebaseAdminDb();
  const handoffReference = db.collection(handoffCollection).doc(input.batchId);
  const transferId = createTransferId(input.batchId);
  const actor = toActor(input.actor);

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(handoffReference);
    const existing = snapshot.exists ? parsePayrollHandoff(snapshot.id, snapshot.data()) : null;
    if (snapshot.exists && !existing) throw new PayrollHandoffDataError();

    if (existing) {
      if (existing.transferStatus !== "failed") {
        throw new PayrollHandoffConflictError(
          existing.transferStatus === "submitted"
            ? "This batch already has a successful payroll handoff."
            : "This batch already has a payroll handoff in progress.",
        );
      }
      if (existing.attemptCount >= 3) {
        throw new PayrollHandoffConflictError("This handoff has reached its retry limit. Technical follow-up is required.");
      }

      const now = Timestamp.now();
      transaction.update(handoffReference, {
        transferStatus: "submitting",
        acknowledgementStatus: "pending",
        submittedBy: actor,
        submittedAt: now,
        acknowledgedAt: null,
        failedAt: null,
        externalReference: null,
        failureCode: null,
        failureSummary: null,
        attemptCount: existing.attemptCount + 1,
        updatedAt: now,
      });

      return {
        ...existing,
        submittedBy: actor,
        submittedAt: toIso(now),
        acknowledgedAt: null,
        failedAt: null,
        transferStatus: "submitting" as const,
        acknowledgementStatus: "pending" as const,
        externalReference: null,
        failureCode: null,
        failureSummary: null,
        attemptCount: existing.attemptCount + 1,
        updatedAt: toIso(now),
        timeline: [],
      };
    }

    const now = Timestamp.now();
    const data: DocumentData = {
      transferId,
      batchId: input.batchId,
      period: input.period,
      submittedBy: actor,
      submittedAt: now,
      readyAt: Timestamp.fromDate(new Date(input.readyAt)),
      acknowledgedAt: null,
      failedAt: null,
      transferStatus: "submitting",
      acknowledgementStatus: "pending",
      externalReference: null,
      provider: "simulated-payroll-adapter",
      failureCode: null,
      failureSummary: null,
      attemptCount: 1,
      batchSummary: input.batchSummary,
      batchSnapshot: input.batchSnapshot,
      createdAt: now,
      updatedAt: now,
    };
    transaction.create(handoffReference, data);

    return {
      transferId,
      batchId: input.batchId,
      period: input.period,
      submittedBy: actor,
      submittedAt: toIso(now),
      readyAt: input.readyAt,
      acknowledgedAt: null,
      failedAt: null,
      transferStatus: "submitting" as const,
      acknowledgementStatus: "pending" as const,
      externalReference: null,
      provider: "simulated-payroll-adapter",
      failureCode: null,
      failureSummary: null,
      attemptCount: 1,
      createdAt: toIso(now),
      updatedAt: toIso(now),
      batchSummary: input.batchSummary,
      timeline: [],
      batchSnapshot: input.batchSnapshot,
    } satisfies PayrollStoredHandoff;
  });
}

export async function updatePayrollHandoffResult(input: {
  batchId: string;
  transferStatus: "submitted" | "failed";
  acknowledgementStatus: PayrollAcknowledgementStatus;
  provider: string;
  externalReference?: string | null;
  failureCode?: string | null;
  failureSummary?: string | null;
}) {
  try {
    return await updatePrismaPayrollHandoffResult(input) as PayrollStoredHandoff;
  } catch (error) {
    return mapPrismaHandoffError(error);
  }

  /* istanbul ignore next -- legacy Firestore implementation retained below for migration reference. */
  const db = getFirebaseAdminDb();
  const handoffReference = db.collection(handoffCollection).doc(input.batchId);

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(handoffReference);
    if (!snapshot.exists) throw new PayrollHandoffNotFoundError();
    const existing = parsePayrollHandoff(snapshot.id, snapshot.data());
    if (!existing) throw new PayrollHandoffDataError();
    if (existing.transferStatus !== "submitting") {
      throw new PayrollHandoffConflictError("This payroll handoff is no longer awaiting an integration response.");
    }

    const now = Timestamp.now();
    const acknowledged = input.acknowledgementStatus === "accepted";
    const failed = input.transferStatus === "failed";
    transaction.update(handoffReference, {
      transferStatus: input.transferStatus,
      acknowledgementStatus: input.acknowledgementStatus,
      provider: input.provider,
      externalReference: input.externalReference ?? null,
      failureCode: input.failureCode ?? null,
      failureSummary: input.failureSummary ?? null,
      acknowledgedAt: acknowledged ? now : null,
      failedAt: failed ? now : null,
      updatedAt: now,
    });

    return withTimeline({
      ...existing,
      transferStatus: input.transferStatus,
      acknowledgementStatus: input.acknowledgementStatus,
      provider: input.provider,
      externalReference: input.externalReference ?? null,
      failureCode: input.failureCode ?? null,
      failureSummary: input.failureSummary ?? null,
      acknowledgedAt: acknowledged ? toIso(now) : null,
      failedAt: failed ? toIso(now) : null,
      updatedAt: toIso(now),
    });
  });
}
