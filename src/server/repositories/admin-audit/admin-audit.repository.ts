import "server-only";

import {
  getDisabledLegacyStore as getFirebaseAdminDb,
  legacyFieldValue as FieldValue,
  RepositoryTimestamp as Timestamp,
} from "@/server/repositories/prisma/prisma-compat";
import type { ApplicationRole } from "@/lib/auth/roles";
import { recordPrismaAuditEvent } from "@/server/repositories/audit/prisma-audit.repository";

const auditCollection = "adminAuditEvents";

export async function writeAdminAuditEvent(input: {
  action: string;
  module: string;
  actor: { uid: string; displayName: string; role: ApplicationRole };
  target: { type: string; id: string; label: string };
  metadata: Record<string, unknown>;
}): Promise<void> {
  await recordPrismaAuditEvent({
    eventType: `admin.${input.action}`,
    action: input.action,
    module: input.module,
    actor: { type: "user", uid: input.actor.uid, displayName: input.actor.displayName, role: input.actor.role },
    target: { type: input.target.type, id: input.target.id, reference: input.target.id, label: input.target.label },
    outcome: "Successful",
    summary: input.action,
    metadata: input.metadata,
  });
  return;

  /* istanbul ignore next -- legacy Firestore implementation retained below for migration reference. */
  await getFirebaseAdminDb().collection(auditCollection).add({
    action: input.action,
    module: input.module,
    actor: input.actor,
    target: input.target,
    metadata: input.metadata,
    occurredAt: Timestamp.now(),
    createdAt: FieldValue.serverTimestamp(),
  });
}
