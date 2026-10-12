"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { ActionButton } from "@/components/ui/ActionButton";
import { Icon } from "@/components/ui/Icon";
import { SectionCard } from "@/components/ui/SectionCard";
import { SummaryCard } from "@/components/ui/SummaryCard";
import { apiRequest } from "@/lib/api/client";
import type { ApiSuccessResponse } from "@/types/api/responses";
import type { AccountingDashboardData } from "@/types/accounting-dashboard";
import type { Metric } from "@/types/ui";

import { AccountingIntegrationFlow } from "./AccountingIntegrationFlow";
import { IntegrationHealth } from "./IntegrationHealth";
import { LatestApprovedPayroll } from "./LatestApprovedPayroll";
import { RecentAccountingActivity } from "./RecentAccountingActivity";
import { RecentPayrollBatches } from "./RecentPayrollBatches";

type AccountingDashboardApiResponse = ApiSuccessResponse<AccountingDashboardData>;

export function AccountingDashboardPage({
  initialData,
  loadError: initialLoadError,
}: {
  initialData: AccountingDashboardData | null;
  loadError: boolean;
}) {
  const [data, setData] = useState(initialData);
  const [error, setError] = useState(
    initialLoadError ? "Accounting dashboard data could not be loaded." : null,
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshData = useCallback(async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);

    try {
      const response = await apiRequest<AccountingDashboardApiResponse>(
        "/api/v1/accounting/dashboard",
        { cache: "no-store" },
      );
      setData(response.data);
      setError(null);
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "Accounting dashboard data could not be loaded.",
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  const summaryMetrics = getSummaryMetrics(data);

  return (
    <div
      className={`accounting-dashboard${isRefreshing ? " is-loading" : ""}`}
      aria-busy={isRefreshing}
    >
      <AdminPageHeader
        eyebrow="Accounting integration"
        title="Accounting Dashboard"
        description="Review approved payroll information and monitor transfers to the Existing Accounting System."
        actions={(
          <ActionButton
            icon="refresh"
            action="Accounting dashboard data refreshed."
            onAction={() => void refreshData()}
          >
            Refresh data
          </ActionButton>
        )}
      />

      {error ? (
        <div className="accounting-dashboard__load-error" role="alert">
          <Icon name="warning" />
          <span>
            {data
              ? `${error} Showing the last successful dashboard data.`
              : `${error} Use Refresh data to try again.`}
          </span>
          <button type="button" className="button-link" onClick={() => void refreshData()}>
            Try again
          </button>
        </div>
      ) : null}

      {data?.alerts.length ? (
        <div className="accounting-dashboard__alerts" aria-label="Accounting dashboard alerts">
          {data.alerts.map((alert) => (
            <Link
              href={alert.href}
              className={`accounting-dashboard__alert is-${alert.severity}`}
              key={alert.id}
            >
              <Icon
                name={
                  alert.severity === "error"
                    ? "warning"
                    : alert.severity === "warning"
                      ? "clock"
                      : "info"
                }
              />
              <span>{alert.message}</span>
              <Icon name="arrow" />
            </Link>
          ))}
        </div>
      ) : null}

      <div className="metric-grid accounting-dashboard__summary">
        {summaryMetrics.map((metric) => (
          <SummaryCard key={metric.label} {...metric} />
        ))}
      </div>

      <SectionCard
        title="Latest Approved Payroll"
        eyebrow="Incoming from Existing Payroll System"
        className="accounting-dashboard__latest-card"
      >
        <LatestApprovedPayroll payroll={data?.latestApprovedPayroll ?? null} />
      </SectionCard>

      <SectionCard
        title="Accounting Integration Flow"
        eyebrow="Approved payroll to downstream handoff"
        className="accounting-dashboard__flow-card"
      >
        <AccountingIntegrationFlow flow={data?.integrationFlow ?? []} />
      </SectionCard>

      <div className="accounting-dashboard__split">
        <SectionCard
          title="Recent Payroll Batches"
          eyebrow="Approved payroll information"
          className="accounting-dashboard__batches-card"
        >
          <RecentPayrollBatches batches={data?.recentPayrolls ?? []} />
        </SectionCard>

        <SectionCard
          title="Integration Health"
          eyebrow="Current boundary status"
          className="accounting-dashboard__health-card"
        >
          <div className="accounting-dashboard__health-copy">
            <Icon name="info" />
            <p>{data?.providerNote ?? "Accounting integration status is unavailable."}</p>
          </div>
          <IntegrationHealth items={data?.health ?? []} />
        </SectionCard>
      </div>

      <SectionCard
        title="Recent Accounting Activity"
        eyebrow="Latest integration events"
        className="accounting-dashboard__activity-card"
      >
        <RecentAccountingActivity items={data?.recentActivity ?? []} />
      </SectionCard>

      <p className="accounting-dashboard__boundary-note">
        <Icon name="shield" />
        This workspace displays deterministic integration information only. It does not calculate payroll, post journal entries, or write to the Existing Accounting System.
      </p>
    </div>
  );
}

function getSummaryMetrics(data: AccountingDashboardData | null): Metric[] {
  if (!data) {
    return [
      {
        label: "Approved payroll",
        value: "—",
        note: "Unavailable",
        icon: "payroll",
        tone: "info",
      },
      {
        label: "Ready for transfer",
        value: "—",
        note: "Unavailable",
        icon: "arrow",
        tone: "warning",
      },
      {
        label: "Successfully transferred",
        value: "—",
        note: "Unavailable",
        icon: "check",
        tone: "success",
      },
      {
        label: "Integration issues",
        value: "—",
        note: "Unavailable",
        icon: "warning",
        tone: "danger",
      },
    ];
  }

  return [
    {
      label: "Approved payroll",
      value: String(data.summary.approvedPayroll),
      note: "Completed Payroll Results",
      icon: "payroll",
      tone: "info",
    },
    {
      label: "Ready for transfer",
      value: String(data.summary.readyForTransfer),
      note: "Readiness checks passed",
      icon: "arrow",
      tone: "warning",
    },
    {
      label: "Successfully transferred",
      value: String(data.summary.successfullyTransferred),
      note: "Acknowledgement accepted",
      icon: "check",
      tone: "success",
    },
    {
      label: "Integration issues",
      value: String(data.summary.integrationIssues),
      note: data.summary.integrationIssues > 0
        ? "Requires review"
        : "No failed or rejected transfers",
      icon: "warning",
      tone: "danger",
    },
  ];
}
