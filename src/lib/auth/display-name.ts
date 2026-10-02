import type { SessionUser } from "@/types/auth";
import type { EmployeeReference } from "@/types/employee";

export function getAuthenticatedDisplayName(
    user: Pick<SessionUser, "displayName">,
    employee: Pick<EmployeeReference, "displayName"> | null,
): string {
    return employee?.displayName || user.displayName;
}
