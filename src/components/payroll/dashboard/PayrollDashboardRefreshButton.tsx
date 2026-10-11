"use client";

import { Icon } from "@/components/ui/Icon";

export function PayrollDashboardRefreshButton({
  isRefreshing,
  onRefresh,
}: {
  isRefreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <span className="action-control">
      <button
        type="button"
        className="button-secondary"
        disabled={isRefreshing}
        onClick={onRefresh}
      >
        <Icon name="refresh" />
        {isRefreshing ? "Refreshing…" : "Refresh data"}
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {isRefreshing ? "Refreshing Payroll Dashboard data." : ""}
      </span>
    </span>
  );
}
