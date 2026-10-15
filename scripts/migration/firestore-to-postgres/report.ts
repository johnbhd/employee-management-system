import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

import type {
  MigrationDomainReport,
  MigrationManifestEntry,
  MigrationReport,
  MigrationCount,
  SourceRecord,
} from "./types";
import type { MigrationConfig } from "./config";
import { sourceHash, targetHash } from "./utils";
import { writeJsonFile } from "./config";

export function emptyCount(source = 0): MigrationCount {
  return { source, inserted: 0, updated: 0, skipped: 0, invalid: 0, failed: 0 };
}

export function emptyDomainReport(source = 0): MigrationDomainReport {
  return {
    ...emptyCount(source),
    targetBefore: 0,
    targetAfter: 0,
    statusCounts: {},
    orphanCount: 0,
    duplicateCount: 0,
    verifiedReadCount: 0,
  };
}

export function createReport(config: MigrationConfig, health: { configured: boolean; connected: boolean }): MigrationReport {
  return {
    task: "DB-DATA-MIGRATION-011",
    runId: config.runId,
    mode: config.mode,
    resumed: config.resumed,
    requestedDomains: config.domains,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    source: {
      provider: "Firestore",
      projectId: null,
      readOnly: true,
      status: "not-read",
    },
    target: {
      provider: "Supabase PostgreSQL",
      configured: health.configured,
      connected: health.connected,
      prismaVersion: "6.19.0",
      liveRepositoriesSwitched: false,
    },
    domains: Object.fromEntries(config.domains.map((domain) => [domain, emptyDomainReport()])),
    findings: [],
    manifestPath: config.manifestPath,
    result: "FAILED",
    safety: {
      firestoreWrites: 0,
      firestoreDeletes: 0,
      passwordRecordsMigrated: 0,
      supabaseAuthUsed: false,
    },
  };
}

export async function persistReport(
  config: MigrationConfig,
  report: MigrationReport,
  manifest: readonly MigrationManifestEntry[],
): Promise<void> {
  await mkdir(dirname(config.reportPath), { recursive: true });
  await writeJsonFile(config.reportPath, { ...report, manifest: undefined });
  await writeJsonFile(config.manifestPath, {
    task: report.task,
    runId: report.runId,
    mode: report.mode,
    source: report.source,
    entries: manifest,
  });
}

export function makeManifestEntry(
  source: SourceRecord,
  status: MigrationManifestEntry["status"],
  targetId: string | null,
  target: unknown,
  error?: string,
): MigrationManifestEntry {
  return {
    sourceCollection: source.collection,
    sourceId: source.id,
    targetId,
    sourceHash: sourceHash(source as SourceRecord),
    targetHash: target === null || target === undefined ? null : targetHash(target),
    status,
    ...(error ? { error } : {}),
    observedAt: new Date().toISOString(),
  };
}

export function incrementStatus(
  report: MigrationDomainReport,
  status: "inserted" | "updated" | "skipped" | "invalid" | "failed",
): void {
  report[status] += 1;
}

export function statusDistribution(report: MigrationDomainReport, status: string): void {
  report.statusCounts[status] = (report.statusCounts[status] ?? 0) + 1;
}
