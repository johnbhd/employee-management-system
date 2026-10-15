import "server-only";

export type DocumentData = Record<string, any>;

type LegacySnapshot = {
    id: string;
    exists: boolean;
    data(): DocumentData;
};

type LegacyQuerySnapshot = {
    docs: LegacySnapshot[];
};

type LegacyDocument = {
    id: string;
    get(): Promise<LegacySnapshot>;
    set(data: DocumentData, options?: unknown): Promise<void>;
    update(data: DocumentData, ...args: unknown[]): Promise<void>;
    delete(): Promise<void>;
    collection(name: string): LegacyCollection;
};

type LegacyQuery = {
    where(field: string, operator: string, value: unknown): LegacyQuery;
    orderBy(field: string, direction?: string): LegacyQuery;
    limit(value: number): LegacyQuery;
    get(): Promise<LegacyQuerySnapshot>;
};

type LegacyCollection = LegacyQuery & {
    doc(id?: string): LegacyDocument;
    add(data: DocumentData): Promise<LegacyDocument>;
    collection(name: string): LegacyCollection;
};

type LegacyTransaction = {
    get(reference: LegacyDocument): Promise<LegacySnapshot>;
    set(reference: LegacyDocument, data: DocumentData, options?: unknown): void;
    create(reference: LegacyDocument, data: DocumentData): void;
    update(reference: LegacyDocument, data: DocumentData, ...args: unknown[]): void;
    delete(reference: LegacyDocument): void;
};

type LegacyStore = {
    collection(name: string): LegacyCollection;
    runTransaction<T>(callback: (transaction: LegacyTransaction) => Promise<T>): Promise<T>;
};

/**
 * Compatibility value object for repository DTOs that still expose timestamp
 * methods to the existing service layer. It deliberately has no Firebase
 * dependency; PostgreSQL/Prisma is the only runtime persistence source.
 */
export class RepositoryTimestamp {
    private constructor(private readonly value: Date) {}

    static fromDate(value: Date): RepositoryTimestamp {
        return new RepositoryTimestamp(new Date(value.getTime()));
    }

    static now(): RepositoryTimestamp {
        return RepositoryTimestamp.fromDate(new Date());
    }

    toDate(): Date {
        return new Date(this.value.getTime());
    }

    toMillis(): number {
        return this.value.getTime();
    }
}

/**
 * Kept only so unreachable legacy compatibility branches remain type-safe
 * while they are removed incrementally. No application path calls this.
 */
export const legacyFieldValue = {
    serverTimestamp(): null {
        return null;
    },
};

export function getDisabledLegacyStore(): LegacyStore {
    throw new Error("Legacy Firestore persistence is disabled; use Prisma repositories.");
}

export function toRepositoryTimestamp(value: string | Date | null | undefined): RepositoryTimestamp | null {
    if (value === null || value === undefined) return null;
    return RepositoryTimestamp.fromDate(value instanceof Date ? value : new Date(value));
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
