import "server-only";

import type { DocumentData } from "firebase-admin/firestore";

import { getFirebaseAdminDb } from "@/lib/firebase/server";
import type {
    EmployeeEmploymentStatus,
    EmployeeReference,
} from "@/types/employee";

const employeeCollection = "employees";

function getRequiredString(
    data: DocumentData,
    field: string,
): string | null {
    const value = data[field];

    return typeof value === "string" && value.trim() ? value : null;
}

function getNullableString(
    data: DocumentData,
    field: string,
): string | null | undefined {
    const value = data[field];

    if (value === null || value === undefined) {
        return null;
    }

    return typeof value === "string" && value.trim() ? value : undefined;
}

function getEmploymentStatus(
    value: unknown,
): EmployeeEmploymentStatus | null {
    if (value === "active" || value === "inactive") {
        return value;
    }

    return null;
}

function parseEmployeeReference(
    employeeId: string,
    data: DocumentData | undefined,
): EmployeeReference | null {
    if (!data || data.employeeId !== employeeId) {
        return null;
    }

    const displayName = getRequiredString(data, "displayName");
    const department = getRequiredString(data, "department");
    const position = getNullableString(data, "position");
    const employmentStatus = getEmploymentStatus(data.employmentStatus);

    if (
        !displayName
        || !department
        || position === undefined
        || !employmentStatus
    ) {
        return null;
    }

    return {
        employeeId,
        displayName,
        department,
        position,
        employmentStatus,
    };
}

export async function getEmployeeById(
    employeeId: string,
): Promise<EmployeeReference | null> {
    const snapshot = await getFirebaseAdminDb()
        .collection(employeeCollection)
        .doc(employeeId)
        .get();

    if (!snapshot.exists) {
        return null;
    }

    return parseEmployeeReference(employeeId, snapshot.data());
}

export async function listEmployees(): Promise<EmployeeReference[]> {
    const snapshots = await getFirebaseAdminDb()
        .collection(employeeCollection)
        .get();

    return snapshots.docs
        .map((snapshot) => parseEmployeeReference(snapshot.id, snapshot.data()))
        .filter((employee): employee is EmployeeReference => employee !== null)
        .sort((left, right) => left.employeeId.localeCompare(right.employeeId));
}
