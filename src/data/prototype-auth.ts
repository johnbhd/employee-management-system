export type PrototypeAuthRole = "admin" | "hr" | "employee" | "accounting";

export type PrototypeAuthAccount = {
  username: string;
  password: string;
  role: PrototypeAuthRole;
  displayName: string;
  redirectTo: "/employee/dashboard" | "/admin/dashboard" | "/hr/dashboard" | "/accounting/dashboard";
  employeeId: string | null;
  authEmail: string;
};

// These credentials are prototype-only development data. They are used by the
// current login simulation and are not production credentials.
export const prototypeAuthAccounts: readonly PrototypeAuthAccount[] = [
  {
    username: "aujsc.admin",
    password: "admin123",
    role: "admin",
    displayName: "IT Administrator",
    redirectTo: "/admin/dashboard",
    employeeId: null,
    authEmail: "aujsc.admin@auth.aujsc.local",
  },
  {
    username: "aujsc.hr",
    password: "hr123",
    role: "hr",
    displayName: "HR / Attendance Staff",
    redirectTo: "/hr/dashboard",
    employeeId: "AU-EMP-2026-014",
    authEmail: "aujsc.hr@auth.aujsc.local",
  },
  {
    username: "aujsc.employee",
    password: "employee123",
    role: "employee",
    displayName: "Employee",
    redirectTo: "/employee/dashboard",
    employeeId: "AU-EMP-2026-001",
    authEmail: "aujsc.employee@auth.aujsc.local",
  },
  {
    username: "aujsc.accounting",
    password: "accounting123",
    role: "accounting",
    displayName: "Accounting Staff",
    redirectTo: "/accounting/dashboard",
    employeeId: null,
    authEmail: "aujsc.accounting@auth.aujsc.local",
  },
];
