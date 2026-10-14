import "server-only";

import type { Prisma } from "@prisma/client";

import type { EmployeeScheduleReference } from "@/types/hr-employee-schedule";
import {
    getRepositoryPrisma,
    toDateKey,
    toTimeKey,
} from "@/server/repositories/prisma/prisma-repository-helpers";

export type PrismaEmployeeScheduleView = EmployeeScheduleReference & {
    internalId: string;
    effectiveFrom: string | null;
    effectiveTo: string | null;
};

const scheduleSelect = {
    id: true,
    scheduleId: true,
    workStart: true,
    workEnd: true,
    breakStart: true,
    breakEnd: true,
    shiftLabel: true,
    workDays: true,
    restDays: true,
    workLocation: true,
    sourceSystem: true,
    dataSource: true,
    effectiveFrom: true,
    effectiveTo: true,
    employee: { select: { employeeId: true } },
} satisfies Prisma.EmployeeScheduleSelect;

function stringArray(value: Prisma.JsonValue): string[] {
    return Array.isArray(value)
        ? value.filter((item): item is string => typeof item === "string")
        : [];
}

function mapSchedule(schedule: Prisma.EmployeeScheduleGetPayload<{
    select: typeof scheduleSelect;
}>): PrismaEmployeeScheduleView {
    return {
        internalId: schedule.id,
        scheduleId: schedule.scheduleId,
        employeeId: schedule.employee.employeeId,
        workStart: toTimeKey(schedule.workStart),
        workEnd: toTimeKey(schedule.workEnd),
        breakStart: toTimeKey(schedule.breakStart),
        breakEnd: toTimeKey(schedule.breakEnd),
        shiftLabel: schedule.shiftLabel,
        workDays: stringArray(schedule.workDays),
        restDays: stringArray(schedule.restDays),
        workLocation: schedule.workLocation,
        sourceSystem: schedule.sourceSystem,
        dataSource: schedule.dataSource === "development-seed" || schedule.dataSource === "synchronized"
            ? schedule.dataSource
            : "synchronized",
        effectiveFrom: schedule.effectiveFrom ? toDateKey(schedule.effectiveFrom) : null,
        effectiveTo: schedule.effectiveTo ? toDateKey(schedule.effectiveTo) : null,
    };
}

export async function getPrismaEmployeeScheduleById(
    employeeId: string,
): Promise<PrismaEmployeeScheduleView | null> {
    const schedule = await getRepositoryPrisma().employeeSchedule.findFirst({
        where: { employee: { employeeId } },
        select: scheduleSelect,
        orderBy: [{ effectiveFrom: "desc" }, { updatedAt: "desc" }],
    });

    return schedule ? mapSchedule(schedule) : null;
}

export async function getEffectivePrismaEmployeeSchedule(
    employeeId: string,
    onDate = new Date(),
): Promise<PrismaEmployeeScheduleView | null> {
    const date = new Date(Date.UTC(onDate.getUTCFullYear(), onDate.getUTCMonth(), onDate.getUTCDate()));
    const schedule = await getRepositoryPrisma().employeeSchedule.findFirst({
        where: {
            employee: { employeeId },
            AND: [
                { OR: [{ effectiveFrom: null }, { effectiveFrom: { lte: date } }] },
                { OR: [{ effectiveTo: null }, { effectiveTo: { gte: date } }] },
            ],
        },
        select: scheduleSelect,
        orderBy: [{ effectiveFrom: "desc" }, { updatedAt: "desc" }],
    });

    return schedule ? mapSchedule(schedule) : null;
}

export async function listPrismaEmployeeScheduleReferences(
    employeeId?: string,
): Promise<PrismaEmployeeScheduleView[]> {
    const schedules = await getRepositoryPrisma().employeeSchedule.findMany({
        where: employeeId ? { employee: { employeeId } } : undefined,
        select: scheduleSelect,
        orderBy: [{ employee: { employeeId: "asc" } }, { effectiveFrom: "desc" }, { id: "asc" }],
    });

    return schedules.map(mapSchedule);
}

