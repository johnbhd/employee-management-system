import Link from "next/link";

import { employeeAttendanceProfile } from "@/data/my-attendance";
import { Icon } from "@/components/ui/Icon";

const profileDetails = [
  { label: "Employee ID", value: employeeAttendanceProfile.employeeId },
  { label: "Department", value: employeeAttendanceProfile.department },
  { label: "Work schedule", value: employeeAttendanceProfile.schedule },
  { label: "Schedule type", value: employeeAttendanceProfile.scheduleType },
  { label: "Today’s attendance", value: employeeAttendanceProfile.status },
  { label: "Attendance note", value: employeeAttendanceProfile.statusNote },
];

export function ProfilePage() {
  return (
    <div className="employee-profile-page">
      <nav className="employee-profile-breadcrumb" aria-label="Breadcrumb">
        <Link href="/employee/dashboard">Dashboard</Link>
        <Icon name="chevron" />
        <span aria-current="page">My Profile</span>
      </nav>

      <section className="employee-profile-overview" aria-labelledby="employee-profile-heading">
        <div className="employee-profile-avatar" aria-hidden="true">
          <Icon name="user" />
        </div>
        <div className="employee-profile-overview-copy">
          <span className="employee-profile-kicker">Employee profile</span>
          <h2 id="employee-profile-heading">{employeeAttendanceProfile.name}</h2>
          <p>{employeeAttendanceProfile.employeeId} · {employeeAttendanceProfile.department}</p>
        </div>
        <span className="employee-profile-status">Employee record</span>
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
