import "server-only";

import type { DocumentData } from "firebase-admin/firestore";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { getFirebaseAdminDb } from "@/lib/firebase/server";
import type { ApplicationRole } from "@/lib/auth/roles";
import type {
  AdminUserAccountAuditEvent,
} from "@/types/admin-user-accounts";
import { listPrismaAuditEvents, recordPrismaAuditEvent } from "@/server/repositories/audit/prisma-audit.repository";

const auditCollection = "adminUserAccountAuditEvents";

type AuditAction = AdminUserAccountAuditEvent["action"];

type AuditChange = {
  field: string;
  from: string | null;
  to: string | null;
};

function getString(data: DocumentData, field: string): string | null {
  const value = data[field];
  return typeof value === "string" && value.trim() ? value : null;
}

function getChanges(value: unknown): AuditChange[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((change) => {
    if (!change || typeof change !== "object") return [];
    const candidate = change as Record<string, unknown>;
    const field = typeof candidate.field === "string" ? candidate.field : null;
    const from = candidate.from === null || typeof candidate.from === "string"
      ? candidate.from
      : undefined;
    const to = candidate.to === null || typeof candidate.to === "string"
      ? candidate.to
      : undefined;

    return field && from !== undefined && to !== undefined
      ? [{ field, from, to }]
      : [];
  });
}

function parseAction(value: unknown): AuditAction | null {
  return value === "created"
    || value === "profile_updated"
    || value === "role_changed"
    || value === "enabled"
    || value === "disabled"
    || value === "deleted"
    ? value
    : null;
}

function parseAuditEvent(
  id: string,
  data: DocumentData | undefined,
): AdminUserAccountAuditEvent | null {
  if (!data) return null;

  const action = parseAction(data.action);
  const actorUid = getString(data, "actorUid");
  const actorDisplayName = getString(data, "actorDisplayName");
  const targetUid = getString(data, "targetUid");
  const targetDisplayName = getString(data, "targetDisplayName");
  const occurredAt = data.occurredAt instanceof Timestamp
    ? data.occurredAt.toDate().toISOString()
    : null;

  if (!action || !actorUid || !actorDisplayName || !targetUid || !targetDisplayName || !occurredAt) {
    return null;
  }

  return {
    id,
    action,
    actorUid,
    actorDisplayName,
    targetUid,
    targetDisplayName,
    changes: getChanges(data.changes),
    occurredAt,
  };
}

export async function writeAdminUserAccountAuditEvent(input: {
  action: AuditAction;
  actor: { uid: string; displayName: string; role: ApplicationRole };
  target: { uid: string; displayName: string };
  changes?: AuditChange[];
  occurredAt?: Date;
}): Promise<void> {
  await recordPrismaAuditEvent({
    eventType: `admin.user.${input.action}`,
    action: input.action,
    module: "User Accounts",
    actor: { type: "user", uid: input.actor.uid, displayName: input.actor.displayName, role: input.actor.role },
    target: { type: "user_account", id: input.target.uid, reference: input.target.uid, label: input.target.displayName },
    outcome: "Successful",
    summary: "A user account was changed by an administrator.",
    metadata: { changes: input.changes ?? [], targetUid: input.target.uid, targetDisplayName: input.target.displayName },
    occurredAt: input.occurredAt,
  });
  return;

  /* istanbul ignore next -- legacy Firestore implementation retained below for migration reference. */
  await getFirebaseAdminDb().collection(auditCollection).add({
    action: input.action,
    actorUid: input.actor.uid,
    actorDisplayName: input.actor.displayName,
    actorRole: input.actor.role,
    targetUid: input.target.uid,
    targetDisplayName: input.target.displayName,
    changes: input.changes ?? [],
    occurredAt: Timestamp.fromDate(input.occurredAt ?? new Date()),
    createdAt: FieldValue.serverTimestamp(),
  });
}

export async function listAdminUserAccountAuditEvents(
  limit = 20,
): Promise<AdminUserAccountAuditEvent[]> {
  const result = await listPrismaAuditEvents({ page: 1, pageSize: Math.min(200, Math.max(1, limit)), module: "User Accounts" });
  return result.rows.map((event) => {
    const metadata = event.metadata;
    const changes = Array.isArray(metadata.changes)
      ? metadata.changes.flatMap((change) => {
        if (!change || typeof change !== "object") return [];
        const item = change as Record<string, unknown>;
        return typeof item.field === "string"
          && (item.from === null || typeof item.from === "string")
          && (item.to === null || typeof item.to === "string")
          ? [{ field: item.field, from: item.from as string | null, to: item.to as string | null }]
          : [];
      })
      : [];
    const action = event.eventType.replace(/^admin\.user\./, "");
    return {
      id: event.id,
      action: action === "role_changed" || action === "profile_updated" || action === "created" || action === "enabled" || action === "disabled" || action === "deleted"
        ? action
        : "profile_updated",
      actorUid: event.actor.uid ?? "system",
      actorDisplayName: event.actor.displayName,
      targetUid: event.target.id ?? "unknown",
      targetDisplayName: event.target.label,
      changes,
      occurredAt: event.occurredAt,
    };
  });

  /* istanbul ignore next -- legacy Firestore implementation retained below for migration reference. */
  const snapshots = await getFirebaseAdminDb()
    .collection(auditCollection)
    .orderBy("occurredAt", "desc")
    .limit(limit)
    .get();

  return snapshots.docs
    .map((snapshot) => parseAuditEvent(snapshot.id, snapshot.data()))
    .filter((event): event is AdminUserAccountAuditEvent => event !== null);
}
