import "server-only";

import { randomUUID } from "node:crypto";

import { recordAuditEvent } from "@/server/repositories/audit/audit.repository";
import {
  getDisabledLegacyStore as getFirebaseAdminDb,
  RepositoryTimestamp as Timestamp,
  type DocumentData,
} from "@/server/repositories/prisma/prisma-compat";
import type { SessionUser } from "@/types/auth";
import type {
  PayrollBatchActor,
  PayrollBatchItemSnapshot,
  PayrollBatchRecord,
  PayrollBatchStatus,
} from "@/types/payroll-batches";
import { payrollBatchStatuses } from "@/types/payroll-batches";
import {
  addPrismaPayrollBatchItem,
  createPrismaPayrollBatch,
  getPrismaPayrollBatchById,
  listPrismaPayrollBatches,
  markPrismaPayrollBatchSubmittedFromHandoff,
  removePrismaPayrollBatchItem,
  updatePrismaPayrollBatchStatus,
  PrismaPayrollBatchConflictError,
  PrismaPayrollBatchNotFoundError,
  PrismaPayrollBatchValidationError,
} from "@/server/repositories/payroll-batches/prisma-payroll-batch.repository";

const batchCollection = "payrollBatches";
const membershipCollection = "payrollBatchMembership";

type BatchActor = Pick<SessionUser, "uid" | "username" | "displayName" | "role">;

export class PayrollBatchDataError extends Error {
  readonly code = "PAYROLL_BATCH_DATA_INVALID";

  constructor() {
    super("The payroll batch record has an invalid shape.");
    this.name = "PayrollBatchDataError";
  }
}

export class PayrollBatchNotFoundError extends Error {
  readonly code = "PAYROLL_BATCH_NOT_FOUND";

  constructor() {
    super("The payroll batch could not be found.");
    this.name = "PayrollBatchNotFoundError";
  }
}

export class PayrollBatchConflictError extends Error {
  readonly code = "PAYROLL_BATCH_CONFLICT";

  constructor(message: string) {
    super(message);
    this.name = "PayrollBatchConflictError";
  }
}

export class PayrollBatchValidationError extends Error {
  readonly code = "PAYROLL_BATCH_VALIDATION_ERROR";

  constructor(message: string) {
    super(message);
    this.name = "PayrollBatchValidationError";
  }
}

export class PayrollBatchEligibilityError extends Error {
  readonly code = "PAYROLL_BATCH_RECORD_NOT_READY";

  constructor(message: string) {
    super(message);
    this.name = "PayrollBatchEligibilityError";
  }
}

function mapPrismaBatchError(error: unknown): never {
  if (error instanceof PrismaPayrollBatchNotFoundError) throw new PayrollBatchNotFoundError();
  if (error instanceof PrismaPayrollBatchConflictError) throw new PayrollBatchConflictError(error.message);
  if (error instanceof PrismaPayrollBatchValidationError) throw new PayrollBatchValidationError(error.message);
  throw error;
}

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
    : typeof value === "string" && value.trim() ? value : null;
}

function getTimestamp(value: unknown): Timestamp | null {
  return value instanceof Timestamp ? value : null;
}

function getRequiredNumber(data: Record<string, unknown>, field: string): number | null {
  const value = data[field];
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

function parseActor(value: unknown): PayrollBatchActor | null {
  if (!isRecord(value)) return null;

  const uid = getRequiredString(value, "uid");
  const username = getRequiredString(value, "username");
  const displayName = getRequiredString(value, "displayName");
  const role = getRequiredString(value, "role");

  return uid && username && displayName && role
    ? { uid, username, displayName, role }
    : null;
}

function parsePeriod(value: unknown): PayrollBatchItemSnapshot["payrollPeriod"] | null {
  if (!isRecord(value)) return null;

  const start = getRequiredString(value, "start");
  const end = getRequiredString(value, "end");
  const label = getRequiredString(value, "label");

  return start && end && label && start <= end ? { start, end, label } : null;
}

export function parsePayrollBatchItemSnapshot(value: unknown): PayrollBatchItemSnapshot | null {
  if (!isRecord(value)) return null;

  const employeePeriodId = getRequiredString(value, "employeePeriodId");
  const employeeId = getRequiredString(value, "employeeId");
  const employeeName = getRequiredString(value, "employeeName");
  const department = getRequiredString(value, "department");
  const payrollPeriod = parsePeriod(value.payrollPeriod);
  const presentDays = getRequiredNumber(value, "presentDays");
  const lateCount = value.lateCount === null ? null : getRequiredNumber(value, "lateCount");
  const lateMinutes = value.lateMinutes === null ? null : getRequiredNumber(value, "lateMinutes");
  const undertimeMinutes = value.undertimeMinutes === null
    ? null
    : getRequiredNumber(value, "undertimeMinutes");
  const sourceAttendanceIds = Array.isArray(value.sourceAttendanceIds)
    && value.sourceAttendanceIds.every((id) => typeof id === "string" && id.trim())
    ? value.sourceAttendanceIds
    : null;
  const snapshotCreatedAt = getTimestamp(value.snapshotCreatedAt);

  if (
    !employeePeriodId
    || !employeeId
    || !employeeName
    || !department
    || !payrollPeriod
    || presentDays === null
    || (value.lateCount !== null && lateCount === null)
    || (value.lateMinutes !== null && lateMinutes === null)
    || (value.undertimeMinutes !== null && undertimeMinutes === null)
    || value.hrVerificationStatus !== "verified"
    || value.payrollReadiness !== "ready"
    || !sourceAttendanceIds
    || !snapshotCreatedAt
  ) {
    return null;
  }

  return {
    employeePeriodId,
    employeeId,
    employeeName,
    department,
    payrollPeriod,
    presentDays,
    lateCount,
    lateMinutes,
    undertimeMinutes,
    hrVerificationStatus: "verified",
    payrollReadiness: "ready",
    sourceAttendanceIds,
    snapshotCreatedAt: snapshotCreatedAt.toDate().toISOString(),
  };
}

function parseBatch(id: string, data: DocumentData | undefined): PayrollBatchRecord | null {
  if (!data) return null;

  const period = parsePeriod(data.period);
  const rawStatus = data.status;
  const status = payrollBatchStatuses.includes(rawStatus as PayrollBatchStatus)
    ? rawStatus as PayrollBatchStatus
    : null;
  const createdBy = parseActor(data.createdBy);
  const createdAt = getTimestamp(data.createdAt);
  const updatedAt = getTimestamp(data.updatedAt);
  const submittedBy = data.submittedBy === null || data.submittedBy === undefined
    ? null
    : parseActor(data.submittedBy);
  const submittedAt = data.submittedAt === null || data.submittedAt === undefined
    ? null
    : getTimestamp(data.submittedAt);
  const recordCount = getRequiredNumber(data, "recordCount");
  const blockedCount = getRequiredNumber(data, "blockedCount");
  const includedRecords = Array.isArray(data.includedRecords)
    ? data.includedRecords.map(parsePayrollBatchItemSnapshot)
    : null;
  const notes = getNullableString(data, "notes");

  if (
    !period
    || status === null
    || !createdBy
    || !createdAt
    || !updatedAt
    || (data.submittedBy !== null && data.submittedBy !== undefined && !submittedBy)
    || (data.submittedAt !== null && data.submittedAt !== undefined && !submittedAt)
    || recordCount === null
    || blockedCount === null
    || !includedRecords
    || includedRecords.some((record) => record === null)
  ) {
    return null;
  }

  const records = includedRecords as PayrollBatchItemSnapshot[];
  const departmentNames = Array.from(new Set(records.map((record) => record.department))).sort();

  return {
    id,
    period,
    status,
    createdBy,
    createdAt: createdAt.toDate().toISOString(),
    updatedAt: updatedAt.toDate().toISOString(),
    submittedBy,
    submittedAt: submittedAt?.toDate().toISOString() ?? null,
    recordCount,
    blockedCount,
    departmentNames,
    includedRecords: records,
    notes,
  };
}

function toActor(actor: BatchActor): PayrollBatchActor {
  return {
    uid: actor.uid,
    username: actor.username,
    displayName: actor.displayName,
    role: actor.role,
  };
}

async function writeBatchAuditEvent(
  batch: PayrollBatchRecord,
  eventType: "payroll.batch.created" | "payroll.batch.updated",
  actor: BatchActor,
  summary: string,
) {
  await recordAuditEvent({
    id: `${batch.id}:${eventType}:${batch.updatedAt}`,
    eventType,
    action: eventType === "payroll.batch.created" ? "Payroll Batch Created" : "Payroll Batch Updated",
    module: "Payroll Batches",
    actor: { type: "user", uid: actor.uid, displayName: actor.displayName, role: actor.role },
    target: { type: "payroll_batch", id: batch.id, reference: batch.id, label: batch.period.label },
    outcome: "Successful",
    summary,
    metadata: { batchId: batch.id },
    occurredAt: new Date(batch.updatedAt),
  });
}

function membershipDocumentId(employeePeriodId: string) {
  return encodeURIComponent(employeePeriodId);
}

export function getEmployeePeriodId(employeeId: string, periodStart: string) {
  return `${employeeId}:${periodStart}`;
}

export function parsePayrollBatch(
  id: string,
  data: DocumentData | undefined,
): PayrollBatchRecord | null {
  return parseBatch(id, data);
}

export async function listPayrollBatches(): Promise<PayrollBatchRecord[]> {
  const result = await listPrismaPayrollBatches({ page: 1, pageSize: 100 });
  return result.rows.map((row) => {
    if (!row.createdBy) throw new PayrollBatchDataError();
    return row as PayrollBatchRecord;
  });

  /* istanbul ignore next -- legacy Firestore implementation retained below for migration reference. */
  const snapshots = await getFirebaseAdminDb().collection(batchCollection).get();

  return snapshots.docs
    .map((snapshot) => {
      const batch = parseBatch(snapshot.id, snapshot.data());
      if (!batch) throw new PayrollBatchDataError();
      return batch;
    })
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function getPayrollBatchById(
  batchId: string,
): Promise<PayrollBatchRecord | null> {
  const prismaBatch = await getPrismaPayrollBatchById(batchId);
  return prismaBatch && prismaBatch.createdBy
    ? prismaBatch as PayrollBatchRecord
    : null;

  /* istanbul ignore next -- legacy Firestore implementation retained below for migration reference. */
  const snapshot = await getFirebaseAdminDb().collection(batchCollection).doc(batchId).get();
  if (!snapshot.exists) return null;

  const legacyBatch = parseBatch(snapshot.id, snapshot.data());
  if (!legacyBatch) throw new PayrollBatchDataError();
  return legacyBatch;
}

export async function createPayrollBatch(input: {
  period: PayrollBatchItemSnapshot["payrollPeriod"];
  actor: BatchActor;
  notes?: string | null;
  blockedCount?: number;
}): Promise<PayrollBatchRecord> {
  try {
    return await createPrismaPayrollBatch(input) as PayrollBatchRecord;
  } catch (error) {
    return mapPrismaBatchError(error);
  }

  /* istanbul ignore next -- legacy Firestore implementation retained below for migration reference. */
  const db = getFirebaseAdminDb();
  const now = Timestamp.now();
  const batchReference = db.collection(batchCollection).doc(`PAY-${input.period.start.replaceAll("-", "")}-${randomUUID().slice(0, 8).toUpperCase()}`);
  const actor = toActor(input.actor);

  await batchReference.set({
    period: input.period,
    status: "Draft",
    createdBy: actor,
    createdAt: now,
    updatedAt: now,
    submittedBy: null,
    submittedAt: null,
    recordCount: 0,
    blockedCount: input.blockedCount ?? 0,
    includedRecords: [],
    notes: input.notes?.trim() || null,
  });

  const batch = parseBatch(batchReference.id, (await batchReference.get()).data()) as PayrollBatchRecord;
  await writeBatchAuditEvent(batch, "payroll.batch.created", input.actor, "A Payroll batch was created.");
  return batch;
}

export async function addPayrollBatchItem(input: {
  batchId: string;
  snapshot: PayrollBatchItemSnapshot;
  actor: BatchActor;
}): Promise<PayrollBatchRecord> {
  try {
    return await addPrismaPayrollBatchItem(input) as PayrollBatchRecord;
  } catch (error) {
    return mapPrismaBatchError(error);
  }

  /* istanbul ignore next -- legacy Firestore implementation retained below for migration reference. */
  const db = getFirebaseAdminDb();
  const batchReference = db.collection(batchCollection).doc(input.batchId);
  const membershipReference = db.collection(membershipCollection).doc(membershipDocumentId(input.snapshot.employeePeriodId));

  const updated = await db.runTransaction(async (transaction) => {
    const batchSnapshot = await transaction.get(batchReference);
    const membershipSnapshot = await transaction.get(membershipReference);

    if (!batchSnapshot.exists) throw new PayrollBatchNotFoundError();
    const batch = parseBatch(batchSnapshot.id, batchSnapshot.data());
    if (!batch) throw new PayrollBatchDataError();
    if (batch.status !== "Draft") {
      throw new PayrollBatchConflictError("Only Draft batches can be changed.");
    }
    if (batch.period.start !== input.snapshot.payrollPeriod.start || batch.period.end !== input.snapshot.payrollPeriod.end) {
      throw new PayrollBatchValidationError("The attendance record belongs to a different payroll period.");
    }

    if (membershipSnapshot.exists) {
      const currentBatchId = membershipSnapshot.data()?.batchId;
      if (currentBatchId !== batch.id) {
        throw new PayrollBatchConflictError("This employee-period record is already included in another payroll batch.");
      }

      return batch;
    }

    const includedRecords = batch.includedRecords.concat(input.snapshot);
    const now = Timestamp.now();
    transaction.update(batchReference, {
      includedRecords,
      recordCount: includedRecords.length,
      updatedAt: now,
    });
    transaction.set(membershipReference, {
      batchId: batch.id,
      employeePeriodId: input.snapshot.employeePeriodId,
      createdAt: now,
    });

    return {
      ...batch,
      includedRecords,
      recordCount: includedRecords.length,
      updatedAt: now.toDate().toISOString(),
      departmentNames: Array.from(new Set(includedRecords.map((record) => record.department))).sort(),
    };
  });
  await recordAuditEvent({
    id: `${updated.id}:item-added:${updated.updatedAt}`,
    eventType: "payroll.batch.updated",
    action: "Payroll Batch Updated",
    module: "Payroll Batches",
    actor: { type: "user", uid: input.actor.uid, displayName: input.actor.displayName, role: input.actor.role },
    target: { type: "payroll_batch", id: updated.id, reference: updated.id, label: updated.period.label },
    outcome: "Successful",
    summary: "A verified attendance record was added to a Payroll batch.",
    metadata: { batchId: updated.id },
    occurredAt: new Date(updated.updatedAt),
  });
  return updated;
}

export async function removePayrollBatchItem(input: {
  batchId: string;
  employeePeriodId: string;
  actor: BatchActor;
}): Promise<PayrollBatchRecord> {
  try {
    return await removePrismaPayrollBatchItem(input) as PayrollBatchRecord;
  } catch (error) {
    return mapPrismaBatchError(error);
  }

  /* istanbul ignore next -- legacy Firestore implementation retained below for migration reference. */
  const db = getFirebaseAdminDb();
  const batchReference = db.collection(batchCollection).doc(input.batchId);
  const membershipReference = db.collection(membershipCollection).doc(membershipDocumentId(input.employeePeriodId));

  const updated = await db.runTransaction(async (transaction) => {
    const batchSnapshot = await transaction.get(batchReference);
    const membershipSnapshot = await transaction.get(membershipReference);
    if (!batchSnapshot.exists) throw new PayrollBatchNotFoundError();
    const batch = parseBatch(batchSnapshot.id, batchSnapshot.data());
    if (!batch) throw new PayrollBatchDataError();
    if (batch.status !== "Draft") throw new PayrollBatchConflictError("Only Draft batches can be changed.");

    const includedRecords = batch.includedRecords.filter((record) => record.employeePeriodId !== input.employeePeriodId);
    if (includedRecords.length === batch.includedRecords.length) {
      return batch;
    }

    const now = Timestamp.now();
    transaction.update(batchReference, {
      includedRecords,
      recordCount: includedRecords.length,
      updatedAt: now,
    });
    if (membershipSnapshot.exists && membershipSnapshot.data()?.batchId === batch.id) {
      transaction.delete(membershipReference);
    }

    return {
      ...batch,
      includedRecords,
      recordCount: includedRecords.length,
      updatedAt: now.toDate().toISOString(),
      departmentNames: Array.from(new Set(includedRecords.map((record) => record.department))).sort(),
    };
  });
  await recordAuditEvent({
    id: `${updated.id}:item-removed:${updated.updatedAt}`,
    eventType: "payroll.batch.updated",
    action: "Payroll Batch Updated",
    module: "Payroll Batches",
    actor: { type: "user", uid: input.actor.uid, displayName: input.actor.displayName, role: input.actor.role },
    target: { type: "payroll_batch", id: updated.id, reference: updated.id, label: updated.period.label },
    outcome: "Successful",
    summary: "An attendance record was removed from a Draft Payroll batch.",
    metadata: { batchId: updated.id },
    occurredAt: new Date(updated.updatedAt),
  });
  return updated;
}

export async function updatePayrollBatchStatus(input: {
  batchId: string;
  status: "Ready" | "Submitted";
  actor: BatchActor;
}): Promise<PayrollBatchRecord> {
  try {
    return await updatePrismaPayrollBatchStatus(input) as PayrollBatchRecord;
  } catch (error) {
    return mapPrismaBatchError(error);
  }

  /* istanbul ignore next -- legacy Firestore implementation retained below for migration reference. */
  const db = getFirebaseAdminDb();
  const batchReference = db.collection(batchCollection).doc(input.batchId);

  const updated = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(batchReference);
    if (!snapshot.exists) throw new PayrollBatchNotFoundError();
    const batch = parseBatch(snapshot.id, snapshot.data());
    if (!batch) throw new PayrollBatchDataError();

    const expectedCurrentStatus = input.status === "Ready" ? "Draft" : "Ready";
    if (batch.status !== expectedCurrentStatus) {
      throw new PayrollBatchConflictError(
        input.status === "Submitted"
          ? "Only Ready batches can be submitted."
          : "Only Draft batches can be marked Ready.",
      );
    }
    if (batch.recordCount < 1) {
      throw new PayrollBatchValidationError("Add at least one Ready for Payroll record before changing the batch status.");
    }

    const now = Timestamp.now();
    const update: DocumentData = {
      status: input.status,
      updatedAt: now,
    };
    if (input.status === "Submitted") {
      update.submittedBy = toActor(input.actor);
      update.submittedAt = now;
    }
    transaction.update(batchReference, update);

    return {
      ...batch,
      status: input.status,
      updatedAt: now.toDate().toISOString(),
      submittedBy: input.status === "Submitted" ? toActor(input.actor) : batch.submittedBy,
      submittedAt: input.status === "Submitted" ? now.toDate().toISOString() : batch.submittedAt,
    };
  });
  await writeBatchAuditEvent(updated, "payroll.batch.updated", input.actor, `Payroll batch status changed to ${input.status}.`);
  return updated;
}

export async function markPayrollBatchSubmittedFromHandoff(input: {
  batchId: string;
  actor: BatchActor;
}): Promise<PayrollBatchRecord> {
  try {
    return await markPrismaPayrollBatchSubmittedFromHandoff(input) as PayrollBatchRecord;
  } catch (error) {
    return mapPrismaBatchError(error);
  }

  /* istanbul ignore next -- legacy Firestore implementation retained below for migration reference. */
  const db = getFirebaseAdminDb();
  const batchReference = db.collection(batchCollection).doc(input.batchId);

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(batchReference);
    if (!snapshot.exists) throw new PayrollBatchNotFoundError();
    const batch = parseBatch(snapshot.id, snapshot.data());
    if (!batch) throw new PayrollBatchDataError();
    if (batch.status === "Submitted" || batch.status === "Acknowledged") return batch;
    if (batch.status !== "Ready") {
      throw new PayrollBatchConflictError("Only Ready batches can be submitted for payroll handoff.");
    }
    if (batch.recordCount < 1 || batch.blockedCount > 0) {
      throw new PayrollBatchValidationError("Only complete Ready batches can be submitted for payroll handoff.");
    }

    const now = Timestamp.now();
    const submittedBy = toActor(input.actor);
    transaction.update(batchReference, {
      status: "Submitted",
      submittedBy,
      submittedAt: now,
      updatedAt: now,
    });

    return {
      ...batch,
      status: "Submitted" as const,
      submittedBy,
      submittedAt: now.toDate().toISOString(),
      updatedAt: now.toDate().toISOString(),
    };
  });
}
