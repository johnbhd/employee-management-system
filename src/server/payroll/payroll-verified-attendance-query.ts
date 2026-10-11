import type {
  PayrollReadinessStatus,
  PayrollVerifiedAttendanceQuery,
} from "@/types/payroll-verified-attendance";

export const payrollVerifiedAttendancePageSizes = [5, 10, 25] as const;
export const defaultPayrollVerifiedAttendancePageSize = 5;

function getTrimmedValue(
  params: URLSearchParams,
  key: string,
  maxLength = 128,
) {
  const value = params.get(key)?.trim() ?? "";

  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

function getPage(params: URLSearchParams) {
  const value = Number.parseInt(params.get("page") ?? "1", 10);

  return Number.isInteger(value) && value > 0 ? Math.min(value, 1000) : 1;
}

function getPageSize(params: URLSearchParams) {
  const value = Number.parseInt(
    params.get("pageSize") ?? String(defaultPayrollVerifiedAttendancePageSize),
    10,
  );

  return payrollVerifiedAttendancePageSizes.includes(
    value as (typeof payrollVerifiedAttendancePageSizes)[number],
  )
    ? value
    : defaultPayrollVerifiedAttendancePageSize;
}

function getReadiness(
  params: URLSearchParams,
): PayrollReadinessStatus | null {
  const value = getTrimmedValue(params, "readiness", 32);

  return value === "ready" || value === "blocked" ? value : null;
}

function getBatch(params: URLSearchParams) {
  return getTrimmedValue(params, "batch", 32) === "not-added"
    ? "not-added" as const
    : null;
}

export function parsePayrollVerifiedAttendanceQuery(
  params: URLSearchParams,
): PayrollVerifiedAttendanceQuery {
  return {
    search: getTrimmedValue(params, "search"),
    department: getTrimmedValue(params, "department") || null,
    readiness: getReadiness(params),
    batch: getBatch(params),
    page: getPage(params),
    pageSize: getPageSize(params),
  };
}
