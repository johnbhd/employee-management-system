import { employeeAttendanceProfile } from "@/data/my-attendance";
import { Icon } from "@/components/ui/Icon";
import { getRoleLabel } from "@/lib/auth/roles";
import type { SessionUser } from "@/types/auth";
import type { EmployeeReference } from "@/types/employee";

function getEmploymentStatusLabel(employee: EmployeeReference | null) {
  if (!employee) {
    return "Employee information unavailable";
  }

  return employee.employmentStatus === "active" ? "Active" : "Inactive";
}

export function ProfilePage({
  user,
  employee,
}: {
  user: SessionUser;
  employee: EmployeeReference | null;
}) {
  const employeeName = employee?.displayName ?? "Employee information unavailable";
  const employeeId = employee?.employeeId ?? "Unavailable";
  const department = employee?.department ?? "Employee information unavailable";
  const position = employee?.position ?? "Not provided";
  const profileDetails = [
    { label: "Employee ID", value: employeeId },
    { label: "Department", value: department },
    { label: "Position", value: position },
    { label: "Employment status", value: getEmploymentStatusLabel(employee) },
    { label: "Work schedule", value: employeeAttendanceProfile.schedule },
    { label: "Schedule type", value: employeeAttendanceProfile.scheduleType },
    { label: "Today’s attendance", value: employeeAttendanceProfile.status },
    { label: "Attendance note", value: employeeAttendanceProfile.statusNote },
  ];

  return (
    <div className="employee-profile-page">
      <section className="employee-profile-overview" aria-labelledby="employee-profile-heading">
        <div className="employee-profile-avatar" aria-hidden="true">
          <Icon name="user" />
        </div>
        <div className="employee-profile-overview-copy">
          <span className="employee-profile-kicker">Employee profile</span>
          <h2 id="employee-profile-heading">{employeeName}</h2>
          <p>{employeeId} · {department}</p>
        </div>
        <span className="employee-profile-status">Employee record</span>
      </section>

      <section className="employee-profile-details" aria-labelledby="employee-profile-account-heading">
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

      <section className="employee-profile-details" aria-labelledby="employee-profile-details-heading">
        <div className="employee-profile-section-heading">
          <div>
            <span className="employee-profile-kicker">Profile details</span>
            <h2 id="employee-profile-details-heading">Employment information</h2>
          </div>
          <p>Read-only information in this prototype.</p>
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
        Need to update your official information? Please contact the HR Office or your department head.
      </p>
    </div>
  );
}
