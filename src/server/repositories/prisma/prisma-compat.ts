import "server-only";

import { Timestamp } from "firebase-admin/firestore";

export function toRepositoryTimestamp(value: string | Date | null | undefined): Timestamp | null {
    if (value === null || value === undefined) return null;
    return Timestamp.fromDate(value instanceof Date ? value : new Date(value));
}

export function toRepositoryOperator(
    value: unknown,
    fallbackRole: "admin" | "hr" | "employee" = "hr",
) {
    const snapshot = value && typeof value === "object" && !Array.isArray(value)
        ? value as Record<string, unknown>
        : {};
    const role = snapshot.role === "admin" || snapshot.role === "hr" || snapshot.role === "employee"
        ? snapshot.role
        : fallbackRole;
    return {
        uid: typeof snapshot.uid === "string" && snapshot.uid ? snapshot.uid : "system",
        username: typeof snapshot.username === "string" && snapshot.username ? snapshot.username : "system",
        displayName: typeof snapshot.displayName === "string" && snapshot.displayName ? snapshot.displayName : "System",
        role,
    };
}

export function toRepositoryRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === "object" && !Array.isArray(value)
        ? value as Record<string, unknown>
        : {};
}
