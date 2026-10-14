import { loadEnvConfig } from "@next/env";
import { Prisma, PrismaClient } from "@prisma/client";

import { loadResumeManifest, parseMigrationConfig, migrationHelp } from "./config";
import { createReport, persistReport } from "./report";
import { readFirestoreSource, FirestoreMigrationReadError, sourceReadErrorMessage } from "./source";
import { runMigrationSelfCheck } from "./self-check";
import type { MigrationContext, MigrationDomain } from "./types";
import { createTargetMaps, hasBlockingFindings, migrateDomain, safeError } from "./runner";
import { addFinding } from "./utils";

loadEnvConfig(process.cwd());

const domainOrder: readonly MigrationDomain[] = [
  "roles",
  "employees",
  "schedules",
  "identity",
  "attendance",
  "corrections",
  "payroll",
  "payslips",
  "accounting",
  "audit",
  "settings",
];

async function main(): Promise<number> {
  const config = parseMigrationConfig(process.argv.slice(2));
  if (config.showHelp) {
    console.log(migrationHelp);
    return 0;
  }
  if (config.selfCheck) {
    runMigrationSelfCheck();
    return 0;
  }

  const priorManifest = config.resumed ? await loadResumeManifest(config.manifestPath) : new Set<string>();
  if (config.resumed && priorManifest.size === 0) {
    throw new Error(`Resume manifest not found or empty: ${config.manifestPath}`);
  }

  const prisma = createMigrationPrisma();
  const health = await checkMigrationPostgresHealth(prisma);
  const report = createReport(config, health);
  await persistReport(config, report, []);
  if (!health.configured || !health.connected) {
    report.result = "BLOCKED";
    report.finishedAt = new Date().toISOString();
    addFinding(report.findings, {
      severity: "P0",
      domain: "preflight",
      collection: "PostgreSQL",
      sourceId: "health",
      message: health.configured ? "Supabase PostgreSQL is not reachable; migration did not start." : "DATABASE_URL is not configured; migration did not start.",
    });
    await persistReport(config, report, []);
    await prisma.$disconnect();
    console.error(`Migration blocked. Report: ${config.reportPath}`);
    return 2;
  }

  let context: MigrationContext | null = null;
  try {
    const source = await readFirestoreSource(config.domains, config.batchSize);
    report.source.projectId = source.projectId;
    report.source.status = "read";
    const manifest: MigrationContext["manifest"] = [];
    context = { mode: config.mode, runId: config.runId, resumed: config.resumed, source, report, manifest };
    const maps = await createTargetMaps(prisma);
    const orderedDomains = domainOrder.filter((domain) => config.domains.includes(domain));

    for (const domain of orderedDomains) {
      if (config.mode === "execute") {
        await prisma.$transaction((transaction: Prisma.TransactionClient) => migrateDomain(domain, transaction, context as MigrationContext, maps));
      } else {
        await migrateDomain(domain, prisma, context, maps);
      }
      await persistReport(config, report, manifest);
    }

    report.result = hasBlockingFindings(context) ? "FAILED" : "PASS";
    report.finishedAt = new Date().toISOString();
    await persistReport(config, report, manifest);
    printSummary(report);
    return report.result === "PASS" ? 0 : 1;
  } catch (error: unknown) {
    report.finishedAt = new Date().toISOString();
    if (error instanceof FirestoreMigrationReadError) {
      report.source.status = "blocked";
      report.result = error.quotaBlocked ? "BLOCKED" : "FAILED";
      addFinding(report.findings, {
        severity: "P0",
        domain: "source",
        collection: "Firestore",
        sourceId: "read",
        message: sourceReadErrorMessage(error),
      });
    } else {
      report.result = "FAILED";
      addFinding(report.findings, {
        severity: "P0",
        domain: "runner",
        collection: "migration",
        sourceId: config.runId,
        message: safeError(error),
      });
    }
    await persistReport(config, report, context?.manifest ?? []);
    console.error(`Migration ${report.result.toLowerCase()}. Report: ${config.reportPath}`);
    console.error(safeError(error));
    return report.result === "BLOCKED" ? 2 : 1;
  } finally {
    await prisma.$disconnect();
  }
}

function createMigrationPrisma(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) return new PrismaClient();
  return new PrismaClient({ datasources: { db: { url: databaseUrl } } });
}

async function checkMigrationPostgresHealth(prisma: PrismaClient): Promise<{ configured: boolean; connected: boolean }> {
  if (!process.env.DATABASE_URL?.trim()) return { configured: false, connected: false };
  try {
    await prisma.$queryRaw<{ connected: number }[]>(Prisma.sql`SELECT 1 AS connected`);
    return { configured: true, connected: true };
  } catch {
    return { configured: true, connected: false };
  }
}

function printSummary(report: ReturnType<typeof createReport>): void {
  console.log(`DB-DATA-MIGRATION-011 ${report.mode} ${report.result}.`);
  console.log(`Run ID: ${report.runId}`);
  console.log(`Source: Firestore ${report.source.projectId ?? "not read"} (read-only).`);
  console.log(`Target: Supabase PostgreSQL via Prisma ${report.target.prismaVersion}.`);
  for (const [domain, domainReport] of Object.entries(report.domains)) {
    console.log(`${domain}: source=${domainReport.source}, inserted=${domainReport.inserted}, updated=${domainReport.updated}, invalid=${domainReport.invalid}, failed=${domainReport.failed}.`);
  }
  console.log(`Report: ${report.manifestPath.replace(/\.manifest\.json$/, ".json")}`);
}

main().then((code) => {
  process.exitCode = code;
}).catch((error: unknown) => {
  console.error(safeError(error));
  process.exitCode = 1;
});
