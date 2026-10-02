import {
  prototypeAuthAccounts,
  type PrototypeAuthRole,
} from "../../../src/data/prototype-auth";

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
    password: account.password,
    role: account.role,
    displayName: account.displayName,
    authEmail: account.authEmail,
    employeeId: account.employeeId,
  }),
);
