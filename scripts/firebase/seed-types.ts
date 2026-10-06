import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";

export type SeedName = "employees" | "users" | "payslips";

export type SeedRecordStatus =
  | "created"
  | "updated"
  | "unchanged"
  | "planned";

export type SeedRecord = {
  id: string;
  label: string;
  status: SeedRecordStatus;
  detail: string;
};

export type SeederResult = {
  name: SeedName;
  records: SeedRecord[];
};

export type SeedContext = {
  auth: Auth | null;
  db: Firestore | null;
  dryRun: boolean;
  projectId: string | null;
};

export type FirebaseSeeder = (
  context: SeedContext,
) => Promise<SeederResult>;
