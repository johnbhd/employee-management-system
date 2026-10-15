import "server-only";

import type {
  PayrollResultItem,
  PayrollResultRecord,
  PayrollResultStatus,
} from "@/types/payroll-results";
import {
  getDisabledLegacyStore as getFirebaseAdminDb,
  legacyFieldValue as FieldValue,
  RepositoryTimestamp as Timestamp,
  type DocumentData,
} from "@/server/repositories/prisma/prisma-compat";
import {
  payrollExternalPayslipStatuses,
  payrollExternalProcessingStatuses,
} from "@/types/payroll-handoff";
import { payrollResultStatuses } from "@/types/payroll-results";
import {
  getPrismaPayrollResultById,
  getPrismaPayrollResultByTransferId,
  getPrismaPayrollResultDetail,
  listPrismaPayrollResultItems,
  listPrismaPayrollResults,
  upsertPrismaPayrollResult,
  writePrismaPayrollResultAuditEvents,
  PrismaPayrollResultConflictError,
  PrismaPayrollResultDataError,
} from "@/server/repositories/payroll-results/prisma-payroll-result.repository";

const resultCollection = "payrollResults";
const itemCollection = "items";
const auditCollection = "payrollResultAuditEvents";

export class PayrollResultDataError extends Error {
  readonly code = "PAYROLL_RESULT_DATA_INVALID";

  constructor(message = "The payroll result record has an invalid shape.") {
    super(message);
    this.name = "PayrollResultDataError";
  }
}

export class PayrollResultConflictError extends Error {
  readonly code = "PAYROLL_RESULT_CONFLICT";

  constructor(message: string) {
    super(message);
    this.name = "PayrollResultConflictError";
  }
}

function mapPrismaResultError(error: unknown): never {
  if (error instanceof PrismaPayrollResultDataError) throw new PayrollResultDataError(error.message);
  if (error instanceof PrismaPayrollResultConflictError) throw new PayrollResultConflictError(error.message);
  throw error;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getString(data: Record<string, unknown>, field: string): string | null {
  const value = data[field];
  return typeof value === "string" && value.trim() ? value : null;
}

function getNullableString(data: Record<string, unknown>, field: string): string | null | undefined {
  const value = data[field];
  if (value === null || value === undefined) return null;
  return typeof value === "string" && value.trim() ? value : undefined;
}

function getInteger(data: Record<string, unknown>, field: string): number | null {
  const value = data[field];
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : null;
}

function getTimestamp(data: Record<string, unknown>, field: string): string | null | undefined {
  const value = data[field];
  if (value === null || value === undefined) return null;
  return value instanceof Timestamp ? value.toDate().toISOString() : undefined;
}

function getPeriod(value: unknown) {
  if (!isRecord(value)) return null;
  const start = getString(value, "start");
  const end = getString(value, "end");
  const label = getString(value, "label");
  return start && end && label ? { start, end, label } : null;
}

function isResultStatus(value: unknown): value is PayrollResultStatus {
  return payrollResultStatuses.includes(value as PayrollResultStatus);
}

function isProcessingStatus(value: unknown): value is PayrollResultItem["processingStatus"] {
  return payrollExternalProcessingStatuses.includes(value as PayrollResultItem["processingStatus"]);
}

function isPayslipStatus(value: unknown): value is PayrollResultItem["payslipStatus"] {
  return payrollExternalPayslipStatuses.includes(value as PayrollResultItem["payslipStatus"]);
}

function parseResult(id: string, data: DocumentData | undefined): PayrollResultRecord | null {
  if (!data) return null;
  const resultId = getString(data, "resultId");
  const batchId = getString(data, "batchId");
  const transferId = getString(data, "transferId");
  const period = getPeriod(data.period);
  const externalPayrollReference = getString(data, "externalPayrollReference");
  const status = data.status;
  const provider = getString(data, "provider");
  const employeeCount = getInteger(data, "employeeCount");
  const processedCount = getInteger(data, "processedCount");
  const pendingCount = getInteger(data, "pendingCount");
  const rejectedCount = getInteger(data, "rejectedCount");
  const failedCount = getInteger(data, "failedCount");
  const payslipAvailableCount = getInteger(data, "payslipAvailableCount");
  const receivedAt = getTimestamp(data, "receivedAt");
  const processedAt = getTimestamp(data, "processedAt");
  const completedAt = getTimestamp(data, "completedAt");
  const createdAt = getTimestamp(data, "createdAt");
  const updatedAt = getTimestamp(data, "updatedAt");

  if (
    !resultId || resultId !== id || !batchId || !transferId || !period
    || !externalPayrollReference || !isResultStatus(status) || !provider
    || employeeCount === null || processedCount === null || pendingCount === null
    || rejectedCount === null || failedCount === null || payslipAvailableCount === null
    || !receivedAt || processedAt === undefined || completedAt === undefined
    || !createdAt || !updatedAt
  ) {
    return null;
  }

  return {
    resultId,
    batchId,
    transferId,
    period,
    externalPayrollReference,
    status,
    provider,
    employeeCount,
    processedCount,
    pendingCount,
    rejectedCount,
    failedCount,
    payslipAvailableCount,
    receivedAt,
    processedAt,
    completedAt,
    createdAt,
    updatedAt,
  };
}

function parseItem(
  id: string,
  data: DocumentData | undefined,
): PayrollResultItem | null {
  if (!data) return null;
  const resultId = getString(data, "resultId");
  const batchId = getString(data, "batchId");
  const transferId = getString(data, "transferId");
  const employeeId = getString(data, "employeeId");
  const employeeName = getString(data, "employeeName");
  const department = getString(data, "department");
  const period = getPeriod(data.period);
  const externalEmployeeReference = getString(data, "externalEmployeeReference");
  const externalPayrollReference = getNullableString(data, "externalPayrollReference");
  const payslipId = getNullableString(data, "payslipId");
  const releasedAt = getTimestamp(data, "releasedAt");
  const processedAt = getTimestamp(data, "processedAt");
  const issueCode = getNullableString(data, "issueCode");
  const issueSummary = getNullableString(data, "issueSummary");

  if (
    !resultId || !batchId || !transferId || !employeeId || !employeeName || !department
    || !period || !externalEmployeeReference || !isProcessingStatus(data.processingStatus)
    || !isPayslipStatus(data.payslipStatus) || externalPayrollReference === undefined
    || payslipId === undefined || releasedAt === undefined || processedAt === undefined
    || issueCode === undefined || issueSummary === undefined
  ) {
    return null;
  }

  return {
    id,
    resultId,
    batchId,
    transferId,
    employeeId,
    employeeName,
    department,
    period,
    externalEmployeeReference,
    externalPayrollReference,
    processingStatus: data.processingStatus,
    payslipStatus: data.payslipStatus,
    payslipId,
    releasedAt,
    processedAt,
    issueCode,
    issueSummary,
  };
}

function toTimestamp(value: string): Timestamp {
  return Timestamp.fromDate(new Date(value));
}

function resultDocument(result: PayrollResultRecord): DocumentData {
  return {
    resultId: result.resultId,
    batchId: result.batchId,
    transferId: result.transferId,
    period: result.period,
    externalPayrollReference: result.externalPayrollReference,
    status: result.status,
    provider: result.provider,
    employeeCount: result.employeeCount,
    processedCount: result.processedCount,
    pendingCount: result.pendingCount,
    rejectedCount: result.rejectedCount,
    failedCount: result.failedCount,
    payslipAvailableCount: result.payslipAvailableCount,
    receivedAt: toTimestamp(result.receivedAt),
    processedAt: result.processedAt ? toTimestamp(result.processedAt) : null,
    completedAt: result.completedAt ? toTimestamp(result.completedAt) : null,
    createdAt: toTimestamp(result.createdAt),
    updatedAt: toTimestamp(result.updatedAt),
  };
}

function itemDocument(item: PayrollResultItem): DocumentData {
  return {
    resultId: item.resultId,
    batchId: item.batchId,
    transferId: item.transferId,
    employeeId: item.employeeId,
    employeeName: item.employeeName,
    department: item.department,
    period: item.period,
    externalEmployeeReference: item.externalEmployeeReference,
    externalPayrollReference: item.externalPayrollReference,
    processingStatus: item.processingStatus,
    payslipStatus: item.payslipStatus,
    payslipId: item.payslipId,
    releasedAt: item.releasedAt ? toTimestamp(item.releasedAt) : null,
    processedAt: item.processedAt ? toTimestamp(item.processedAt) : null,
    issueCode: item.issueCode,
    issueSummary: item.issueSummary,
  };
}

function itemDocumentId(employeeId: string): string {
  return employeeId.replace(/[^A-Za-z0-9_-]/g, "_");
}

export async function listPayrollResults(): Promise<PayrollResultRecord[]> {
  const result = await listPrismaPayrollResults({ page: 1, pageSize: 100 });
  return result.rows;

  /* istanbul ignore next -- legacy Firestore implementation retained below for migration reference. */
  const snapshots = await getFirebaseAdminDb().collection(resultCollection).get();
  return snapshots.docs
    .map((snapshot) => {
      const result = parseResult(snapshot.id, snapshot.data());
      if (!result) throw new PayrollResultDataError();
      return result;
    })
    .sort((left, right) => right.receivedAt.localeCompare(left.receivedAt));
}

export async function getPayrollResultById(resultId: string): Promise<PayrollResultRecord | null> {
  return getPrismaPayrollResultById(resultId);

  /* istanbul ignore next -- legacy Firestore implementation retained below for migration reference. */
  const snapshot = await getFirebaseAdminDb().collection(resultCollection).doc(resultId).get();
  if (!snapshot.exists) return null;
  const result = parseResult(snapshot.id, snapshot.data());
  if (!result) throw new PayrollResultDataError();
  return result;
}

export async function getPayrollResultByTransferId(transferId: string): Promise<PayrollResultRecord | null> {
  return getPrismaPayrollResultByTransferId(transferId);

  /* istanbul ignore next -- legacy Firestore implementation retained below for migration reference. */
  const snapshots = await getFirebaseAdminDb()
    .collection(resultCollection)
    .where("transferId", "==", transferId)
    .limit(1)
    .get();
  const snapshot = snapshots.docs[0];
  if (!snapshot) return null;
  const result = parseResult(snapshot.id, snapshot.data());
  if (!result) throw new PayrollResultDataError();
  return result;
}

export async function listPayrollResultItems(resultId: string): Promise<PayrollResultItem[]> {
  return listPrismaPayrollResultItems(resultId);

  /* istanbul ignore next -- legacy Firestore implementation retained below for migration reference. */
  const snapshots = await getFirebaseAdminDb()
    .collection(resultCollection)
    .doc(resultId)
    .collection(itemCollection)
    .get();
  return snapshots.docs
    .map((snapshot) => {
      const item = parseItem(snapshot.id, snapshot.data());
      if (!item || item.resultId !== resultId) throw new PayrollResultDataError();
      return item;
    })
    .sort((left, right) => left.employeeName.localeCompare(right.employeeName));
}

export async function getPayrollResultDetail(resultId: string) {
  return getPrismaPayrollResultDetail(resultId);

  /* istanbul ignore next -- legacy Firestore implementation retained below for migration reference. */
  const result = await getPayrollResultById(resultId);
  if (!result) return null;
  return { result, items: await listPayrollResultItems(resultId) };
}

export async function upsertPayrollResult(input: {
  result: PayrollResultRecord;
  items: PayrollResultItem[];
}): Promise<void> {
  try {
    await upsertPrismaPayrollResult(input);
    return;
  } catch (error) {
    return mapPrismaResultError(error);
  }

  /* istanbul ignore next -- legacy Firestore implementation retained below for migration reference. */
  const db = getFirebaseAdminDb();
  const resultReference = db.collection(resultCollection).doc(input.result.resultId);

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(resultReference);
    let resultToPersist = input.result;
    if (snapshot.exists) {
      const existing = parseResult(snapshot.id, snapshot.data());
      if (!existing) throw new PayrollResultDataError();
      if (
        existing.batchId !== input.result.batchId
        || existing.transferId !== input.result.transferId
        || existing.externalPayrollReference !== input.result.externalPayrollReference
      ) {
        throw new PayrollResultConflictError("A different payroll result already uses this result ID.");
      }
      resultToPersist = {
        ...input.result,
        createdAt: existing.createdAt,
      };
    }

    transaction.set(resultReference, resultDocument(resultToPersist), { merge: true });
    for (const item of input.items) {
      transaction.set(
        resultReference.collection(itemCollection).doc(itemDocumentId(item.employeeId)),
        itemDocument(item),
        { merge: true },
      );
    }
  });
}

export async function writePayrollResultAuditEvents(input: {
  result: PayrollResultRecord;
  items: PayrollResultItem[];
  receivedAt: string;
}) {
  await writePrismaPayrollResultAuditEvents(input);
  return;

  /* istanbul ignore next -- legacy Firestore implementation retained below for migration reference. */
  const db = getFirebaseAdminDb();
  const events: Array<{ id: string; action: string; employeeId?: string; payslipId?: string | null }> = [
    { id: `${input.result.resultId}:received`, action: "Payroll result received" },
  ];

  if (input.result.status === "completed" || input.result.status === "completed_with_issues") {
    events.push({ id: `${input.result.resultId}:completed`, action: "Payroll result completed" });
  }
  for (const item of input.items) {
    if (item.processingStatus === "processed") {
      events.push({ id: `${input.result.resultId}:${item.employeeId}:processed`, action: "Employee result processed", employeeId: item.employeeId });
    }
    if (item.payslipStatus === "available") {
      events.push({ id: `${input.result.resultId}:${item.employeeId}:payslip`, action: "Payslip made available", employeeId: item.employeeId, payslipId: item.payslipId });
    }
  }

  await Promise.all(events.map((event) => db.collection(auditCollection).doc(event.id).set({
    eventId: event.id,
    action: event.action,
    resultId: input.result.resultId,
    batchId: input.result.batchId,
    transferId: input.result.transferId,
    externalPayrollReference: input.result.externalPayrollReference,
    employeeId: event.employeeId ?? null,
    payslipId: event.payslipId ?? null,
    actor: {
      uid: "system:payroll-integration",
      username: "payroll-integration",
      displayName: "Payroll Integration",
      role: "system",
    },
    occurredAt: Timestamp.fromDate(new Date(input.receivedAt)),
    createdAt: FieldValue.serverTimestamp(),
  }, { merge: true })));
}
