import { MyAttendancePage } from "@/components/employee/my-attendance/MyAttendancePage";
import {
  formatCampusDate,
  formatCampusDateKey,
} from "@/lib/campus-time";
import {
  getAttendanceCalendarForEmployee,
  getTodayAttendanceForEmployee,
} from "@/server/attendance/attendance.service";
import { requireCurrentUserContext } from "@/server/auth/current-user-context";
import type { AttendanceCalendarRecord } from "@/types/attendance-history";
import type { TodayAttendanceData } from "@/types/attendance-qr";

export default async function Page() {
  const context = await requireCurrentUserContext();
  const now = new Date();
  const fallbackAttendance: TodayAttendanceData = {
    attendance: null,
    attendanceDate: formatCampusDateKey(now),
  };
  let todayAttendance = fallbackAttendance;
  let calendarAttendance: AttendanceCalendarRecord[] = [];
  let attendanceLoadError = context.employee === null;
  let calendarLoadError = context.employee === null;

  if (context.employee) {
    const [todayResult, calendarResult] = await Promise.allSettled([
      getTodayAttendanceForEmployee(context.employee.employeeId, now),
      getAttendanceCalendarForEmployee(context.employee.employeeId),
    ]);

    if (todayResult.status === "fulfilled") {
      todayAttendance = todayResult.value;
    } else {
      attendanceLoadError = true;
    }

    if (calendarResult.status === "fulfilled") {
      calendarAttendance = calendarResult.value;
    } else {
      calendarLoadError = true;
    }
  }

  return (
    <MyAttendancePage
      attendanceLoadError={attendanceLoadError}
      calendarAttendance={calendarAttendance}
      calendarLoadError={calendarLoadError}
      employee={context.employee}
      todayAttendance={todayAttendance}
      todayLabel={formatCampusDate(now)}
    />
  );
}
