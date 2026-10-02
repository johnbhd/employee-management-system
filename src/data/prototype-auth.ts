import {
  type ApplicationRole,
  type RoleHomePath,
} from "../lib/auth/roles";

export type PrototypeAuthRole = ApplicationRole;

export type PrototypeAuthAccount = {
  username: string;
  password: string;
  role: PrototypeAuthRole;
  displayName: string;
  redirectTo: RoleHomePath;
  employeeId: string | null;
};

// These credentials are development seed data only. They are not production
// credentials and are not used by runtime authentication.
export const prototypeAuthAccounts: readonly PrototypeAuthAccount[] = [
  {
    username: "aujsc.admin",
    password: "admin123",
    role: "admin",
    displayName: "IT Administrator",
    redirectTo: "/admin/dashboard",
    employeeId: null,
  },
  {
    username: "aujsc.hr",
    password: "hr123",
    role: "hr",
    displayName: "HR / Attendance Staff",
    redirectTo: "/hr/dashboard",
    employeeId: "AU-EMP-2026-014",
  },
  {
    username: "aujsc.employee",
    password: "employee123",
    role: "employee",
    displayName: "Employee",
    redirectTo: "/employee/dashboard",
    employeeId: "AU-EMP-2026-001",
  },
  {
    username: "aujsc.accounting",
    password: "accounting123",
    role: "accounting",
    displayName: "Accounting Staff",
    redirectTo: "/accounting/dashboard",
    employeeId: null,
  },
];
