import { PermissionDeniedPage } from "@/components/auth/PermissionDeniedPage";
import { AccountingIntegrationStatusPage } from "@/components/accounting/integration-status/AccountingIntegrationStatusPage";
import { hasPermission } from "@/server/auth/permission.service";
import { requireRoleContext } from "@/server/auth/guards";
import { getAccountingIntegrationStatusData } from "@/server/accounting/accounting-transfer.service";
import type { AccountingIntegrationStatusData } from "@/types/accounting-transfers";

export const dynamic = "force-dynamic";

const emptyIntegrationData: AccountingIntegrationStatusData = {
  readyRecords: [],
  transfers: [],
  attention: [],
  history: [],
  connectionStatuses: [],
  summary: {
    readyForTransfer: 0,
    inProgress: 0,
    successfulTransfers: 0,
    awaitingAcknowledgement: 0,
    failedTransfers: 0,
  },
  total: 0,
  page: 1,
  pageSize: 5,
  totalPages: 1,
  hasNext: false,
  transferStatusOptions: [],
  providerNote: "Accounting transfer data is unavailable.",
};

export default async function AccountingIntegrationStatusRoute() {
  const context = await requireRoleContext("accounting");
  if (!(await hasPermission(context.user, "accounting.transfer.view"))) {
    return <PermissionDeniedPage title="Accounting Integration unavailable" backHref="/accounting/dashboard" backLabel="Back to Accounting Dashboard" />;
  }

  let data = emptyIntegrationData;
  let loadError = false;

  try {
    data = await getAccountingIntegrationStatusData();
  } catch {
    loadError = true;
  }

  return <AccountingIntegrationStatusPage initialData={data} loadError={loadError} />;
}
