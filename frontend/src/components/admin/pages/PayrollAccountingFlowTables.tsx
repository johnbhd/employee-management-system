import type { ReactNode } from "react";

import { ActionButton } from "@/components/ui/ActionButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  payrollAccountingExceptions,
  payrollAccountingFieldMappings,
  payrollAccountingSynchronizationHistory,
  payrollAccountingTransferQueue,
} from "@/data/payroll-accounting-flow";

type PayrollAccountingTableProps = {
  caption: string;
  children: ReactNode;
};

function PayrollAccountingTable({ caption, children }: PayrollAccountingTableProps) {
  return (
    <div className="payroll-accounting-flow-table-wrap">
      <table className="data-table payroll-accounting-flow-table">
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  );
}

export function PayrollAccountingTransferQueueTable() {
  return (
    <PayrollAccountingTable caption="Payroll transfer queue">
      <thead>
        <tr>
          <th>Attendance batch</th>
          <th>Period</th>
          <th>Records</th>
          <th>Verification</th>
          <th>Transfer</th>
          <th>Acknowledgement</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {payrollAccountingTransferQueue.map((record) => (
          <tr key={record.batchId}>
            <td>{record.batchId}</td>
            <td>{record.period}</td>
            <td>{record.records}</td>
            <td>
              <StatusBadge tone={record.verificationTone}>{record.verification}</StatusBadge>
            </td>
            <td>
              <StatusBadge tone={record.transferTone}>{record.transferStatus}</StatusBadge>
            </td>
            <td>
              <StatusBadge tone={record.acknowledgementTone}>{record.acknowledgement}</StatusBadge>
            </td>
            <td>
              <ActionButton
                variant="link"
                icon="file"
                action={`${record.batchId} details opened in prototype mode.`}
              >
                View
              </ActionButton>
            </td>
          </tr>
        ))}
      </tbody>
    </PayrollAccountingTable>
  );
}

export function PayrollAccountingFieldMappingTable() {
  return (
    <PayrollAccountingTable caption="Payroll field mapping">
      <thead>
        <tr>
          <th>Unified Attendance source</th>
          <th>Payroll target</th>
          <th>Mapping status</th>
        </tr>
      </thead>
      <tbody>
        {payrollAccountingFieldMappings.map((mapping) => (
          <tr key={mapping.source}>
            <td>{mapping.source}</td>
            <td>
              <code>{mapping.target}</code>
            </td>
            <td>
              <StatusBadge tone={mapping.tone}>{mapping.status}</StatusBadge>
            </td>
          </tr>
        ))}
      </tbody>
    </PayrollAccountingTable>
  );
}

export function PayrollAccountingExceptionTable() {
  return (
    <PayrollAccountingTable caption="Blocked and failed Payroll transfers">
      <thead>
        <tr>
          <th>Type</th>
          <th>Attendance batch</th>
          <th>Issue</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {payrollAccountingExceptions.map((exception) => (
          <tr key={`${exception.type}-${exception.batchId}`}>
            <td>{exception.type}</td>
            <td>{exception.batchId}</td>
            <td>{exception.issue}</td>
            <td>
              <StatusBadge tone={exception.tone}>{exception.status}</StatusBadge>
            </td>
            <td>
              <ActionButton
                variant="link"
                icon={exception.type === "Failed" ? "refresh" : "info"}
                action={`${exception.batchId} ${exception.type.toLowerCase()} transfer reviewed.`}
              >
                {exception.type === "Failed" ? "Retry" : "Review"}
              </ActionButton>
            </td>
          </tr>
        ))}
      </tbody>
    </PayrollAccountingTable>
  );
}

export function PayrollAccountingSynchronizationHistoryTable() {
  return (
    <PayrollAccountingTable caption="Payroll synchronization history">
      <thead>
        <tr>
          <th>Time</th>
          <th>Attendance batch</th>
          <th>Operation</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {payrollAccountingSynchronizationHistory.map((event) => (
          <tr key={`${event.time}-${event.batchId}`}>
            <td>{event.time}</td>
            <td>{event.batchId}</td>
            <td>{event.operation}</td>
            <td>
              <StatusBadge tone={event.tone}>{event.status}</StatusBadge>
            </td>
          </tr>
        ))}
      </tbody>
    </PayrollAccountingTable>
  );
}
