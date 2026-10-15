import { Timestamp, type Firestore } from "firebase-admin/firestore";

import { getFirebaseAdminDb } from "../../../src/lib/firebase/server/legacy-firestore";

import type { MigrationDomain, SourceRecord, SourceSnapshot } from "./types";
import { compactError, errorMessage, isQuotaError } from "./utils";

export class FirestoreMigrationReadError extends Error {
  readonly quotaBlocked: boolean;

  constructor(message: string, quotaBlocked: boolean) {
    super(message);
    this.name = "FirestoreMigrationReadError";
    this.quotaBlocked = quotaBlocked;
  }
}

const sourceCollections: Readonly<Record<MigrationDomain, readonly string[]>> = {
  roles: ["rolePermissions"],
  employees: ["employees"],
  schedules: ["employeeSchedules"],
  identity: ["users"],
  attendance: ["attendance"],
  corrections: ["attendanceCorrectionRequests"],
  payroll: ["payrollBatches", "payrollBatchMembership", "payrollHandoffs", "payrollResults", "payrollResultAuditEvents"],
  payslips: ["payrollPayslips"],
  accounting: ["accountingTransfers", "accountingTransferMembership", "accountingTransferAuditEvents"],
  audit: ["auditEvents", "adminAuditEvents", "adminUserAccountAuditEvents", "payrollResultAuditEvents", "accountingTransferAuditEvents"],
  settings: ["systemSettings"],
};

export async function readFirestoreSource(
  domains: readonly MigrationDomain[],
  batchSize = 250,
  firestore: Firestore = getFirebaseAdminDb(),
): Promise<SourceSnapshot> {
  const records = new Map<string, SourceRecord[]>();
  const collectionNames = uniqueCollectionNames(domains.flatMap((domain) => sourceCollections[domain]));

  try {
    for (const collectionName of collectionNames) {
      records.set(collectionName, await readCollectionInChunks(firestore, collectionName, batchSize));
    }

    if (domains.includes("payroll")) {
      records.set("payrollResultItems", await readNestedItemsInChunks(firestore, batchSize));
    }
  } catch (error: unknown) {
    throw new FirestoreMigrationReadError(
      `${compactError(error)}${isQuotaError(error) ? " Firestore quota is exhausted; no retry was attempted." : ""}`,
      isQuotaError(error),
    );
  }

  return {
    projectId: process.env.FIREBASE_PROJECT_ID?.trim() ?? "unknown",
    records,
  };
}

async function readCollectionInChunks(
  firestore: Firestore,
  collectionName: string,
  batchSize: number,
): Promise<SourceRecord[]> {
  const collection = firestore.collection(collectionName);
  const records: SourceRecord[] = [];
  let query = collection.orderBy("__name__").limit(batchSize);
  while (true) {
    const snapshots = await query.get();
    records.push(...snapshots.docs.map((snapshot) => ({
      collection: collectionName,
      id: snapshot.id,
      path: snapshot.ref.path,
      data: snapshot.data(),
    })));
    if (snapshots.size < batchSize) break;
    const last = snapshots.docs[snapshots.docs.length - 1];
    if (!last) break;
    query = collection.orderBy("__name__").startAfter(last).limit(batchSize);
  }
  return records;
}

async function readNestedItemsInChunks(firestore: Firestore, batchSize: number): Promise<SourceRecord[]> {
  const records: SourceRecord[] = [];
  const collectionGroup = firestore.collectionGroup("items");
  let query = collectionGroup.orderBy("__name__").limit(batchSize);
  while (true) {
    const snapshots = await query.get();
    records.push(...snapshots.docs
      .filter((snapshot) => snapshot.ref.parent.parent?.parent.id === "payrollResults")
      .map((snapshot) => ({
        collection: "payrollResultItems",
        id: snapshot.id,
        path: snapshot.ref.path,
        data: snapshot.data(),
      })));
    if (snapshots.size < batchSize) break;
    const last = snapshots.docs[snapshots.docs.length - 1];
    if (!last) break;
    query = collectionGroup.orderBy("__name__").startAfter(last).limit(batchSize);
  }
  return records;
}

function uniqueCollectionNames(collections: readonly string[]): string[] {
  return Array.from(new Set(collections));
}

export function recordsFor(snapshot: SourceSnapshot, collection: string): readonly SourceRecord[] {
  return snapshot.records.get(collection) ?? [];
}

export function sourceTimestamp(value: unknown): string | null {
  return value instanceof Timestamp ? value.toDate().toISOString() : null;
}

export function sourceReadErrorMessage(error: unknown): string {
  return error instanceof FirestoreMigrationReadError ? errorMessage(error) : compactError(error);
}

export const migrationSourceCollections = sourceCollections;
