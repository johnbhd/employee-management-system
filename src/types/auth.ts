import type {
    ApplicationRole,
    RoleHomePath,
} from "@/lib/auth/roles";
import type {
    ApiSuccessResponse,
} from "@/types/api/responses";
import type { EmployeeReference } from "@/types/employee";

export type ApplicationUserStatus = "active" | "inactive" | "disabled";

export type ApplicationUser = {
    uid: string;
    username: string;
    displayName: string;
    role: ApplicationRole;
    employeeId: string | null;
    status: ApplicationUserStatus;
};

export type SessionUser = Omit<ApplicationUser, "status">;

export type AuthSessionData = {
    user: SessionUser;
    redirectTo: RoleHomePath;
};

export type AuthSessionSuccessResponse =
    ApiSuccessResponse<AuthSessionData>;

export type CurrentUserContext = {
    user: SessionUser;
    employee: EmployeeReference | null;
};

export type CurrentUserSuccessResponse =
    ApiSuccessResponse<CurrentUserContext>;
