import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import type {
    ApplicationUser,
    CurrentUserContext,
    SessionUser,
} from "@/types/auth";
import type { EmployeeReference } from "@/types/employee";

import { getEmployeeById } from "../repositories/employees/employee.repository";
import { getOptionalSessionUser } from "./session";

export class CurrentEmployeeUnavailableError extends Error {
    readonly code = "EMPLOYEE_REFERENCE_UNAVAILABLE";
    readonly status = 403;

    constructor() {
        super("The authenticated account has no available employee reference.");
        this.name = "CurrentEmployeeUnavailableError";
    }
}

export const getCurrentUserContext = cache(
    async (): Promise<CurrentUserContext | null> => {
        const user = await getOptionalSessionUser();

        if (!user) {
            return null;
        }

        return {
            user,
            employee: await getEmployeeForApplicationUser(user),
        };
    },
);

export async function getEmployeeForApplicationUser(
    user: Pick<ApplicationUser, "employeeId">
        | Pick<SessionUser, "employeeId">,
): Promise<EmployeeReference | null> {
    if (!user.employeeId) {
        return null;
    }

    return getEmployeeById(user.employeeId);
}

export async function getCurrentEmployee(): Promise<EmployeeReference | null> {
    const context = await getCurrentUserContext();

    return context?.employee ?? null;
}

export async function requireCurrentUserContext(): Promise<CurrentUserContext> {
    const context = await getCurrentUserContext();

    if (!context) {
        redirect("/");
    }

    return context;
}

export async function requireCurrentEmployee(): Promise<EmployeeReference> {
    const context = await requireCurrentUserContext();

    if (!context.user.employeeId || !context.employee) {
        throw new CurrentEmployeeUnavailableError();
    }

    return context.employee;
}
