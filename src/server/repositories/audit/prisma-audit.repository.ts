import "server-only";

import type { AuditActorType, AuditOutcome, Prisma } from "@prisma/client";

import type { AdminAuditActorType, AdminAuditOutcome } from "@/types/admin-audit-logs";
import { normalizeAuditEventId } from "./audit-id";
import {
    findUserIdByFirebaseUid,
    getRepositoryPrisma,
    toJson,
    toJsonObject,
    type PrismaDbClient,
} from "@/server/repositories/prisma/prisma-repository-helpers";

export type PrismaAuditEventView = {
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

export type PrismaAuditEventInput = {
    id?: string;
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
    occurredAt?: Date;
    sourceCollection?: string | null;
    legacyDocumentId?: string | null;
};

function mapEvent(row: {
    id: string;
    eventType: string;
    action: string;
    module: string;
    actorType: AuditActorType;
    actorUid: string | null;
    actorSnapshot: Prisma.JsonValue;
    targetType: string;
    targetId: string | null;
    targetReference: string;
    targetLabel: string;
    outcome: AuditOutcome;
    summary: string;
    metadata: Prisma.JsonValue;
    occurredAt: Date;
}): PrismaAuditEventView {
    const actor = toJsonObject(row.actorSnapshot);
    return {
        id: row.id,
        eventType: row.eventType,
        action: row.action,
        module: row.module,
        actor: {
            type: row.actorType,
            uid: row.actorUid,
            displayName: typeof actor.displayName === "string" ? actor.displayName : "System",
            role: typeof actor.role === "string" ? actor.role : null,
        },
        target: {
            type: row.targetType,
            id: row.targetId,
            reference: row.targetReference,
            label: row.targetLabel,
        },
        outcome: row.outcome,
        summary: row.summary,
        metadata: toJsonObject(row.metadata),
        occurredAt: row.occurredAt.toISOString(),
    };
}

export async function recordPrismaAuditEvent(
    input: PrismaAuditEventInput,
    prisma: PrismaDbClient = getRepositoryPrisma(),
): Promise<void> {
    const actorUserId = await findUserIdByFirebaseUid(input.actor.uid, prisma);
    const auditId = normalizeAuditEventId(input.id);

    await prisma.auditEvent.create({
        data: {
            ...(auditId ? { id: auditId } : {}),
            eventType: input.eventType,
            action: input.action,
            module: input.module,
            actorType: input.actor.type,
            actorUserId,
            actorUid: input.actor.uid,
            actorSnapshot: toJson(input.actor),
            targetType: input.target.type,
            targetId: input.target.id,
            targetReference: input.target.reference,
            targetLabel: input.target.label,
            outcome: input.outcome,
            summary: input.summary,
            metadata: toJson(input.metadata),
            sourceCollection: input.sourceCollection ?? null,
            legacyDocumentId: input.legacyDocumentId ?? null,
            occurredAt: input.occurredAt ?? new Date(),
        },
    });
}

export async function listPrismaAuditEvents(input: {
    page?: number;
    pageSize?: number;
    from?: Date;
    to?: Date;
    actorUid?: string | null;
    action?: string | null;
    module?: string | null;
    targetType?: string | null;
    targetId?: string | null;
    outcome?: AdminAuditOutcome | null;
} = {}) {
    const page = Math.max(1, input.page ?? 1);
    const pageSize = Math.min(200, Math.max(1, input.pageSize ?? 50));
    const where: Prisma.AuditEventWhereInput = {
        ...(input.from || input.to
            ? {
                occurredAt: {
                    ...(input.from ? { gte: input.from } : {}),
                    ...(input.to ? { lte: input.to } : {}),
                },
            }
            : {}),
        ...(input.actorUid ? { actorUid: input.actorUid } : {}),
        ...(input.action ? { action: { contains: input.action, mode: "insensitive" } } : {}),
        ...(input.module ? { module: input.module } : {}),
        ...(input.targetType ? { targetType: input.targetType } : {}),
        ...(input.targetId ? { targetId: input.targetId } : {}),
        ...(input.outcome ? { outcome: input.outcome } : {}),
    };
    const [rows, total] = await Promise.all([
        getRepositoryPrisma().auditEvent.findMany({
            where,
            orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
            skip: (page - 1) * pageSize,
            take: pageSize + 1,
        }),
        getRepositoryPrisma().auditEvent.count({ where }),
    ]);
    return {
        rows: rows.slice(0, pageSize).map(mapEvent),
        total,
        hasNext: rows.length > pageSize,
    };
}

export async function getPrismaAuditEventById(id: string): Promise<PrismaAuditEventView | null> {
    const row = await getRepositoryPrisma().auditEvent.findUnique({ where: { id } });
    return row ? mapEvent(row) : null;
}

