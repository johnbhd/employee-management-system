import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { getFirebaseAdminDb } from "@/lib/firebase/server";
import type { ApplicationRole } from "@/lib/auth/roles";

const auditCollection = "adminAuditEvents";

export async function writeAdminAuditEvent(input: {
  action: string;
  module: string;
  actor: { uid: string; displayName: string; role: ApplicationRole };
  target: { type: string; id: string; label: string };
  metadata: Record<string, unknown>;
}): Promise<void> {
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
