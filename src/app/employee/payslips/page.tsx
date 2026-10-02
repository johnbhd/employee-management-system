import { EmployeePayslipsPage } from "@/components/employee/payslips/EmployeePayslipsPage";
import { requireCurrentUserContext } from "@/server/auth/current-user-context";

export default async function Page() {
  const context = await requireCurrentUserContext();

  return <EmployeePayslipsPage employee={context.employee} />;
}
