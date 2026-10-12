import { AccountingTransactionHistoryPage } from "@/components/accounting/transaction-history/AccountingTransactionHistoryPage";
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
  let data = emptyHistoryData;
  let loadError = false;

  try {
    data = await getAccountingTransactionHistoryData();
  } catch {
    loadError = true;
  }

  return <AccountingTransactionHistoryPage initialData={data} loadError={loadError} />;
}
