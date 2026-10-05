import { HrDashboardPage } from "@/components/hr/dashboard/HrDashboardPage";
import { getHrDashboardSummary } from "@/server/hr/hr-dashboard.service";

export default async function Page() {
  let summary = null;
  let dataLoadError = false;

  try {
    summary = await getHrDashboardSummary();
  } catch {
    dataLoadError = true;
  }

  return (
    <HrDashboardPage
      dataLoadError={dataLoadError}
      summary={summary}
    />
  );
}
