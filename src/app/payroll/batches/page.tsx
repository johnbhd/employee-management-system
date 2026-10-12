import { PayrollBatchesPage } from "@/components/payroll/batches/PayrollBatchesPage";
import {
  getDefaultPayrollBatchesQuery,
  getPayrollBatchesData,
} from "@/server/payroll/payroll-batches.service";
import type { PayrollBatchesData } from "@/types/payroll-batches";

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

function getValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function getEmptyData(): PayrollBatchesData {
  const period = getDefaultPayrollBatchesQuery();
  return {
    period: { start: period.periodStart, end: period.periodEnd, label: `${period.periodStart} – ${period.periodEnd}` },
    batches: [],
    availableRecords: [],
    summary: { draftBatches: 0, readyBatches: 0, submittedBatches: 0, blockedBatches: 0, recordsInDrafts: 0, blockedRecords: 0 },
  };
}

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: PageProps) {
  const values = searchParams ? await searchParams : {};
  const defaults = getDefaultPayrollBatchesQuery();
  const query = {
    periodStart: getValue(values.periodStart) || defaults.periodStart,
    periodEnd: getValue(values.periodEnd) || defaults.periodEnd,
  };
  let data = getEmptyData();
  let loadError = false;

  try {
    data = await getPayrollBatchesData(query);
  } catch {
    loadError = true;
  }

  return <PayrollBatchesPage key={`${query.periodStart}|${query.periodEnd}`} initialData={data} loadError={loadError} />;
}
