import { hrpsEmployees } from "../../../src/data/hrps-employees";

import { demoEmployeeSeedAccounts } from "./demo-employees";

export type SeedEmployee = {
  employeeId: string;
  displayName: string;
  department: string;
  position: string | null;
  employmentStatus: "active" | "inactive";
  sourceSystem: "HRPS";
  dataSource: "development-seed";
};

const hrpsEmployeeSeedData: readonly SeedEmployee[] = hrpsEmployees.map(
  (employee) => ({
    employeeId: employee.id,
    displayName: employee.employee,
    department: employee.department,
    position: employee.position === "—" ? null : employee.position,
    employmentStatus:
      employee.employment === "Active" ? "active" : "inactive",
    sourceSystem: "HRPS",
    dataSource: "development-seed",
  }),
);

const demoEmployeeSeedData: readonly SeedEmployee[] =
  demoEmployeeSeedAccounts.map((employee) => ({
    employeeId: employee.employeeId,
    displayName: employee.displayName,
    department: employee.department,
    position: employee.position,
    employmentStatus: employee.employmentStatus,
    sourceSystem: employee.sourceSystem,
    dataSource: employee.dataSource,
  }));

export const employeeSeedData: readonly SeedEmployee[] = [
  ...hrpsEmployeeSeedData,
  ...demoEmployeeSeedData,
];
