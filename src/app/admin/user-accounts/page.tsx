import { redirect } from "next/navigation";

import { UserAccountsHrpsPage } from "@/components/admin/pages/UserAccountsHrpsPage";
import { hasPermission } from "@/server/auth/permission.service";
import { requireRoleContext } from "@/server/auth/guards";
import { getAdminUserAccountsData } from "@/server/admin/admin-user-account.service";
import type { AdminUserAccountsData } from "@/types/admin-user-accounts";

export const dynamic = "force-dynamic";

const emptyData: AdminUserAccountsData = {
  items: [],
  employees: [],
  auditEvents: [],
  summary: { total: 0, active: 0, disabled: 0, linked: 0, integrityIssues: 0 },
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 1,
  hasNext: false,
};

export default async function Page() {
  const context = await requireRoleContext("admin");
  const canView = await hasPermission(context.user, "admin.user_accounts.view");
  if (!canView) {
    redirect("/admin/dashboard");
  }

  let data = emptyData;
  let loadError = false;

  try {
    data = await getAdminUserAccountsData();
  } catch {
    loadError = true;
  }

  return <UserAccountsHrpsPage initialData={data} loadError={loadError} canManage={await hasPermission(context.user, "admin.user_accounts.manage")} />;
}
