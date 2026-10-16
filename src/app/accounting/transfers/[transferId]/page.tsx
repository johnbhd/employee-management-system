import { notFound } from "next/navigation";

import { PermissionDeniedPage } from "@/components/auth/PermissionDeniedPage";
import { PreparedAccountingTransferPage } from "@/components/accounting/transfers/PreparedAccountingTransferPage";
import { hasPermission } from "@/server/auth/permission.service";
import { requireRoleContext } from "@/server/auth/guards";
import { getAccountingTransferDetail } from "@/server/accounting/accounting-transfer.service";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ transferId: string }>;
}) {
  const context = await requireRoleContext("accounting");
  if (!(await hasPermission(context.user, "accounting.transfer.view"))) {
    return (
      <PermissionDeniedPage
        title="Accounting transfer unavailable"
        backHref="/accounting/dashboard"
        backLabel="Back to Accounting Dashboard"
      />
    );
  }

  const { transferId } = await params;
  const transfer = await getAccountingTransferDetail(transferId);
  if (!transfer || transfer.transferStatus !== "prepared") {
    notFound();
  }

  return <PreparedAccountingTransferPage transfer={transfer} />;
}
