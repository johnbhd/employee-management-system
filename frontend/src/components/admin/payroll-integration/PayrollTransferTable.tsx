import type { ReactNode } from "react";

import { ActionButton } from "@/components/ui/ActionButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  blockedPayrollRecords,
  failedPayrollTransfers,
  payrollReadyRecords,
  payrollSynchronizationHistory,
  payrollTransferBatches,
  type PayrollFieldMapping,
} from "@/data/payroll-integration";

type PayrollTableProps = {
  caption: string;
  children: ReactNode;
  className?: string;
};

function PayrollTable({ caption, children, className = "" }: PayrollTableProps) {
  return (
    <div className={`payroll-integration-table-wrap ${className}`.trim()}>
      <table className="data-table payroll-integration-table">
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  );
}

export function PayrollReadyTable() {
  return (
    <PayrollTable caption="Payroll-ready attendance records" className="payroll-ready-table-wrap">
      <thead>
        <tr>
          <th>Employee ID</th>
          <th>Employee</th>
          <th>Department</th>
          <th>Payroll period</th>
          <th>Attendance</th>
          <th>Verification</th>
          <th>Readiness</th>
          <th>Transfer</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {payrollReadyRecords.map((record) => (
          <tr key={record.employeeId}>
            <td>{record.employeeId}</td>
            <td>{record.employee}</td>
            <td>{record.department}</td>
            <td>{record.payrollPeriod}</td>
            <td>
              <StatusBadge tone={record.attendanceStatus.tone}>{record.attendanceStatus.label}</StatusBadge>
            </td>
            <td>
              <StatusBadge tone={record.verificationStatus.tone}>{record.verificationStatus.label}</StatusBadge>
            </td>
            <td>
              <StatusBadge tone={record.readinessStatus.tone}>{record.readinessStatus.label}</StatusBadge>
            </td>
            <td>
              <StatusBadge tone={record.transferStatus.tone}>{record.transferStatus.label}</StatusBadge>
            </td>
            <td>
              <ActionButton
                variant="link"
                icon="file"
                action={`${record.employeeId} attendance details opened in prototype mode.`}
              >
                View
              </ActionButton>
            </td>
          </tr>
        ))}
      </tbody>
    </PayrollTable>
  );
}

type PayrollFieldMappingTableProps = {
  mappings: readonly PayrollFieldMapping[];
};

export function PayrollFieldMappingTable({ mappings }: PayrollFieldMappingTableProps) {
  return (
    <PayrollTable caption="Attendance to Payroll field mapping" className="payroll-mapping-table-wrap">
      <thead>
        <tr>
          <th>Verified attendance field</th>
          <th>Prototype Payroll payload field</th>
          <th>Mapping status</th>
        </tr>
      </thead>
      <tbody>
        {mappings.map((mapping) => (
          <tr key={mapping.sourceField}>
            <td>{mapping.sourceField}</td>
            <td>
              <code>{mapping.targetField}</code>
            </td>
            <td>
              <StatusBadge tone={mapping.tone}>{mapping.status}</StatusBadge>
            </td>
          </tr>
        ))}
      </tbody>
    </PayrollTable>
  );
}

export function PayrollBatchTable() {
  return (
    <PayrollTable caption="Payroll transfer batches" className="payroll-batch-table-wrap">
      <thead>
        <tr>
          <th>Batch ID</th>
          <th>Payroll period</th>
          <th>Employees</th>
          <th>Records</th>
          <th>Prepared at</th>
          <th>Transfer status</th>
          <th>Acknowledgement</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {payrollTransferBatches.map((batch) => (
          <tr key={batch.id}>
            <td>{batch.id}</td>
            <td>{batch.payrollPeriod}</td>
            <td>{batch.employeeCount}</td>
            <td>{batch.recordCount}</td>
            <td>{batch.preparedAt}</td>
            <td>
              <StatusBadge tone={batch.transferStatus.tone}>{batch.transferStatus.label}</StatusBadge>
            </td>
            <td>
              <StatusBadge tone={batch.acknowledgementStatus.tone}>
                {batch.acknowledgementStatus.label}
              </StatusBadge>
            </td>
            <td>
              <ActionButton
                variant="link"
                icon={batch.transferStatus.label === "Failed" ? "refresh" : "file"}
                action={`${batch.id} ${batch.transferStatus.label === "Failed" ? "retry queued" : "details opened"} in prototype mode.`}
              >
                {batch.transferStatus.label === "Failed" ? "Retry" : "View"}
              </ActionButton>
            </td>
          </tr>
        ))}
      </tbody>
    </PayrollTable>
  );
}

export function PayrollBlockedTable() {
  return (
    <PayrollTable caption="Blocked Payroll records" className="payroll-blocked-table-wrap">
      <thead>
        <tr>
          <th>Employee ID</th>
          <th>Employee</th>
          <th>Issue</th>
          <th>Attendance</th>
          <th>Review status</th>
          <th>Readiness</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {blockedPayrollRecords.map((record) => (
          <tr key={record.employeeId}>
            <td>{record.employeeId}</td>
            <td>{record.employee}</td>
            <td>{record.issue}</td>
            <td>
              <StatusBadge tone={record.attendanceStatus.tone}>{record.attendanceStatus.label}</StatusBadge>
            </td>
            <td>
              <StatusBadge tone={record.reviewStatus.tone}>{record.reviewStatus.label}</StatusBadge>
            </td>
            <td>
              <StatusBadge tone={record.readinessStatus.tone}>{record.readinessStatus.label}</StatusBadge>
            </td>
            <td>
              <ActionButton
                variant="link"
                icon="info"
                action={`${record.employeeId} validation issue opened in prototype mode.`}
              >
                Inspect
              </ActionButton>
            </td>
          </tr>
        ))}
      </tbody>
    </PayrollTable>
  );
}

export function PayrollFailedTable() {
  return (
    <PayrollTable caption="Failed Payroll transfers" className="payroll-failed-table-wrap">
      <thead>
        <tr>
          <th>Batch ID</th>
          <th>Timestamp</th>
          <th>Records</th>
          <th>Failure type</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {failedPayrollTransfers.map((transfer) => (
          <tr key={transfer.batchId}>
            <td>{transfer.batchId}</td>
            <td>{transfer.timestamp}</td>
            <td>{transfer.recordCount}</td>
            <td>{transfer.failureType}</td>
            <td>
              <StatusBadge tone={transfer.status.tone}>{transfer.status.label}</StatusBadge>
            </td>
            <td>
              <ActionButton
                variant="link"
                icon="refresh"
                action={`${transfer.batchId} retry queued in prototype mode.`}
              >
                Retry
              </ActionButton>
            </td>
          </tr>
        ))}
      </tbody>
    </PayrollTable>
  );
}

export function PayrollHistoryTable() {
  return (
    <PayrollTable caption="Payroll synchronization history" className="payroll-history-table-wrap">
      <thead>
        <tr>
          <th>Date / time</th>
          <th>Batch ID</th>
          <th>Period</th>
          <th>Records</th>
          <th>Operation</th>
          <th>Status</th>
          <th>Details</th>
        </tr>
      </thead>
      <tbody>
        {payrollSynchronizationHistory.map((event) => (
          <tr key={`${event.timestamp}-${event.batchId}`}>
            <td>{event.timestamp}</td>
            <td>{event.batchId}</td>
            <td>{event.payrollPeriod}</td>
            <td>{event.recordCount}</td>
            <td>{event.operation}</td>
            <td>
              <StatusBadge tone={event.status.tone}>{event.status.label}</StatusBadge>
            </td>
            <td>{event.details}</td>
          </tr>
        ))}
      </tbody>
    </PayrollTable>
  );
}
