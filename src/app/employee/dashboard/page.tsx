import {
  EmployeeDashboardPage,
  EmployeeDashboardPageUnavailable,
} from "@/components/employee/dashboard/EmployeeDashboardPage";
import { requireCurrentUserContext } from "@/server/auth/current-user-context";

export default async function Page() {
  const context = await requireCurrentUserContext();

  if (!context.employee) {
    return <EmployeeDashboardPageUnavailable />;
  }

  return <EmployeeDashboardPage employee={context.employee} />;
}
