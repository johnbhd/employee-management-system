import { hrpsEmployees } from "@/data/admin";

export type UserAccountRole = "IT Administrator" | "Employee";
export type UserAccountStatus = "Active" | "Disabled";

export type LinkedHrpsEmployee = {
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  employmentStatus: "Active" | "Inactive";
};

export type UserAccount = {
  accountId: string;
  username: string;
  role: UserAccountRole;
  status: UserAccountStatus;
  linkedEmployee: LinkedHrpsEmployee | null;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
  isPrimaryAdministrator?: boolean;
  reviewNote?: string;
};

export type UserAccountActivity = {
  event: string;
  detail: string;
  actor: string;
  time: string;
  tone: "success" | "warning" | "info" | "muted";
};

export const linkedHrpsEmployees: readonly LinkedHrpsEmployee[] = hrpsEmployees.map((employee) => ({
  employeeId: employee.id,
  employeeName: employee.employee,
  department: employee.department,
  position: employee.position,
  employmentStatus: employee.employment,
}));

export const userAccounts: readonly UserAccount[] = [
  {
    accountId: "USR-001",
    username: "aujsc.admin",
    role: "IT Administrator",
    status: "Active",
    linkedEmployee: null,
    lastLogin: "Sep 23, 2026 • 10:12 AM",
    createdAt: "Aug 01, 2026 • Prototype",
    updatedAt: "Sep 23, 2026 • Prototype",
    isPrimaryAdministrator: true,
  },
  {
    accountId: "USR-002",
    username: "employee1",
    role: "Employee",
    status: "Active",
    linkedEmployee: linkedHrpsEmployees[0],
    lastLogin: "Sep 23, 2026 • 08:04 AM",
    createdAt: "Aug 03, 2026 • Prototype",
    updatedAt: "Sep 20, 2026 • Prototype",
  },
  {
    accountId: "USR-003",
    username: "employee2",
    role: "Employee",
    status: "Active",
    linkedEmployee: linkedHrpsEmployees[1],
    lastLogin: "Sep 22, 2026 • 04:36 PM",
    createdAt: "Aug 05, 2026 • Prototype",
    updatedAt: "Sep 18, 2026 • Prototype",
  },
  {
    accountId: "USR-004",
    username: "employee3",
    role: "Employee",
    status: "Active",
    linkedEmployee: linkedHrpsEmployees[2],
    lastLogin: "Sep 15, 2026 • 05:11 PM",
    createdAt: "Aug 08, 2026 • Prototype",
    updatedAt: "Sep 15, 2026 • Prototype",
    reviewNote: "Account review recommended: linked HRPS employee is inactive.",
  },
  {
    accountId: "USR-005",
    username: "employee4",
    role: "Employee",
    status: "Disabled",
    linkedEmployee: linkedHrpsEmployees[3],
    lastLogin: "Sep 10, 2026 • 03:22 PM",
    createdAt: "Aug 12, 2026 • Prototype",
    updatedAt: "Sep 10, 2026 • Prototype",
  },
];

export const accountActivity: readonly UserAccountActivity[] = [
  {
    event: "Account review flagged",
    detail: "employee3 is active in this application while its linked HRPS employee is inactive.",
    actor: "Prototype review check",
    time: "Sep 23, 2026 · 10:16 AM",
    tone: "warning",
  },
  {
    event: "Account disabled",
    detail: "employee4 application access was disabled; the linked HRPS record was not changed.",
    actor: "IT Administrator",
    time: "Sep 10, 2026 · 03:24 PM",
    tone: "info",
  },
  {
    event: "Account created",
    detail: "employee2 was linked to an existing HRPS Employee ID.",
    actor: "IT Administrator",
    time: "Aug 05, 2026 · 09:10 AM",
    tone: "success",
  },
];
