import { hrpsEmployees } from "../../../src/data/hrps-employees";

export type SeedEmployee = {
  employeeId: string;
  displayName: string;
  department: string;
  position: string | null;
  employmentStatus: "active" | "inactive";
  sourceSystem: "HRPS";
  dataSource: "development-seed";
};

export const employeeSeedData: readonly SeedEmployee[] = hrpsEmployees.map(
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
