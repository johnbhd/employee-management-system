import { EmployeeSettingsPage } from "@/components/employee/settings/EmployeeSettingsPage";
import { requireRoleContext } from "@/server/auth/guards";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: PageProps) {
  const context = await requireRoleContext("employee", {
    allowMustChangePassword: true,
  });
  const params = await searchParams;
  const setupValue = params?.setup;
  const setupPassword = context.user.mustChangePassword
    || (Array.isArray(setupValue) ? setupValue[0] : setupValue) === "password";

  return (
    <EmployeeSettingsPage
      user={context.user}
      employee={context.employee}
      setupPassword={setupPassword}
    />
  );
}
