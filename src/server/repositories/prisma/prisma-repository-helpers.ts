import "server-only";

import { Prisma, type PrismaClient } from "@prisma/client";

import { getPrismaClient } from "@/lib/prisma/server";

export { Prisma };

export type PrismaDbClient = PrismaClient | Prisma.TransactionClient;

export function getRepositoryPrisma() {
    return getPrismaClient();
}

export function toIso(value: Date | null | undefined): string | null {
    return value ? value.toISOString() : null;
}

export function toDateKey(value: Date): string {
    return value.toISOString().slice(0, 10);
}

export function toTimeKey(value: Date | null): string | null {
    return value ? value.toISOString().slice(11, 16) : null;
}

export function toUtcDate(value: string): Date {
    return new Date(`${value}T00:00:00.000Z`);
}

export function toJson(value: unknown): Prisma.InputJsonValue {
    return value as Prisma.InputJsonValue;
}

export function toJsonObject(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
    return value && typeof value === "object" && !Array.isArray(value)
        ? value as Record<string, unknown>
        : {};
}

export function toJsonArray(value: Prisma.JsonValue | null | undefined): unknown[] {
    return Array.isArray(value) ? value : [];
}

export function toDecimalString(value: Prisma.Decimal | null | undefined): string | null {
    return value === null || value === undefined ? null : value.toFixed(2);
}

export function isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function findUserIdByFirebaseUid(
    firebaseUid: string | null | undefined,
    prisma: PrismaDbClient = getRepositoryPrisma(),
): Promise<string | null> {
    if (!firebaseUid) {
        return null;
    }

    const user = await prisma.user.findUnique({
        where: { firebaseUid },
        select: { id: true },
    });

    return user?.id ?? null;
}

export function toActorSnapshot(input: {
    uid: string;
    username?: string;
    displayName: string;
    role?: string;
}) {
    return {
        uid: input.uid,
        username: input.username ?? input.uid,
        displayName: input.displayName,
        role: input.role ?? "system",
    };
}

