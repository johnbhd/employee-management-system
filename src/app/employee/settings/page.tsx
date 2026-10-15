import { EmployeeSettingsPage } from "@/components/employee/settings/EmployeeSettingsPage";
import { requireRoleContext } from "@/server/auth/guards";

export default async function Page() {
  const context = await requireRoleContext("employee");

  return (
    <EmployeeSettingsPage
      user={context.user}
      employee={context.employee}
    />
  );
}
