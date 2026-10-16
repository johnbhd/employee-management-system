import "server-only";

import { randomUUID } from "node:crypto";
import type { AccountingAcknowledgementStatus, AccountingTransferStatus, Prisma } from "@prisma/client";

import type { PayrollBatchPeriod } from "@/types/payroll-batches";
import type {
    AccountingTransferSnapshot,
    AccountingTransferActor,
    AccountingTransferRecord,
    AccountingTransferTimelineEvent,
} from "@/types/accounting-transfers";
import type { PayrollResultStatus } from "@/types/payroll-results";
import {
    findUserIdByFirebaseUid,
    getRepositoryPrisma,
    toDateKey,
    toJson,
    toJsonObject,
    toIso,
} from "@/server/repositories/prisma/prisma-repository-helpers";
import { recordPrismaAuditEvent } from "@/server/repositories/audit/prisma-audit.repository";

export const prismaAccountingAdapterProvider = "simulated-accounting-adapter";
export class PrismaAccountingTransferNotFoundError extends Error {}
export class PrismaAccountingTransferConflictError extends Error {}

const transferInclude = {
    payrollResult: { select: { resultReference: true, status: true, externalPayrollReference: true } },
    payrollBatch: { select: { batchReference: true } },
    payrollHandoff: { select: { transferReference: true } },
    preparedBy: { select: { id: true } },
} satisfies Prisma.AccountingTransferInclude;

type TransferRow = Prisma.AccountingTransferGetPayload<{ include: typeof transferInclude }>;
type TransferActorInput = Pick<AccountingTransferActor, "uid" | "username" | "displayName" | "role">;

function actor(value: Prisma.JsonValue): AccountingTransferActor {
    const snapshot = toJsonObject(value);
    return {
        uid: typeof snapshot.uid === "string" ? snapshot.uid : "system",
        username: typeof snapshot.username === "string" ? snapshot.username : "system",
        displayName: typeof snapshot.displayName === "string" ? snapshot.displayName : "System",
        role: typeof snapshot.role === "string" ? snapshot.role : "system",
    };
}

function parseSnapshot(value: Prisma.JsonValue | null): AccountingTransferSnapshot | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }

    return value as AccountingTransferSnapshot;
}

function mapPeriod(row: TransferRow): PayrollBatchPeriod {
    return { start: toDateKey(row.periodStart), end: toDateKey(row.periodEnd), label: row.periodLabel };
}

function mapTimeline(row: TransferRow): AccountingTransferTimelineEvent[] {
    const events: AccountingTransferTimelineEvent[] = [
        { id: "created", label: "Transfer Created", occurredAt: row.createdAt.toISOString() },
    ];
    if (row.preparedAt) {
        events.push({
            id: "prepared",
            label: "Accounting Transfer Prepared",
            occurredAt: row.preparedAt.toISOString(),
        });
    } else {
        events.push({
            id: "submitted",
            label: "Submitted to Accounting adapter",
            occurredAt: row.submittedAt.toISOString(),
        });
    }
    if (row.acknowledgedAt) {
        events.push({
            id: row.acknowledgementStatus === "accepted" ? "acknowledged" : "rejected",
            label: row.acknowledgementStatus === "accepted" ? "Acknowledged" : "Rejected",
            occurredAt: row.acknowledgedAt.toISOString(),
        });
    }
    if (row.failedAt) events.push({ id: "failed", label: "Transfer Failed", occurredAt: row.failedAt.toISOString() });
    return events.sort((left, right) => left.occurredAt.localeCompare(right.occurredAt));
}

function mapTransfer(row: TransferRow): AccountingTransferRecord {
    return {
        transferId: row.transferReference,
        payrollResultId: row.payrollResult.resultReference,
        payrollBatchId: row.payrollBatch.batchReference,
        payrollHandoffId: row.payrollHandoff.transferReference,
        period: mapPeriod(row),
        externalPayrollReference: row.externalPayrollReference,
        employeeCount: row.employeeCount,
        payrollResultStatus: row.payrollResultStatus as PayrollResultStatus,
        submittedBy: actor(row.submittedBySnapshot),
        submittedAt: row.submittedAt.toISOString(),
        preparedBy: row.preparedBySnapshot ? actor(row.preparedBySnapshot) : null,
        preparedAt: toIso(row.preparedAt),
        snapshot: parseSnapshot(row.snapshot),
        sourceMode: row.sourceMode,
        acknowledgedAt: toIso(row.acknowledgedAt),
        failedAt: toIso(row.failedAt),
        transferStatus: row.transferStatus,
        acknowledgementStatus: row.acknowledgementStatus,
        externalAccountingReference: row.externalAccountingReference,
        provider: row.provider,
        failureCode: row.failureCode,
        failureSummary: row.failureSummary,
        attemptCount: row.attemptCount,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        timeline: mapTimeline(row),
    };
}

export async function listPrismaAccountingTransfers(input: {
    status?: AccountingTransferStatus;
    page?: number;
    pageSize?: number;
} = {}) {
    const page = Math.max(1, input.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 50));
    const where: Prisma.AccountingTransferWhereInput = input.status ? { transferStatus: input.status } : {};
    const [rows, total] = await Promise.all([
        getRepositoryPrisma().accountingTransfer.findMany({
            where,
            include: transferInclude,
            orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
            skip: (page - 1) * pageSize,
            take: pageSize + 1,
        }),
        getRepositoryPrisma().accountingTransfer.count({ where }),
    ]);
    return { rows: rows.slice(0, pageSize).map(mapTransfer), total, hasNext: rows.length > pageSize };
}

export async function getPrismaAccountingTransferById(
    transferId: string,
): Promise<AccountingTransferRecord | null> {
    const row = await getRepositoryPrisma().accountingTransfer.findUnique({
        where: { transferReference: transferId },
        include: transferInclude,
    });
    return row ? mapTransfer(row) : null;
}

export async function getPrismaAccountingTransferByPayrollResultId(
    payrollResultId: string,
): Promise<AccountingTransferRecord | null> {
    const result = await getRepositoryPrisma().payrollResult.findUnique({
        where: { resultReference: payrollResultId },
        select: { id: true },
    });
    if (!result) return null;
    const row = await getRepositoryPrisma().accountingTransfer.findUnique({
        where: { payrollResultId: result.id },
        include: transferInclude,
    });
    return row ? mapTransfer(row) : null;
}

export async function claimPrismaAccountingTransfer(input: {
    payrollResultId: string;
    period: PayrollBatchPeriod;
    externalPayrollReference: string;
    employeeCount: number;
    actor: TransferActorInput;
}): Promise<AccountingTransferRecord> {
    const prisma = getRepositoryPrisma();
    const submittedByUserId = await findUserIdByFirebaseUid(input.actor.uid);
    const row = await prisma.$transaction(async (transaction) => {
        const result = await transaction.payrollResult.findUnique({
            where: { resultReference: input.payrollResultId },
            include: { batch: true, handoff: true },
        });
        if (!result) throw new PrismaAccountingTransferNotFoundError();
        const existing = await transaction.accountingTransfer.findUnique({ where: { payrollResultId: result.id } });
        const now = new Date();
        if (existing) {
            if (existing.transferStatus === "submitted") throw new PrismaAccountingTransferConflictError("This Payroll Result has already been transferred to Accounting.");
            if (existing.transferStatus === "preparing" || existing.transferStatus === "submitting") throw new PrismaAccountingTransferConflictError("This Accounting transfer is already in progress.");
            if (existing.attemptCount >= 3) throw new PrismaAccountingTransferConflictError("This Accounting transfer has reached its retry limit.");
            return transaction.accountingTransfer.update({
                where: { id: existing.id },
                data: {
                    submittedByUserId,
                    submittedBySnapshot: toJson(input.actor),
                    submittedAt: now,
                    acknowledgedAt: null,
                    failedAt: null,
                    transferStatus: "submitting",
                    acknowledgementStatus: "pending",
                    externalAccountingReference: null,
                    failureCode: null,
                    failureSummary: null,
                    attemptCount: { increment: 1 },
                },
                include: transferInclude,
            });
        }
        return transaction.accountingTransfer.create({
            data: {
                payrollResultId: result.id,
                payrollBatchId: result.batchId,
                payrollHandoffId: result.handoffId,
                transferReference: `ACC-TRF-${input.period.start.replaceAll("-", "")}-${randomUUID().slice(0, 8).toUpperCase()}`,
                periodStart: new Date(`${input.period.start}T00:00:00.000Z`),
                periodEnd: new Date(`${input.period.end}T00:00:00.000Z`),
                periodLabel: input.period.label,
                externalPayrollReference: input.externalPayrollReference,
                employeeCount: input.employeeCount,
                payrollResultStatus: result.status,
                submittedByUserId,
                submittedBySnapshot: toJson(input.actor),
                submittedAt: now,
                transferStatus: "submitting",
                acknowledgementStatus: "pending",
                provider: prismaAccountingAdapterProvider,
            },
            include: transferInclude,
        });
    });
    return mapTransfer(row);
}

export async function preparePrismaAccountingTransfer(input: {
    payrollResultId: string;
    actor: TransferActorInput;
}): Promise<AccountingTransferRecord> {
    const prisma = getRepositoryPrisma();
    const preparedByUserId = await findUserIdByFirebaseUid(input.actor.uid);
    const row = await prisma.$transaction(async (transaction) => {
        const result = await transaction.payrollResult.findUnique({
            where: { resultReference: input.payrollResultId },
            include: {
                batch: {
                    select: {
                        batchReference: true,
                        periodStart: true,
                        periodEnd: true,
                        periodLabel: true,
                    },
                },
                handoff: {
                    select: {
                        transferReference: true,
                        acknowledgementStatus: true,
                    },
                },
                items: {
                    orderBy: [{ employeeNameSnapshot: "asc" }, { id: "asc" }],
                },
            },
        });

        if (!result) {
            throw new PrismaAccountingTransferNotFoundError();
        }

        const existing = await transaction.accountingTransfer.findUnique({
            where: { payrollResultId: result.id },
        });
        if (existing) {
            throw new PrismaAccountingTransferConflictError(
                "An Accounting transfer already exists for this Payroll Result.",
            );
        }

        if (result.status !== "completed"
            || !result.externalPayrollReference
            || result.handoff.acknowledgementStatus !== "accepted") {
            throw new PrismaAccountingTransferConflictError(
                "The Payroll Result is no longer eligible for Accounting preparation.",
            );
        }

        const now = new Date();
        const sourceMode = result.provider.toLowerCase().includes("simulated")
            ? "simulated-payroll"
            : "external-payroll";
        const snapshot: AccountingTransferSnapshot = {
            source: {
                mode: sourceMode,
                provider: result.provider,
            },
            payroll: {
                payrollResultId: result.resultReference,
                payrollBatchId: result.batch.batchReference,
                payrollHandoffId: result.handoff.transferReference,
                externalPayrollReference: result.externalPayrollReference,
                periodStart: toDateKey(result.batch.periodStart),
                periodEnd: toDateKey(result.batch.periodEnd),
                resultStatus: result.status,
                receivedAt: result.receivedAt.toISOString(),
                processedAt: toIso(result.processedAt),
                completedAt: toIso(result.completedAt),
            },
            summary: {
                employeeCount: result.employeeCount,
                processedCount: result.processedCount,
                pendingCount: result.pendingCount,
                rejectedCount: result.rejectedCount,
                failedCount: result.failedCount,
                payslipAvailableCount: result.payslipAvailableCount,
            },
            items: result.items.map((item) => ({
                employeeId: item.employeeIdSnapshot,
                employeeName: item.employeeNameSnapshot,
                department: item.departmentSnapshot,
                externalEmployeeReference: item.externalEmployeeReference,
                externalPayrollReference: item.externalPayrollReference,
                processingStatus: item.processingStatus,
                payslipStatus: item.payslipStatus,
                issueCode: item.issueCode,
                issueSummary: item.issueSummary,
            })),
        };
        const preparedBySnapshot = toJson(input.actor);
        const transferReference = `ACC-TRF-${toDateKey(result.batch.periodStart).replaceAll("-", "")}-${randomUUID().slice(0, 8).toUpperCase()}`;
        const transfer = await transaction.accountingTransfer.create({
            data: {
                payrollResultId: result.id,
                payrollBatchId: result.batchId,
                payrollHandoffId: result.handoffId,
                transferReference,
                periodStart: result.batch.periodStart,
                periodEnd: result.batch.periodEnd,
                periodLabel: result.batch.periodLabel,
                externalPayrollReference: result.externalPayrollReference,
                employeeCount: result.employeeCount,
                payrollResultStatus: result.status,
                submittedByUserId: preparedByUserId,
                submittedBySnapshot: preparedBySnapshot,
                submittedAt: now,
                preparedByUserId,
                preparedBySnapshot,
                preparedAt: now,
                snapshot: toJson(snapshot),
                sourceMode,
                transferStatus: "prepared",
                acknowledgementStatus: "pending",
                provider: "local-accounting-preparation",
            },
            include: transferInclude,
        });

        await recordPrismaAuditEvent({
            id: `${transferReference}:prepared`,
            eventType: "accounting.transfer.prepared",
            action: "Accounting Transfer Prepared",
            module: "Accounting Integration",
            actor: {
                type: "user",
                uid: input.actor.uid,
                displayName: input.actor.displayName,
                role: input.actor.role,
            },
            target: {
                type: "accounting_transfer",
                id: transferReference,
                reference: transferReference,
                label: transferReference,
            },
            outcome: "Successful",
            summary: "A local Accounting transfer snapshot was prepared from an eligible Payroll Result.",
            metadata: {
                payrollResultId: result.resultReference,
                transferReference,
                sourceMode,
                employeeCount: result.employeeCount,
            },
            occurredAt: now,
        }, transaction);

        return transfer;
    });

    return mapTransfer(row);
}

export async function updatePrismaAccountingTransferResult(input: {
    transferId: string;
    transferStatus: "submitted" | "failed";
    acknowledgementStatus: AccountingAcknowledgementStatus;
    provider: string;
    externalAccountingReference?: string | null;
    failureCode?: string | null;
    failureSummary?: string | null;
}): Promise<AccountingTransferRecord> {
    const row = await getRepositoryPrisma().$transaction(async (transaction) => {
        const existing = await transaction.accountingTransfer.findUnique({
            where: { transferReference: input.transferId },
        });
        if (!existing) throw new PrismaAccountingTransferNotFoundError();
        if (existing.transferStatus !== "submitting") throw new PrismaAccountingTransferConflictError("This Accounting transfer is no longer awaiting an adapter response.");
        const acknowledged = input.acknowledgementStatus === "accepted" || input.acknowledgementStatus === "rejected";
        return transaction.accountingTransfer.update({
            where: { id: existing.id },
            data: {
                transferStatus: input.transferStatus,
                acknowledgementStatus: input.acknowledgementStatus,
                provider: input.provider,
                externalAccountingReference: input.externalAccountingReference ?? null,
                failureCode: input.failureCode ?? null,
                failureSummary: input.failureSummary ?? null,
                acknowledgedAt: acknowledged ? new Date() : null,
                failedAt: input.transferStatus === "failed" ? new Date() : null,
            },
            include: transferInclude,
        });
    });
    return mapTransfer(row);
}

export async function listPrismaAccountingTransferAuditEvents(transferId: string) {
    const transfer = await getRepositoryPrisma().accountingTransfer.findUnique({
        where: { transferReference: transferId },
        select: { transferReference: true },
    });
    if (!transfer) return [];
    const events = await getRepositoryPrisma().auditEvent.findMany({
        where: {
            targetType: "accounting_transfer",
            targetId: transfer.transferReference,
        },
        orderBy: [{ occurredAt: "asc" }, { id: "asc" }],
        select: { id: true, action: true, occurredAt: true },
    });
    return events.map((event) => ({ id: event.id, action: event.action, occurredAt: event.occurredAt.toISOString() }));
}

