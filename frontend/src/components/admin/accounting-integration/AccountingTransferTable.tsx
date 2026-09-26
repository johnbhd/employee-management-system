import type { ReactNode } from "react";

import { ActionButton } from "@/components/ui/ActionButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  accountingExceptions,
  accountingFieldMappings,
  accountingSynchronizationHistory,
  accountingTransferQueue,
} from "@/data/accounting-integration";

type AccountingTableProps = {
  caption: string;
  children: ReactNode;
  className?: string;
};

function AccountingTable({ caption, children, className = "" }: AccountingTableProps) {
  return (
    <div className={`accounting-integration-table-wrap ${className}`.trim()}>
      <table className="data-table accounting-integration-table">
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  );
}

export function AccountingTransferQueueTable() {
  return (
    <AccountingTable caption="Accounting transfer queue">
      <thead>
        <tr>
          <th>Payroll batch</th>
          <th>Period</th>
          <th>Records</th>
          <th>Readiness</th>
          <th>Transfer</th>
          <th>Acknowledgement</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {accountingTransferQueue.map((record) => (
          <tr key={record.batchId}>
            <td>{record.batchId}</td>
            <td>{record.period}</td>
            <td>{record.records}</td>
            <td>
              <StatusBadge tone={record.readinessTone}>{record.readiness}</StatusBadge>
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
    </AccountingTable>
  );
}

export function AccountingFieldMappingTable() {
  return (
    <AccountingTable caption="Accounting field mapping">
      <thead>
        <tr>
          <th>Payroll source</th>
          <th>Accounting target</th>
          <th>Mapping status</th>
        </tr>
      </thead>
      <tbody>
        {accountingFieldMappings.map((mapping) => (
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
    </AccountingTable>
  );
}

export function AccountingExceptionTable() {
  return (
    <AccountingTable caption="Blocked and failed Accounting transfers">
      <thead>
        <tr>
          <th>Type</th>
          <th>Payroll batch</th>
          <th>Issue</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {accountingExceptions.map((exception) => (
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
    </AccountingTable>
  );
}

export function AccountingSynchronizationHistoryTable() {
  return (
    <AccountingTable caption="Accounting synchronization history">
      <thead>
        <tr>
          <th>Time</th>
          <th>Payroll batch</th>
          <th>Operation</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {accountingSynchronizationHistory.map((event) => (
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
    </AccountingTable>
  );
}
