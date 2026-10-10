import { formatCampusDateKey } from "@/lib/campus-time";
import {
  getAttendanceReportsData,
} from "@/server/hr/attendance-reports.service";
import {
  parseAttendanceReportsQuery,
} from "@/server/hr/attendance-reports-query";
import type { AttendanceReportsData } from "@/server/hr/attendance-reports.service";

import { AttendanceReportsPage } from "@/components/hr/attendance-reports/AttendanceReportsPage";

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
