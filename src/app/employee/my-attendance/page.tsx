import { MyAttendancePage } from "@/components/employee/my-attendance/MyAttendancePage";
import {
  formatCampusDate,
  formatCampusDateKey,
} from "@/lib/campus-time";
import { getTodayAttendanceForEmployee } from "@/server/attendance/attendance.service";
import { requireCurrentUserContext } from "@/server/auth/current-user-context";
import type { TodayAttendanceData } from "@/types/attendance-qr";

export default async function Page() {
  const context = await requireCurrentUserContext();
  const now = new Date();
  const fallbackAttendance: TodayAttendanceData = {
    attendance: null,
    attendanceDate: formatCampusDateKey(now),
  };
  let todayAttendance = fallbackAttendance;
  let attendanceLoadError = context.employee === null;

  if (context.employee) {
    try {
      todayAttendance = await getTodayAttendanceForEmployee(
        context.employee.employeeId,
        now,
      );
    } catch {
      attendanceLoadError = true;
    }
  }

  return (
    <MyAttendancePage
      attendanceLoadError={attendanceLoadError}
      employee={context.employee}
      todayAttendance={todayAttendance}
      todayLabel={formatCampusDate(now)}
    />
  );
}
