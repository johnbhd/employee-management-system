import type { DocumentData } from "firebase-admin/firestore";

export const migrationDomains = [
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
] as const;

export type MigrationDomain = (typeof migrationDomains)[number];

export type MigrationMode = "dry-run" | "execute";

export type SourceRecord = {
  collection: string;
  id: string;
  path: string;
  data: DocumentData;
};

export type SourceSnapshot = {
  projectId: string;
  records: ReadonlyMap<string, readonly SourceRecord[]>;
};

export type MigrationCount = {
  source: number;
  inserted: number;
  updated: number;
  skipped: number;
  invalid: number;
  failed: number;
};

export type MigrationFinding = {
  severity: "P0" | "P1" | "P2";
  domain: string;
  collection: string;
  sourceId: string;
  message: string;
  quarantineReason?: string;
};

export type MigrationManifestEntry = {
  sourceCollection: string;
  sourceId: string;
  targetId: string | null;
  sourceHash: string;
  targetHash: string | null;
  status: "inserted" | "updated" | "unchanged" | "invalid" | "conflict" | "failed" | "blocked";
  error?: string;
  observedAt: string;
};

export type MigrationDomainReport = MigrationCount & {
  targetBefore: number;
  targetAfter: number;
  statusCounts: Record<string, number>;
  orphanCount: number;
  duplicateCount: number;
  verifiedReadCount: number;
};

export type MigrationReport = {
  task: "DB-DATA-MIGRATION-011";
  runId: string;
  mode: MigrationMode;
  resumed: boolean;
  requestedDomains: readonly string[];
  startedAt: string;
  finishedAt: string | null;
  source: {
    provider: "Firestore";
    projectId: string | null;
    readOnly: true;
    status: "not-read" | "read" | "blocked";
  };
  target: {
    provider: "Supabase PostgreSQL";
    configured: boolean;
    connected: boolean;
    prismaVersion: "6.19.0";
    liveRepositoriesSwitched: false;
  };
  domains: Record<string, MigrationDomainReport>;
  findings: MigrationFinding[];
  manifestPath: string;
  result: "PASS" | "BLOCKED" | "FAILED";
  safety: {
    firestoreWrites: 0;
    firestoreDeletes: 0;
    passwordRecordsMigrated: 0;
    supabaseAuthUsed: false;
  };
};

export type MigrationContext = {
  mode: MigrationMode;
  runId: string;
  resumed: boolean;
  source: SourceSnapshot;
  report: MigrationReport;
  manifest: MigrationManifestEntry[];
};

export type ActorSnapshot = {
  uid: string;
  username: string;
  displayName: string;
  role: string;
};

export type TargetMaps = {
  employees: Map<string, string>;
  users: Map<string, string>;
  usersByUsername: Map<string, string>;
  attendance: Map<string, string>;
  batches: Map<string, string>;
  handoffs: Map<string, string>;
  results: Map<string, string>;
  resultItems: Map<string, string>;
};
