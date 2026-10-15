import {
  EmployeeDashboardPage,
  EmployeeDashboardPageUnavailable,
} from "@/components/employee/dashboard/EmployeeDashboardPage";
import { requireCurrentUserContext } from "@/server/auth/current-user-context";
import { hasPermission } from "@/server/auth/permission.service";

export default async function Page() {
  const context = await requireCurrentUserContext();

  if (!(await hasPermission(context.user, "employee.dashboard.view"))) {
    return <PermissionDeniedPage title="Employee Dashboard unavailable" backHref="/" backLabel="Return to sign in" />;
  }

  if (!context.employee) {
    return <EmployeeDashboardPageUnavailable />;
  }

  return <EmployeeDashboardPage employee={context.employee} />;
}
import { PermissionDeniedPage } from "@/components/auth/PermissionDeniedPage";
