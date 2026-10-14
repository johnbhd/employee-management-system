"use client";

import { useCallback, useState } from "react";

import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { SummaryCard } from "@/components/ui/SummaryCard";
import type { ApiResponse } from "@/types/api/responses";
import type { Metric } from "@/types/ui";
import type { PayrollDashboardData } from "@/types/payroll-dashboard";

import { PayrollDashboardRefreshButton } from "./PayrollDashboardRefreshButton";
import { PayrollHandoffAlerts } from "./PayrollHandoffAlerts";
import { PayrollReadinessTable } from "./PayrollReadinessTable";
import { PayrollRecentBatches } from "./PayrollRecentBatches";

type PayrollDashboardApiResponse = ApiResponse<PayrollDashboardData>;

export function PayrollDashboardPage({
  dataLoadError,
  initialData,
}: {
  dataLoadError: boolean;
  initialData: PayrollDashboardData | null;
}) {
  const [data, setData] = useState(initialData);
  const [error, setError] = useState(
    dataLoadError ? "Payroll dashboard data could not be loaded." : null,
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshData = useCallback(async () => {
    if (isRefreshing) {
      return;
    }

    setIsRefreshing(true);

    try {
      const response = await fetch("/api/payroll/dashboard", {
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });
      const body = await response.json() as PayrollDashboardApiResponse;

      if (!response.ok || !body.success) {
        throw new Error(getDashboardErrorMessage(response.status, body));
      }

      setData(body.data);
      setError(null);
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "Payroll dashboard data could not be loaded.",
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  const summaryMetrics = getSummaryMetrics(data);

  return (
    <div className="payroll-dashboard" aria-busy={isRefreshing}>
      <AdminPageHeader
        eyebrow="Payroll operations"
        title="Payroll Dashboard"
        description="Monitor verified attendance, payroll handoff readiness, transfer progress, and payroll integration activity."
        actions={(
          <PayrollDashboardRefreshButton
            isRefreshing={isRefreshing}
            onRefresh={() => void refreshData()}
          />
        )}
      />

      {error ? (
        <p className="payroll-dashboard__data-error" role="alert">
          {data
            ? `${error} Showing the last successful dashboard data.`
            : `${error} Use Refresh data to try again.`}
        </p>
      ) : null}

      <div className="metric-grid payroll-dashboard__summary">
        {summaryMetrics.map((metric) => <SummaryCard key={metric.label} {...metric} />)}
      </div>

      <SectionCard
        title="Verified Attendance Ready for Payroll"
        eyebrow="Payroll readiness"
        className="payroll-dashboard__readiness"
      >
        <p className="payroll-dashboard__section-note">
          Only HR-verified attendance records that meet payroll readiness checks are shown here.
        </p>
        <PayrollReadinessTable records={data?.readiness ?? []} />
      </SectionCard>

      <div className="payroll-dashboard__split">
        <SectionCard
          title="Recent Payroll Batches"
          eyebrow="Batch activity"
          className="payroll-dashboard__batches"
        >
          <p className="payroll-dashboard__section-note">
            Recent preparation batches and their current transfer status.
          </p>
          <PayrollRecentBatches batches={data?.recentBatches ?? []} />
        </SectionCard>

        <SectionCard
          title="Transfer Issues & Follow-up"
          eyebrow="Payroll alerts"
          className="payroll-dashboard__alerts-card"
        >
          <p className="payroll-dashboard__section-note">
            Items that require attention before or after payroll handoff.
          </p>
          <PayrollHandoffAlerts alerts={data?.alerts ?? []} />
        </SectionCard>
      </div>

    </div>
  );
}

function getSummaryMetrics(data: PayrollDashboardData | null): Metric[] {
  if (!data) {
    return [
      {
        label: "Verified attendance",
        value: "—",
        note: "Unavailable",
        icon: "check",
        tone: "success",
      },
      {
        label: "Ready for handoff",
        value: "—",
        note: "Unavailable",
        icon: "users",
        tone: "info",
      },
      {
        label: "Pending / blocked",
        value: "—",
        note: "Unavailable",
        icon: "clock",
        tone: "warning",
      },
      {
        label: "Transferred",
        value: "—",
        note: "Unavailable",
        icon: "arrow",
        tone: "success",
      },
      {
        label: "Transfer issues",
        value: "—",
        note: "Unavailable",
        icon: "warning",
        tone: "danger",
      },
      {
        label: "Current payroll period",
        value: "—",
        note: "Unavailable",
        icon: "calendar",
        tone: "muted",
      },
    ];
  }

  const { metrics, period } = data;

  return [
    {
      label: "Verified attendance",
      value: String(metrics.verifiedAttendance),
      note: "Final HR verification records",
      icon: "check",
      tone: "success",
    },
    {
      label: "Ready for handoff",
      value: String(metrics.readyForHandoff),
      note: "Requires final HR verification",
      icon: "users",
      tone: "info",
    },
    {
      label: "Pending / blocked",
      value: String(metrics.blocked),
      note: metrics.blocked === 0
        ? "No incomplete or pending correction records"
        : "Incomplete or pending correction records",
      icon: "clock",
      tone: "warning",
    },
    {
      label: "Transferred",
      value: String(metrics.transferred),
      note: "Persisted Payroll handoff records",
      icon: "arrow",
      tone: "success",
    },
    {
      label: "Transfer issues",
      value: String(metrics.transferIssues),
      note: "Persisted handoff failures",
      icon: "warning",
      tone: "danger",
    },
    {
      label: "Current payroll period",
      value: period.label,
      note: "Derived from the Asia/Manila date",
      icon: "calendar",
      tone: "muted",
    },
  ];
}

function getDashboardErrorMessage(
  status: number,
  body: PayrollDashboardApiResponse,
) {
  if (status === 401) {
    return "Your Payroll session has expired. Sign in again.";
  }

  if (status === 403) {
    return "You do not have permission to view the Payroll Dashboard.";
  }

  if (!body.success && body.error.message) {
    return body.error.message;
  }

  return "Payroll dashboard data could not be loaded.";
}
