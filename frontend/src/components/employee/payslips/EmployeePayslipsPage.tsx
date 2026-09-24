import Link from "next/link";

import { Icon } from "@/components/ui/Icon";
import { employeePayslipStats } from "@/data/employee-payslips";

import { PayslipsExplorer } from "./PayslipsExplorer";

export function EmployeePayslipsPage() {
  return (
    <div className="employee-payslips-page">
      <nav className="employee-payslips-breadcrumb" aria-label="Breadcrumb">
        <Link href="/employee/dashboard">Dashboard</Link>
        <Icon name="chevron" />
        <span aria-current="page">My Payslips</span>
      </nav>

      <header className="employee-payslips-heading">
        <span className="employee-payslips-heading-label">Payroll records</span>
        <h2>My Payslip</h2>
        <p>View and download your payroll records.</p>
      </header>

      <aside className="employee-payslips-notice" aria-label="Payroll information notice">
        <span className="employee-payslips-notice-icon" aria-hidden="true">i</span>
        <div>
          <p className="employee-payslips-notice-main">
            The page displays payroll information received from the Existing Payroll System; the SIA application does not calculate the employee&apos;s payroll itself.
          </p>
          <p className="employee-payslips-notice-sub">
            For any payroll concerns, such as discrepancies or a missing payslip, please contact the HR or Accounting Office.
          </p>
        </div>
      </aside>

      <section className="employee-payslips-stat-grid" aria-label="Payroll summary">
        {employeePayslipStats.map((stat) => (
          <article className="employee-payslips-stat-card" key={stat.label}>
            <span className={`employee-payslips-stat-icon employee-payslips-stat-icon-${stat.tone}`} aria-hidden="true">
              <Icon name={stat.icon} />
            </span>
            <div>
              <p className="employee-payslips-stat-label">{stat.label}</p>
              <p className={`employee-payslips-stat-value ${stat.label === "Latest Payslip" ? "is-date" : ""}`}>{stat.value}</p>
              <p className="employee-payslips-stat-note">{stat.note}</p>
            </div>
          </article>
        ))}
      </section>

      <PayslipsExplorer />
    </div>
  );
}
