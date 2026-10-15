import "server-only";

import type { EmployeeEmploymentStatus, Prisma } from "@prisma/client";

import type { EmployeeReference } from "@/types/employee";
import {
    getRepositoryPrisma,
    toIso,
} from "@/server/repositories/prisma/prisma-repository-helpers";

export type PrismaEmployeeView = EmployeeReference & {
    internalId: string;
    sourceSystem: "HRPS";
    dataSource: string | null;
    syncedAt: string | null;
};

export type PrismaEmployeeFilters = {
    search?: string | null;
    department?: string | null;
    employmentStatus?: EmployeeEmploymentStatus | null;
    page?: number;
    pageSize?: number;
};

function mapEmployee(employee: {
    id: string;
    employeeId: string;
    displayName: string;
    department: string;
    position: string | null;
    employmentStatus: EmployeeEmploymentStatus;
    sourceSystem: "HRPS";
    dataSource: string | null;
    syncedAt: Date | null;
}): PrismaEmployeeView {
    return {
        internalId: employee.id,
        employeeId: employee.employeeId,
        displayName: employee.displayName,
        department: employee.department,
        position: employee.position,
        employmentStatus: employee.employmentStatus,
        sourceSystem: employee.sourceSystem,
        dataSource: employee.dataSource,
        syncedAt: toIso(employee.syncedAt),
    };
}

const employeeSelect = {
    id: true,
    employeeId: true,
    displayName: true,
    department: true,
    position: true,
    employmentStatus: true,
    sourceSystem: true,
    dataSource: true,
    syncedAt: true,
} satisfies Prisma.EmployeeSelect;

export async function getPrismaEmployeeByInternalId(
    id: string,
): Promise<PrismaEmployeeView | null> {
    const employee = await getRepositoryPrisma().employee.findUnique({
        where: { id },
        select: employeeSelect,
    });

    return employee ? mapEmployee(employee) : null;
}

export async function getPrismaEmployeeByEmployeeId(
    employeeId: string,
): Promise<PrismaEmployeeView | null> {
    const employee = await getRepositoryPrisma().employee.findUnique({
        where: { employeeId },
        select: employeeSelect,
    });

    return employee ? mapEmployee(employee) : null;
}

export async function listPrismaEmployees(
    filters: PrismaEmployeeFilters = {},
): Promise<{ rows: PrismaEmployeeView[]; total: number; hasNext: boolean }> {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 50));
    const search = filters.search?.trim();
    const where: Prisma.EmployeeWhereInput = {
        ...(filters.department ? { department: filters.department } : {}),
        ...(filters.employmentStatus ? { employmentStatus: filters.employmentStatus } : {}),
        ...(search
            ? {
                OR: [
                    { employeeId: { contains: search, mode: "insensitive" } },
                    { displayName: { contains: search, mode: "insensitive" } },
                    { department: { contains: search, mode: "insensitive" } },
                ],
            }
            : {}),
    };
    const [rows, total] = await Promise.all([
        getRepositoryPrisma().employee.findMany({
            where,
            select: employeeSelect,
            orderBy: [{ employeeId: "asc" }, { id: "asc" }],
            skip: (page - 1) * pageSize,
            take: pageSize + 1,
        }),
        getRepositoryPrisma().employee.count({ where }),
    ]);

    return {
        rows: rows.slice(0, pageSize).map(mapEmployee),
        total,
        hasNext: rows.length > pageSize,
    };
}

export type PrismaEmployeeSyncInput = {
    employeeId: string;
    displayName: string;
    department: string;
    position?: string | null;
    employmentStatus: EmployeeEmploymentStatus;
    dataSource?: string | null;
    sourceUpdatedAt?: Date | null;
    syncedAt?: Date | null;
    legacyFirestoreId?: string | null;
};

export async function upsertPrismaEmployee(
    input: PrismaEmployeeSyncInput,
): Promise<PrismaEmployeeView> {
    const employee = await getRepositoryPrisma().employee.upsert({
        where: { employeeId: input.employeeId },
        create: {
            employeeId: input.employeeId,
            displayName: input.displayName,
            department: input.department,
            position: input.position ?? null,
            employmentStatus: input.employmentStatus,
            dataSource: input.dataSource ?? "HRPS",
            sourceUpdatedAt: input.sourceUpdatedAt ?? null,
            syncedAt: input.syncedAt ?? new Date(),
            legacyFirestoreId: input.legacyFirestoreId ?? null,
        },
        update: {
            displayName: input.displayName,
            department: input.department,
            position: input.position ?? null,
            employmentStatus: input.employmentStatus,
            dataSource: input.dataSource ?? "HRPS",
            sourceUpdatedAt: input.sourceUpdatedAt ?? null,
            syncedAt: input.syncedAt ?? new Date(),
            ...(input.legacyFirestoreId === undefined
                ? {}
                : { legacyFirestoreId: input.legacyFirestoreId }),
        },
        select: employeeSelect,
    });

    return mapEmployee(employee);
}

