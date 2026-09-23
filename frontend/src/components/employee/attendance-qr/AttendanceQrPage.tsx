import Link from "next/link";

import {
  employeeQrInfo,
  employeeQrProfile,
  employeeQrSteps,
} from "@/data/attendance-qr";
import { Icon } from "@/components/ui/Icon";

import { AttendanceQrCard } from "./AttendanceQrCard";

export function AttendanceQrPage() {
  return (
    <div className="attendance-qr-page">
      <nav className="attendance-qr-breadcrumb" aria-label="Breadcrumb">
        <Link href="/employee/dashboard">Dashboard</Link>
        <Icon name="chevron" />
        <span aria-current="page">Show Attendance QR</span>
      </nav>

      <p className="attendance-qr-page-subtitle">
        Present this QR code at an authorized campus attendance station.
      </p>

      <section className="attendance-qr-layout" aria-label="Attendance QR">
        <AttendanceQrCard />

        <aside className="attendance-qr-side" aria-label="Attendance QR guidance">
          <div className="attendance-qr-info-card">
            <div className="attendance-qr-info-heading">
              <Icon name={employeeQrInfo.icon} />
              <h2>{employeeQrInfo.title}</h2>
            </div>
            <ol className="attendance-qr-step-list">
              {employeeQrSteps.map((step, index) => (
                <li key={step}>
                  <span className="attendance-qr-step-number" aria-hidden="true">
                    {index + 1}
                  </span>
                  <p>{step}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="attendance-qr-notice-card">
            <div className="attendance-qr-notice-heading">
              <Icon name={employeeQrInfo.securityIcon} />
              <h2>{employeeQrInfo.securityTitle}</h2>
            </div>
            <p>{employeeQrInfo.securityMessage}</p>
          </div>
        </aside>
      </section>

      <p className="sr-only">
        QR attendance for {employeeQrProfile.name}, employee ID {employeeQrProfile.employeeId}.
      </p>
    </div>
  );
}
