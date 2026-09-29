import { PayslipsExplorer } from "./PayslipsExplorer";

export function EmployeePayslipsPage() {
  return (
    <div className="employee-payslips-page">
      <header className="employee-payslips-heading">
        <span className="employee-payslips-heading-label">Payroll records</span>
        <h2>My Payslip</h2>
        <p>View payroll records received from the Existing Payroll System.</p>
      </header>

      <PayslipsExplorer />
    </div>
  );
}
