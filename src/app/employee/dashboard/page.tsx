import { EmployeeDashboardPage } from "@/components/employee/dashboard/EmployeeDashboardPage";
import { requireCurrentUserContext } from "@/server/auth/current-user-context";

export default async function Page() {
  const context = await requireCurrentUserContext();

  return <EmployeeDashboardPage employee={context.employee} />;
}
