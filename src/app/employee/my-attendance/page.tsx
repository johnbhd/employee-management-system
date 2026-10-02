import { MyAttendancePage } from "@/components/employee/my-attendance/MyAttendancePage";
import { requireCurrentUserContext } from "@/server/auth/current-user-context";

export default async function Page() {
  const context = await requireCurrentUserContext();

  return <MyAttendancePage employee={context.employee} />;
}
