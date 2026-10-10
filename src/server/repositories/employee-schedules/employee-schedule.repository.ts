import "server-only";

import type { DocumentData } from "firebase-admin/firestore";

import { getFirebaseAdminDb } from "@/lib/firebase/server";
import type { EmployeeScheduleReference } from "@/types/hr-employee-schedule";

const scheduleCollection = "employeeSchedules";

export class EmployeeScheduleDataError extends Error {
    readonly code = "EMPLOYEE_SCHEDULE_DATA_INVALID";

    constructor() {
        super("The employee schedule reference has an invalid shape.");
        this.name = "EmployeeScheduleDataError";
    }
}

function getRequiredString(
    data: DocumentData,
    field: string,
): string | null {
    const value = data[field];

    return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getNullableString(
    data: DocumentData,
    field: string,
): string | null | undefined {
    const value = data[field];

    if (value === null || value === undefined) {
        return null;
    }

    return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getStringArray(
    data: DocumentData,
    field: string,
): string[] | null {
    const value = data[field];

    if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
        return null;
    }

    return value
        .map((item) => item.trim())
        .filter(Boolean);
}

function getTimeValue(
    data: DocumentData,
    field: string,
): string | null | undefined {
    const value = getNullableString(data, field);

    if (value === undefined) {
        return undefined;
    }

    if (value === null || /^\d{2}:\d{2}$/.test(value)) {
        return value;
    }

    return undefined;
}

function parseScheduleReference(
    documentId: string,
    data: DocumentData | undefined,
): EmployeeScheduleReference | null {
    if (!data) {
        return null;
    }

    const employeeId = getRequiredString(data, "employeeId");
    const scheduleId = getRequiredString(data, "scheduleId");
    const workStart = getTimeValue(data, "workStart");
    const workEnd = getTimeValue(data, "workEnd");
    const breakStart = getTimeValue(data, "breakStart");
    const breakEnd = getTimeValue(data, "breakEnd");
    const shiftLabel = getNullableString(data, "shiftLabel");
    const workDays = getStringArray(data, "workDays");
    const restDays = getStringArray(data, "restDays");
    const workLocation = getNullableString(data, "workLocation");
    const sourceSystem = data.sourceSystem;
    const dataSource = data.dataSource;

    if (
        !employeeId
        || employeeId !== documentId
        || !scheduleId
        || workStart === undefined
        || workEnd === undefined
        || breakStart === undefined
        || breakEnd === undefined
        || !shiftLabel
        || !workDays
        || !restDays
        || workLocation === undefined
        || sourceSystem !== "HRPS"
        || (dataSource !== "development-seed" && dataSource !== "synchronized")
    ) {
        return null;
    }

    return {
        scheduleId,
        employeeId,
        workStart,
        workEnd,
        breakStart,
        breakEnd,
        shiftLabel,
        workDays,
        restDays,
        workLocation,
        sourceSystem,
        dataSource,
    };
}

export async function getEmployeeScheduleById(
    employeeId: string,
): Promise<EmployeeScheduleReference | null> {
    const snapshot = await getFirebaseAdminDb()
        .collection(scheduleCollection)
        .doc(employeeId)
        .get();

    if (!snapshot.exists) {
        return null;
    }

    const schedule = parseScheduleReference(employeeId, snapshot.data());

    if (!schedule) {
        throw new EmployeeScheduleDataError();
    }

    return schedule;
}

export async function listEmployeeScheduleReferences(): Promise<EmployeeScheduleReference[]> {
    const snapshots = await getFirebaseAdminDb()
        .collection(scheduleCollection)
        .get();

    return snapshots.docs
        .map((snapshot) => {
            const schedule = parseScheduleReference(snapshot.id, snapshot.data());

            if (!schedule) {
                throw new EmployeeScheduleDataError();
            }

            return schedule;
        })
        .sort((left, right) => left.employeeId.localeCompare(right.employeeId));
}
