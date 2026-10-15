import "server-only";

import { FieldValue, Timestamp, type DocumentData } from "firebase-admin/firestore";

import { getFirebaseAdminDb } from "@/lib/firebase/server";
import {
  getPrismaAuditEventById,
  listPrismaAuditEvents,
  recordPrismaAuditEvent,
} from "@/server/repositories/audit/prisma-audit.repository";
import type { AdminAuditActorType, AdminAuditOutcome } from "@/types/admin-audit-logs";

const canonicalCollection = "auditEvents";
const legacyCollections = [
  "adminAuditEvents",
  "adminUserAccountAuditEvents",
  "payrollResultAuditEvents",
  "accountingTransferAuditEvents",
] as const;
const collectionsForRead = [canonicalCollection, ...legacyCollections] as const;

export type AuditStoredEvent = {
  id: string;
  eventType: string;
  action: string;
  module: string;
  actor: {
    type: AdminAuditActorType;
    uid: string | null;
    displayName: string;
    role: string | null;
  };
  target: {
    type: string;
    id: string | null;
    reference: string;
    label: string;
  };
  outcome: AdminAuditOutcome;
  summary: string;
  metadata: Record<string, unknown>;
  occurredAt: string;
};

export type AuditEventInput = Omit<AuditStoredEvent, "id" | "occurredAt"> & {
  id?: string;
  occurredAt?: Date;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function timestampValue(value: unknown): string | null {
  return value instanceof Timestamp ? value.toDate().toISOString() : null;
}

function actorType(value: unknown): AdminAuditActorType {
  return value === "integration" ? "integration" : value === "system" ? "system" : "user";
}

function outcome(value: unknown, fallback: AdminAuditOutcome): AdminAuditOutcome {
  return value === "Failed" || value === "failed" ? "Failed"
    : value === "Blocked" || value === "blocked" || value === "Rejected" || value === "rejected" ? "Blocked"
      : fallback;
}

function mapCanonical(id: string, data: DocumentData): AuditStoredEvent | null {
  const eventType = stringValue(data.eventType);
  const action = stringValue(data.action);
  const eventModule = stringValue(data.module);
  const occurredAt = timestampValue(data.occurredAt);
  const actor = isRecord(data.actor) ? data.actor : null;
  const target = isRecord(data.target) ? data.target : null;
  if (!eventType || !action || !eventModule || !occurredAt || !actor || !target) return null;
  const displayName = stringValue(actor.displayName);
  const targetType = stringValue(target.type);
  const targetReference = stringValue(target.reference);
  const targetLabel = stringValue(target.label);
  if (!displayName || !targetType || !targetReference || !targetLabel) return null;
  return {
    id,
    eventType,
    action,
    module: eventModule,
    actor: { type: actorType(actor.type), uid: stringValue(actor.uid), displayName, role: stringValue(actor.role) },
    target: { type: targetType, id: stringValue(target.id), reference: targetReference, label: targetLabel },
    outcome: outcome(data.outcome, "Successful"),
    summary: stringValue(data.summary) ?? action,
    metadata: isRecord(data.metadata) ? data.metadata : {},
    occurredAt,
  };
}

function mapLegacy(id: string, collection: string, data: DocumentData): AuditStoredEvent | null {
  const occurredAt = timestampValue(data.occurredAt);
  if (!occurredAt) return null;

  if (collection === "adminAuditEvents") {
    const actor = isRecord(data.actor) ? data.actor : null;
    const target = isRecord(data.target) ? data.target : null;
    const action = stringValue(data.action);
    const eventModule = stringValue(data.module);
    if (!actor || !target || !action || !eventModule) return null;
    const displayName = stringValue(actor.displayName);
    const targetType = stringValue(target.type);
    const targetLabel = stringValue(target.label);
    if (!displayName || !targetType || !targetLabel) return null;
    return {
      id: `${collection}:${id}`,
      eventType: action === "role_permissions_updated" ? "admin.role_permissions.updated" : `admin.${action}`,
      action: action === "role_permissions_updated" ? "Role Permissions Updated" : action,
      module: eventModule === "roles-permissions" ? "Roles & Permissions" : eventModule,
      actor: { type: "user", uid: stringValue(actor.uid), displayName, role: stringValue(actor.role) },
      target: { type: targetType, id: stringValue(target.id), reference: stringValue(target.id) ?? id, label: targetLabel },
      outcome: "Successful",
      summary: action === "role_permissions_updated" ? "Role permissions were updated." : action,
      metadata: isRecord(data.metadata) ? data.metadata : {},
      occurredAt,
    };
  }

  if (collection === "adminUserAccountAuditEvents") {
    const action = stringValue(data.action);
    const actorName = stringValue(data.actorDisplayName);
    const actorUid = stringValue(data.actorUid);
    const targetUid = stringValue(data.targetUid);
    const targetName = stringValue(data.targetDisplayName);
    if (!action || !actorName || !actorUid || !targetUid || !targetName) return null;
    const actionLabel = action === "profile_updated"
      ? "User Account Updated"
      : action === "role_changed"
        ? "User Role Changed"
      : `User Account ${action.charAt(0).toUpperCase()}${action.slice(1)}`;
    const changes = Array.isArray(data.changes) ? data.changes : [];
    const roleChange = changes.find((change) => (
      isRecord(change) && change.field === "role"
    ));
    const metadata: Record<string, unknown> = { changes };
    if (action === "role_changed" && roleChange) {
      metadata.previousRole = stringValue(roleChange.from);
      metadata.newRole = stringValue(roleChange.to);
    }
    return {
      id: `${collection}:${id}`,
      eventType: `admin.user.${action}`,
      action: actionLabel,
      module: "User Accounts",
      actor: { type: "user", uid: actorUid, displayName: actorName, role: stringValue(data.actorRole) },
      target: { type: "user_account", id: targetUid, reference: targetUid, label: targetName },
      outcome: "Successful",
      summary: "A user account was changed by an administrator.",
      metadata,
      occurredAt,
    };
  }

  const actor = isRecord(data.actor) ? data.actor : null;
  const actorName = stringValue(actor?.displayName);
  const action = stringValue(data.action);
  if (!actor || !actorName || !action) return null;
  const isPayroll = collection === "payrollResultAuditEvents";
  const targetId = stringValue(isPayroll ? data.resultId : data.transferId);
  if (!targetId) return null;
  const isFailure = /failed|rejected/i.test(action);
  const isAcknowledged = /acknowledged|accepted/i.test(action);
  const eventModule = isPayroll ? "Payroll Integration" : "Accounting Integration";
  const eventType = isPayroll
    ? action.toLowerCase().includes("received") ? "payroll.result.received" : "payroll.result.updated"
    : action.toLowerCase().includes("acknowledged") ? "accounting.transfer.acknowledged"
      : action.toLowerCase().includes("rejected") ? "accounting.transfer.rejected"
        : action.toLowerCase().includes("failed") ? "accounting.transfer.failed"
          : action.toLowerCase().includes("submitted") ? "accounting.transfer.submitted" : "accounting.transfer.created";
  return {
    id: `${collection}:${id}`,
    eventType,
    action,
    module: eventModule,
    actor: { type: actor.type === "system" ? "integration" : "user", uid: stringValue(actor.uid), displayName: actorName, role: stringValue(actor.role) },
    target: { type: isPayroll ? "payroll_result" : "accounting_transfer", id: targetId, reference: stringValue(isPayroll ? data.externalPayrollReference : data.externalAccountingReference) ?? targetId, label: targetId },
    outcome: isFailure ? "Failed" : isAcknowledged || !isFailure ? "Successful" : "Blocked",
    summary: action,
    metadata: {
      batchId: stringValue(data.batchId),
      transferId: stringValue(data.transferId),
      resultId: stringValue(data.resultId),
      failureCode: stringValue(data.failureCode),
    },
    occurredAt,
  };
}

export async function recordAuditEvent(input: AuditEventInput): Promise<void> {
  await recordPrismaAuditEvent(input);
  return;

  /* istanbul ignore next -- legacy Firestore implementation retained below for migration reference. */
  const db = getFirebaseAdminDb();
  const eventId = input.id ?? db.collection(canonicalCollection).doc().id;
  await db.collection(canonicalCollection).doc(eventId).set({
    eventType: input.eventType,
    action: input.action,
    module: input.module,
    actor: input.actor,
    target: input.target,
    outcome: input.outcome,
    summary: input.summary,
    metadata: input.metadata,
    occurredAt: Timestamp.fromDate(input.occurredAt ?? new Date()),
    createdAt: FieldValue.serverTimestamp(),
  });
}

export async function listAuditEvents(limitPerCollection = 250): Promise<AuditStoredEvent[]> {
  const result = await listPrismaAuditEvents({ page: 1, pageSize: Math.min(200, Math.max(1, limitPerCollection)) });
  return result.rows;

  /* istanbul ignore next -- legacy Firestore implementation retained below for migration reference. */
  const db = getFirebaseAdminDb();
  const snapshots = await Promise.all(collectionsForRead.map((collection) => (
    db.collection(collection).orderBy("occurredAt", "desc").limit(limitPerCollection).get()
  )));
  const events = snapshots.flatMap((snapshot, index) => snapshot.docs.flatMap((doc) => {
    const raw = doc.data();
    if (!raw) return [];
    const event = index === 0
      ? mapCanonical(doc.id, raw as DocumentData)
      : mapLegacy(doc.id, collectionsForRead[index]!, raw as DocumentData);
    return event ? [event] : [];
  }));
  const unique = new Map(events.map((event) => [event.id, event]));
  return Array.from(unique.values()).sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));
}

export async function getAuditEventById(id: string): Promise<AuditStoredEvent | null> {
  return getPrismaAuditEventById(id);

  /* istanbul ignore next -- legacy Firestore implementation retained below for migration reference. */
  const db = getFirebaseAdminDb();
  const canonicalSnapshot = await db.collection(canonicalCollection).doc(id).get();
  if (canonicalSnapshot.exists) {
    const raw = canonicalSnapshot.data();
    return raw ? mapCanonical(canonicalSnapshot.id, raw as DocumentData) : null;
  }

  const legacyCollectionCandidate = legacyCollections.find((collection) => id.startsWith(`${collection}:`));
  if (!legacyCollectionCandidate) return null;
  const legacyCollection = legacyCollectionCandidate!;
  const documentId = id.slice(legacyCollection.length + 1);
  const snapshot = await db.collection(legacyCollection).doc(documentId).get();
  if (!snapshot.exists) return null;
  const raw = snapshot.data();
  return raw ? mapLegacy(snapshot.id, legacyCollection, raw as DocumentData) : null;
}
