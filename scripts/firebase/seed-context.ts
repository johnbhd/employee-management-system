import {
  getFirebaseAdminAuth,
  getFirebaseAdminDb,
} from "../../src/lib/firebase/server/runtime";
import { getFirebaseAdminConfig } from "../../src/lib/firebase/server/config";

import type { SeedContext } from "./seed-types";

const allowedSeedEnvironments = new Set(["development", "test"]);

function getEnvironmentValue(variableName: string): string {
  return process.env[variableName]?.trim() ?? "";
}

function assertSeedWritePolicy(projectId: string): void {
  if (getEnvironmentValue("FIREBASE_SEED_ENABLED") !== "true") {
    throw new Error(
      "Firebase seed writes are disabled. Set FIREBASE_SEED_ENABLED=true only for an approved development or test project.",
    );
  }

  const seedEnvironment = getEnvironmentValue("FIREBASE_SEED_ENVIRONMENT");

  if (!allowedSeedEnvironments.has(seedEnvironment)) {
    throw new Error(
      "Firebase seed writes require FIREBASE_SEED_ENVIRONMENT to be development or test.",
    );
  }

  if (getEnvironmentValue("FIREBASE_SEED_PROJECT_ID") !== projectId) {
    throw new Error(
      "Firebase seed writes require FIREBASE_SEED_PROJECT_ID to match FIREBASE_PROJECT_ID.",
    );
  }

  if (getEnvironmentValue("FIREBASE_SEED_CREDENTIAL_ROTATED") !== "true") {
    throw new Error(
      "Firebase seed writes are blocked until the configured service-account key has been rotated and FIREBASE_SEED_CREDENTIAL_ROTATED=true.",
    );
  }
}

export function createSeedContext(dryRun: boolean): SeedContext {
  const configuredProjectId = getEnvironmentValue("FIREBASE_PROJECT_ID");

  if (dryRun) {
    return {
      auth: null,
      db: null,
      dryRun: true,
      projectId: configuredProjectId || null,
    };
  }

  const config = getFirebaseAdminConfig();

  assertSeedWritePolicy(config.projectId);

  return {
    auth: getFirebaseAdminAuth(),
    db: getFirebaseAdminDb(),
    dryRun: false,
    projectId: config.projectId,
  };
}

export function requireSeedServices(context: SeedContext) {
  if (!context.auth || !context.db) {
    throw new Error(
      "Firebase Admin services are unavailable for a non-dry-run seed.",
    );
  }

  return {
    auth: context.auth,
    db: context.db,
  };
}
