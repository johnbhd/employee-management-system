import "server-only";

import { FieldValue, Timestamp, type DocumentData } from "firebase-admin/firestore";
import { randomUUID } from "node:crypto";

import { getFirebaseAdminDb } from "@/lib/firebase/server";
import type { SessionUser } from "@/types/auth";
import type { PayrollBatchPeriod } from "@/types/payroll-batches";
import type {
  AccountingAcknowledgementStatus,
  AccountingTransferActor,
  AccountingTransferRecord,
  AccountingTransferStatus,
  AccountingTransferTimelineEvent,
} from "@/types/accounting-transfers";

const transferCollection = "accountingTransfers";
const membershipCollection = "accountingTransferMembership";
const auditCollection = "accountingTransferAuditEvents";
const provider = "simulated-accounting-adapter";

type TransferActor = Pick<SessionUser, "uid" | "username" | "displayName" | "role">;

export class AccountingTransferDataError extends Error {
  readonly code = "ACCOUNTING_TRANSFER_DATA_INVALID";

  constructor() {
    super("The Accounting transfer record has an invalid shape.");
    this.name = "AccountingTransferDataError";
  }
}

export class AccountingTransferNotFoundError extends Error {
  readonly code = "ACCOUNTING_TRANSFER_NOT_FOUND";

  constructor() {
    super("The Accounting transfer could not be found.");
    this.name = "AccountingTransferNotFoundError";
  }
}

export class AccountingTransferConflictError extends Error {
  readonly code = "ACCOUNTING_TRANSFER_CONFLICT";

  constructor(message: string) {
    super(message);
    this.name = "AccountingTransferConflictError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getString(data: Record<string, unknown>, field: string): string | null {
  const value = data[field];
  return typeof value === "string" && value.trim() ? value : null;
}

function getNullableString(data: Record<string, unknown>, field: string): string | null {
  const value = data[field];
  if (value === null || value === undefined) return null;
  return typeof value === "string" && value.trim() ? value : null;
}

function getTimestamp(value: unknown, nullable = false): Timestamp | null {
  if (value === null && nullable) return null;
  return value instanceof Timestamp ? value : null;
}

function getNumber(data: Record<string, unknown>, field: string): number | null {
  const value = data[field];
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : null;
}

function parsePeriod(value: unknown): PayrollBatchPeriod | null {
  if (!isRecord(value)) return null;
  const start = getString(value, "start");
  const end = getString(value, "end");
  const label = getString(value, "label");
  return start && end && label && start <= end ? { start, end, label } : null;
}

function parseActor(value: unknown): AccountingTransferActor | null {
  if (!isRecord(value)) return null;
  const uid = getString(value, "uid");
  const username = getString(value, "username");
  const displayName = getString(value, "displayName");
  const role = getString(value, "role");
  return uid && username && displayName && role
    ? { uid, username, displayName, role }
    : null;
}

function toIso(value: Timestamp) {
  return value.toDate().toISOString();
}

function parseTransfer(id: string, data: DocumentData | undefined): AccountingTransferRecord | null {
  if (!data) return null;

  const transferId = getString(data, "transferId");
  const payrollResultId = getString(data, "payrollResultId");
  const payrollBatchId = getString(data, "payrollBatchId");
  const payrollHandoffId = getString(data, "payrollHandoffId");
  const period = parsePeriod(data.period);
  const externalPayrollReference = getString(data, "externalPayrollReference");
  const employeeCount = getNumber(data, "employeeCount");
  const payrollResultStatus = getString(data, "payrollResultStatus");
  const submittedBy = parseActor(data.submittedBy);
  const submittedAt = getTimestamp(data.submittedAt);
  const acknowledgedAt = getTimestamp(data.acknowledgedAt, true);
  const failedAt = getTimestamp(data.failedAt, true);
  const createdAt = getTimestamp(data.createdAt);
  const updatedAt = getTimestamp(data.updatedAt);
  const transferStatus = data.transferStatus as AccountingTransferStatus;
  const acknowledgementStatus = data.acknowledgementStatus as AccountingAcknowledgementStatus;
  const providerName = getString(data, "provider");
  const attemptCount = getNumber(data, "attemptCount");

  if (
    !transferId || transferId !== id || !payrollResultId || !payrollBatchId
    || !payrollHandoffId || !period || !externalPayrollReference || employeeCount === null
    || !payrollResultStatus || !submittedBy || !submittedAt || !createdAt || !updatedAt
    || !["preparing", "submitting", "submitted", "failed"].includes(transferStatus)
    || !["pending", "accepted", "rejected", "not_received"].includes(acknowledgementStatus)
    || !providerName || attemptCount === null
    || (data.acknowledgedAt !== null && data.acknowledgedAt !== undefined && !acknowledgedAt)
    || (data.failedAt !== null && data.failedAt !== undefined && !failedAt)
  ) {
    return null;
  }

  const transfer: AccountingTransferRecord = {
    transferId,
    payrollResultId,
    payrollBatchId,
    payrollHandoffId,
    period,
    externalPayrollReference,
    employeeCount,
    payrollResultStatus,
    submittedBy,
    submittedAt: toIso(submittedAt),
    acknowledgedAt: acknowledgedAt ? toIso(acknowledgedAt) : null,
    failedAt: failedAt ? toIso(failedAt) : null,
    transferStatus,
    acknowledgementStatus,
    externalAccountingReference: getNullableString(data, "externalAccountingReference"),
    provider: providerName,
    failureCode: getNullableString(data, "failureCode"),
    failureSummary: getNullableString(data, "failureSummary"),
    attemptCount,
    createdAt: toIso(createdAt),
    updatedAt: toIso(updatedAt),
    timeline: [],
  };

  return withTimeline(transfer);
}

function withTimeline(record: AccountingTransferRecord): AccountingTransferRecord {
  const timeline: AccountingTransferTimelineEvent[] = [
    { id: "created", label: "Transfer Created", occurredAt: record.createdAt },
    { id: "submitted", label: "Submitted to Accounting adapter", occurredAt: record.submittedAt },
  ];

  if (record.acknowledgedAt) {
    timeline.push({
      id: record.acknowledgementStatus === "accepted" ? "acknowledged" : "rejected",
      label: record.acknowledgementStatus === "accepted" ? "Acknowledged" : "Rejected",
      occurredAt: record.acknowledgedAt,
    });
  }
  if (record.failedAt) {
    timeline.push({ id: "failed", label: "Transfer Failed", occurredAt: record.failedAt });
  }

  return { ...record, timeline: timeline.sort((left, right) => left.occurredAt.localeCompare(right.occurredAt)) };
}

function toActor(actor: TransferActor): AccountingTransferActor {
  return {
    uid: actor.uid,
    username: actor.username,
    displayName: actor.displayName,
    role: actor.role,
  };
}

function createTransferId(period: PayrollBatchPeriod) {
  return `ACC-TRF-${period.start.replaceAll("-", "")}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

function membershipId(payrollResultId: string) {
  return payrollResultId.replace(/[^A-Za-z0-9_-]/g, "_");
}

function transferDocument(record: AccountingTransferRecord): DocumentData {
  return {
    transferId: record.transferId,
    payrollResultId: record.payrollResultId,
    payrollBatchId: record.payrollBatchId,
    payrollHandoffId: record.payrollHandoffId,
    period: record.period,
    externalPayrollReference: record.externalPayrollReference,
    employeeCount: record.employeeCount,
    payrollResultStatus: record.payrollResultStatus,
    submittedBy: record.submittedBy,
    submittedAt: Timestamp.fromDate(new Date(record.submittedAt)),
    acknowledgedAt: record.acknowledgedAt ? Timestamp.fromDate(new Date(record.acknowledgedAt)) : null,
    failedAt: record.failedAt ? Timestamp.fromDate(new Date(record.failedAt)) : null,
    transferStatus: record.transferStatus,
    acknowledgementStatus: record.acknowledgementStatus,
    externalAccountingReference: record.externalAccountingReference,
    provider: record.provider,
    failureCode: record.failureCode,
    failureSummary: record.failureSummary,
    attemptCount: record.attemptCount,
    createdAt: Timestamp.fromDate(new Date(record.createdAt)),
    updatedAt: Timestamp.fromDate(new Date(record.updatedAt)),
  };
}

export async function listAccountingTransfers(): Promise<AccountingTransferRecord[]> {
  const snapshots = await getFirebaseAdminDb().collection(transferCollection).get();
  return snapshots.docs
    .map((snapshot) => {
      const transfer = parseTransfer(snapshot.id, snapshot.data());
      if (!transfer) throw new AccountingTransferDataError();
      return transfer;
    })
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function getAccountingTransferById(transferId: string) {
  const snapshot = await getFirebaseAdminDb().collection(transferCollection).doc(transferId).get();
  if (!snapshot.exists) return null;
  const transfer = parseTransfer(snapshot.id, snapshot.data());
  if (!transfer) throw new AccountingTransferDataError();
  return transfer;
}

export async function getAccountingTransferByPayrollResultId(payrollResultId: string) {
  const db = getFirebaseAdminDb();
  const membership = await db.collection(membershipCollection).doc(membershipId(payrollResultId)).get();
  if (membership.exists) {
    const transferId = membership.data()?.transferId;
    if (typeof transferId === "string") return getAccountingTransferById(transferId);
  }

  const snapshots = await db.collection(transferCollection)
    .where("payrollResultId", "==", payrollResultId)
    .limit(1)
    .get();
  const snapshot = snapshots.docs[0];
  if (!snapshot) return null;
  const transfer = parseTransfer(snapshot.id, snapshot.data());
  if (!transfer) throw new AccountingTransferDataError();
  return transfer;
}

export async function claimAccountingTransfer(input: {
  payrollResultId: string;
  payrollBatchId: string;
  payrollHandoffId: string;
  period: PayrollBatchPeriod;
  externalPayrollReference: string;
  employeeCount: number;
  payrollResultStatus: string;
  actor: TransferActor;
}) {
  const db = getFirebaseAdminDb();
  const membershipReference = db.collection(membershipCollection).doc(membershipId(input.payrollResultId));
  const actor = toActor(input.actor);

  return db.runTransaction(async (transaction) => {
    const membershipSnapshot = await transaction.get(membershipReference);
    const now = Timestamp.now();

    if (membershipSnapshot.exists) {
      const existingTransferId = membershipSnapshot.data()?.transferId;
      if (typeof existingTransferId !== "string") throw new AccountingTransferDataError();
      const transferReference = db.collection(transferCollection).doc(existingTransferId);
      const transferSnapshot = await transaction.get(transferReference);
      const existing = parseTransfer(transferSnapshot.id, transferSnapshot.data());
      if (!existing) throw new AccountingTransferDataError();

      if (existing.transferStatus === "submitted") {
        throw new AccountingTransferConflictError("This Payroll Result has already been transferred to Accounting.");
      }
      if (existing.transferStatus === "preparing" || existing.transferStatus === "submitting") {
        throw new AccountingTransferConflictError("This Accounting transfer is already in progress.");
      }
      if (existing.attemptCount >= 3) {
        throw new AccountingTransferConflictError("This Accounting transfer has reached its retry limit.");
      }

      transaction.update(transferReference, {
        submittedBy: actor,
        submittedAt: now,
        acknowledgedAt: null,
        failedAt: null,
        transferStatus: "submitting",
        acknowledgementStatus: "pending",
        externalAccountingReference: null,
        failureCode: null,
        failureSummary: null,
        attemptCount: existing.attemptCount + 1,
        updatedAt: now,
      });

      return withTimeline({
        ...existing,
        submittedBy: actor,
        submittedAt: toIso(now),
        acknowledgedAt: null,
        failedAt: null,
        transferStatus: "submitting",
        acknowledgementStatus: "pending",
        externalAccountingReference: null,
        failureCode: null,
        failureSummary: null,
        attemptCount: existing.attemptCount + 1,
        updatedAt: toIso(now),
        timeline: [],
      });
    }

    const transferId = createTransferId(input.period);
    const transferReference = db.collection(transferCollection).doc(transferId);
    const transfer: AccountingTransferRecord = {
      transferId,
      payrollResultId: input.payrollResultId,
      payrollBatchId: input.payrollBatchId,
      payrollHandoffId: input.payrollHandoffId,
      period: input.period,
      externalPayrollReference: input.externalPayrollReference,
      employeeCount: input.employeeCount,
      payrollResultStatus: input.payrollResultStatus,
      submittedBy: actor,
      submittedAt: toIso(now),
      acknowledgedAt: null,
      failedAt: null,
      transferStatus: "submitting",
      acknowledgementStatus: "pending",
      externalAccountingReference: null,
      provider,
      failureCode: null,
      failureSummary: null,
      attemptCount: 1,
      createdAt: toIso(now),
      updatedAt: toIso(now),
      timeline: [],
    };

    transaction.create(transferReference, transferDocument(transfer));
    transaction.create(membershipReference, {
      payrollResultId: input.payrollResultId,
      transferId,
      createdAt: now,
    });
    return withTimeline(transfer);
  });
}

export async function updateAccountingTransferResult(input: {
  transferId: string;
  transferStatus: "submitted" | "failed";
  acknowledgementStatus: AccountingAcknowledgementStatus;
  provider: string;
  externalAccountingReference?: string | null;
  failureCode?: string | null;
  failureSummary?: string | null;
}) {
  const db = getFirebaseAdminDb();
  const reference = db.collection(transferCollection).doc(input.transferId);

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists) throw new AccountingTransferNotFoundError();
    const existing = parseTransfer(snapshot.id, snapshot.data());
    if (!existing) throw new AccountingTransferDataError();
    if (existing.transferStatus !== "submitting") {
      throw new AccountingTransferConflictError("This Accounting transfer is no longer awaiting an adapter response.");
    }

    const now = Timestamp.now();
    const acknowledged = input.acknowledgementStatus === "accepted"
      || input.acknowledgementStatus === "rejected";
    const failed = input.transferStatus === "failed";
    const updated: AccountingTransferRecord = withTimeline({
      ...existing,
      transferStatus: input.transferStatus,
      acknowledgementStatus: input.acknowledgementStatus,
      provider: input.provider,
      externalAccountingReference: input.externalAccountingReference ?? null,
      failureCode: input.failureCode ?? null,
      failureSummary: input.failureSummary ?? null,
      acknowledgedAt: acknowledged ? toIso(now) : null,
      failedAt: failed ? toIso(now) : null,
      updatedAt: toIso(now),
      timeline: [],
    });

    transaction.update(reference, {
      transferStatus: updated.transferStatus,
      acknowledgementStatus: updated.acknowledgementStatus,
      provider: updated.provider,
      externalAccountingReference: updated.externalAccountingReference,
      failureCode: updated.failureCode,
      failureSummary: updated.failureSummary,
      acknowledgedAt: updated.acknowledgedAt ? now : null,
      failedAt: updated.failedAt ? now : null,
      updatedAt: now,
    });

    return updated;
  });
}

export async function writeAccountingTransferAuditEvent(input: {
  transfer: AccountingTransferRecord;
  action: "Transfer Created" | "Submitted" | "Acknowledged" | "Rejected" | "Failed";
  occurredAt: string;
}) {
  const id = `${input.transfer.transferId}:${input.action.toLowerCase().replaceAll(" ", "-")}:${input.occurredAt}`;
  const automatic = input.action === "Acknowledged" || input.action === "Rejected" || input.action === "Failed";
  await getFirebaseAdminDb().collection(auditCollection).doc(id).set({
    eventId: id,
    action: input.action,
    transferId: input.transfer.transferId,
    payrollResultId: input.transfer.payrollResultId,
    payrollBatchId: input.transfer.payrollBatchId,
    payrollHandoffId: input.transfer.payrollHandoffId,
    externalPayrollReference: input.transfer.externalPayrollReference,
    externalAccountingReference: input.transfer.externalAccountingReference,
    actor: automatic
      ? {
        uid: `integration:${input.transfer.provider}`,
        username: input.transfer.provider,
        displayName: "Accounting Integration",
        role: "system",
        type: "integration",
      }
      : { ...input.transfer.submittedBy, type: "user" },
    occurredAt: Timestamp.fromDate(new Date(input.occurredAt)),
    createdAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

export type AccountingTransferAuditEventRecord = {
  id: string;
  action: string;
  occurredAt: string;
};

export async function listAccountingTransferAuditEvents(
  transferId: string,
): Promise<AccountingTransferAuditEventRecord[]> {
  const snapshots = await getFirebaseAdminDb()
    .collection(auditCollection)
    .where("transferId", "==", transferId)
    .get();

  return snapshots.docs
    .map((snapshot) => {
      const data = snapshot.data();
      const action = data.action;
      const occurredAt = data.occurredAt;
      if (typeof action !== "string" || !(occurredAt instanceof Timestamp)) return null;

      return {
        id: snapshot.id,
        action,
        occurredAt: occurredAt.toDate().toISOString(),
      };
    })
    .filter((event): event is AccountingTransferAuditEventRecord => event !== null)
    .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt));
}

export { provider as accountingAdapterProvider };
