import type { AttendanceCalendarRecord } from "@/types/attendance-history";
import type { EmployeeReference } from "@/types/employee";
import type { TodayAttendanceData } from "@/types/attendance-qr";

import { MonthlyAttendanceCalendar } from "./MonthlyAttendanceCalendar";
import { MyAttendanceToday } from "./MyAttendanceToday";

export function MyAttendancePage({
  attendanceLoadError,
  calendarAttendance,
  calendarLoadError,
  employee,
  todayAttendance,
  todayLabel,
}: {
  attendanceLoadError: boolean;
  calendarAttendance: readonly AttendanceCalendarRecord[];
  calendarLoadError: boolean;
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
        calendarAttendance={calendarAttendance}
        calendarLoadError={calendarLoadError}
        todayAttendance={todayAttendance}
      />
    </div>
  );
}
