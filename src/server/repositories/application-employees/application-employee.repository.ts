import "server-only";

import type { Employee } from "@prisma/client";

import { getPrismaClient } from "@/lib/prisma/server";
import type { EmployeeReference } from "@/types/employee";

function toEmployeeReference(employee: Employee): EmployeeReference {
    return {
        employeeId: employee.employeeId,
        displayName: employee.displayName,
        department: employee.department,
        position: employee.position,
        employmentStatus: employee.employmentStatus,
    };
}

export async function getApplicationEmployeeById(
    employeeId: string,
): Promise<EmployeeReference | null> {
    const employee = await getPrismaClient().employee.findUnique({
        where: { employeeId },
    });

    return employee ? toEmployeeReference(employee) : null;
}

export async function listApplicationEmployees(): Promise<EmployeeReference[]> {
    const employees = await getPrismaClient().employee.findMany({
        orderBy: { employeeId: "asc" },
    });

    return employees.map(toEmployeeReference);
}

export async function upsertApplicationEmployee(
    employee: EmployeeReference,
): Promise<EmployeeReference> {
    const saved = await getPrismaClient().employee.upsert({
        where: { employeeId: employee.employeeId },
        create: {
            employeeId: employee.employeeId,
            displayName: employee.displayName,
            department: employee.department,
            position: employee.position,
            employmentStatus: employee.employmentStatus,
            sourceSystem: "HRPS",
            dataSource: "identity-bridge",
        },
        update: {
            displayName: employee.displayName,
            department: employee.department,
            position: employee.position,
            employmentStatus: employee.employmentStatus,
            sourceSystem: "HRPS",
            dataSource: "identity-bridge",
        },
    });

    return toEmployeeReference(saved);
}
