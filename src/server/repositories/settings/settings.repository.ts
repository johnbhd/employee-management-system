import "server-only";

import { FieldValue, Timestamp, type DocumentData } from "firebase-admin/firestore";

import { getFirebaseAdminDb } from "@/lib/firebase/server";
import {
  getPrismaRuntimeSettings,
  PrismaSettingsConflictError,
  PrismaSettingsDataError,
  updatePrismaRuntimeSettings,
} from "@/server/repositories/settings/prisma-settings.repository";

const settingsCollection = "systemSettings";
const runtimeDocumentId = "runtime";

export type RuntimeSettingsSnapshot = {
  overrides: Record<string, unknown>;
  version: number;
  updatedAt: string | null;
  updatedBy: { uid: string; displayName: string } | null;
};

export class SettingsRepositoryConflictError extends Error {
  readonly code = "SETTINGS_CONFLICT";

  constructor() {
    super("The system settings changed since this page was opened.");
    this.name = "SettingsRepositoryConflictError";
  }
}

export class SettingsRepositoryDataError extends Error {
  readonly code = "SETTINGS_DATA_INVALID";

  constructor(message: string) {
    super(message);
    this.name = "SettingsRepositoryDataError";
  }
}

function parseUpdatedBy(value: unknown): RuntimeSettingsSnapshot["updatedBy"] {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.uid === "string" && typeof candidate.displayName === "string"
    ? { uid: candidate.uid, displayName: candidate.displayName }
    : null;
}

function parseRuntimeSettings(data: DocumentData | undefined): RuntimeSettingsSnapshot {
  if (!data) {
    return { overrides: {}, version: 0, updatedAt: null, updatedBy: null };
  }

  const version = data.version;
  if (typeof version !== "number" || !Number.isInteger(version) || version < 1) {
    throw new SettingsRepositoryDataError("The runtime settings version is invalid.");
  }

  const rawOverrides = data.overrides;
  if (rawOverrides !== undefined && (!rawOverrides || typeof rawOverrides !== "object" || Array.isArray(rawOverrides))) {
    throw new SettingsRepositoryDataError("The runtime settings overrides are invalid.");
  }

  return {
    overrides: rawOverrides ? { ...(rawOverrides as Record<string, unknown>) } : {},
    version,
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : null,
    updatedBy: parseUpdatedBy(data.updatedBy),
  };
}

export async function getRuntimeSettings(): Promise<RuntimeSettingsSnapshot> {
  return getPrismaRuntimeSettings();

  /* istanbul ignore next -- legacy Firestore implementation retained below for migration reference. */
  const snapshot = await getFirebaseAdminDb().collection(settingsCollection).doc(runtimeDocumentId).get();
  return parseRuntimeSettings(snapshot.exists ? snapshot.data() : undefined);
}

export async function updateRuntimeSettings(input: {
  overrides: Record<string, unknown>;
  expectedVersion: number;
  updatedBy: { uid: string; displayName: string };
}): Promise<RuntimeSettingsSnapshot> {
  try {
    return await updatePrismaRuntimeSettings(input);
  } catch (error) {
    if (error instanceof PrismaSettingsConflictError) {
      throw new SettingsRepositoryConflictError();
    }
    if (error instanceof PrismaSettingsDataError) {
      throw new SettingsRepositoryDataError(error.message);
    }
    throw error;
  }

  /* istanbul ignore next -- legacy Firestore implementation retained below for migration reference. */
  const db = getFirebaseAdminDb();
  const reference = db.collection(settingsCollection).doc(runtimeDocumentId);

  await db.runTransaction(async (transaction) => {
    const currentSnapshot = await transaction.get(reference);
    const current = parseRuntimeSettings(currentSnapshot.exists ? currentSnapshot.data() : undefined);

    if (input.expectedVersion !== current.version) {
      throw new SettingsRepositoryConflictError();
    }

    transaction.set(reference, {
      overrides: input.overrides,
      version: current.version + 1,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: input.updatedBy,
    });
  });

  const saved = await reference.get();
  return parseRuntimeSettings(saved.data());
}
