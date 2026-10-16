import {
  EmployeeDashboardPage,
  EmployeeDashboardPageUnavailable,
} from "@/components/employee/dashboard/EmployeeDashboardPage";
import { formatCampusDateKey } from "@/lib/campus-time";
import { requireCurrentUserContext } from "@/server/auth/current-user-context";
import { hasPermission } from "@/server/auth/permission.service";
import { getEffectivePrismaEmployeeSchedule } from "@/server/repositories/employee-schedules/prisma-employee-schedule.repository";

export default async function Page() {
  const context = await requireCurrentUserContext();

  if (!(await hasPermission(context.user, "employee.dashboard.view"))) {
    return <PermissionDeniedPage title="Employee Dashboard unavailable" backHref="/" backLabel="Return to sign in" />;
  }

  if (!context.employee) {
    return <EmployeeDashboardPageUnavailable />;
  }

  const campusDate = formatCampusDateKey(new Date());
  let scheduledStart: string | null = null;

  try {
    const schedule = await getEffectivePrismaEmployeeSchedule(
      context.employee.employeeId,
      new Date(`${campusDate}T00:00:00.000Z`),
    );
    scheduledStart = schedule?.workStart ?? null;
  } catch {
    scheduledStart = null;
  }

  return (
    <EmployeeDashboardPage
      employee={context.employee}
      scheduledStart={scheduledStart}
    />
  );
}
import { PermissionDeniedPage } from "@/components/auth/PermissionDeniedPage";
