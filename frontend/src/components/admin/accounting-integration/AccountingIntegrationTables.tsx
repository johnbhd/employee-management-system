import type { ReactNode } from "react";

import { ActionButton } from "@/components/ui/ActionButton";
import { StatusBadge } from "@/components/ui/StatusBadge";

import {
  accountingSynchronizationHistory,
  accountingTransferBatches,
  accountingTransferCandidates,
  blockedAccountingTransfers,
  failedAccountingTransfers,
  type AccountingFieldMapping,
} from "@/data/accounting";

type AccountingTableProps = {
  caption: string;
  children: ReactNode;
  className?: string;
};

function AccountingTable({ caption, children, className = "" }: AccountingTableProps) {
  return (
    <div className={`accounting-table-wrap ${className}`.trim()}>
      <table className="data-table accounting-table">
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  );
}

export function AccountingTransferCandidatesTable() {
  return (
    <AccountingTable
      caption="Payroll to Accounting transfer candidates"
      className="accounting-candidate-table-wrap"
    >
      <thead>
        <tr>
          <th>Payroll batch ID</th>
          <th>Payroll period</th>
          <th>Employees</th>
          <th>Source status</th>
          <th>Accounting readiness</th>
          <th>Transfer status</th>
          <th>Acknowledgement</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {accountingTransferCandidates.map((candidate) => (
          <tr key={candidate.payrollBatchId}>
            <td>{candidate.payrollBatchId}</td>
            <td>{candidate.payrollPeriod}</td>
            <td>{candidate.employeeCount}</td>
            <td>
              <StatusBadge tone={candidate.sourceStatus.tone}>
                {candidate.sourceStatus.label}
              </StatusBadge>
            </td>
            <td>
              <StatusBadge tone={candidate.readinessStatus.tone}>
                {candidate.readinessStatus.label}
              </StatusBadge>
            </td>
            <td>
              <StatusBadge tone={candidate.transferStatus.tone}>
                {candidate.transferStatus.label}
              </StatusBadge>
            </td>
            <td>
              <StatusBadge tone={candidate.acknowledgementStatus.tone}>
                {candidate.acknowledgementStatus.label}
              </StatusBadge>
            </td>
            <td className="accounting-action-cell">
              <ActionButton
                variant="link"
                icon="file"
                action={`${candidate.payrollBatchId} transfer details opened.`}
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

type AccountingFieldMappingTableProps = {
  mappings: readonly AccountingFieldMapping[];
};

export function AccountingFieldMappingTable({ mappings }: AccountingFieldMappingTableProps) {
  return (
    <AccountingTable caption="Payroll to Accounting field mapping" className="accounting-mapping-table-wrap">
      <thead>
        <tr>
          <th>Payroll Integration field</th>
          <th>Prototype Accounting field</th>
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
    </AccountingTable>
  );
}

export function AccountingTransferBatchTable() {
  return (
    <AccountingTable caption="Accounting transfer batches" className="accounting-batch-table-wrap">
      <thead>
        <tr>
          <th>Transfer ID</th>
          <th>Payroll batch ID</th>
          <th>Payroll period</th>
          <th>Records</th>
          <th>Prepared at</th>
          <th>Transfer status</th>
          <th>Acknowledgement</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {accountingTransferBatches.map((batch) => (
          <tr key={batch.transferId}>
            <td>{batch.transferId}</td>
            <td>{batch.payrollBatchId}</td>
            <td>{batch.payrollPeriod}</td>
            <td>{batch.recordCount}</td>
            <td>{batch.preparedAt}</td>
            <td>
              <StatusBadge tone={batch.transferStatus.tone}>
                {batch.transferStatus.label}
              </StatusBadge>
            </td>
            <td>
              <StatusBadge tone={batch.acknowledgementStatus.tone}>
                {batch.acknowledgementStatus.label}
              </StatusBadge>
            </td>
            <td className="accounting-action-cell">
              {batch.transferStatus.label === "Failed" ? (
                <ActionButton
                  variant="link"
                  icon="refresh"
                  action={`${batch.transferId} retry queued in prototype mode.`}
                >
                  Retry
                </ActionButton>
              ) : (
                <ActionButton
                  variant="link"
                  icon="file"
                  action={`${batch.transferId} transfer details opened.`}
                >
                  View
                </ActionButton>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </AccountingTable>
  );
}

export function BlockedAccountingTransfersTable() {
  return (
    <AccountingTable caption="Blocked Accounting transfers" className="accounting-blocked-table-wrap">
      <thead>
        <tr>
          <th>Payroll batch ID</th>
          <th>Payroll period</th>
          <th>Issue</th>
          <th>Upstream status</th>
          <th>Accounting readiness</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {blockedAccountingTransfers.map((transfer) => (
          <tr key={transfer.payrollBatchId}>
            <td>{transfer.payrollBatchId}</td>
            <td>{transfer.payrollPeriod}</td>
            <td>{transfer.issue}</td>
            <td>
              <StatusBadge tone={transfer.upstreamStatus.tone}>
                {transfer.upstreamStatus.label}
              </StatusBadge>
            </td>
            <td>
              <StatusBadge tone={transfer.readinessStatus.tone}>
                {transfer.readinessStatus.label}
              </StatusBadge>
            </td>
            <td className="accounting-action-cell">
              <ActionButton
                variant="link"
                icon="info"
                action={`${transfer.payrollBatchId} integration issue opened.`}
              >
                View details
              </ActionButton>
            </td>
          </tr>
        ))}
      </tbody>
    </AccountingTable>
  );
}

export function FailedAccountingTransfersTable() {
  return (
    <AccountingTable caption="Failed Accounting transfers" className="accounting-failed-table-wrap">
      <thead>
        <tr>
          <th>Transfer ID</th>
          <th>Timestamp</th>
          <th>Payroll batch</th>
          <th>Failure type</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {failedAccountingTransfers.map((transfer) => (
          <tr key={transfer.transferId}>
            <td>{transfer.transferId}</td>
            <td>{transfer.timestamp}</td>
            <td>{transfer.payrollBatchId}</td>
            <td>{transfer.failureType}</td>
            <td>
              <StatusBadge tone={transfer.status.tone}>{transfer.status.label}</StatusBadge>
            </td>
            <td className="accounting-action-cell">
              <ActionButton
                variant="link"
                icon="refresh"
                action={`${transfer.transferId} retry queued in prototype mode.`}
              >
                Retry
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
    <AccountingTable caption="Accounting synchronization history" className="accounting-history-table-wrap">
      <thead>
        <tr>
          <th>Date / time</th>
          <th>Transfer ID</th>
          <th>Payroll batch</th>
          <th>Operation</th>
          <th>Status</th>
          <th>Acknowledgement</th>
          <th>Details</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {accountingSynchronizationHistory.map((event) => (
          <tr key={`${event.transferId}-${event.timestamp}`}>
            <td>{event.timestamp}</td>
            <td>{event.transferId}</td>
            <td>{event.payrollBatchId}</td>
            <td>{event.operation}</td>
            <td>
              <StatusBadge tone={event.status.tone}>{event.status.label}</StatusBadge>
            </td>
            <td>
              <StatusBadge tone={event.acknowledgement.tone}>
                {event.acknowledgement.label}
              </StatusBadge>
            </td>
            <td>{event.detail}</td>
            <td className="accounting-action-cell">
              <ActionButton
                variant="link"
                icon="file"
                action={`${event.transferId} history details opened.`}
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
