import { AuditHistoryPage } from "@/components/hr/audit-history/AuditHistoryPage";
import {
  getHrAuditHistory,
  type HrAuditHistoryData,
} from "@/server/hr/audit-history.service";
import { parseAuditHistoryQuery } from "@/server/hr/audit-history-query";

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

const emptyData: HrAuditHistoryData = {
  events: [],
  total: 0,
  page: 1,
  pageSize: 10,
  hasNext: false,
  summary: {
    total: 0,
    attendance: 0,
    qr: 0,
    corrections: 0,
    approved: 0,
    rejected: 0,
  },
  actions: [{ value: "all", label: "All actions" }],
  areas: [{ value: "all", label: "All areas" }],
  actorRoles: [{ value: "all", label: "All roles" }],
  outcomes: [{ value: "all", label: "All outcomes" }],
  employees: [{ value: "all", label: "All employees" }],
};

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const query = parseAuditHistoryQuery(toSearchParams(resolvedSearchParams));
  let data = emptyData;
  let loadError = false;

  try {
    data = await getHrAuditHistory(query);
  } catch {
    loadError = true;
  }

  return (
    <AuditHistoryPage
      data={data}
      query={query}
      loadError={loadError}
    />
  );
}
