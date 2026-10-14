import "server-only";

import type { Prisma } from "@prisma/client";

import {
    getRepositoryPrisma,
    toIso,
    toJson,
    toJsonObject,
} from "@/server/repositories/prisma/prisma-repository-helpers";

export type PrismaRuntimeSettingsSnapshot = {
    overrides: Record<string, unknown>;
    version: number;
    updatedAt: string | null;
    updatedBy: { uid: string; displayName: string } | null;
};

export class PrismaSettingsConflictError extends Error {}
export class PrismaSettingsDataError extends Error {}

function mapSettings(row: {
    overrides: Prisma.JsonValue;
    version: number;
    updatedAt: Date;
    updatedBySnapshot: Prisma.JsonValue | null;
} | null): PrismaRuntimeSettingsSnapshot {
    if (!row) {
        return { overrides: {}, version: 0, updatedAt: null, updatedBy: null };
    }
    const updatedBy = row.updatedBySnapshot ? toJsonObject(row.updatedBySnapshot) : null;
    return {
        overrides: toJsonObject(row.overrides),
        version: row.version,
        updatedAt: toIso(row.updatedAt),
        updatedBy: updatedBy
            && typeof updatedBy.uid === "string"
            && typeof updatedBy.displayName === "string"
            ? { uid: updatedBy.uid, displayName: updatedBy.displayName }
            : null,
    };
}

export async function getPrismaRuntimeSettings(): Promise<PrismaRuntimeSettingsSnapshot> {
    const row = await getRepositoryPrisma().systemSetting.findUnique({
        where: { settingKey: "runtime" },
        select: {
            overrides: true,
            version: true,
            updatedAt: true,
            updatedBySnapshot: true,
        },
    });
    return mapSettings(row);
}

export async function updatePrismaRuntimeSettings(input: {
    overrides: Record<string, unknown>;
    expectedVersion: number;
    updatedBy: { uid: string; displayName: string };
}): Promise<PrismaRuntimeSettingsSnapshot> {
    const prisma = getRepositoryPrisma();
    await prisma.$transaction(async (transaction) => {
        const current = await transaction.systemSetting.findUnique({
            where: { settingKey: "runtime" },
            select: { id: true, version: true },
        });
        const currentVersion = current?.version ?? 0;
        if (input.expectedVersion !== currentVersion) {
            throw new PrismaSettingsConflictError("The system settings changed since this page was opened.");
        }
        const updatedByUserId = await transaction.user.findUnique({
            where: { firebaseUid: input.updatedBy.uid },
            select: { id: true },
        });
        await transaction.systemSetting.upsert({
            where: { settingKey: "runtime" },
            create: {
                settingKey: "runtime",
                overrides: toJson(input.overrides),
                version: 1,
                updatedByUserId: updatedByUserId?.id ?? null,
                updatedBySnapshot: toJson(input.updatedBy),
            },
            update: {
                overrides: toJson(input.overrides),
                version: currentVersion + 1,
                updatedByUserId: updatedByUserId?.id ?? null,
                updatedBySnapshot: toJson(input.updatedBy),
            },
        });
    });
    return getPrismaRuntimeSettings();
}

