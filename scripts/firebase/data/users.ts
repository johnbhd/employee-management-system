import {
  prototypeAuthAccounts,
  type PrototypeAuthRole,
} from "../../../src/data/prototype-auth";

const firebaseMinimumPasswordLength = 6;

function getSeedPassword(password: string): string {
  if (password.length >= firebaseMinimumPasswordLength) {
    return password;
  }

  // Keep the prototype login credential unchanged. Firebase Email/Password
  // Auth requires at least six characters, so short prototype credentials get
  // a deterministic development-only suffix in the seed source.
  return `${password}4`;
}

export type SeedUser = {
  uid: string;
  username: string;
  password: string;
  role: PrototypeAuthRole;
  displayName: string;
  authEmail: string;
  employeeId: string | null;
};

export const userSeedData: readonly SeedUser[] = prototypeAuthAccounts.map(
  (account) => ({
    uid: `seed-aujsc-${account.role}`,
    username: account.username,
    password: getSeedPassword(account.password),
    role: account.role,
    displayName: account.displayName,
    authEmail: account.authEmail,
    employeeId: account.employeeId,
  }),
);
