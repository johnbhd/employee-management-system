import type { ApplicationRole } from "../../../src/lib/auth/roles";

export type DemoEmployeeSeedAccount = {
  employeeId: string;
  username: string;
  password: string;
  role: Extract<ApplicationRole, "employee">;
  displayName: string;
  department: string;
  position: string;
  employmentStatus: "active";
  sourceSystem: "HRPS";
  dataSource: "development-seed";
};

export const demoEmployeeSeedAccounts: readonly DemoEmployeeSeedAccount[] = [
  {
    employeeId: "001",
    username: "aujsc.registrar.001",
    password: "aujsc.001",
    role: "employee",
    displayName: "Demo Employee 001",
    department: "Registrar",
    position: "Rank-and-File Staff",
    employmentStatus: "active",
    sourceSystem: "HRPS",
    dataSource: "development-seed",
  },
  {
    employeeId: "002",
    username: "aujsc.admissions.002",
    password: "aujsc.002",
    role: "employee",
    displayName: "Demo Employee 002",
    department: "Admissions",
    position: "Rank-and-File Staff",
    employmentStatus: "active",
    sourceSystem: "HRPS",
    dataSource: "development-seed",
  },
  {
    employeeId: "003",
    username: "aujsc.library.003",
    password: "aujsc.003",
    role: "employee",
    displayName: "Demo Employee 003",
    department: "Library",
    position: "Rank-and-File Staff",
    employmentStatus: "active",
    sourceSystem: "HRPS",
    dataSource: "development-seed",
  },
  {
    employeeId: "004",
    username: "aujsc.cashier.004",
    password: "aujsc.004",
    role: "employee",
    displayName: "Demo Employee 004",
    department: "Cashier",
    position: "Rank-and-File Staff",
    employmentStatus: "active",
    sourceSystem: "HRPS",
    dataSource: "development-seed",
  },
  {
    employeeId: "005",
    username: "aujsc.records.005",
    password: "aujsc.005",
    role: "employee",
    displayName: "Demo Employee 005",
    department: "Records",
    position: "Rank-and-File Staff",
    employmentStatus: "active",
    sourceSystem: "HRPS",
    dataSource: "development-seed",
  },
  {
    employeeId: "006",
    username: "aujsc.guidance.006",
    password: "aujsc.006",
    role: "employee",
    displayName: "Demo Employee 006",
    department: "Guidance",
    position: "Rank-and-File Staff",
    employmentStatus: "active",
    sourceSystem: "HRPS",
    dataSource: "development-seed",
  },
  {
    employeeId: "007",
    username: "aujsc.studentaffairs.007",
    password: "aujsc.007",
    role: "employee",
    displayName: "Demo Employee 007",
    department: "Student Affairs",
    position: "Rank-and-File Staff",
    employmentStatus: "active",
    sourceSystem: "HRPS",
    dataSource: "development-seed",
  },
  {
    employeeId: "008",
    username: "aujsc.itoffice.008",
    password: "aujsc.008",
    role: "employee",
    displayName: "Demo Employee 008",
    department: "IT Office",
    position: "Rank-and-File Staff",
    employmentStatus: "active",
    sourceSystem: "HRPS",
    dataSource: "development-seed",
  },
  {
    employeeId: "009",
    username: "aujsc.adminoffice.009",
    password: "aujsc.009",
    role: "employee",
    displayName: "Demo Employee 009",
    department: "Administrative Office",
    position: "Rank-and-File Staff",
    employmentStatus: "active",
    sourceSystem: "HRPS",
    dataSource: "development-seed",
  },
  {
    employeeId: "010",
    username: "aujsc.facilities.010",
    password: "aujsc.010",
    role: "employee",
    displayName: "Demo Employee 010",
    department: "Facilities / Office Support",
    position: "Rank-and-File Staff",
    employmentStatus: "active",
    sourceSystem: "HRPS",
    dataSource: "development-seed",
  },
] as const;
