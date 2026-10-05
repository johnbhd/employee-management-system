import { AttendanceHistoryPage } from "@/components/employee/attendance-history/AttendanceHistoryPage";
import {
  defaultAttendanceHistoryQuery,
  parseAttendanceHistoryQuery,
} from "@/server/attendance/attendance-history-query";
import { getAttendanceHistoryForEmployee } from "@/server/attendance/attendance.service";
import { requireCurrentUserContext } from "@/server/auth/current-user-context";
import type {
  AttendanceHistoryData,
  AttendanceHistoryQuery,
} from "@/types/attendance-history";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: PageProps) {
  const context = await requireCurrentUserContext();
  const query = await getAttendanceHistoryQuery(searchParams);
  let attendanceData: AttendanceHistoryData = {
    records: [],
    page: query.page,
    pageSize: query.pageSize,
    total: 0,
    totalRecords: 0,
    availableMonths: [],
    oldestDate: null,
    newestDate: null,
  };
  let attendanceLoadError = context.employee === null;

  if (context.employee) {
    try {
      attendanceData = await getAttendanceHistoryForEmployee(
        context.employee.employeeId,
        query,
      );
    } catch {
      attendanceLoadError = true;
    }
  }

  return (
    <AttendanceHistoryPage
      attendanceLoadError={attendanceLoadError}
      attendanceData={attendanceData}
      employee={context.employee}
      query={query}
    />
  );
}

async function getAttendanceHistoryQuery(
  searchParams: PageProps["searchParams"],
): Promise<AttendanceHistoryQuery> {
  const params = await searchParams;

  if (!params) {
    return defaultAttendanceHistoryQuery;
  }

  const queryParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    const firstValue = Array.isArray(value) ? value[0] : value;

    if (firstValue !== undefined) {
      queryParams.set(key, firstValue);
    }
  }

  try {
    return parseAttendanceHistoryQuery(queryParams);
  } catch {
    return defaultAttendanceHistoryQuery;
  }
}
