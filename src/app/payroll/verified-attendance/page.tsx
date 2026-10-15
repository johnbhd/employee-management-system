import { PermissionDeniedPage } from "@/components/auth/PermissionDeniedPage";
import { PayrollVerifiedAttendancePage } from "@/components/payroll/verified-attendance/PayrollVerifiedAttendancePage";
import { hasPermission } from "@/server/auth/permission.service";
import { requireRoleContext } from "@/server/auth/guards";
import {
  getCurrentPayrollPeriod,
  getPayrollPeriodForStart,
  getPayrollPeriodOptions,
} from "@/server/payroll/payroll-dashboard.service";
import { parsePayrollVerifiedAttendanceQuery } from "@/server/payroll/payroll-verified-attendance-query";
import { getPayrollVerifiedAttendanceData } from "@/server/payroll/payroll-verified-attendance.service";
import type { PayrollDashboardPeriod } from "@/types/payroll-dashboard";
import type { PayrollVerifiedAttendanceData } from "@/types/payroll-verified-attendance";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function toSearchParams(
  values: Record<string, string | string[] | undefined>,
) {
  const params = new URLSearchParams();

  Object.entries(values).forEach(([key, value]) => {
    if (typeof value === "string") {
      params.set(key, value);
    } else if (Array.isArray(value) && value[0]) {
      params.set(key, value[0]);
    }
  });

  return params;
}

function getEmptyData(
  pageSize: number,
  period: PayrollDashboardPeriod,
  periodOptions: PayrollDashboardPeriod[],
): PayrollVerifiedAttendanceData {
  return {
    period,
    periodOptions,
    summary: {
      verifiedRecords: 0,
      ready: 0,
      includedInBatch: 0,
      blocked: 0,
      needsFollowUp: 0,
    },
    items: [],
    departments: [],
    pagination: {
      page: 1,
      pageSize,
      totalItems: 0,
      totalPages: 1,
    },
  };
}

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: PageProps) {
  const context = await requireRoleContext("payroll");
  if (!(await hasPermission(context.user, "payroll.verified_attendance.view"))) {
    return <PermissionDeniedPage title="Verified attendance unavailable" backHref="/payroll/dashboard" backLabel="Back to Payroll Dashboard" />;
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const parsedQuery = parsePayrollVerifiedAttendanceQuery(
    toSearchParams(resolvedSearchParams),
  );
  const selectedPeriod = parsedQuery.periodStart
    ? getPayrollPeriodForStart(parsedQuery.periodStart)
    : null;
  const query = {
    ...parsedQuery,
    periodStart: selectedPeriod?.start ?? null,
  };
  const period = selectedPeriod ?? getCurrentPayrollPeriod();
  const periodOptions = getPayrollPeriodOptions();
  if (!periodOptions.some((option) => option.start === period.start)) {
    periodOptions.unshift(period);
  }
  let data = getEmptyData(query.pageSize, period, periodOptions);
  let loadError = false;

  try {
    data = await getPayrollVerifiedAttendanceData(query);
  } catch {
    loadError = true;
  }

  return (
    <PayrollVerifiedAttendancePage
      key={[query.search, query.department, query.readiness, query.batch, query.page, query.pageSize].join("|")}
      data={data}
      query={query}
      loadError={loadError}
    />
  );
}
