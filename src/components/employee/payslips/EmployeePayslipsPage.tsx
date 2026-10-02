import { PayslipsExplorer } from "./PayslipsExplorer";
import type { EmployeeReference } from "@/types/employee";

export function EmployeePayslipsPage({
  employee,
}: {
  employee: EmployeeReference | null;
}) {
  return (
    <div className="employee-payslips-page">
      <header className="employee-payslips-heading">
        <span className="employee-payslips-heading-label">Payroll records</span>
        <h2>My Payslip</h2>
        <p>View payroll records received from the Existing Payroll System.</p>
      </header>

      <PayslipsExplorer employee={employee} />
    </div>
  );
}
