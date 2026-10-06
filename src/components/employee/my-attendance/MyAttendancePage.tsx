import {
  employeeAttendanceHelp,
  employeeAttendanceReminders,
} from "@/data/my-attendance";
import { Icon } from "@/components/ui/Icon";
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

      <section
        className="my-attendance-notes"
        aria-label="Attendance reminders and help"
      >
        <article
          className="my-attendance-note-card my-attendance-reminder-card"
          aria-labelledby="my-attendance-reminders-title"
        >
          <div className="my-attendance-note-heading">
            <Icon name="activity" />
            <div>
              <span className="my-attendance-note-kicker">Keep in mind</span>
              <h2 id="my-attendance-reminders-title">Important reminders</h2>
            </div>
          </div>
          <ul>
            {employeeAttendanceReminders.map((reminder) => (
              <li key={reminder}>{reminder}</li>
            ))}
          </ul>
        </article>

        <article
          className="my-attendance-note-card my-attendance-help-card"
          aria-labelledby="my-attendance-help-title"
        >
          <div className="my-attendance-note-heading">
            <Icon name="help" />
            <div>
              <span className="my-attendance-note-kicker">Support</span>
              <h2 id="my-attendance-help-title">Need help?</h2>
            </div>
          </div>
          <p>{employeeAttendanceHelp}</p>
        </article>
      </section>
    </div>
  );
}
