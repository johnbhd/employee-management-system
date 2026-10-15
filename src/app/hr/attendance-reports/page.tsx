import { PermissionDeniedPage } from "@/components/auth/PermissionDeniedPage";
import { formatCampusDateKey } from "@/lib/campus-time";
import {
  getAttendanceReportsData,
} from "@/server/hr/attendance-reports.service";
import {
  parseAttendanceReportsQuery,
} from "@/server/hr/attendance-reports-query";
import type { AttendanceReportsData } from "@/server/hr/attendance-reports.service";

import { AttendanceReportsPage } from "@/components/hr/attendance-reports/AttendanceReportsPage";
import { hasPermission } from "@/server/auth/permission.service";
import { requireRoleContext } from "@/server/auth/guards";

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

const emptyData: AttendanceReportsData = {
  records: [],
  monthlyRows: [],
  correctionRequests: [],
  summary: {
    totalRecords: 0,
    timedIn: 0,
    completed: 0,
    awaitingTimeOut: 0,
  },
  sourceSummary: {
    qr: 0,
    total: 0,
  },
  employees: [],
  departments: [],
};

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: PageProps) {
  const context = await requireRoleContext("hr");
  if (!(await hasPermission(context.user, "hr.attendance.reports.view"))) {
    return <PermissionDeniedPage title="Attendance Reports unavailable" backHref="/hr/dashboard" backLabel="Back to HR Dashboard" />;
  }

  const defaultDate = formatCampusDateKey(new Date());
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const query = parseAttendanceReportsQuery(
    toSearchParams(resolvedSearchParams),
    defaultDate,
  );
  let data = emptyData;
  let loadError = false;

  try {
    data = await getAttendanceReportsData(query);
  } catch {
    loadError = true;
  }

  return (
    <AttendanceReportsPage
      data={data}
      query={query}
      defaultDate={defaultDate}
      loadError={loadError}
    />
  );
}
