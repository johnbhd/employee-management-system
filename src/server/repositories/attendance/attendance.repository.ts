import "server-only";

import type { DocumentData } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";

import { getFirebaseAdminDb } from "@/lib/firebase/server";
import type { SessionUser } from "@/types/auth";
import type {
    QrAttendanceAction,
    QrAttendanceStatus,
} from "@/types/attendance-qr";

import { determineQrAttendanceAction } from "@/server/attendance/qr/qr-attendance-state";

const attendanceCollection = "attendance";

type ScannerOperator = Pick<
    SessionUser,
    "uid" | "username" | "displayName" | "role"
>;

export type QrAttendanceOperatorSnapshot = ScannerOperator;

export type StoredQrAttendanceRecord = {
    employeeId: string;
    attendanceDate: string;
    timeIn: Timestamp;
    timeOut: Timestamp | null;
    timeInSource: "QR";
    timeOutSource: "QR" | null;
    status: QrAttendanceStatus;
    timeInOperator: QrAttendanceOperatorSnapshot;
    timeOutOperator: QrAttendanceOperatorSnapshot | null;
    createdAt: Timestamp;
    updatedAt: Timestamp;
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

export class QrAttendanceDataError extends Error {
    readonly code = "QR_ATTENDANCE_DATA_INVALID";

    constructor() {
        super("The attendance record has an invalid shape.");
        this.name = "QrAttendanceDataError";
    }
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

function parseAttendanceRecord(
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

    if (
        !employeeId
        || !attendanceDate
        || !timeIn
        || (data.timeOut !== null
            && data.timeOut !== undefined
            && !timeOut)
        || timeInSource !== "QR"
        || (timeOut !== null && timeOutSource !== "QR")
        || (timeOut === null && timeOutSource !== null)
        || (status !== "present" && status !== "completed")
        || !timeInOperator
        || (data.timeOutOperator !== null
            && data.timeOutOperator !== undefined
            && !timeOutOperator)
        || !createdAt
        || !updatedAt
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

function getAttendanceDocumentId(
    employeeId: string,
    attendanceDate: string,
) {
    return `${employeeId}_${attendanceDate}`;
}

export async function getAttendanceByEmployeeAndDate(
    employeeId: string,
    attendanceDate: string,
): Promise<StoredQrAttendanceRecord | null> {
    const snapshot = await getFirebaseAdminDb()
        .collection(attendanceCollection)
        .doc(getAttendanceDocumentId(employeeId, attendanceDate))
        .get();

    if (!snapshot.exists) {
        return null;
    }

    const record = parseAttendanceRecord(snapshot.data());

    if (!record) {
        throw new QrAttendanceDataError();
    }

    return record;
}

export async function listAttendanceByEmployee(
    employeeId: string,
): Promise<Array<{ id: string; record: StoredQrAttendanceRecord }>> {
    const snapshots = await getFirebaseAdminDb()
        .collection(attendanceCollection)
        .where("employeeId", "==", employeeId)
        .get();

    return snapshots.docs
        .map((snapshot) => {
            const record = parseAttendanceRecord(snapshot.data());

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
    const snapshots = await getFirebaseAdminDb()
        .collection(attendanceCollection)
        .where("attendanceDate", "==", attendanceDate)
        .get();

    return snapshots.docs
        .map((snapshot) => {
            const record = parseAttendanceRecord(snapshot.data());

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
            const record = parseAttendanceRecord(snapshot.data());

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

export async function recordQrAttendance(
    input: {
        employeeId: string;
        attendanceDate: string;
        occurredAt: Date;
        scannerOperator: ScannerOperator;
    },
): Promise<QrAttendanceRepositoryResult> {
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

        const currentRecord = parseAttendanceRecord(snapshot.data());

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
