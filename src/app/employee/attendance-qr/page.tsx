import { AttendanceQrPage } from "@/components/employee/attendance-qr/AttendanceQrPage";
import { createEmployeeQrData } from "@/server/attendance/qr/attendance-qr.service";
import { requireCurrentUserContext } from "@/server/auth/current-user-context";

export default async function Page() {
  const context = await requireCurrentUserContext();
  const employee = context.employee;
  let initialQrValue: string | null = null;
  let initialQrGeneratedAt: string | null = null;
  let initialQrError: string | null = null;

  if (employee) {
    try {
      const qrData = createEmployeeQrData(employee);
      initialQrValue = qrData.qrValue;
      initialQrGeneratedAt = qrData.generatedAt;
    } catch {
      initialQrError = "Employee QR generation is not configured yet.";
    }
  } else {
    initialQrError =
      "Your employee QR is currently unavailable. Please contact the system administrator.";
  }

  return (
    <AttendanceQrPage
      employee={employee}
      initialQrError={initialQrError}
      initialQrGeneratedAt={initialQrGeneratedAt}
      initialQrValue={initialQrValue}
    />
  );
}
