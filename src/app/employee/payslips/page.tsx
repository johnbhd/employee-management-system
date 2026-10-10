import { EmployeePayslipsPage } from "@/components/employee/payslips/EmployeePayslipsPage";
import { getEmployeePayslipHistoryForEmployee } from "@/server/payroll/payslip.service";
import { requireCurrentUserContext } from "@/server/auth/current-user-context";
import type { EmployeePayslipHistoryData } from "@/types/payslip";

const emptyPayslipData: EmployeePayslipHistoryData = {
  payslips: [],
  monthlyPayslips: [],
  years: [],
  cutoffStats: [],
  monthlyStats: [],
};

export default async function Page() {
  const context = await requireCurrentUserContext();
  let payslipData = emptyPayslipData;
  let payslipLoadError = context.employee === null;

  if (context.employee) {
    try {
      payslipData = await getEmployeePayslipHistoryForEmployee(
        context.employee.employeeId,
      );
    } catch {
      payslipLoadError = true;
    }
  }

  return (
    <EmployeePayslipsPage
      employee={context.employee}
      payslipData={payslipData}
      payslipLoadError={payslipLoadError}
    />
  );
}
