import { Icon } from "@/components/ui/Icon";
import { getRoleLabel } from "@/lib/auth/roles";
import type { SessionUser } from "@/types/auth";
import type { EmployeeReference } from "@/types/employee";

function getEmploymentStatusLabel(employee: EmployeeReference) {
  return employee.employmentStatus === "active" ? "Active" : "Inactive";
}

export function ProfilePageUnavailable() {
  return (
    <div className="employee-profile-page">
      <section
        className="employee-profile-details employee-profile-unavailable"
        role="alert"
        aria-labelledby="employee-profile-unavailable-heading"
      >
        <span className="employee-profile-kicker">Employee profile</span>
        <h2 id="employee-profile-unavailable-heading">
          Employee information is currently unavailable.
        </h2>
        <p>
          Please contact the system administrator to restore your employee
          account reference.
        </p>
      </section>
    </div>
  );
}

export function ProfilePage({
  user,
  employee,
}: {
  user: SessionUser;
  employee: EmployeeReference;
}) {
  const employmentStatus = getEmploymentStatusLabel(employee);
  const statusClassName =
    employee.employmentStatus === "active"
      ? "employee-profile-status"
      : "employee-profile-status is-inactive";
  const profileDetails = [
    { label: "Employee ID", value: employee.employeeId },
    { label: "Department", value: employee.department },
    { label: "Position", value: employee.position ?? "Not provided" },
    { label: "Employment status", value: employmentStatus },
  ];

  return (
    <div className="employee-profile-page">
      <section
        className="employee-profile-overview"
        aria-labelledby="employee-profile-heading"
      >
        <div className="employee-profile-avatar" aria-hidden="true">
          <Icon name="user" />
        </div>
        <div className="employee-profile-overview-copy">
          <span className="employee-profile-kicker">Employee profile</span>
          <h2 id="employee-profile-heading">{employee.displayName}</h2>
          <p>
            {employee.employeeId}
            {" / "}
            {employee.department}
          </p>
        </div>
        <span className={statusClassName}>
          {employmentStatus} employee
        </span>
      </section>

      <section
        className="employee-profile-details"
        aria-labelledby="employee-profile-account-heading"
      >
        <div className="employee-profile-section-heading">
          <div>
            <span className="employee-profile-kicker">Account information</span>
            <h2 id="employee-profile-account-heading">Portal access</h2>
          </div>
          <p>Managed by the application account.</p>
        </div>
        <dl className="employee-profile-detail-grid">
          <div>
            <dt>Username</dt>
            <dd>{user.username}</dd>
          </div>
          <div>
            <dt>System role</dt>
            <dd>{getRoleLabel(user.role)}</dd>
          </div>
        </dl>
      </section>

      <section
        className="employee-profile-details"
        aria-labelledby="employee-profile-details-heading"
      >
        <div className="employee-profile-section-heading">
          <div>
            <span className="employee-profile-kicker">Profile details</span>
            <h2 id="employee-profile-details-heading">
              Employment information
            </h2>
          </div>
          <p>Official employee information is read-only.</p>
        </div>
        <dl className="employee-profile-detail-grid">
          {profileDetails.map((detail) => (
            <div key={detail.label}>
              <dt>{detail.label}</dt>
              <dd>{detail.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <p className="employee-profile-note">
        Need to update your official information? Please contact the HR Office
        or your department head.
      </p>
    </div>
  );
}
