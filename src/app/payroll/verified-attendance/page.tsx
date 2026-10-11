import { PayrollVerifiedAttendancePage } from "@/components/payroll/verified-attendance/PayrollVerifiedAttendancePage";
import { getCurrentPayrollPeriod } from "@/server/payroll/payroll-dashboard.service";
import { parsePayrollVerifiedAttendanceQuery } from "@/server/payroll/payroll-verified-attendance-query";
import { getPayrollVerifiedAttendanceData } from "@/server/payroll/payroll-verified-attendance.service";
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

function getEmptyData(pageSize: number): PayrollVerifiedAttendanceData {
  return {
    period: getCurrentPayrollPeriod(),
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
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const query = parsePayrollVerifiedAttendanceQuery(
    toSearchParams(resolvedSearchParams),
  );
  let data = getEmptyData(query.pageSize);
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
