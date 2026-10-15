"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { Icon } from "@/components/ui/Icon";
import { SectionCard } from "@/components/ui/SectionCard";
import { SummaryCard } from "@/components/ui/SummaryCard";
import { payrollVerifiedAttendancePageSizes } from "@/server/payroll/payroll-verified-attendance-query";
import type { ApiResponse } from "@/types/api/responses";
import type { Metric } from "@/types/ui";
import type { PayrollBatchRecord } from "@/types/payroll-batches";
import type {
  PayrollVerifiedAttendanceData,
  PayrollVerifiedAttendanceItem,
  PayrollVerifiedAttendanceQuery,
} from "@/types/payroll-verified-attendance";

import { PayrollVerifiedAttendanceDetailsModal } from "./PayrollVerifiedAttendanceDetailsModal";
import { PayrollVerifiedAttendanceFilters } from "./PayrollVerifiedAttendanceFilters";
import { PayrollVerifiedAttendanceTable } from "./PayrollVerifiedAttendanceTable";

type PayrollVerifiedAttendanceApiResponse = ApiResponse<PayrollVerifiedAttendanceData>;

type PayrollVerifiedAttendancePageProps = {
  data: PayrollVerifiedAttendanceData;
  query: PayrollVerifiedAttendanceQuery;
  loadError?: boolean;
};

function buildQueryString(values: PayrollVerifiedAttendanceQuery) {
  const params = new URLSearchParams();

  if (values.periodStart) {
    params.set("periodStart", values.periodStart);
  }

  if (values.search.trim()) {
    params.set("search", values.search.trim());
  }

  if (values.department) {
    params.set("department", values.department);
  }

  if (values.readiness) {
    params.set("readiness", values.readiness);
  }

  if (values.batch) {
    params.set("batch", values.batch);
  }

  if (values.page > 1) {
    params.set("page", String(values.page));
  }

  if (values.pageSize !== payrollVerifiedAttendancePageSizes[0]) {
    params.set("pageSize", String(values.pageSize));
  }

  return params.toString();
}

function getRangeLabel(data: PayrollVerifiedAttendanceData) {
  const { page, pageSize, totalItems } = data.pagination;

  if (totalItems === 0) {
    return "Showing 0 of 0 records";
  }

  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, totalItems);

  return `Showing ${first}–${last} of ${totalItems} records`;
}

function getSummaryMetrics(
  data: PayrollVerifiedAttendanceData,
  unavailable: boolean,
): Metric[] {
  if (unavailable) {
    return [
      { label: "Verified records", value: "—", note: "Unavailable", icon: "users", tone: "success" },
      { label: "Ready for payroll", value: "—", note: "Unavailable", icon: "check", tone: "info" },
      { label: "Already added to batch", value: "—", note: "Unavailable", icon: "layers", tone: "success" },
      { label: "Blocked records", value: "—", note: "Unavailable", icon: "warning", tone: "warning" },
      { label: "Needs follow-up", value: "—", note: "Unavailable", icon: "warning", tone: "danger" },
    ];
  }

  return [
    {
      label: "Verified records",
      value: String(data.summary.verifiedRecords),
      note: "HR-final-verified employee-period records",
      icon: "users",
      tone: "success",
    },
    {
      label: "Ready for payroll",
      value: String(data.summary.ready),
      note: "Eligible for future batch preparation",
      icon: "check",
      tone: "info",
    },
    {
      label: "Already added to batch",
      value: String(data.summary.includedInBatch),
      note: "No persistent batch records yet",
      icon: "layers",
      tone: "success",
    },
    {
      label: "Blocked records",
      value: String(data.summary.blocked),
      note: "Server-derived readiness blockers",
      icon: "warning",
      tone: "warning",
    },
    {
      label: "Needs follow-up",
      value: String(data.summary.needsFollowUp),
      note: "Requires attendance workflow follow-up",
      icon: "warning",
      tone: "danger",
    },
  ];
}

function getDashboardErrorMessage(
  status: number,
  body: ApiResponse<unknown>,
) {
  if (status === 401) {
    return "Your Payroll session has expired. Sign in again.";
  }

  if (status === 403) {
    return "You do not have permission to view verified attendance.";
  }

  if (!body.success) {
    return body.error.message;
  }

  return "Verified attendance could not be loaded.";
}

export function PayrollVerifiedAttendancePage({
  data: initialData,
  query,
  loadError = false,
}: PayrollVerifiedAttendancePageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [data, setData] = useState(initialData);
  const [error, setError] = useState(
    loadError ? "Verified attendance could not be loaded." : null,
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddingToBatch, setIsAddingToBatch] = useState(false);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());
  const [selectedRecord, setSelectedRecord] = useState<PayrollVerifiedAttendanceItem | null>(null);

  useEffect(() => {
    if (!selectedRecord) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedRecord(null);
      }
    }

    document.addEventListener("keydown", closeOnEscape);

    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [selectedRecord]);

  const refreshData = useCallback(async () => {
    if (isRefreshing) {
      return;
    }

    setIsRefreshing(true);

    try {
      const queryString = buildQueryString(query);
      const response = await fetch(
        queryString
          ? `/api/payroll/verified-attendance?${queryString}`
          : "/api/payroll/verified-attendance",
        {
          cache: "no-store",
          headers: { Accept: "application/json" },
        },
      );
      const body = await response.json() as PayrollVerifiedAttendanceApiResponse;

      if (!response.ok || !body.success) {
        throw new Error(getDashboardErrorMessage(response.status, body));
      }

      setData(body.data);
      setError(null);
      setSelectedIds(new Set());
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "Verified attendance could not be loaded.",
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, query]);

  function navigateToFilters(overrides: Partial<PayrollVerifiedAttendanceQuery> = {}) {
    if (Object.prototype.hasOwnProperty.call(overrides, "periodStart")) {
      setSelectedIds(new Set());
    }

    const nextQuery: PayrollVerifiedAttendanceQuery = {
      ...query,
      ...overrides,
      page: overrides.page ?? 1,
    };
    const queryString = buildQueryString(nextQuery);

    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  }

  function resetFilters() {
    setSelectedIds(new Set());
    router.push(pathname);
  }

  async function addToBatch(recordIds: readonly string[]) {
    if (recordIds.length === 0 || isAddingToBatch) {
      return;
    }

    setIsAddingToBatch(true);

    try {
      const response = await fetch("/api/payroll/batches", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          periodStart: data.period.start,
          periodEnd: data.period.end,
          employeePeriodIds: recordIds,
        }),
      });
      const body = await response.json() as ApiResponse<PayrollBatchRecord>;

      if (!response.ok || !body.success) {
        throw new Error(getDashboardErrorMessage(response.status, body as PayrollVerifiedAttendanceApiResponse));
      }

      await refreshData();
      setSelectedIds(new Set());
      router.push(`/payroll/batches?periodStart=${body.data.period.start}&periodEnd=${body.data.period.end}`);
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "The selected records could not be added to a batch.");
    } finally {
      setIsAddingToBatch(false);
    }
  }

  function toggleAllVisible(checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);

      data.items.forEach((item) => {
        if (!item.selectable) {
          return;
        }

        if (checked) {
          next.add(item.id);
        } else {
          next.delete(item.id);
        }
      });

      return next;
    });
  }

  function toggleRecord(id: string, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }

      return next;
    });
  }

  const summaryMetrics = getSummaryMetrics(data, Boolean(error));
  const allSelectableSelected = data.items.some((item) => item.selectable)
    && data.items.filter((item) => item.selectable).every((item) => selectedIds.has(item.id));

  return (
    <div className="payroll-verified-attendance" aria-busy={isRefreshing}>
      <AdminPageHeader
        eyebrow="Payroll readiness"
        title="Verified Attendance"
        description="Review HR-final-verified attendance records that are eligible for payroll preparation and handoff."
        actions={(
          <button
            type="button"
            className="button-secondary"
            onClick={() => void refreshData()}
            disabled={isRefreshing}
          >
            <Icon name="refresh" /> {isRefreshing ? "Refreshing…" : "Refresh data"}
          </button>
        )}
      />

      {error ? (
        <p className="payroll-verified-attendance__data-error" role="alert">
          {data.pagination.totalItems > 0
            ? `${error} Showing the last successful data.`
            : `${error} Use Refresh data to try again.`}
        </p>
      ) : null}

      <div className="payroll-verified-attendance__period-controls">
        <p className="payroll-verified-attendance__period">
          <Icon name="calendar" />
          Payroll period: {data.period.label}
        </p>
        <label className="payroll-verified-attendance__period-selector">
          <span>Payroll period</span>
          <select
            value={query.periodStart ?? data.period.start}
            onChange={(event) => navigateToFilters({ periodStart: event.target.value })}
            aria-label="Select payroll period"
          >
            {data.periodOptions.map((option) => (
              <option value={option.start} key={option.start}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="metric-grid payroll-verified-attendance__summary">
        {summaryMetrics.map((metric) => <SummaryCard key={metric.label} {...metric} />)}
      </div>

      <SectionCard
        title="Verified Attendance Records"
        eyebrow="Employee records"
        className="payroll-verified-attendance__records-card"
        actions={(
          <div className="payroll-verified-attendance__header-actions">
            <button type="button" className="button-secondary" onClick={resetFilters}>Clear filters</button>
            <button
              type="button"
              className="button-primary"
              disabled={isAddingToBatch || selectedIds.size === 0}
              onClick={() => void addToBatch(Array.from(selectedIds))}
            >
              <Icon name="layers" /> {isAddingToBatch ? "Adding…" : `Add to batch (${selectedIds.size})`}
            </button>
          </div>
        )}
      >
        <p className="payroll-verified-attendance__description">
          Only attendance with a persisted HR final-verification state appears here. Attendance corrections and HR verification remain outside this Payroll workspace.
        </p>

        <PayrollVerifiedAttendanceFilters
          search={query.search}
          department={query.department ?? ""}
          readiness={query.readiness ?? ""}
          batch={query.batch ?? ""}
          departments={data.departments}
          onSearchChange={(value) => navigateToFilters({ search: value })}
          onDepartmentChange={(value) => navigateToFilters({ department: value || null })}
          onReadinessChange={(value) => navigateToFilters({ readiness: value || null })}
          onBatchChange={(value) => navigateToFilters({ batch: value || null })}
          onReset={resetFilters}
        />

        <p className="payroll-verified-attendance__result-meta" aria-live="polite">
          <span>{error ? "Records unavailable" : getRangeLabel(data)}</span>
          <span>{data.pagination.totalItems} HR-final-verified records</span>
        </p>

        <PayrollVerifiedAttendanceTable
          records={data.items}
          periodLabel={data.period.label}
          selectedIds={selectedIds}
          allSelectableSelected={allSelectableSelected}
          onToggleAll={toggleAllVisible}
          onToggleRecord={toggleRecord}
          onViewDetails={setSelectedRecord}
          onAddToBatch={(record) => void addToBatch([record.id])}
        />

        <footer className="payroll-verified-attendance__pagination">
          <label className="payroll-verified-attendance__page-size">
            <span>Rows per page</span>
            <select
              value={query.pageSize}
              onChange={(event) => navigateToFilters({
                pageSize: Number(event.target.value),
                page: 1,
              })}
            >
              {payrollVerifiedAttendancePageSizes.map((pageSize) => (
                <option value={pageSize} key={pageSize}>{pageSize}</option>
              ))}
            </select>
          </label>
          <nav aria-label="Verified attendance pages">
            <button
              type="button"
              className="payroll-verified-attendance__page-button"
              onClick={() => navigateToFilters({ page: Math.max(1, data.pagination.page - 1) })}
              disabled={data.pagination.page <= 1}
            >
              <Icon name="chevron-left" /> Previous
            </button>
            <span aria-live="polite">
              Page {data.pagination.page} of {data.pagination.totalPages}
            </span>
            <button
              type="button"
              className="payroll-verified-attendance__page-button"
              onClick={() => navigateToFilters({ page: data.pagination.page + 1 })}
              disabled={data.pagination.page >= data.pagination.totalPages}
            >
              Next <Icon name="chevron-right" />
            </button>
          </nav>
        </footer>
      </SectionCard>

      <PayrollVerifiedAttendanceDetailsModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />
    </div>
  );
}
