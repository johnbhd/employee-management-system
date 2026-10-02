import { prototypeAuthAccounts } from "../../../src/data/prototype-auth";
import {
  getRequiredFirebaseAuthEmail,
  getFirebaseAuthPassword,
} from "../../../src/lib/auth/firebase-credential-adapter";
import type { ApplicationRole } from "../../../src/lib/auth/roles";

export type SeedUser = {
  uid: string;
  username: string;
  password: string;
  role: ApplicationRole;
  displayName: string;
  authEmail: string;
  employeeId: string | null;
};

export const userSeedData: readonly SeedUser[] = prototypeAuthAccounts.map(
  (account) => ({
    uid: `seed-aujsc-${account.role}`,
    username: account.username,
    password: getFirebaseAuthPassword(account.password),
    role: account.role,
    displayName: account.displayName,
    authEmail: getRequiredFirebaseAuthEmail(account.username),
    employeeId: account.employeeId,
  }),
);
