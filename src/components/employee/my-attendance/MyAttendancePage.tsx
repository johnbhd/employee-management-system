import type { EmployeeReference } from "@/types/employee";
import type { TodayAttendanceData } from "@/types/attendance-qr";

import { MonthlyAttendanceCalendar } from "./MonthlyAttendanceCalendar";
import { MyAttendanceToday } from "./MyAttendanceToday";

export function MyAttendancePage({
  attendanceLoadError,
  employee,
  todayAttendance,
  todayLabel,
}: {
  attendanceLoadError: boolean;
  employee: EmployeeReference | null;
  todayAttendance: TodayAttendanceData;
  todayLabel: string;
}) {
  return (
    <div className="my-attendance-page">
      <MyAttendanceToday
        attendanceLoadError={attendanceLoadError}
        employee={employee}
        todayAttendance={todayAttendance}
        todayLabel={todayLabel}
      />

      <MonthlyAttendanceCalendar
        attendanceLoadError={attendanceLoadError}
        todayAttendance={todayAttendance}
      />
    </div>
  );
}
