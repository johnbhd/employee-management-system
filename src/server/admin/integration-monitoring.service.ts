import "server-only";

import {
  listAttendanceForMonitoring,
  type StoredQrAttendanceRecord,
} from "@/server/repositories/attendance/attendance.repository";
import { listEmployees } from "@/server/repositories/employees/employee.repository";
import { listEmployeeScheduleReferences } from "@/server/repositories/employee-schedules/employee-schedule.repository";
import { listAccountingTransfers } from "@/server/repositories/accounting-transfers/accounting-transfer.repository";
import { listPayrollHandoffs } from "@/server/repositories/payroll-handoffs/payroll-handoff.repository";
import { listPayrollResults } from "@/server/repositories/payroll-results/payroll-result.repository";
import { accountingIntegrationProviderNote } from "@/server/accounting/accounting-integration.adapter";
import { payrollIntegrationProviderNote } from "@/server/payroll/integration/payroll-integration-adapter";
import type { AccountingTransferRecord } from "@/types/accounting-transfers";
import type { PayrollResultRecord } from "@/types/payroll-results";
import type { PayrollStoredHandoff } from "@/server/repositories/payroll-handoffs/payroll-handoff.repository";
import type {
  AdminIntegrationActivity,
  AdminIntegrationFlowNode,
  AdminIntegrationHealth,
  AdminIntegrationIssue,
  AdminIntegrationMonitoringData,
  AdminIntegrationStatus,
} from "@/types/admin-integration-monitoring";

const activityLimit = 30;
const issueLimit = 50;

function latestTimestamp(values: Array<string | null | undefined>) {
  return values
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => right.localeCompare(left))[0] ?? null;
}

function attendanceTimestamp(record: StoredQrAttendanceRecord) {
  return record.updatedAt.toDate().toISOString();
}

function hasPayrollHandoffFailure(handoff: PayrollStoredHandoff) {
  return handoff.transferStatus === "failed"
    || handoff.acknowledgementStatus === "rejected";
}

function hasPayrollHandoffPending(handoff: PayrollStoredHandoff) {
  return handoff.transferStatus === "preparing"
    || handoff.transferStatus === "submitting"
    || (handoff.transferStatus === "submitted"
      && handoff.acknowledgementStatus !== "accepted");
}

function hasPayrollHandoffSuccess(handoff: PayrollStoredHandoff) {
  return handoff.transferStatus === "submitted"
    && handoff.acknowledgementStatus === "accepted";
}

function hasPayrollResultFailure(result: PayrollResultRecord) {
  return result.status === "failed"
    || result.status === "rejected"
    || result.failedCount > 0;
}

function hasPayrollResultPending(result: PayrollResultRecord) {
  return result.status === "processing" || result.pendingCount > 0;
}

function hasAccountingFailure(transfer: AccountingTransferRecord) {
  return transfer.transferStatus === "failed"
    || transfer.acknowledgementStatus === "rejected";
}

function hasAccountingPending(transfer: AccountingTransferRecord) {
  return transfer.transferStatus === "preparing"
    || transfer.transferStatus === "submitting"
    || (transfer.transferStatus === "submitted"
      && transfer.acknowledgementStatus !== "accepted");
}

function hasAccountingSuccess(transfer: AccountingTransferRecord) {
  return transfer.transferStatus === "submitted"
    && transfer.acknowledgementStatus === "accepted";
}

function healthTone(health: AdminIntegrationHealth) {
  if (health === "healthy") return "success" as const;
  if (health === "failed") return "danger" as const;
  if (health === "degraded" || health === "pending") return "warning" as const;
  if (health === "unknown") return "info" as const;
  return "muted" as const;
}

function healthLabel(health: AdminIntegrationHealth) {
  switch (health) {
    case "not_configured":
      return "Not Configured";
    case "unknown":
      return "Unknown";
    case "healthy":
      return "Healthy";
    case "degraded":
      return "Degraded";
    case "pending":
      return "Pending";
    default:
      return "Failed";
  }
}

function integrationStatus(input: {
  key: string;
  name: string;
  category: AdminIntegrationStatus["category"];
  icon: AdminIntegrationStatus["icon"];
  health: AdminIntegrationHealth;
  mode: AdminIntegrationStatus["mode"];
  provider: string | null;
  detail: string;
  pendingCount?: number;
  issueCount?: number;
  lastSuccessfulAt?: string | null;
  lastFailureAt?: string | null;
  detailHref: string | null;
}): AdminIntegrationStatus {
  return {
    ...input,
    pendingCount: input.pendingCount ?? 0,
    issueCount: input.issueCount ?? 0,
    lastSuccessfulAt: input.lastSuccessfulAt ?? null,
    lastFailureAt: input.lastFailureAt ?? null,
  };
}

function buildPayrollHandoffIssues(
  handoffs: readonly PayrollStoredHandoff[],
): AdminIntegrationIssue[] {
  return handoffs
    .filter(hasPayrollHandoffFailure)
    .map((handoff) => ({
      id: `payroll-handoff:${handoff.transferId}`,
      integrationKey: "payroll-handoff",
      integrationName: "Payroll Handoff",
      affectedRecordType: "Payroll batch",
      affectedRecordId: handoff.batchId,
      reference: handoff.externalReference ?? handoff.transferId,
      severity: handoff.acknowledgementStatus === "rejected" ? "error" : "critical",
      status: "open",
      summary: handoff.failureSummary
        ?? "The Payroll handoff failed and requires technical follow-up.",
      detectedAt: handoff.failedAt ?? handoff.updatedAt,
      lastAttemptAt: handoff.updatedAt,
      retrySupported: false,
      detailHref: "/admin/payroll-integration",
    }));
}

function buildPayrollResultIssues(
  results: readonly PayrollResultRecord[],
): AdminIntegrationIssue[] {
  return results
    .filter(hasPayrollResultFailure)
    .map((result) => ({
      id: `payroll-result:${result.resultId}`,
      integrationKey: "payroll-results",
      integrationName: "Payroll Results",
      affectedRecordType: "Payroll result",
      affectedRecordId: result.resultId,
      reference: result.externalPayrollReference,
      severity: result.status === "failed" ? "critical" : "error",
      status: "open",
      summary: result.status === "failed"
        ? "The Payroll result integration failed."
        : "The Payroll result contains rejected or failed processing records.",
      detectedAt: result.completedAt ?? result.processedAt ?? result.receivedAt,
      lastAttemptAt: result.updatedAt,
      retrySupported: false,
      detailHref: "/admin/payroll-integration",
    }));
}

function buildAccountingIssues(
  transfers: readonly AccountingTransferRecord[],
): AdminIntegrationIssue[] {
  return transfers
    .filter(hasAccountingFailure)
    .map((transfer) => ({
      id: `accounting-transfer:${transfer.transferId}`,
      integrationKey: "accounting",
      integrationName: "Accounting Transfer",
      affectedRecordType: "Accounting transfer",
      affectedRecordId: transfer.transferId,
      reference: transfer.externalAccountingReference ?? transfer.transferId,
      severity: transfer.acknowledgementStatus === "rejected" ? "error" : "critical",
      status: "open",
      summary: transfer.failureSummary
        ?? "The Accounting transfer failed and requires technical follow-up.",
      detectedAt: transfer.failedAt ?? transfer.updatedAt,
      lastAttemptAt: transfer.updatedAt,
      retrySupported: false,
      detailHref: "/admin/accounting-integration",
    }));
}

function buildPayrollActivities(
  handoffs: readonly PayrollStoredHandoff[],
  results: readonly PayrollResultRecord[],
) {
  const activities: AdminIntegrationActivity[] = [];

  for (const handoff of handoffs) {
    const successful = hasPayrollHandoffSuccess(handoff);
    const failed = hasPayrollHandoffFailure(handoff);
    activities.push({
      id: `payroll-handoff:${handoff.transferId}:${handoff.updatedAt}`,
      integrationKey: "payroll-handoff",
      integrationName: "Payroll Handoff",
      summary: successful
        ? "Payroll handoff acknowledged"
        : failed
          ? "Payroll handoff failed"
          : "Payroll handoff submitted",
      reference: handoff.externalReference ?? handoff.transferId,
      status: successful ? "success" : failed ? "failed" : "pending",
      occurredAt: successful
        ? handoff.acknowledgedAt ?? handoff.updatedAt
        : handoff.failedAt ?? handoff.updatedAt,
    });
  }

  for (const result of results) {
    const failed = hasPayrollResultFailure(result);
    const pending = hasPayrollResultPending(result);
    activities.push({
      id: `payroll-result:${result.resultId}:${result.updatedAt}`,
      integrationKey: "payroll-results",
      integrationName: "Payroll Results",
      summary: failed
        ? "Payroll result requires attention"
        : pending
          ? "Payroll result is still processing"
          : "Payroll result received",
      reference: result.externalPayrollReference,
      status: failed ? "failed" : pending ? "pending" : "success",
      occurredAt: result.completedAt ?? result.processedAt ?? result.receivedAt,
    });
  }

  return activities;
}

function buildAccountingActivities(
  transfers: readonly AccountingTransferRecord[],
) {
  return transfers.map((transfer) => {
    const successful = hasAccountingSuccess(transfer);
    const failed = hasAccountingFailure(transfer);
    return {
      id: `accounting:${transfer.transferId}:${transfer.updatedAt}`,
      integrationKey: "accounting",
      integrationName: "Accounting Transfer",
      summary: successful
        ? "Accounting acknowledgement received"
        : failed
          ? "Accounting transfer failed"
          : "Accounting transfer submitted",
      reference: transfer.externalAccountingReference ?? transfer.transferId,
      status: successful ? "success" : failed ? "failed" : "pending",
      occurredAt: successful
        ? transfer.acknowledgedAt ?? transfer.updatedAt
        : transfer.failedAt ?? transfer.updatedAt,
    } satisfies AdminIntegrationActivity;
  });
}

function buildAttendanceActivities(
  records: readonly { id: string; record: StoredQrAttendanceRecord }[],
) {
  return records
    .filter(({ record }) => record.timeInSource === "QR")
    .map(({ id, record }) => ({
      id: `qr:${id}:${attendanceTimestamp(record)}`,
      integrationKey: "qr-attendance",
      integrationName: "QR Attendance",
      summary: "QR attendance write recorded",
      reference: id,
      status: "success" as const,
      occurredAt: attendanceTimestamp(record),
    } satisfies AdminIntegrationActivity));
}

function buildFlow(
  integrations: readonly AdminIntegrationStatus[],
): AdminIntegrationFlowNode[] {
  const byKey = new Map(integrations.map((item) => [item.key, item]));
  const sourceHealth = byKey.get("hrps")?.health === "healthy"
    && byKey.get("qr-attendance")?.health === "healthy"
    ? "healthy"
    : byKey.get("bundy")?.health === "not_configured"
      ? "degraded"
      : "unknown";
  const flowItem = (
    key: string,
    label: string,
    detail: string,
    icon: AdminIntegrationFlowNode["icon"],
    health: AdminIntegrationHealth,
  ): AdminIntegrationFlowNode => ({
    key,
    label,
    detail,
    icon,
    status: healthLabel(health),
    tone: healthTone(health),
  });

  return [
    flowItem(
      "sources",
      "Source systems",
      "HRPS, Bundy, and QR",
      "layers",
      sourceHealth,
    ),
    flowItem(
      "attendance",
      "Unified Attendance",
      "Persisted attendance records",
      "unified",
      byKey.get("unified-attendance")?.health ?? "unknown",
    ),
    flowItem(
      "payroll",
      "Payroll integration",
      "Handoff and returned results",
      "payroll",
      byKey.get("payroll-handoff")?.health === "failed"
        || byKey.get("payroll-results")?.health === "failed"
        ? "failed"
        : byKey.get("payroll-handoff")?.health === "pending"
          || byKey.get("payroll-results")?.health === "pending"
          ? "pending"
          : byKey.get("payroll-handoff")?.health ?? "unknown",
    ),
    flowItem(
      "accounting",
      "Accounting transfer",
      "Transfer and acknowledgement",
      "accounting",
      byKey.get("accounting")?.health ?? "unknown",
    ),
  ];
}

function determineOverallHealth(
  integrations: readonly AdminIntegrationStatus[],
): AdminIntegrationHealth {
  const configured = integrations.filter((item) => item.mode !== "not_configured");

  if (configured.some((item) => item.health === "failed")) return "failed";
  if (configured.some((item) => item.health === "degraded")) return "degraded";
  if (configured.some((item) => item.health === "pending")) return "pending";
  if (configured.length === 0 || configured.some((item) => item.health === "unknown")) {
    return "unknown";
  }

  return "healthy";
}

function statusForOperationalRecords(input: {
  pendingCount: number;
  issueCount: number;
  successfulCount: number;
  noActivityDetail: string;
}) {
  if (input.issueCount > 0) {
    return {
      health: "failed" as const,
      detail: "Persisted technical failures require follow-up.",
    };
  }
  if (input.pendingCount > 0) {
    return {
      health: "pending" as const,
      detail: "Persisted operations are awaiting completion or acknowledgement.",
    };
  }
  if (input.successfulCount > 0) {
    return {
      health: "healthy" as const,
      detail: "Recent persisted operations completed without a technical failure.",
    };
  }
  return {
    health: "unknown" as const,
    detail: input.noActivityDetail,
  };
}

export async function getAdminIntegrationMonitoringData(): Promise<AdminIntegrationMonitoringData> {
  const [employees, schedules, attendance, handoffs, results, transfers] = await Promise.all([
    listEmployees(),
    listEmployeeScheduleReferences(),
    listAttendanceForMonitoring(),
    listPayrollHandoffs(),
    listPayrollResults(),
    listAccountingTransfers(),
  ]);

  const qrAttendance = attendance.filter(({ record }) => record.timeInSource === "QR");
  const qrLatest = latestTimestamp(qrAttendance.map(({ record }) => attendanceTimestamp(record)));
  const attendanceLatest = latestTimestamp(attendance.map(({ record }) => attendanceTimestamp(record)));

  const handoffPending = handoffs.filter(hasPayrollHandoffPending).length;
  const handoffIssues = handoffs.filter(hasPayrollHandoffFailure).length;
  const handoffSuccesses = handoffs.filter(hasPayrollHandoffSuccess);
  const handoffStatus = statusForOperationalRecords({
    pendingCount: handoffPending,
    issueCount: handoffIssues,
    successfulCount: handoffSuccesses.length,
    noActivityDetail: "No Payroll handoff has been persisted; no failure is inferred.",
  });

  const resultPending = results.filter(hasPayrollResultPending).length;
  const resultIssues = results.filter(hasPayrollResultFailure).length;
  const completedResults = results.filter((result) => (
    result.status === "completed" || result.status === "completed_with_issues"
  ));
  const resultStatus = statusForOperationalRecords({
    pendingCount: resultPending,
    issueCount: resultIssues,
    successfulCount: completedResults.length,
    noActivityDetail: "No Payroll result has been persisted; no failure is inferred.",
  });

  const accountingPending = transfers.filter(hasAccountingPending).length;
  const accountingIssues = transfers.filter(hasAccountingFailure).length;
  const acceptedTransfers = transfers.filter(hasAccountingSuccess);
  const accountingStatus = statusForOperationalRecords({
    pendingCount: accountingPending,
    issueCount: accountingIssues,
    successfulCount: acceptedTransfers.length,
    noActivityDetail: "No Accounting transfer has been persisted; no failure is inferred.",
  });

  const integrations = [
    integrationStatus({
      key: "hrps",
      name: "HRPS Employee Data",
      category: "employee-data",
      icon: "hrps",
      health: employees.length > 0 ? "healthy" : "unknown",
      mode: "local",
      provider: "Firestore employee and schedule repositories",
      detail: employees.length > 0
        ? `${employees.length} employee reference${employees.length === 1 ? "" : "s"} and ${schedules.length} schedule reference${schedules.length === 1 ? "" : "s"} loaded.`
        : "No employee reference records are available.",
      lastSuccessfulAt: null,
      detailHref: "/admin/hrps-integration",
    }),
    integrationStatus({
      key: "bundy",
      name: "Bundy / Biometric ETL",
      category: "attendance",
      icon: "bundy",
      health: "not_configured",
      mode: "not_configured",
      provider: null,
      detail: "No Bundy ingestion adapter or persisted Bundy log repository is configured.",
      detailHref: "/admin/bundy-biometric-etl",
    }),
    integrationStatus({
      key: "qr-attendance",
      name: "QR Attendance",
      category: "attendance",
      icon: "qr",
      health: qrAttendance.length > 0 ? "healthy" : "unknown",
      mode: "local",
      provider: "Firestore attendance repository",
      detail: qrAttendance.length > 0
        ? `${qrAttendance.length} persisted QR attendance write${qrAttendance.length === 1 ? "" : "s"} available.`
        : "No QR attendance write has been recorded; no failure is inferred.",
      lastSuccessfulAt: qrLatest,
      detailHref: "/admin/qr-attendance",
    }),
    integrationStatus({
      key: "unified-attendance",
      name: "Unified Attendance",
      category: "attendance",
      icon: "unified",
      health: attendance.length > 0 ? "healthy" : "unknown",
      mode: "local",
      provider: "Firestore attendance repository",
      detail: attendance.length > 0
        ? `${attendance.length} persisted attendance record${attendance.length === 1 ? "" : "s"} available.`
        : "No attendance record is available; no failure is inferred.",
      lastSuccessfulAt: attendanceLatest,
      detailHref: "/admin/unified-attendance",
    }),
    integrationStatus({
      key: "payroll-handoff",
      name: "Payroll Handoff",
      category: "payroll",
      icon: "payroll",
      health: handoffStatus.health,
      mode: "simulated",
      provider: handoffs[0]?.provider ?? "simulated-payroll-adapter",
      detail: handoffStatus.detail,
      pendingCount: handoffPending,
      issueCount: handoffIssues,
      lastSuccessfulAt: latestTimestamp(handoffSuccesses.map((item) => item.acknowledgedAt)),
      lastFailureAt: latestTimestamp(handoffs.filter(hasPayrollHandoffFailure).map((item) => item.failedAt ?? item.updatedAt)),
      detailHref: "/admin/payroll-integration",
    }),
    integrationStatus({
      key: "payroll-results",
      name: "Payroll Results",
      category: "payroll",
      icon: "payroll",
      health: resultStatus.health,
      mode: "simulated",
      provider: results[0]?.provider ?? "simulated-payroll-adapter",
      detail: resultStatus.detail,
      pendingCount: resultPending,
      issueCount: resultIssues,
      lastSuccessfulAt: latestTimestamp(completedResults.map((item) => item.completedAt ?? item.processedAt)),
      lastFailureAt: latestTimestamp(results.filter(hasPayrollResultFailure).map((item) => item.updatedAt)),
      detailHref: "/admin/payroll-integration",
    }),
    integrationStatus({
      key: "accounting",
      name: "Accounting Transfer & Acknowledgement",
      category: "accounting",
      icon: "accounting",
      health: accountingStatus.health,
      mode: "simulated",
      provider: transfers[0]?.provider ?? "simulated-accounting-adapter",
      detail: accountingStatus.detail,
      pendingCount: accountingPending,
      issueCount: accountingIssues,
      lastSuccessfulAt: latestTimestamp(acceptedTransfers.map((item) => item.acknowledgedAt)),
      lastFailureAt: latestTimestamp(transfers.filter(hasAccountingFailure).map((item) => item.failedAt ?? item.updatedAt)),
      detailHref: "/admin/accounting-integration",
    }),
  ];

  const issues = [
    ...buildPayrollHandoffIssues(handoffs),
    ...buildPayrollResultIssues(results),
    ...buildAccountingIssues(transfers),
  ]
    .sort((left, right) => right.detectedAt.localeCompare(left.detectedAt))
    .slice(0, issueLimit);
  const activities = [
    ...buildPayrollActivities(handoffs, results),
    ...buildAccountingActivities(transfers),
    ...buildAttendanceActivities(attendance),
  ]
    .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))
    .slice(0, activityLimit);
  const configured = integrations.filter((item) => item.mode !== "not_configured");

  return {
    summary: {
      configuredIntegrations: configured.length,
      healthyIntegrations: configured.filter((item) => item.health === "healthy").length,
      pendingOperations: integrations.reduce((total, item) => total + item.pendingCount, 0),
      integrationIssues: integrations.reduce((total, item) => total + item.issueCount, 0),
      overallHealth: determineOverallHealth(integrations),
      lastSuccessfulAt: latestTimestamp(integrations.map((item) => item.lastSuccessfulAt)),
    },
    integrations,
    flow: buildFlow(integrations),
    activities,
    issues,
    providerNote: `${payrollIntegrationProviderNote} ${accountingIntegrationProviderNote}`,
  };
}

export { healthLabel, healthTone };
