import { EmployeeSchedulesPage } from "@/components/hr/employee-schedules/EmployeeSchedulesPage";
import { getEmployeeSchedulesData } from "@/server/hr/employee-schedules.service";
import type { EmployeeScheduleItem } from "@/types/hr-employee-schedule";

export default async function Page() {
  let records: EmployeeScheduleItem[] = [];
  let loadError = false;

  try {
    ({ records } = await getEmployeeSchedulesData());
  } catch {
    loadError = true;
  }

  return <EmployeeSchedulesPage records={records} loadError={loadError} />;
}
