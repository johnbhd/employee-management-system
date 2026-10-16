import "server-only";

import type { SessionUser } from "@/types/auth";
import type {
    QrAttendanceAction,
    QrAttendanceStatus,
} from "@/types/attendance-qr";

import { determineQrAttendanceAction } from "@/server/attendance/qr/qr-attendance-state";
import {
    getPrismaAttendanceByEmployeeAndDate,
    getPrismaAttendanceById,
    listPrismaAttendance,
    recordPrismaQrAttendance,
    type PrismaAttendanceView,
} from "@/server/repositories/attendance/prisma-attendance.repository";
import {
    getDisabledLegacyStore as getFirebaseAdminDb,
    RepositoryTimestamp as Timestamp,
    type DocumentData,
    toRepositoryOperator,
    toRepositoryRecord,
    toRepositoryTimestamp,
} from "@/server/repositories/prisma/prisma-compat";

const attendanceCollection = "attendance";

type ScannerOperator = Pick<
    SessionUser,
    "uid" | "username" | "displayName" | "role"
>;

export type QrAttendanceOperatorSnapshot = ScannerOperator;

export type StoredAttendanceCorrectionMetadata = {
    requestId: string;
    correctedAt: Timestamp;
    correctedBy: QrAttendanceOperatorSnapshot;
};

export type StoredAttendanceHrVerification = {
    status: "verified";
    verifiedAt: Timestamp;
    verifiedBy: QrAttendanceOperatorSnapshot;
};

export type StoredQrAttendanceRecord = {
    employeeId: string;
    attendanceDate: string;
    timeIn: Timestamp;
    timeOut: Timestamp | null;
    timeInSource: "QR" | "BUNDY";
    timeOutSource: "QR" | "BUNDY" | null;
    status: QrAttendanceStatus;
    timeInOperator: QrAttendanceOperatorSnapshot;
    timeOutOperator: QrAttendanceOperatorSnapshot | null;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    correction?: StoredAttendanceCorrectionMetadata;
    hrVerification?: StoredAttendanceHrVerification;
};

export type QrAttendanceRepositoryResult = {
    action: QrAttendanceAction;
    record: StoredQrAttendanceRecord;
};

export type AttendanceMonitoringRepositoryFilters = {
    attendanceDate?: string | null;
    employeeId?: string | null;
    status?: QrAttendanceStatus | null;
    source?: "QR" | null;
};

export type AttendanceReportRepositoryFilters = {
    attendanceDate?: string | null;
    attendanceMonth?: string | null;
    employeeId?: string | null;
    status?: QrAttendanceStatus | null;
};

export class QrAttendanceDataError extends Error {
    readonly code = "QR_ATTENDANCE_DATA_INVALID";

    constructor() {
        super("The attendance record has an invalid shape.");
        this.name = "QrAttendanceDataError";
    }
}

function toScannerOperator(value: unknown, fallbackRole: "admin" | "hr" = "admin"): QrAttendanceOperatorSnapshot {
    const operator = toRepositoryOperator(value, fallbackRole);
    return {
        uid: operator.uid,
        username: operator.username,
        displayName: operator.displayName,
        role: operator.role === "hr" ? "hr" : "admin",
    };
}

function toPrismaAttendanceRecord(record: PrismaAttendanceView): StoredQrAttendanceRecord {
    const correction = toRepositoryRecord(record.correctionMetadata);
    const correctedAt = typeof correction.correctedAt === "string"
        ? toRepositoryTimestamp(correction.correctedAt)
        : null;
    const correctedBy = correction.correctedBy
        ? toScannerOperator(correction.correctedBy)
        : null;
    const verification = record.hrVerificationStatus === "verified" && record.hrVerifiedAt
        ? {
            status: "verified" as const,
            verifiedAt: toRepositoryTimestamp(record.hrVerifiedAt) as Timestamp,
            verifiedBy: toScannerOperator(record.hrVerifiedBySnapshot, "hr"),
        }
        : undefined;

    return {
        employeeId: record.employeeId,
        attendanceDate: record.attendanceDate,
        timeIn: toRepositoryTimestamp(record.timeIn) as Timestamp,
        timeOut: toRepositoryTimestamp(record.timeOut),
        timeInSource: record.timeInSource,
        timeOutSource: record.timeOutSource,
        status: record.status,
        timeInOperator: toScannerOperator(record.timeInActorSnapshot),
        timeOutOperator: record.timeOutActorSnapshot ? toScannerOperator(record.timeOutActorSnapshot) : null,
        createdAt: toRepositoryTimestamp(record.createdAt) as Timestamp,
        updatedAt: toRepositoryTimestamp(record.updatedAt) as Timestamp,
        ...(correction.requestId && correctedAt && correctedBy
            ? { correction: { requestId: correction.requestId as string, correctedAt, correctedBy } }
            : {}),
        ...(verification ? { hrVerification: verification } : {}),
    };
}

function toPrismaAttendanceResult(result: Awaited<ReturnType<typeof recordPrismaQrAttendance>>): QrAttendanceRepositoryResult {
    return { action: result.action, record: toPrismaAttendanceRecord(result.record) };
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function getRequiredString(
    data: Record<string, unknown>,
    field: string,
): string | null {
    const value = data[field];

    return typeof value === "string" && value.trim() ? value : null;
}

function getTimestamp(value: unknown): Timestamp | null {
    return value instanceof Timestamp ? value : null;
}

function parseOperator(value: unknown): QrAttendanceOperatorSnapshot | null {
    if (!isRecord(value)) {
        return null;
    }

    const uid = getRequiredString(value, "uid");
    const username = getRequiredString(value, "username");
    const displayName = getRequiredString(value, "displayName");
    const role = value.role;

    if (
        !uid
        || !username
        || !displayName
        || (role !== "admin" && role !== "hr")
    ) {
        return null;
    }

    return {
        uid,
        username,
        displayName,
        role,
    };
}

function parseCorrectionMetadata(
    value: unknown,
): StoredAttendanceCorrectionMetadata | undefined | null {
    if (value === undefined) {
        return undefined;
    }

    if (!isRecord(value)) {
        return null;
    }

    const requestId = getRequiredString(value, "requestId");
    const correctedAt = getTimestamp(value.correctedAt);
    const correctedBy = parseOperator(value.correctedBy);

    if (!requestId || !correctedAt || !correctedBy) {
        return null;
    }

    return {
        requestId,
        correctedAt,
        correctedBy,
    };
}

function parseHrVerificationMetadata(
    value: unknown,
): StoredAttendanceHrVerification | undefined | null {
    if (value === undefined) {
        return undefined;
    }

    if (!isRecord(value)) {
        return null;
    }

    const status = value.status;
    const verifiedAt = getTimestamp(value.verifiedAt);
    const verifiedBy = parseOperator(value.verifiedBy);

    if (status !== "verified" || !verifiedAt || !verifiedBy || verifiedBy.role !== "hr") {
        return null;
    }

    return {
        status,
        verifiedAt,
        verifiedBy,
    };
}

export function parseStoredQrAttendanceRecord(
    data: DocumentData | undefined,
): StoredQrAttendanceRecord | null {
    if (!data) {
        return null;
    }

    const employeeId = getRequiredString(data, "employeeId");
    const attendanceDate = getRequiredString(data, "attendanceDate");
    const timeIn = getTimestamp(data.timeIn);
    const timeOut = data.timeOut === null || data.timeOut === undefined
        ? null
        : getTimestamp(data.timeOut);
    const timeInSource = data.timeInSource;
    const timeOutSource = data.timeOutSource === null
        || data.timeOutSource === undefined
        ? null
        : data.timeOutSource;
    const status = data.status;
    const timeInOperator = parseOperator(data.timeInOperator);
    const timeOutOperator = data.timeOutOperator === null
        || data.timeOutOperator === undefined
        ? null
        : parseOperator(data.timeOutOperator);
    const createdAt = getTimestamp(data.createdAt);
    const updatedAt = getTimestamp(data.updatedAt);
    const correction = parseCorrectionMetadata(data.correction);
    const hrVerification = parseHrVerificationMetadata(data.hrVerification);

    if (
        !employeeId
        || !attendanceDate
        || !timeIn
        || (data.timeOut !== null
            && data.timeOut !== undefined
            && !timeOut)
        || timeInSource !== "QR"
        || (timeOut !== null
            && timeOutSource !== "QR"
            && !correction)
        || (timeOut === null && timeOutSource !== null)
        || (status !== "present" && status !== "completed")
        || !timeInOperator
        || (data.timeOutOperator !== null
            && data.timeOutOperator !== undefined
            && !timeOutOperator)
        || !createdAt
        || !updatedAt
        || correction === null
        || hrVerification === null
    ) {
        return null;
    }

    return {
        employeeId,
        attendanceDate,
        timeIn,
        timeOut,
        timeInSource,
        timeOutSource,
        status,
        timeInOperator,
        timeOutOperator,
        createdAt,
        updatedAt,
        ...(correction ? { correction } : {}),
        ...(hrVerification ? { hrVerification } : {}),
    };
}

function toOperatorSnapshot(
    operator: ScannerOperator,
): QrAttendanceOperatorSnapshot {
    return {
        uid: operator.uid,
        username: operator.username,
        displayName: operator.displayName,
        role: operator.role,
    };
}

export function getAttendanceDocumentId(
    employeeId: string,
    attendanceDate: string,
) {
    return `${employeeId}_${attendanceDate}`;
}

function getNextMonthDateKey(month: string) {
    const [year, monthNumber] = month.split("-").map(Number);
    const date = new Date(Date.UTC(year, monthNumber, 1));

    return [
        date.getUTCFullYear(),
        String(date.getUTCMonth() + 1).padStart(2, "0"),
        String(date.getUTCDate()).padStart(2, "0"),
    ].join("-");
}

export async function getAttendanceByRecordId(
    attendanceRecordId: string,
): Promise<StoredQrAttendanceRecord | null> {
    const prismaRecord = await getPrismaAttendanceById(attendanceRecordId);
    return prismaRecord ? toPrismaAttendanceRecord(prismaRecord) : null;

    /* istanbul ignore next -- legacy Firestore implementation retained below for migration reference. */
    const snapshot = await getFirebaseAdminDb()
        .collection(attendanceCollection)
        .doc(attendanceRecordId)
        .get();

    if (!snapshot.exists) {
        return null;
    }

    const record = parseStoredQrAttendanceRecord(snapshot.data());

    if (!record) {
        throw new QrAttendanceDataError();
    }

    return record;
}

export async function getAttendanceByEmployeeAndDate(
    employeeId: string,
    attendanceDate: string,
): Promise<StoredQrAttendanceRecord | null> {
    const prismaRecord = await getPrismaAttendanceByEmployeeAndDate(employeeId, attendanceDate);
    return prismaRecord ? toPrismaAttendanceRecord(prismaRecord) : null;

    /* istanbul ignore next -- legacy Firestore implementation retained below for migration reference. */
    const snapshot = await getFirebaseAdminDb()
        .collection(attendanceCollection)
        .doc(getAttendanceDocumentId(employeeId, attendanceDate))
        .get();

    if (!snapshot.exists) {
        return null;
    }

    const record = parseStoredQrAttendanceRecord(snapshot.data());

    if (!record) {
        throw new QrAttendanceDataError();
    }

    return record;
}

export async function listAttendanceByEmployee(
    employeeId: string,
): Promise<Array<{ id: string; record: StoredQrAttendanceRecord }>> {
    const prismaResult = await listPrismaAttendance({ employeeId, page: 1, pageSize: 200 });
    return prismaResult.rows.map((record) => ({ id: record.id, record: toPrismaAttendanceRecord(record) }));

    /* istanbul ignore next -- legacy Firestore implementation retained below for migration reference. */
    const snapshots = await getFirebaseAdminDb()
        .collection(attendanceCollection)
        .where("employeeId", "==", employeeId)
        .get();

    return snapshots.docs
        .map((snapshot) => {
            const record = parseStoredQrAttendanceRecord(snapshot.data());

            if (!record || record.employeeId !== employeeId) {
                throw new QrAttendanceDataError();
            }

            return {
                id: snapshot.id,
                record,
            };
        })
        .sort((left, right) => {
            const dateOrder = right.record.attendanceDate.localeCompare(
                left.record.attendanceDate,
            );

            return dateOrder || right.id.localeCompare(left.id);
        });
}

export async function listAttendanceByDate(
    attendanceDate: string,
): Promise<Array<{ id: string; record: StoredQrAttendanceRecord }>> {
    const prismaResult = await listPrismaAttendance({ attendanceDate, page: 1, pageSize: 200 });
    return prismaResult.rows.map((record) => ({ id: record.id, record: toPrismaAttendanceRecord(record) }));

    /* istanbul ignore next -- legacy Firestore implementation retained below for migration reference. */
    const snapshots = await getFirebaseAdminDb()
        .collection(attendanceCollection)
        .where("attendanceDate", "==", attendanceDate)
        .get();

    return snapshots.docs
        .map((snapshot) => {
            const record = parseStoredQrAttendanceRecord(snapshot.data());

            if (!record || record.attendanceDate !== attendanceDate) {
                throw new QrAttendanceDataError();
            }

            return {
                id: snapshot.id,
                record,
            };
        })
        .sort((left, right) => {
            const timeOrder = right.record.timeIn.toMillis()
                - left.record.timeIn.toMillis();

            return timeOrder || right.id.localeCompare(left.id);
        });
}

export async function listAttendanceForMonitoring(
    filters: AttendanceMonitoringRepositoryFilters = {},
): Promise<Array<{ id: string; record: StoredQrAttendanceRecord }>> {
    const result = await listPrismaAttendance({
        attendanceDate: filters.attendanceDate,
        employeeId: filters.employeeId,
        status: filters.status,
        source: filters.source,
        page: 1,
        pageSize: 200,
    });
    return result.rows.map((record) => ({ id: record.id, record: toPrismaAttendanceRecord(record) }));

    /* istanbul ignore next -- legacy Firestore implementation retained below for migration reference. */
    const collection = getFirebaseAdminDb().collection(attendanceCollection);
    const snapshots = filters.attendanceDate
        ? await collection
            .where("attendanceDate", "==", filters.attendanceDate)
            .get()
        : filters.employeeId
            ? await collection.where("employeeId", "==", filters.employeeId).get()
            : await collection.get();

    return snapshots.docs
        .map((snapshot) => {
            const record = parseStoredQrAttendanceRecord(snapshot.data());

            if (!record) {
                throw new QrAttendanceDataError();
            }

            return { id: snapshot.id, record };
        })
        .filter(({ record }) => {
            if (filters.attendanceDate && record.attendanceDate !== filters.attendanceDate) {
                return false;
            }

            if (filters.employeeId && record.employeeId !== filters.employeeId) {
                return false;
            }

            if (filters.status && record.status !== filters.status) {
                return false;
            }

            return !filters.source
                || record.timeInSource === filters.source
                || record.timeOutSource === filters.source;
        })
        .sort((left, right) => {
            const dateOrder = right.record.attendanceDate.localeCompare(
                left.record.attendanceDate,
            );
            const timeOrder = right.record.timeIn.toMillis()
                - left.record.timeIn.toMillis();

            return dateOrder || timeOrder || right.id.localeCompare(left.id);
        });
}

export async function listAttendanceForReport(
    filters: AttendanceReportRepositoryFilters = {},
): Promise<Array<{ id: string; record: StoredQrAttendanceRecord }>> {
    const result = await listPrismaAttendance({
        attendanceDate: filters.attendanceDate,
        attendanceMonth: filters.attendanceMonth,
        employeeId: filters.employeeId,
        status: filters.status,
        page: 1,
        pageSize: 200,
    });
    return result.rows.map((record) => ({ id: record.id, record: toPrismaAttendanceRecord(record) }));

    /* istanbul ignore next -- legacy Firestore implementation retained below for migration reference. */
    const collection = getFirebaseAdminDb().collection(attendanceCollection);
    const snapshots = filters.attendanceDate
        ? await collection
            .where("attendanceDate", "==", filters.attendanceDate)
            .get()
        : filters.attendanceMonth
            ? await collection
                .where("attendanceDate", ">=", `${filters.attendanceMonth}-01`)
                .where("attendanceDate", "<", getNextMonthDateKey(filters.attendanceMonth ?? ""))
                .get()
            : filters.employeeId
                ? await collection.where("employeeId", "==", filters.employeeId).get()
                : await collection.get();

    return snapshots.docs
        .map((snapshot) => {
            const record = parseStoredQrAttendanceRecord(snapshot.data());

            if (!record) {
                throw new QrAttendanceDataError();
            }

            return { id: snapshot.id, record };
        })
        .filter(({ record }) => {
            if (filters.attendanceDate && record.attendanceDate !== filters.attendanceDate) {
                return false;
            }

            if (
                filters.attendanceMonth
                && !record.attendanceDate.startsWith(`${filters.attendanceMonth}-`)
            ) {
                return false;
            }

            if (filters.employeeId && record.employeeId !== filters.employeeId) {
                return false;
            }

            return !filters.status || record.status === filters.status;
        })
        .sort((left, right) => {
            const dateOrder = right.record.attendanceDate.localeCompare(
                left.record.attendanceDate,
            );
            const employeeOrder = left.record.employeeId.localeCompare(
                right.record.employeeId,
            );
            const timeOrder = right.record.timeIn.toMillis()
                - left.record.timeIn.toMillis();

            return dateOrder || employeeOrder || timeOrder || right.id.localeCompare(left.id);
        });
}

export async function recordQrAttendance(
    input: {
        employeeId: string;
        attendanceDate: string;
        occurredAt: Date;
        actualRecordedAt?: Date;
        simulated?: boolean;
        demoAttendanceTime?: string | null;
        scannerOperator: ScannerOperator;
    },
): Promise<QrAttendanceRepositoryResult> {
    return toPrismaAttendanceResult(await recordPrismaQrAttendance({
        ...input,
        scannerOperator: {
            ...input.scannerOperator,
            role: input.scannerOperator.role === "hr" ? "hr" : "admin",
        },
    }));

    /* istanbul ignore next -- legacy Firestore implementation retained below for migration reference. */
    const db = getFirebaseAdminDb();
    const attendanceReference = db
        .collection(attendanceCollection)
        .doc(getAttendanceDocumentId(input.employeeId, input.attendanceDate));
    const occurredAt = Timestamp.fromDate(input.occurredAt);
    const timeInOperator = toOperatorSnapshot(input.scannerOperator);

    return db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(attendanceReference);

        if (!snapshot.exists) {
            const record: StoredQrAttendanceRecord = {
                employeeId: input.employeeId,
                attendanceDate: input.attendanceDate,
                timeIn: occurredAt,
                timeOut: null,
                timeInSource: "QR",
                timeOutSource: null,
                status: "present",
                timeInOperator,
                timeOutOperator: null,
                createdAt: occurredAt,
                updatedAt: occurredAt,
            };

            transaction.set(attendanceReference, record);

            return {
                action: "time_in",
                record,
            } satisfies QrAttendanceRepositoryResult;
        }

        const currentRecord = parseStoredQrAttendanceRecord(snapshot.data());

        if (!currentRecord) {
            throw new QrAttendanceDataError();
        }

        const action = determineQrAttendanceAction(
            {
                timeIn: currentRecord.timeIn.toDate(),
                timeOut: currentRecord.timeOut?.toDate() ?? null,
            },
            input.occurredAt,
        );

        if (action !== "time_out") {
            return {
                action,
                record: currentRecord,
            } satisfies QrAttendanceRepositoryResult;
        }

        const updatedRecord: StoredQrAttendanceRecord = {
            ...currentRecord,
            timeOut: occurredAt,
            timeOutSource: "QR",
            status: "completed",
            timeOutOperator: timeInOperator,
            updatedAt: occurredAt,
        };

        transaction.update(attendanceReference, {
            timeOut: occurredAt,
            timeOutSource: "QR",
            status: "completed",
            timeOutOperator: timeInOperator,
            updatedAt: occurredAt,
        });

        return {
            action,
            record: updatedRecord,
        } satisfies QrAttendanceRepositoryResult;
    });
}
