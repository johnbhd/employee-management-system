import "server-only";

import { listEmployees } from "@/server/repositories/employees/employee.repository";
import type { EmployeeReference } from "@/types/employee";

export type EmployeeDirectoryData = {
    employees: EmployeeReference[];
};

export async function getEmployeeDirectoryData(): Promise<EmployeeDirectoryData> {
    return {
        employees: await listEmployees(),
    };
}
