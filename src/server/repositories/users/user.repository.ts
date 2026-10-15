import "server-only";

import { getPrismaClient } from "@/lib/prisma/server";
import { isApplicationRole } from "@/lib/auth/roles";
import type {
    ApplicationUser,
    ApplicationUserStatus,
} from "@/types/auth";

type ApplicationUserWithIdentity = {
    firebaseUid: string;
    username: string;
    displayName: string;
    status: "active" | "inactive" | "disabled";
    role: {
        code: "admin" | "hr" | "employee" | "payroll" | "accounting";
    };
    employee: {
        employeeId: string;
    } | null;
    mustChangePassword: boolean;
};

export type ApplicationUserProfileInput = {
    username: string;
    displayName: string;
    role: ApplicationUser["role"];
    employeeId: string | null;
    mustChangePassword?: boolean;
};

function toApplicationUser(user: ApplicationUserWithIdentity): ApplicationUser {
    return {
        uid: user.firebaseUid,
        username: user.username,
        displayName: user.displayName,
        role: user.role.code,
        employeeId: user.employee?.employeeId ?? null,
        status: user.status,
        mustChangePassword: user.mustChangePassword,
    };
}

function assertApplicationUserStatus(value: unknown): asserts value is ApplicationUserStatus {
    if (value !== "active" && value !== "inactive" && value !== "disabled") {
        throw new Error("The application user status is invalid.");
    }
}

async function findUserByUid(uid: string): Promise<ApplicationUserWithIdentity | null> {
    return getPrismaClient().user.findUnique({
        where: { firebaseUid: uid },
        include: {
            role: { select: { code: true } },
            employee: { select: { employeeId: true } },
        },
    });
}

async function getRoleId(role: ApplicationUser["role"]): Promise<string> {
    if (!isApplicationRole(role)) {
        throw new Error("The application role is invalid.");
    }

    const record = await getPrismaClient().applicationRole.findUnique({
        where: { code: role },
        select: { id: true },
    });

    if (!record) {
        throw new Error(`The application role ${role} is not configured.`);
    }

    return record.id;
}

async function getEmployeeId(employeeId: string | null): Promise<string | null> {
    if (!employeeId) {
        return null;
    }

    const record = await getPrismaClient().employee.findUnique({
        where: { employeeId },
        select: { id: true },
    });

    if (!record) {
        throw new Error(`The employee ${employeeId} is not available in PostgreSQL.`);
    }

    return record.id;
}

export async function getApplicationUserByUid(
    uid: string,
): Promise<ApplicationUser | null> {
    const user = await findUserByUid(uid);

    return user ? toApplicationUser(user) : null;
}

export async function listApplicationUsers(): Promise<ApplicationUser[]> {
    const users = await getPrismaClient().user.findMany({
        include: {
            role: { select: { code: true } },
            employee: { select: { employeeId: true } },
        },
        orderBy: { displayName: "asc" },
    });

    return users.map(toApplicationUser);
}

export async function createApplicationUserProfile(
    uid: string,
    input: ApplicationUserProfileInput,
): Promise<ApplicationUser> {
    const prisma = getPrismaClient();
    const [roleId, employeeId] = await Promise.all([
        getRoleId(input.role),
        getEmployeeId(input.employeeId),
    ]);

    const created = await prisma.user.create({
        data: {
            firebaseUid: uid,
            username: input.username,
            displayName: input.displayName,
            status: "active",
            role: { connect: { id: roleId } },
            employee: employeeId ? { connect: { id: employeeId } } : undefined,
            mustChangePassword: input.mustChangePassword ?? false,
        },
        include: {
            role: { select: { code: true } },
            employee: { select: { employeeId: true } },
        },
    });

    return toApplicationUser(created);
}

export async function updateApplicationUserProfile(
    uid: string,
    input: Partial<ApplicationUserProfileInput> & {
        status?: ApplicationUserStatus;
    },
): Promise<ApplicationUser | null> {
    const existing = await findUserByUid(uid);

    if (!existing) {
        return null;
    }

    if (input.status !== undefined) {
        assertApplicationUserStatus(input.status);
    }

    const data: {
        username?: string;
        displayName?: string;
        status?: ApplicationUserStatus;
        role?: { connect: { id: string } };
        employee?: { connect: { id: string } } | { disconnect: true };
    } = {};

    if (input.username !== undefined) data.username = input.username;
    if (input.displayName !== undefined) data.displayName = input.displayName;
    if (input.status !== undefined) data.status = input.status;
    if (input.role !== undefined) {
        data.role = { connect: { id: await getRoleId(input.role) } };
    }
    if (input.employeeId !== undefined) {
        const employeeId = await getEmployeeId(input.employeeId);
        data.employee = employeeId
            ? { connect: { id: employeeId } }
            : { disconnect: true };
    }

    const updated = await getPrismaClient().user.update({
        where: { firebaseUid: uid },
        data,
        include: {
            role: { select: { code: true } },
            employee: { select: { employeeId: true } },
        },
    });

    return toApplicationUser(updated);
}

export async function deleteApplicationUserProfile(uid: string): Promise<void> {
    await getPrismaClient().user.deleteMany({
        where: { firebaseUid: uid },
    });
}
