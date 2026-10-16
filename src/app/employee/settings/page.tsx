import { EmployeeSettingsPage } from "@/components/employee/settings/EmployeeSettingsPage";
import { formatCampusDateKey } from "@/lib/campus-time";
import { getEmployeeAttendanceDemoData } from "@/server/attendance/demo-attendance.service";
import { requireRoleContext } from "@/server/auth/guards";
import type { AttendanceDemoSettingsData } from "@/types/attendance-demo";

export default async function Page() {
  const context = await requireRoleContext("employee");
  const now = new Date();
  let initialDemoSettings: AttendanceDemoSettingsData = {
    featureEnabled: false,
    enabled: false,
    customTime: null,
    attendanceDate: formatCampusDateKey(now),
    attendance: null,
    resetAvailable: false,
    resetBlockedReason: "Your employee attendance demonstration is unavailable.",
  };

  if (context.employee) {
    try {
      initialDemoSettings = await getEmployeeAttendanceDemoData(
        context.employee.employeeId,
        now,
      );
    } catch {
      // Keep the account and security settings available if the optional demo data is unavailable.
    }
  }

  return (
    <EmployeeSettingsPage
      user={context.user}
      employee={context.employee}
      initialDemoSettings={initialDemoSettings}
    />
  );
}
