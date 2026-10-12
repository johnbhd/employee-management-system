import { PermissionDeniedPage } from "@/components/auth/PermissionDeniedPage";
import { AccountingTransactionHistoryPage } from "@/components/accounting/transaction-history/AccountingTransactionHistoryPage";
import { hasPermission } from "@/server/auth/permission.service";
import { requireRoleContext } from "@/server/auth/guards";
import { getAccountingTransactionHistoryData } from "@/server/accounting/accounting-transaction-history.service";
import type { AccountingTransactionHistoryData } from "@/types/accounting-transaction-history";

export const dynamic = "force-dynamic";

const emptyHistoryData: AccountingTransactionHistoryData = {
  records: [],
  summary: {
    totalTransfers: 0,
    successfulTransfers: 0,
    awaitingAcknowledgement: 0,
    failedOrRejected: 0,
    latestCompletedPeriod: null,
  },
  total: 0,
  page: 1,
  pageSize: 5,
  totalPages: 1,
  hasNext: false,
  periodOptions: [],
  transferStatusOptions: [],
  acknowledgementStatusOptions: [],
  providerNote: "Accounting transaction history data is unavailable.",
};

export default async function Page() {
  const context = await requireRoleContext("accounting");
  if (!(await hasPermission(context.user, "accounting.history.view"))) {
    return <PermissionDeniedPage title="Accounting History unavailable" backHref="/accounting/dashboard" backLabel="Back to Accounting Dashboard" />;
  }

  let data = emptyHistoryData;
  let loadError = false;

  try {
    data = await getAccountingTransactionHistoryData();
  } catch {
    loadError = true;
  }

  return <AccountingTransactionHistoryPage initialData={data} loadError={loadError} />;
}
