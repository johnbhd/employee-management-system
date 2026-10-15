import {
  ProfilePage,
  ProfilePageUnavailable,
} from "@/components/employee/profile/ProfilePage";
import { requireCurrentUserContext } from "@/server/auth/current-user-context";
import { hasPermission } from "@/server/auth/permission.service";

export default async function Page() {
  const context = await requireCurrentUserContext();

  if (!(await hasPermission(context.user, "employee.profile.view_own"))) {
    return <PermissionDeniedPage title="Profile unavailable" backHref="/employee/dashboard" backLabel="Back to Employee Dashboard" />;
  }

  if (!context.employee) {
    return <ProfilePageUnavailable />;
  }

  return <ProfilePage user={context.user} employee={context.employee} />;
}
import { PermissionDeniedPage } from "@/components/auth/PermissionDeniedPage";
