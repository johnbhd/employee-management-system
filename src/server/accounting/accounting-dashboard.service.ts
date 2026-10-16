import "server-only";

import { accountingIntegrationProviderNote } from "@/server/accounting/accounting-integration.adapter";
import {
  determineAccountingDashboardStatus,
} from "@/server/accounting/accounting-lifecycle";
import { getAccountingApprovedPayrollData } from "@/server/accounting/accounting-approved-payroll.service";
import { getAccountingTransactionHistoryData } from "@/server/accounting/accounting-transaction-history.service";
import type { AccountingApprovedPayrollItem } from "@/types/accounting-approved-payroll";
import type {
  AccountingDashboardActivity,
  AccountingDashboardAlert,
  AccountingDashboardData,
  AccountingDashboardHealthItem,
  AccountingDashboardPayroll,
  AccountingIntegrationFlowStep,
} from "@/types/accounting-dashboard";
import type { AccountingTransactionHistoryItem } from "@/types/accounting-transaction-history";

const dashboardSourcePageSize = 50;
const recentActivityLimit = 5;
const recentPayrollLimit = 5;

function getLatestTimestamp(...values: Array<string | null | undefined>) {
  return values
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => right.localeCompare(left))[0] ?? null;
}

function getAccountingTransferStatus(item: AccountingApprovedPayrollItem) {
  return {
    transferStatus: item.accountingTransfer.status,
    acknowledgementStatus: item.accountingTransfer.acknowledgementStatus,
  } as const;
}

function getPayrollDetail(
  item: AccountingApprovedPayrollItem,
  historyItem: AccountingTransactionHistoryItem | undefined,
) {
  const accountingStatus = determineAccountingDashboardStatus({
    readinessStatus: item.accountingReadiness.status,
    transfer: getAccountingTransferStatus(item),
  });

  if (accountingStatus === "Transferred") {
    return "The Accounting transfer was acknowledged by the configured integration adapter.";
  }

  if (accountingStatus === "Prepared") {
    return "A local, read-only Accounting snapshot is prepared and ready for controlled simulated handoff.";
  }

  if (accountingStatus === "Awaiting Acknowledgement") {
    return "The Accounting transfer was submitted and is awaiting acknowledgement.";
  }

  if (accountingStatus === "Transfer In Progress") {
    return "The Accounting transfer is currently being processed by the integration adapter.";
  }

  if (accountingStatus === "Integration Issue") {
    return historyItem?.issueSummary
      ?? item.accountingTransfer.failureSummary
      ?? "The Accounting transfer requires technical follow-up.";
  }

  if (accountingStatus === "Ready for Transfer") {
    return "The completed Payroll Result is ready for the next Accounting transfer.";
  }

  return item.accountingReadiness.reasons.join(" ")
    || "The Payroll Result is not ready for Accounting transfer.";
}

function toDashboardPayroll(
  item: AccountingApprovedPayrollItem,
  historyItem: AccountingTransactionHistoryItem | undefined,
): AccountingDashboardPayroll {
  const accountingStatus = determineAccountingDashboardStatus({
    readinessStatus: item.accountingReadiness.status,
    transfer: getAccountingTransferStatus(item),
  });

  return {
    payrollResultId: item.payrollResultId,
    payrollPeriod: item.period,
    payrollReference: item.references.externalPayrollReference
      ?? item.payrollResultId,
    employeeCount: item.employeeCount,
    returnedAmount: item.returnedAmount,
    payrollStatus: item.payrollResultStatus,
    readinessStatus: item.accountingReadiness.status,
    accountingStatus,
    transferId: item.accountingTransfer.transferId,
    transferReference: item.accountingTransfer.externalReference,
    submittedAt: item.accountingTransfer.submittedAt,
    lastUpdatedAt: getLatestTimestamp(
      item.updatedAt,
      item.accountingTransfer.updatedAt,
      historyItem?.completedAt,
    ) ?? item.updatedAt,
    detail: getPayrollDetail(item, historyItem),
  };
}

function buildIntegrationFlow(
  latest: AccountingDashboardPayroll | null,
): AccountingIntegrationFlowStep[] {
  if (!latest) return [];

  const hasTransfer = Boolean(latest.transferId);
  const transferPrepared = latest.accountingStatus === "Prepared";
  const transferInProgress = latest.accountingStatus === "Transfer In Progress";
  const transferFailed = latest.accountingStatus === "Integration Issue";
  const transferSubmitted = latest.accountingStatus === "Transferred"
    || latest.accountingStatus === "Awaiting Acknowledgement"
    || transferFailed;
  const acknowledgementComplete = latest.accountingStatus === "Transferred";
  const acknowledgementFailed = latest.accountingStatus === "Integration Issue";

  return [
    {
      key: "payroll-result",
      label: "Payroll Result",
      detail: latest.payrollReference,
      state: latest.payrollStatus === "completed" ? "complete" : "failed",
      occurredAt: latest.lastUpdatedAt,
    },
    {
      key: "accounting-ready",
      label: "Accounting Ready",
      detail: latest.readinessStatus === "ready"
        ? "Readiness checks passed"
        : "Readiness checks blocked",
      state: latest.readinessStatus === "ready" ? "complete" : "failed",
      occurredAt: null,
    },
    {
      key: "submitted",
      label: transferPrepared ? "Prepared for Accounting" : "Submitted to Accounting",
      detail: transferFailed
        ? "Transfer requires follow-up"
        : transferPrepared
          ? "Local snapshot prepared; ready for controlled handoff"
          : transferInProgress
            ? "Transfer in progress"
            : hasTransfer
              ? "Persisted Accounting transfer"
              : "Waiting for transfer",
      state: transferFailed
        ? "failed"
        : transferInProgress
          ? "current"
          : transferPrepared || transferSubmitted
            ? "complete"
            : "pending",
      occurredAt: latest.submittedAt,
    },
    {
      key: "acknowledged",
      label: "Acknowledged",
      detail: acknowledgementFailed
        ? "Acknowledgement or transfer failed"
        : acknowledgementComplete
          ? "Accepted by Accounting adapter"
          : transferPrepared
            ? "Submit the prepared snapshot from the Accounting transfer workspace"
            : latest.accountingStatus === "Awaiting Acknowledgement"
              ? "Awaiting response"
              : "No acknowledgement yet",
      state: acknowledgementFailed
        ? "failed"
        : acknowledgementComplete
          ? "complete"
          : transferPrepared
            ? "pending"
            : latest.accountingStatus === "Awaiting Acknowledgement"
              ? "current"
              : "pending",
      occurredAt: acknowledgementComplete || acknowledgementFailed
        ? latest.lastUpdatedAt
        : null,
    },
  ];
}

function getActivityPresentation(item: AccountingTransactionHistoryItem) {
  switch (item.lifecycleStatus) {
    case "Prepared":
      return {
        type: "pending" as const,
        title: "Accounting transfer prepared",
        description: `${item.transferId} has a local read-only snapshot; external submission is not active.`,
        tone: "info" as const,
        icon: "info" as const,
        occurredAt: item.preparedAt ?? item.submittedAt,
      };
    case "Completed":
      return {
        type: "acknowledged" as const,
        title: "Accounting transfer acknowledged",
        description: `${item.transferId} was accepted for ${item.payrollReference ?? item.payrollResultId}.`,
        tone: "success" as const,
        icon: "check" as const,
        occurredAt: item.completedAt ?? item.submittedAt,
      };
    case "Awaiting Acknowledgement":
      return {
        type: "pending" as const,
        title: "Accounting transfer submitted",
        description: `${item.transferId} is awaiting acknowledgement from the Accounting adapter.`,
        tone: "warning" as const,
        icon: "clock" as const,
        occurredAt: item.submittedAt,
      };
    case "Not Received":
      return {
        type: "failed" as const,
        title: "Accounting acknowledgement not received",
        description: item.issueSummary ?? `${item.transferId} has not been acknowledged by the Accounting adapter.`,
        tone: "warning" as const,
        icon: "clock" as const,
        occurredAt: item.submittedAt,
      };
    case "Rejected":
      return {
        type: "rejected" as const,
        title: "Accounting acknowledgement rejected",
        description: item.issueSummary ?? `${item.transferId} was rejected by the Accounting adapter.`,
        tone: "danger" as const,
        icon: "warning" as const,
        occurredAt: item.completedAt ?? item.submittedAt,
      };
    case "Failed":
      return {
        type: "failed" as const,
        title: "Accounting transfer failed",
        description: item.issueSummary ?? `${item.transferId} requires technical follow-up.`,
        tone: "danger" as const,
        icon: "warning" as const,
        occurredAt: item.completedAt ?? item.submittedAt,
      };
    default:
      return {
        type: "submitted" as const,
        title: "Accounting transfer submitted",
        description: `${item.transferId} is recorded in Accounting transaction history.`,
        tone: "info" as const,
        icon: "info" as const,
        occurredAt: item.submittedAt,
      };
  }
}

function buildRecentActivity(
  records: readonly AccountingTransactionHistoryItem[],
): AccountingDashboardActivity[] {
  return records.slice(0, recentActivityLimit).map((item) => {
    const presentation = getActivityPresentation(item);

    return {
      id: `${item.transferId}:${presentation.type}:${presentation.occurredAt}`,
      type: presentation.type,
      title: presentation.title,
      description: presentation.description,
      occurredAt: presentation.occurredAt,
      transferId: item.transferId,
      payrollResultId: item.payrollResultId,
      tone: presentation.tone,
      icon: presentation.icon,
    };
  });
}

function buildAlerts(
  readyForTransfer: number,
  awaitingAcknowledgement: number,
  integrationIssues: number,
): AccountingDashboardAlert[] {
  const alerts: AccountingDashboardAlert[] = [];

  if (integrationIssues > 0) {
    alerts.push({
      id: "accounting-integration-issues",
      severity: "error",
      message: `${integrationIssues} Accounting transfer${integrationIssues === 1 ? " requires" : "s require"} technical follow-up.`,
      href: "/accounting/integration-status",
    });
  }

  if (awaitingAcknowledgement > 0) {
    alerts.push({
      id: "accounting-awaiting-acknowledgement",
      severity: "warning",
      message: `${awaitingAcknowledgement} Accounting transfer${awaitingAcknowledgement === 1 ? " is" : "s are"} awaiting acknowledgement.`,
      href: "/accounting/integration-status",
    });
  }

  if (readyForTransfer > 0) {
    alerts.push({
      id: "accounting-ready-for-transfer",
      severity: "info",
      message: `${readyForTransfer} completed Payroll Result${readyForTransfer === 1 ? " is" : "s are"} ready for Accounting transfer.`,
      href: "/accounting/approved-payroll",
    });
  }

  return alerts;
}

function buildHealth(
  approvedData: Awaited<ReturnType<typeof getAccountingApprovedPayrollData>>,
  historyData: Awaited<ReturnType<typeof getAccountingTransactionHistoryData>>,
): AccountingDashboardHealthItem[] {
  const latestPayrollUpdatedAt = approvedData.records
    .map((record) => record.updatedAt)
    .sort((left, right) => right.localeCompare(left))[0] ?? null;
  const latestTransfer = historyData.records[0];
  const hasIssues = historyData.summary.failedOrRejected > 0;
  const hasPending = historyData.summary.awaitingAcknowledgement > 0;

  return [
    {
      name: "Existing Payroll System",
      detail: "Read-only Payroll Result source.",
      status: approvedData.summary.approvedPayroll > 0
        ? "Available"
        : "No Payroll Results",
      tone: approvedData.summary.approvedPayroll > 0 ? "info" : "muted",
      lastEventAt: latestPayrollUpdatedAt,
    },
    {
      name: "Accounting Integration Service",
      detail: latestTransfer
        ? `Provider: ${latestTransfer.provider}.`
        : "No Accounting transfer has been recorded.",
      status: latestTransfer ? "Operational" : "Ready",
      tone: latestTransfer ? "success" : "muted",
      lastEventAt: latestTransfer?.submittedAt ?? null,
    },
    {
      name: "Existing Accounting System",
      detail: "External destination; no live Accounting API is configured.",
      status: hasIssues
        ? "Requires attention"
        : hasPending
          ? "Awaiting acknowledgement"
          : historyData.summary.successfulTransfers > 0
            ? "Acknowledgements received"
            : "No transfer recorded",
      tone: hasIssues
        ? "danger"
        : hasPending
          ? "warning"
          : historyData.summary.successfulTransfers > 0
            ? "success"
            : "muted",
      lastEventAt: latestTransfer?.completedAt ?? latestTransfer?.submittedAt ?? null,
    },
    {
      name: "Last synchronization",
      detail: latestTransfer
        ? "Latest persisted Accounting transfer event."
        : "No persisted Accounting transfer event yet.",
      status: latestTransfer ? "Recorded" : "No activity",
      tone: latestTransfer ? "info" : "muted",
      lastEventAt: latestTransfer?.completedAt ?? latestTransfer?.submittedAt ?? null,
    },
  ];
}

export async function getAccountingDashboardData(): Promise<AccountingDashboardData> {
  const [approvedData, historyData] = await Promise.all([
    getAccountingApprovedPayrollData({
      search: "",
      periodStart: null,
      resultStatus: null,
      readinessStatus: null,
      transferStatus: null,
      page: 1,
      pageSize: dashboardSourcePageSize,
    }),
    getAccountingTransactionHistoryData({
      search: "",
      periodStart: null,
      transferStatus: null,
      acknowledgementStatus: null,
      page: 1,
      pageSize: dashboardSourcePageSize,
    }),
  ]);
  const historyByPayrollResultId = new Map(
    historyData.records.map((record) => [record.payrollResultId, record]),
  );
  const dashboardPayrolls = approvedData.records.map((record) => (
    toDashboardPayroll(record, historyByPayrollResultId.get(record.payrollResultId))
  ));
  const latestApprovedPayroll = dashboardPayrolls.find((record) => (
    record.payrollStatus === "completed"
    && record.readinessStatus === "ready"
  )) ?? null;
  const summary = {
    approvedPayroll: approvedData.summary.approvedPayroll,
    readyForTransfer: approvedData.summary.readyForTransfer,
    successfullyTransferred: historyData.summary.successfulTransfers,
    integrationIssues: historyData.summary.failedOrRejected,
  };
  return {
    summary,
    latestApprovedPayroll,
    recentPayrolls: dashboardPayrolls.slice(0, recentPayrollLimit),
    integrationFlow: buildIntegrationFlow(latestApprovedPayroll),
    recentActivity: buildRecentActivity(historyData.records),
    alerts: buildAlerts(
      summary.readyForTransfer,
      historyData.summary.awaitingAcknowledgement,
      summary.integrationIssues,
    ),
    health: buildHealth(approvedData, historyData),
    providerNote: accountingIntegrationProviderNote,
  };
}

export { buildIntegrationFlow, determineAccountingDashboardStatus };
