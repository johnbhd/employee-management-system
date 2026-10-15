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
import { getPrismaIntegrationMonitoringSnapshot } from "@/server/repositories/dashboard/prisma-dashboard.repository";
import { listBundyImports } from "@/server/repositories/bundy/bundy.repository";
import { getUnifiedAttendanceProcessingMonitoringSnapshot } from "@/server/attendance/unified-attendance-processing.service";
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
      detailHref: "/admin/hrps-integration",
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
      detailHref: "/admin/bundy-etl",
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
      detailHref: "/admin/qr-attendance",
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

function bundyStatus(history: Awaited<ReturnType<typeof listBundyImports>>) {
  const latest = history.items[0];
  const failed = history.items.filter((item) => item.status === "FAILED" || item.status === "ROLLBACK_FAILED").length;
  const pending = history.items.filter((item) => item.status === "PROCESSING" || item.status === "ROLLING_BACK").length;
  const successful = history.items.filter((item) => item.status === "COMPLETED").length;
  const withErrors = history.items.filter((item) => item.status === "COMPLETED_WITH_ERRORS").length;

  if (!latest) {
    return {
      health: "unknown" as const,
      detail: "No Bundy CSV import has been confirmed; no failure is inferred.",
      pending,
      issues: failed + withErrors,
      lastSuccess: null,
      lastFailure: null,
    };
  }
  if (failed > 0) {
    return {
      health: "failed" as const,
      detail: "A persisted Bundy import failed and requires technical follow-up.",
      pending,
      issues: failed + withErrors,
      lastSuccess: history.items.find((item) => item.status === "COMPLETED")?.completedAt ?? null,
      lastFailure: latest.completedAt ?? latest.startedAt,
    };
  }
  if (pending > 0) {
    return {
      health: "pending" as const,
      detail: "A Bundy import is still processing.",
      pending,
      issues: withErrors,
      lastSuccess: history.items.find((item) => item.status === "COMPLETED")?.completedAt ?? null,
      lastFailure: null,
    };
  }
  return {
    health: withErrors > 0 ? "degraded" as const : successful > 0 ? "healthy" as const : "unknown" as const,
    detail: withErrors > 0
      ? "Bundy imports completed with validation or source-conflict records requiring review."
      : successful > 0
        ? "Recent Bundy raw-event imports completed without a technical failure."
        : "No Bundy CSV import has been confirmed; no failure is inferred.",
    pending,
    issues: withErrors,
    lastSuccess: history.items.find((item) => item.status === "COMPLETED")?.completedAt ?? null,
    lastFailure: null,
  };
}

function buildBundyActivities(history: Awaited<ReturnType<typeof listBundyImports>>) {
  return history.items.map((item) => ({
    id: `bundy:${item.id}`,
    integrationKey: "bundy",
    integrationName: "Bundy / Biometric ETL",
    summary: item.status === "FAILED" || item.status === "ROLLBACK_FAILED"
      ? "Bundy CSV import failed"
      : item.status === "ROLLING_BACK"
        ? "Bundy import rollback is processing"
        : item.status === "ROLLED_BACK"
          ? "Bundy import was rolled back"
          : item.status === "PROCESSING"
        ? "Bundy CSV import is processing"
        : `Bundy import stored ${item.summary.importedCount} raw event${item.summary.importedCount === 1 ? "" : "s"}`,
    reference: item.id,
    status: item.status === "FAILED" || item.status === "ROLLBACK_FAILED" ? "failed" as const : item.status === "PROCESSING" || item.status === "ROLLING_BACK" ? "pending" as const : "success" as const,
    occurredAt: item.completedAt ?? item.startedAt,
  } satisfies AdminIntegrationActivity));
}

function buildBundyIssues(history: Awaited<ReturnType<typeof listBundyImports>>) {
  return history.items
    .filter((item) => item.status === "FAILED" || item.status === "ROLLBACK_FAILED" || item.status === "ROLLING_BACK" || item.status === "COMPLETED_WITH_ERRORS")
    .map((item) => ({
      id: `bundy:${item.id}`,
      integrationKey: "bundy",
      integrationName: "Bundy / Biometric ETL",
      affectedRecordType: "Bundy import",
      affectedRecordId: item.id,
      reference: item.filename,
      severity: item.status === "FAILED" || item.status === "ROLLBACK_FAILED" ? "critical" as const : "warning" as const,
      status: "open" as const,
      summary: item.rollbackErrorSummary ?? item.errorSummary ?? (item.status === "ROLLING_BACK"
        ? "Bundy import rollback is in progress or needs recovery review."
        : `Bundy import completed with ${item.summary.invalidCount + item.summary.sourceConflictCount} row-level issue(s).`),
      detectedAt: item.completedAt ?? item.startedAt,
      lastAttemptAt: item.completedAt,
      retrySupported: true,
      detailHref: "/admin/bundy-etl",
    } satisfies AdminIntegrationIssue));
}

export async function getAdminIntegrationMonitoringData(): Promise<AdminIntegrationMonitoringData> {
  const [employees, schedules, attendance, handoffs, results, transfers, databaseSnapshot, bundyHistory, unifiedProcessing] = await Promise.all([
    listEmployees(),
    listEmployeeScheduleReferences(),
    listAttendanceForMonitoring(),
    listPayrollHandoffs(),
    listPayrollResults(),
    listAccountingTransfers(),
    getPrismaIntegrationMonitoringSnapshot(),
    listBundyImports(1, 30),
    getUnifiedAttendanceProcessingMonitoringSnapshot(),
  ]);

  const qrAttendance = attendance.filter(({ record }) => record.timeInSource === "QR");
  const qrLatest = databaseSnapshot.attendance.lastActivityAt
    ?? latestTimestamp(qrAttendance.map(({ record }) => attendanceTimestamp(record)));
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
  const bundy = bundyStatus(bundyHistory);
  const unifiedProcessingPending = unifiedProcessing.activeRun
    ? unifiedProcessing.activeRun.pendingItems + unifiedProcessing.activeRun.processingItems
    : 0;
  const unifiedProcessingIssues = unifiedProcessing.failedItems.length + (unifiedProcessing.latestFailure ? 1 : 0);
  const unifiedProcessingHealth = unifiedProcessingIssues > 0
    ? "failed" as const
    : unifiedProcessingPending > 0
      ? "pending" as const
      : unifiedProcessing.latestSuccessfulAt
        ? "healthy" as const
        : "unknown" as const;
  const unifiedProcessingDetail = unifiedProcessingIssues > 0
    ? "One or more persisted processing items failed and require retry."
    : unifiedProcessingPending > 0
      ? "A Unified Attendance processing run is still in progress."
      : unifiedProcessing.latestSuccessfulAt
        ? "The latest Unified Attendance processing run completed successfully."
        : "No Unified Attendance processing run has been completed; no failure is inferred.";

  const integrations = [
    integrationStatus({
      key: "hrps",
      name: "HRPS Employee Data",
      category: "employee-data",
      icon: "hrps",
      health: employees.length > 0 ? "healthy" : "unknown",
      mode: "local",
      provider: "Prisma employee and schedule repositories",
      detail: employees.length > 0
        ? `${employees.length} employee reference${employees.length === 1 ? "" : "s"} and ${schedules.length} schedule reference${schedules.length === 1 ? "" : "s"} loaded.`
        : "No employee reference records are available.",
      lastSuccessfulAt: null,
      detailHref: "/admin/unified-attendance",
    }),
    integrationStatus({
      key: "bundy",
      name: "Bundy / Biometric ETL",
      category: "attendance",
      icon: "bundy",
      health: bundy.health,
      mode: "local",
      provider: "Prisma Bundy raw-event repository",
      detail: bundy.detail,
      pendingCount: bundy.pending,
      issueCount: bundy.issues,
      lastSuccessfulAt: bundy.lastSuccess,
      lastFailureAt: bundy.lastFailure,
      detailHref: "/admin/bundy-etl",
    }),
    integrationStatus({
      key: "qr-attendance",
      name: "QR Attendance",
      category: "attendance",
      icon: "qr",
      health: qrAttendance.length > 0 ? "healthy" : "unknown",
      mode: "local",
      provider: "Prisma attendance repository",
      detail: qrAttendance.length > 0
        ? `${qrAttendance.length} persisted QR attendance write${qrAttendance.length === 1 ? "" : "s"} available.`
        : "No QR attendance write has been recorded; no failure is inferred.",
      lastSuccessfulAt: qrLatest,
      detailHref: "/admin/payroll-integration",
    }),
    integrationStatus({
      key: "unified-attendance",
      name: "Unified Attendance",
      category: "attendance",
      icon: "unified",
      health: unifiedProcessingHealth,
      mode: "local",
      provider: "Unified Attendance processing run service",
      detail: unifiedProcessingDetail,
      pendingCount: unifiedProcessingPending,
      issueCount: unifiedProcessingIssues,
      lastSuccessfulAt: unifiedProcessing.latestSuccessfulAt,
      lastFailureAt: latestTimestamp([
        unifiedProcessing.latestFailure?.detectedAt,
        ...unifiedProcessing.failedItems.map((item) => item.detectedAt),
      ]),
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
    ...buildBundyIssues(bundyHistory),
    ...(unifiedProcessing.latestFailure ? [{
      id: `unified-attendance:run:${unifiedProcessing.latestFailure.id}`,
      integrationKey: "unified-attendance",
      integrationName: "Unified Attendance",
      affectedRecordType: "Processing run",
      affectedRecordId: unifiedProcessing.latestFailure.id,
      reference: unifiedProcessing.latestFailure.id,
      severity: "critical" as const,
      status: "open" as const,
      summary: unifiedProcessing.latestFailure.summary ?? "A Unified Attendance processing run failed.",
      detectedAt: unifiedProcessing.latestFailure.detectedAt,
      lastAttemptAt: unifiedProcessing.latestFailure.detectedAt,
      retrySupported: true,
      detailHref: "/admin/unified-attendance",
    } satisfies AdminIntegrationIssue] : []),
    ...unifiedProcessing.failedItems.map((item) => ({
      id: `unified-attendance:${item.id}`,
      integrationKey: "unified-attendance",
      integrationName: "Unified Attendance",
      affectedRecordType: "Employee/date processing item",
      affectedRecordId: item.employeeReference,
      reference: `${item.employeeReference} / ${item.attendanceDate}`,
      severity: "error" as const,
      status: "open" as const,
      summary: item.errorMessage ?? "Unified Attendance processing failed for this employee/date.",
      detectedAt: item.detectedAt,
      lastAttemptAt: item.detectedAt,
      retrySupported: true,
      detailHref: "/admin/unified-attendance",
    } satisfies AdminIntegrationIssue)),
    ...buildPayrollHandoffIssues(handoffs),
    ...buildPayrollResultIssues(results),
    ...buildAccountingIssues(transfers),
  ]
    .sort((left, right) => right.detectedAt.localeCompare(left.detectedAt))
    .slice(0, issueLimit);
  const activities = [
    ...buildBundyActivities(bundyHistory),
    ...(unifiedProcessing.latestRun ? [{
      id: `unified-attendance:${unifiedProcessing.latestRun.id}`,
      integrationKey: "unified-attendance",
      integrationName: "Unified Attendance",
      summary: unifiedProcessing.latestRun.status === "COMPLETED"
        ? "Unified Attendance processing completed"
        : unifiedProcessing.latestRun.status === "COMPLETED_WITH_ERRORS"
          ? "Unified Attendance processing completed with errors"
          : `Unified Attendance processing is ${unifiedProcessing.latestRun.status.toLowerCase()}`,
      reference: unifiedProcessing.latestRun.id,
      status: unifiedProcessing.latestRun.status === "COMPLETED"
        ? "success" as const
        : unifiedProcessing.latestRun.status === "COMPLETED_WITH_ERRORS" || unifiedProcessing.latestRun.status === "FAILED"
          ? "failed" as const
          : "pending" as const,
      occurredAt: unifiedProcessing.latestRun.completedAt ?? unifiedProcessing.latestRun.startedAt,
    } satisfies AdminIntegrationActivity] : []),
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
