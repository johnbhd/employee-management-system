export const applicationRoles = [
    "admin",
    "hr",
    "employee",
    "accounting",
    "payroll",
] as const;

export type ApplicationRole = (typeof applicationRoles)[number];

export const roleHomePaths = {
    admin: "/admin/dashboard",
    hr: "/hr/dashboard",
    employee: "/employee/dashboard",
    accounting: "/accounting/dashboard",
    payroll: "/payroll/dashboard",
} as const satisfies Record<ApplicationRole, string>;

export type RoleHomePath = (typeof roleHomePaths)[ApplicationRole];

export function isApplicationRole(value: unknown): value is ApplicationRole {
    return (
        typeof value === "string" &&
        applicationRoles.some((role) => role === value)
    );
}

export function getRoleHomePath(role: ApplicationRole): RoleHomePath {
    return roleHomePaths[role];
}

export function getAuthenticatedHomePath(
    user: Pick<{ role: ApplicationRole; mustChangePassword: boolean }, "role" | "mustChangePassword">,
): RoleHomePath | "/employee/settings?setup=password" {
    return user.role === "employee" && user.mustChangePassword
        ? "/employee/settings?setup=password"
        : getRoleHomePath(user.role);
}

export function getRoleLabel(role: ApplicationRole): string {
    switch (role) {
        case "admin":
            return "IT Administrator";
        case "hr":
            return "HR / Attendance Staff";
        case "employee":
            return "Employee";
        case "accounting":
            return "Accounting Staff";
        case "payroll":
            return "Payroll Staff";
    }
}
