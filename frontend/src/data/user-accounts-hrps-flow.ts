import type { Metric } from "@/types/ui";

export const userAccountsHrpsMetrics: readonly Metric[] = [
  {
    label: "Application accounts",
    value: "5",
    note: "Current directory",
    icon: "users",
    tone: "info",
  },
  {
    label: "HRPS links",
    value: "4 / 5",
    note: "Employee ID references",
    icon: "hrps",
    tone: "success",
  },
  {
    label: "Active access",
    value: "4",
    note: "Application access enabled",
    icon: "check",
    tone: "success",
  },
  {
    label: "Needs review",
    value: "1",
    note: "Reference mismatch",
    icon: "warning",
    tone: "warning",
  },
];

export const userAccountsHrpsFlow = [
  {
    label: "HRPS",
    detail: "Employee master data",
    icon: "hrps" as const,
    status: "Source of truth",
    tone: "info" as const,
  },
  {
    label: "Integration layer",
    detail: "Match + validate",
    icon: "shield" as const,
    status: "Validated",
    tone: "success" as const,
  },
  {
    label: "Application directory",
    detail: "Access reference",
    icon: "users" as const,
    status: "Updated",
    tone: "success" as const,
  },
] as const;

export const userAccountsHrpsMappings = [
  ["HRPS employee number", "employeeId"],
  ["Full name", "employeeName"],
  ["Department", "department"],
  ["Employment status", "hrpsStatus"],
  ["Application username", "username"],
  ["Assigned application role", "role"],
] as const;

export const userAccountsHrpsRecords = [
  {
    id: "USR-001",
    username: "aujsc.admin",
    employeeId: "—",
    employee: "Application administrator",
    role: "IT Administrator",
    status: "Active",
    employment: "Not Linked",
    result: "Protected",
    time: "10:38 AM",
  },
  {
    id: "USR-002",
    username: "employee1",
    employeeId: "AU-EMP-2026-001",
    employee: "John Benedict M. Villegas",
    role: "Employee",
    status: "Active",
    employment: "Active",
    result: "Updated",
    time: "10:38 AM",
  },
  {
    id: "USR-003",
    username: "employee2",
    employeeId: "AU-EMP-2026-014",
    employee: "Maria Santos",
    role: "Employee",
    status: "Active",
    employment: "Active",
    result: "No Change",
    time: "10:38 AM",
  },
  {
    id: "USR-004",
    username: "employee3",
    employeeId: "AU-EMP-2026-087",
    employee: "Robert Cruz",
    role: "Employee",
    status: "Active",
    employment: "Inactive",
    result: "Needs Review",
    time: "10:38 AM",
  },
  {
    id: "USR-005",
    username: "employee4",
    employeeId: "AU-EMP-2026-233",
    employee: "Example Employee",
    role: "Employee",
    status: "Disabled",
    employment: "Active",
    result: "Protected",
    time: "10:38 AM",
  },
] as const;

export const userAccountsHrpsIssues = [
  {
    title: "Inactive HRPS reference",
    detail: "employee3 has active application access while its linked HRPS employee is inactive.",
    tone: "warning" as const,
  },
  {
    title: "Disabled application access",
    detail: "employee4 access is disabled without changing the linked HRPS employee record.",
    tone: "warning" as const,
  },
] as const;

export const userAccountsHrpsSyncHistory = [
  {
    title: "Application account reference synchronization",
    detail: "5 account records checked · 4 HRPS links verified · 1 review item",
    time: "10:38 AM",
  },
  {
    title: "Access boundary test completed",
    detail: "Application account fields remained separate from HRPS employee data.",
    time: "09:20 AM",
  },
  {
    title: "HRPS connection test completed",
    detail: "The prototype endpoint responded within the expected mock threshold.",
    time: "08:45 AM",
  },
] as const;
