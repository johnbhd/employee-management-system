import "server-only";

import {
    getRepositoryPrisma,
    toIso,
} from "@/server/repositories/prisma/prisma-repository-helpers";

export async function getPrismaAdminDashboardAggregates(input: {
    attendanceDate?: string;
} = {}) {
    const prisma = getRepositoryPrisma();
    const attendanceDate = input.attendanceDate
        ? new Date(`${input.attendanceDate}T00:00:00.000Z`)
        : undefined;
    const [
        employeeCount,
        activeEmployeeCount,
        attendanceCount,
        attendanceSourceCounts,
        pendingCorrections,
        payrollBatchCounts,
        accountingTransferCounts,
        payrollResultCounts,
    ] = await Promise.all([
        prisma.employee.count(),
        prisma.employee.count({ where: { employmentStatus: "active" } }),
        prisma.attendanceRecord.count({
            where: attendanceDate ? { attendanceDate } : undefined,
        }),
        prisma.attendanceRecord.groupBy({
            by: ["timeInSource"],
            where: attendanceDate ? { attendanceDate } : undefined,
            _count: { _all: true },
        }),
        prisma.attendanceCorrection.count({ where: { status: "pending" } }),
        prisma.payrollBatch.groupBy({ by: ["status"], _count: { _all: true } }),
        prisma.accountingTransfer.groupBy({ by: ["transferStatus"], _count: { _all: true } }),
        prisma.payrollResult.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);

    return {
        employeeCount,
        activeEmployeeCount,
        attendanceCount,
        attendanceBySource: Object.fromEntries(
            attendanceSourceCounts.map((entry) => [entry.timeInSource, entry._count._all]),
        ),
        pendingCorrections,
        payrollBatches: Object.fromEntries(
            payrollBatchCounts.map((entry) => [entry.status, entry._count._all]),
        ),
        accountingTransfers: Object.fromEntries(
            accountingTransferCounts.map((entry) => [entry.transferStatus, entry._count._all]),
        ),
        payrollResults: Object.fromEntries(
            payrollResultCounts.map((entry) => [entry.status, entry._count._all]),
        ),
    };
}

export async function getPrismaIntegrationMonitoringSnapshot() {
    const prisma = getRepositoryPrisma();
    const [lastAttendance, lastPayrollHandoff, lastAccountingTransfer, attendanceFailures, payrollFailures, accountingFailures] = await Promise.all([
        prisma.attendanceRecord.findFirst({ orderBy: [{ updatedAt: "desc" }, { id: "desc" }], select: { updatedAt: true } }),
        prisma.payrollHandoff.findFirst({ orderBy: [{ updatedAt: "desc" }, { id: "desc" }], select: { updatedAt: true } }),
        prisma.accountingTransfer.findFirst({ orderBy: [{ updatedAt: "desc" }, { id: "desc" }], select: { updatedAt: true } }),
        prisma.attendanceRecord.count({ where: { payrollReadinessStatus: "blocked" } }),
        prisma.payrollHandoff.count({ where: { transferStatus: "failed" } }),
        prisma.accountingTransfer.count({ where: { transferStatus: "failed" } }),
    ]);

    return {
        attendance: {
            configured: true,
            lastActivityAt: toIso(lastAttendance?.updatedAt),
            blockedCount: attendanceFailures,
        },
        payroll: {
            configured: true,
            lastActivityAt: toIso(lastPayrollHandoff?.updatedAt),
            failureCount: payrollFailures,
        },
        accounting: {
            configured: true,
            lastActivityAt: toIso(lastAccountingTransfer?.updatedAt),
            failureCount: accountingFailures,
        },
    };
}

