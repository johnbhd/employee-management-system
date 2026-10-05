import { prototypeAuthAccounts } from "../../../src/data/prototype-auth";
import {
  getRequiredFirebaseAuthEmail,
  getFirebaseAuthPassword,
} from "../../../src/lib/auth/firebase-credential-adapter";
import type { ApplicationRole } from "../../../src/lib/auth/roles";

import { demoEmployeeSeedAccounts } from "./demo-employees";

export type SeedUser = {
  uid: string;
  username: string;
  password: string;
  role: ApplicationRole;
  displayName: string;
  authEmail: string;
  employeeId: string | null;
};

type SeedUserSource = {
  username: string;
  password: string;
  role: ApplicationRole;
  displayName: string;
  employeeId: string | null;
};

const legacySeedUidByUsername: Readonly<Record<string, string>> = {
  "aujsc.admin": "seed-aujsc-admin",
  "aujsc.hr": "seed-aujsc-hr",
  "aujsc.employee": "seed-aujsc-employee",
  "aujsc.accounting": "seed-aujsc-accounting",
};

function getSeedUid(account: SeedUserSource): string {
  return (
    legacySeedUidByUsername[account.username]
    ?? `seed-aujsc-${account.username.replace(/[^a-z0-9]+/gi, "-")}`
  );
}

function toSeedUser(account: SeedUserSource): SeedUser {
  return {
    uid: getSeedUid(account),
    username: account.username,
    password: getFirebaseAuthPassword(account.password),
    role: account.role,
    displayName: account.displayName,
    authEmail: getRequiredFirebaseAuthEmail(account.username),
    employeeId: account.employeeId,
  };
}

const legacyUserSeedData: readonly SeedUser[] = prototypeAuthAccounts.map(
  toSeedUser,
);

const demoEmployeeUserSeedData: readonly SeedUser[] =
  demoEmployeeSeedAccounts.map(toSeedUser);

export const userSeedData: readonly SeedUser[] = [
  ...legacyUserSeedData,
  ...demoEmployeeUserSeedData,
];
