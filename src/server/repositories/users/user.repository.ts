import "server-only";

import type { DocumentData } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";

import { getFirebaseAdminDb } from "@/lib/firebase/server";
import {
    isApplicationRole,
} from "@/lib/auth/roles";
import type {
    ApplicationUser,
    ApplicationUserStatus,
} from "@/types/auth";

const userCollection = "users";

export type ApplicationUserProfileInput = {
    username: string;
    displayName: string;
    role: ApplicationUser["role"];
    employeeId: string | null;
};

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

function getUserStatus(value: unknown): ApplicationUserStatus | null {
    if (value === "active" || value === "inactive" || value === "disabled") {
        return value;
    }

    return null;
}

function parseApplicationUser(
    uid: string,
    data: DocumentData | undefined,
): ApplicationUser | null {
    if (!data || data.uid !== uid) {
        return null;
    }

    const username = getRequiredString(data, "username");
    const displayName = getRequiredString(data, "displayName");
    const role = data.role;
    const employeeId = getNullableString(data, "employeeId");
    const status = getUserStatus(data.status);

    if (
        !username ||
        !displayName ||
        !isApplicationRole(role) ||
        employeeId === undefined ||
        !status
    ) {
        return null;
    }

    return {
        uid,
        username,
        displayName,
        role,
        employeeId,
        status,
    };
}

export async function getApplicationUserByUid(
    uid: string,
): Promise<ApplicationUser | null> {
    const snapshot = await getFirebaseAdminDb()
        .collection(userCollection)
        .doc(uid)
        .get();

    if (!snapshot.exists) {
        return null;
    }

    return parseApplicationUser(uid, snapshot.data());
}

export async function listApplicationUsers(): Promise<ApplicationUser[]> {
    const snapshots = await getFirebaseAdminDb()
        .collection(userCollection)
        .get();

    return snapshots.docs
        .map((snapshot) => parseApplicationUser(snapshot.id, snapshot.data()))
        .filter((user): user is ApplicationUser => user !== null)
        .sort((left, right) => left.displayName.localeCompare(right.displayName));
}

export async function createApplicationUserProfile(
    uid: string,
    input: ApplicationUserProfileInput,
): Promise<ApplicationUser> {
    const db = getFirebaseAdminDb();
    const reference = db.collection(userCollection).doc(uid);

    await reference.set({
        uid,
        ...input,
        status: "active",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    });

    const created = await getApplicationUserByUid(uid);

    if (!created) {
        throw new Error("The application user profile could not be created.");
    }

    return created;
}

export async function updateApplicationUserProfile(
    uid: string,
    input: Partial<ApplicationUserProfileInput> & {
        status?: ApplicationUser["status"];
    },
): Promise<ApplicationUser | null> {
    await getFirebaseAdminDb()
        .collection(userCollection)
        .doc(uid)
        .set({
            ...input,
            updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });

    return getApplicationUserByUid(uid);
}

export async function deleteApplicationUserProfile(uid: string): Promise<void> {
    await getFirebaseAdminDb()
        .collection(userCollection)
        .doc(uid)
        .delete();
}
