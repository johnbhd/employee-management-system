import {
  auditHistoryActions,
  auditHistoryAreas,
  auditHistoryOutcomes,
  type HrAuditHistoryAction,
  type HrAuditHistoryArea,
  type HrAuditHistoryOutcome,
  type HrAuditHistoryQuery,
} from "@/types/hr-audit-history";

export const auditHistoryPageSize = 10;

function getTrimmedValue(
  params: URLSearchParams,
  key: string,
  maxLength = 128,
) {
  const value = params.get(key)?.trim() ?? "";

  return value.length > maxLength ? value.slice(0, maxLength) : value;
}
function getDateValue(params: URLSearchParams, key: string) {
  const value = getTrimmedValue(params, key, 10);

  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function getPage(params: URLSearchParams) {
  const value = Number.parseInt(getTrimmedValue(params, "page", 4), 10);

  return Number.isFinite(value) ? Math.min(Math.max(value, 1), 10000) : 1;
}

function getAllowedValue<T extends string>(
  params: URLSearchParams,
  key: string,
  values: readonly T[],
): T | null {
  const value = getTrimmedValue(params, key);

  return values.includes(value as T) ? value as T : null;
}

export function parseAuditHistoryQuery(
  params: URLSearchParams,
): HrAuditHistoryQuery {
  let fromDate = getDateValue(params, "from");
  let toDate = getDateValue(params, "to");

  if (fromDate && toDate && fromDate > toDate) {
    [fromDate, toDate] = [toDate, fromDate];
  }

  return {
    search: getTrimmedValue(params, "search"),
    fromDate,
    toDate,
    action: getAllowedValue<HrAuditHistoryAction>(params, "action", auditHistoryActions),
    area: getAllowedValue<HrAuditHistoryArea>(params, "area", auditHistoryAreas),
    actorRole: getTrimmedValue(params, "actorRole", 64) || null,
    outcome: getAllowedValue<HrAuditHistoryOutcome>(params, "outcome", auditHistoryOutcomes),
    employeeId: getTrimmedValue(params, "employeeId", 64) || null,
    page: getPage(params),
    pageSize: auditHistoryPageSize,
  };
}
