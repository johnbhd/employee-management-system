import { PayrollDashboardPage } from "@/components/payroll/dashboard/PayrollDashboardPage";
import { getPayrollDashboardData } from "@/server/payroll/payroll-dashboard.service";

export default async function Page() {
  let data = null;
  let dataLoadError = false;

  try {
    data = await getPayrollDashboardData();
  } catch {
    dataLoadError = true;
  }

  return (
    <PayrollDashboardPage
      dataLoadError={dataLoadError}
      initialData={data}
    />
  );
}
