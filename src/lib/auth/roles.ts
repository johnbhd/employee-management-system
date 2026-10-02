export const applicationRoles = [
    "admin",
    "hr",
    "employee",
    "accounting",
] as const;

export type ApplicationRole = (typeof applicationRoles)[number];

export const roleHomePaths = {
    admin: "/admin/dashboard",
    hr: "/hr/dashboard",
    employee: "/employee/dashboard",
    accounting: "/accounting/dashboard",
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
    }
}
