import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve } from "node:path";

import type { MigrationDomain, MigrationMode } from "./types";
import { migrationDomains } from "./types";

export type MigrationConfig = {
  mode: MigrationMode;
  domains: MigrationDomain[];
  runId: string;
  resumed: boolean;
  manifestPath: string;
  reportPath: string;
  batchSize: number;
  sourceProjectId: string | null;
  showHelp: boolean;
  selfCheck: boolean;
};

const defaultReportDirectory = ".migration-reports";

export function parseMigrationConfig(argv: readonly string[]): MigrationConfig {
  const mode: MigrationMode = argv.includes("--apply") || argv.includes("--execute")
    ? "execute"
    : "dry-run";
  const domainArgument = valueAfter(argv, "--domain") ?? "all";
  const domains = domainArgument === "all"
    ? [...migrationDomains]
    : domainArgument.split(",").map((value) => value.trim()).filter(Boolean).map(parseDomain);
  const runArgument = valueAfter(argv, "--run-id");
  const resumeArgument = valueAfter(argv, "--resume");
  const runId = runArgument ?? resumeArgument ?? `migration-${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}-${randomUUID().slice(0, 8)}`;
  const reportDirectory = resolve(valueAfter(argv, "--report-dir") ?? defaultReportDirectory);
  const reportPath = join(reportDirectory, `${runId}.json`);
  const manifestPath = join(reportDirectory, `${runId}.manifest.json`);
  const batchSize = parsePositiveInteger(valueAfter(argv, "--batch-size")) ?? 250;

  return {
    mode,
    domains: uniqueDomains(domains),
    runId,
    resumed: Boolean(resumeArgument),
    manifestPath,
    reportPath,
    batchSize,
    sourceProjectId: process.env.FIREBASE_PROJECT_ID?.trim()
      ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim()
      ?? null,
    showHelp: argv.includes("--help") || argv.includes("-h"),
    selfCheck: argv.includes("--self-check"),
  };
}

function valueAfter(argv: readonly string[], flag: string): string | null {
  const index = argv.indexOf(flag);
  if (index < 0) return null;
  const value = argv[index + 1];
  return value && !value.startsWith("--") ? value : null;
}

function parseDomain(value: string): MigrationDomain {
  if ((migrationDomains as readonly string[]).includes(value)) return value as MigrationDomain;
  throw new Error(`Unknown migration domain "${value}". Allowed: ${migrationDomains.join(", ")}.`);
}

function uniqueDomains(domains: MigrationDomain[]): MigrationDomain[] {
  return Array.from(new Set(domains));
}

function parsePositiveInteger(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function loadResumeManifest(path: string): Promise<Set<string>> {
  try {
    const raw = await readFile(path, "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (!isObject(parsed) || !Array.isArray(parsed.entries)) return new Set();
    return new Set(parsed.entries.map((entry) => (
      isObject(entry) && typeof entry.sourceCollection === "string" && typeof entry.sourceId === "string"
        ? `${entry.sourceCollection}/${entry.sourceId}`
        : null
    )).filter((entry): entry is string => Boolean(entry)));
  } catch {
    return new Set();
  }
}

export async function writeJsonFile(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function absolutePath(path: string): string {
  return isAbsolute(path) ? path : resolve(path);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export const migrationHelp = `
DB-DATA-MIGRATION-011 Firestore -> Supabase PostgreSQL

Safe default:
  npm run db:migrate:firestore -- --dry-run

Options:
  --dry-run                 Read and validate only (default).
  --apply or --execute      Execute validated writes explicitly.
  --domain all|a,b          Limit domains; default is all.
  --resume <run-id>         Reuse the prior report and rerun idempotently.
  --run-id <id>             Use a stable external run identifier.
  --report-dir <directory>  Store report and manifest outside business tables.
  --batch-size <number>     Validation/write batch size; default 250.
  --self-check              Run local transformation fixtures without Firestore.
  --help                    Show this help.

Firestore is never updated or deleted by this command. Firebase Auth passwords,
password hashes, and Supabase Auth are never read or migrated.
`;
