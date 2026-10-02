import { AttendanceHistoryPage } from "@/components/employee/attendance-history/AttendanceHistoryPage";
import { requireCurrentUserContext } from "@/server/auth/current-user-context";

export default async function Page() {
  const context = await requireCurrentUserContext();

  return <AttendanceHistoryPage employee={context.employee} />;
}
