import { PayslipsExplorer } from "./PayslipsExplorer";
import type { EmployeeReference } from "@/types/employee";
import type { EmployeePayslipHistoryData } from "@/types/payslip";

export function EmployeePayslipsPage({
  employee,
  payslipData,
  payslipLoadError,
}: {
  employee: EmployeeReference | null;
  payslipData: EmployeePayslipHistoryData;
  payslipLoadError: boolean;
}) {
  return (
    <div className="employee-payslips-page">
      <header className="employee-payslips-heading">
        <span className="employee-payslips-heading-label">Payroll records</span>
        <h2>My Payslip</h2>
        <p>View payroll records received from the Existing Payroll System.</p>
      </header>

      <PayslipsExplorer
        employee={employee}
        payslipData={payslipData}
        payslipLoadError={payslipLoadError}
      />
    </div>
  );
}
