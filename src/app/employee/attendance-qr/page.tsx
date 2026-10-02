import { AttendanceQrPage } from "@/components/employee/attendance-qr/AttendanceQrPage";
import { requireCurrentUserContext } from "@/server/auth/current-user-context";

export default async function Page() {
  const context = await requireCurrentUserContext();

  return <AttendanceQrPage employee={context.employee} />;
}
