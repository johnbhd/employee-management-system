import { AttendanceQrPage } from "@/components/employee/attendance-qr/AttendanceQrPage";
import { formatCampusDateKey } from "@/lib/campus-time";
import { getTodayAttendanceForEmployee } from "@/server/attendance/attendance.service";
import { createEmployeeQrData } from "@/server/attendance/qr/attendance-qr.service";
import { requireCurrentUserContext } from "@/server/auth/current-user-context";
import { hasPermission } from "@/server/auth/permission.service";
import type { TodayAttendanceData } from "@/types/attendance-qr";

export default async function Page() {
  const context = await requireCurrentUserContext();
  if (
    !(await hasPermission(context.user, "employee.attendance_qr.view_own"))
    || !(await hasPermission(context.user, "employee.attendance.view_own"))
  ) {
    return <PermissionDeniedPage title="Attendance QR unavailable" backHref="/employee/dashboard" backLabel="Back to Employee Dashboard" />;
  }
  const employee = context.employee;
  let initialQrValue: string | null = null;
  let initialQrGeneratedAt: string | null = null;
  let initialQrError: string | null = null;
  const now = new Date();
  const fallbackAttendance: TodayAttendanceData = {
    attendance: null,
    attendanceDate: formatCampusDateKey(now),
  };
  let initialAttendance = fallbackAttendance;
  let initialAttendanceError: string | null = null;

  if (employee) {
    try {
      const qrData = createEmployeeQrData(employee);
      initialQrValue = qrData.qrValue;
      initialQrGeneratedAt = qrData.generatedAt;
    } catch {
      initialQrError = "Employee QR generation is not configured yet.";
    }

    try {
      initialAttendance = await getTodayAttendanceForEmployee(
        employee.employeeId,
        now,
      );
    } catch {
      initialAttendanceError =
        "Today's attendance could not be loaded. We'll keep trying while this page is open.";
    }
  } else {
    initialQrError =
      "Your employee QR is currently unavailable. Please contact the system administrator.";
    initialAttendanceError =
      "Your employee attendance status is currently unavailable.";
  }

  return (
    <AttendanceQrPage
      employee={employee}
      initialQrError={initialQrError}
      initialQrGeneratedAt={initialQrGeneratedAt}
      initialQrValue={initialQrValue}
      initialAttendance={initialAttendance}
      initialAttendanceError={initialAttendanceError}
    />
  );
}
import { PermissionDeniedPage } from "@/components/auth/PermissionDeniedPage";
