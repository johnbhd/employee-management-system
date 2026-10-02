"use client";

import { Icon } from "@/components/ui/Icon";
import { formatCampusDateTime } from "@/lib/campus-time";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { QrResolveData } from "@/types/attendance-qr";

type ScannedEmployeeCardProps = {
  result: QrResolveData;
  onScanNext: () => void;
};

export function ScannedEmployeeCard({
  onScanNext,
  result,
}: ScannedEmployeeCardProps) {
  const statusTone = result.employee.employmentStatus === "active"
    ? "success"
    : "warning";
  const scannedAt = new Date(result.scannedAt);

  return (
    <section className="attendance-scanner-result" aria-labelledby="scanner-result-heading">
      <div className="attendance-scanner-result-heading">
        <span className="attendance-scanner-success-icon" aria-hidden="true">
          <Icon name="check" />
        </span>
        <div>
          <span className="attendance-scanner-kicker">Employee identified</span>
          <h2 id="scanner-result-heading">Identity verified</h2>
        </div>
      </div>

      <div className="attendance-scanner-employee">
        <div className="attendance-scanner-avatar" aria-hidden="true">
          <Icon name="user" />
        </div>
        <div>
          <h3>{result.employee.displayName}</h3>
          <p>{result.employee.employeeId}</p>
        </div>
      </div>

      <dl className="attendance-scanner-detail-grid">
        <div>
          <dt>Department</dt>
          <dd>{result.employee.department}</dd>
        </div>
        <div>
          <dt>Position</dt>
          <dd>{result.employee.position ?? "Not provided"}</dd>
        </div>
        <div>
          <dt>Employee status</dt>
          <dd>
            <StatusBadge tone={statusTone}>
              {result.employee.employmentStatus === "active" ? "Active" : "Inactive"}
            </StatusBadge>
          </dd>
        </div>
        <div>
          <dt>Scanned at</dt>
          <dd>
            {Number.isNaN(scannedAt.getTime())
              ? "Time unavailable"
              : formatCampusDateTime(scannedAt)}
          </dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>{result.source}</dd>
        </div>
      </dl>

      <p className="attendance-scanner-result-note" role="status">
        Identity was verified. Attendance has not been recorded by this scan.
      </p>

      <button
        type="button"
        className="attendance-scanner-primary-button"
        onClick={onScanNext}
      >
        <Icon name="refresh" />
        Scan Next Employee
      </button>
    </section>
  );
}
