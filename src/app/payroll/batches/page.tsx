import { PermissionDeniedPage } from "@/components/auth/PermissionDeniedPage";
import { PayrollBatchesPage } from "@/components/payroll/batches/PayrollBatchesPage";
import { hasPermission } from "@/server/auth/permission.service";
import { requireRoleContext } from "@/server/auth/guards";
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
  const context = await requireRoleContext("payroll");
  if (!(await hasPermission(context.user, "payroll.batch.view"))) {
    return <PermissionDeniedPage title="Payroll Batches unavailable" backHref="/payroll/dashboard" backLabel="Back to Payroll Dashboard" />;
  }

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
