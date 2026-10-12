"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  getAccountingReadinessLabel,
  getAccountingTransferLabel,
} from "@/data/accounting/approved-payroll";
import { getPayrollResultStatusLabel } from "@/data/payroll/results";
import { apiRequest } from "@/lib/api/client";
import type { ApiSuccessResponse } from "@/types/api/responses";
import type {
  AccountingApprovedPayrollData,
  AccountingReadinessStatus,
  AccountingTransferStatus,
} from "@/types/accounting-approved-payroll";
import type { PayrollResultStatus } from "@/types/payroll-results";

import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { ActionButton } from "@/components/ui/ActionButton";
import { Icon } from "@/components/ui/Icon";
import { SectionCard } from "@/components/ui/SectionCard";
import { SummaryCard } from "@/components/ui/SummaryCard";

import { ApprovedPayrollDetailsDialog } from "./ApprovedPayrollDetailsDialog";
import { ApprovedPayrollTable } from "./ApprovedPayrollTable";

const allValue = "all";

type ApprovedPayrollPageProps = {
  initialData: AccountingApprovedPayrollData;
  loadError: boolean;
};

type ApprovedPayrollApiResponse = ApiSuccessResponse<AccountingApprovedPayrollData>;

function formatCount(value: number, singular: string, plural = `${singular}s`) {
  return `${value} ${value === 1 ? singular : plural}`;
}

export function ApprovedPayrollPage({
  initialData,
  loadError: initialLoadError,
}: ApprovedPayrollPageProps) {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState(allValue);
  const [resultStatus, setResultStatus] = useState<PayrollResultStatus | typeof allValue>(allValue);
  const [readinessStatus, setReadinessStatus] = useState<
    AccountingReadinessStatus | typeof allValue
  >(allValue);
  const [transferStatus, setTransferStatus] = useState<
    AccountingTransferStatus | typeof allValue
  >(allValue);
  const [page, setPage] = useState(1);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(initialLoadError);
  const firstRender = useRef(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);

    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(data.pageSize || 5),
    });

    if (search.trim()) {
      params.set("search", search.trim());
    }
    if (period !== allValue) {
      params.set("periodStart", period);
    }
    if (resultStatus !== allValue) {
      params.set("resultStatus", resultStatus);
    }
    if (readinessStatus !== allValue) {
      params.set("readiness", readinessStatus);
    }
    if (transferStatus !== allValue) {
      params.set("transferStatus", transferStatus);
    }

    try {
      const response = await apiRequest<ApprovedPayrollApiResponse>(
        `/api/v1/accounting/approved-payroll?${params.toString()}`,
        { cache: "no-store" },
      );

      setData(response.data);
      setLoadError(false);
      setFeedback("");
    } catch (error) {
      setLoadError(true);
      setFeedback(
        error instanceof Error
          ? error.message
          : "Approved payroll information could not be loaded.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    data.pageSize,
    page,
    period,
    readinessStatus,
    resultStatus,
    search,
    transferStatus,
  ]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    void loadData();
  }, [loadData]);

  const periodOptions = useMemo(
    () => data.periodOptions.map((option) => ({
      value: option.start,
      label: option.label,
    })),
    [data.periodOptions],
  );

  const summaryMetrics = [
    {
      label: "Approved payroll",
      value: formatCount(data.summary.approvedPayroll, "result"),
      note: "Completed Payroll Results",
      icon: "payroll" as const,
      tone: "info" as const,
    },
    {
      label: "Ready for transfer",
      value: formatCount(data.summary.readyForTransfer, "result"),
      note: "Awaiting Accounting handoff",
      icon: "arrow" as const,
      tone: "warning" as const,
    },
    {
      label: "Successfully transferred",
      value: formatCount(data.summary.transferred, "result"),
      note: "Persisted Accounting transfer records",
      icon: "check" as const,
      tone: "success" as const,
    },
    {
      label: "Blocked / issues",
      value: formatCount(data.summary.blocked, "result"),
      note: "Requires Payroll follow-up",
      icon: "warning" as const,
      tone: "danger" as const,
    },
  ];

  const totalPages = Math.max(1, data.totalPages);
  const visiblePage = Math.min(data.page, totalPages);
  const firstVisible = data.total === 0
    ? 0
    : (visiblePage - 1) * data.pageSize + 1;
  const lastVisible = Math.min(visiblePage * data.pageSize, data.total);
  const selectedRecord = data.records.find(
    (record) => record.payrollResultId === selectedResultId,
  ) ?? null;

  function clearFilters() {
    setSearch("");
    setPeriod(allValue);
    setResultStatus(allValue);
    setReadinessStatus(allValue);
    setTransferStatus(allValue);
    setPage(1);
  }

  function handlePageChange(nextPage: number) {
    setPage(Math.min(Math.max(nextPage, 1), totalPages));
  }

  return (
    <div className={`accounting-approved-payroll${isLoading ? " is-loading" : ""}`}>
      <AdminPageHeader
        eyebrow="Approved payroll"
        title="Approved Payroll Information"
        description="Review Payroll Results and their readiness for downstream Accounting processing."
        actions={(
          <div className="accounting-approved-payroll__header-actions">
            <ActionButton
              icon="refresh"
              action="Approved payroll data refreshed."
              onAction={() => void loadData()}
            >
              Refresh data
            </ActionButton>
            <Link href="/accounting/integration-status" className="button-primary">
              <Icon name="accounting" />
              View integration status
            </Link>
          </div>
        )}
      />

      {loadError ? (
        <div className="accounting-approved-payroll__load-error" role="alert">
          <Icon name="warning" />
          <span>
            {feedback || "Approved payroll information could not be loaded."}
          </span>
          <button type="button" className="button-link" onClick={() => void loadData()}>
            Try again
          </button>
        </div>
      ) : null}

      <div className="metric-grid accounting-approved-payroll__summary">
        {summaryMetrics.map((metric) => (
          <SummaryCard key={metric.label} {...metric} />
        ))}
      </div>

      <SectionCard
        title="Approved Payroll Information"
        eyebrow="Incoming from Existing Payroll System"
        className="accounting-approved-payroll__card"
      >
        <p className="accounting-approved-payroll__description">
          Review historical Payroll Result snapshots, output status, and Accounting readiness.
        </p>

        <form
          className="accounting-approved-payroll__filters"
          onSubmit={(event) => event.preventDefault()}
          role="search"
          aria-label="Approved payroll filters"
        >
          <label className="accounting-approved-payroll__search-field">
            <span>Search</span>
            <span className="accounting-approved-payroll__search-input">
              <Icon name="search" />
              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search result, batch, or Payroll reference"
                aria-label="Search approved payroll"
              />
            </span>
          </label>

          <label className="accounting-approved-payroll__field">
            <span>Payroll period</span>
            <select
              value={period}
              onChange={(event) => {
                setPeriod(event.target.value);
                setPage(1);
              }}
              aria-label="Filter by payroll period"
            >
              <option value={allValue}>All periods</option>
              {periodOptions.map((option) => (
                <option value={option.value} key={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="accounting-approved-payroll__field">
            <span>Result status</span>
            <select
              value={resultStatus}
              onChange={(event) => {
                setResultStatus(event.target.value as PayrollResultStatus | typeof allValue);
                setPage(1);
              }}
              aria-label="Filter by Payroll result status"
            >
              <option value={allValue}>All statuses</option>
              {data.resultStatusOptions.map((option) => (
                <option value={option} key={option}>
                  {getPayrollResultStatusLabel(option)}
                </option>
              ))}
            </select>
          </label>

          <label className="accounting-approved-payroll__field">
            <span>Accounting readiness</span>
            <select
              value={readinessStatus}
              onChange={(event) => {
                setReadinessStatus(
                  event.target.value as AccountingReadinessStatus | typeof allValue,
                );
                setPage(1);
              }}
              aria-label="Filter by Accounting readiness"
            >
              <option value={allValue}>All readiness states</option>
              {data.readinessStatusOptions.map((option) => (
                <option value={option} key={option}>
                  {getAccountingReadinessLabel(option)}
                </option>
              ))}
            </select>
          </label>

          <label className="accounting-approved-payroll__field">
            <span>Transfer status</span>
            <select
              value={transferStatus}
              onChange={(event) => {
                setTransferStatus(
                  event.target.value as AccountingTransferStatus | typeof allValue,
                );
                setPage(1);
              }}
              aria-label="Filter by Accounting transfer status"
            >
              <option value={allValue}>All transfer states</option>
              {data.transferStatusOptions.map((option) => (
                <option value={option} key={option}>
                  {getAccountingTransferLabel(option)}
                </option>
              ))}
            </select>
          </label>

          <button type="button" className="button-secondary" onClick={clearFilters}>
            Reset
          </button>
        </form>

        <div className="accounting-approved-payroll__result-meta" aria-live="polite">
          <span>
            {isLoading
              ? "Refreshing approved payroll information…"
              : data.total
                ? `Showing ${firstVisible}-${lastVisible} of ${data.total} results`
                : "No approved payroll information is available for Accounting."}
          </span>
          <span>{formatCount(data.summary.approvedPayroll, "completed result")}</span>
        </div>

        <ApprovedPayrollTable
          records={data.records}
          onViewDetails={(record) => setSelectedResultId(record.payrollResultId)}
        />

        <footer className="accounting-approved-payroll__pagination">
          <span>Page {visiblePage} of {totalPages}</span>
          <nav aria-label="Approved payroll pages">
            <button
              type="button"
              className="accounting-approved-payroll__page-button"
              onClick={() => handlePageChange(visiblePage - 1)}
              disabled={visiblePage === 1}
              aria-label="Previous approved payroll page"
            >
              <Icon name="chevron-left" />
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
              <button
                type="button"
                className={`accounting-approved-payroll__page-button${pageNumber === visiblePage ? " is-active" : ""}`}
                key={pageNumber}
                onClick={() => handlePageChange(pageNumber)}
                aria-current={pageNumber === visiblePage ? "page" : undefined}
              >
                {pageNumber}
              </button>
            ))}
            <button
              type="button"
              className="accounting-approved-payroll__page-button"
              onClick={() => handlePageChange(visiblePage + 1)}
              disabled={visiblePage === totalPages}
              aria-label="Next approved payroll page"
            >
              <Icon name="chevron-right" />
            </button>
          </nav>
        </footer>
      </SectionCard>

      <p className="accounting-approved-payroll__boundary-note">
        <Icon name="shield" />
        {data.providerNote}
      </p>

      <span className="sr-only" aria-live="polite">{feedback}</span>

      {selectedRecord ? (
        <ApprovedPayrollDetailsDialog
          record={selectedRecord}
          onClose={() => setSelectedResultId(null)}
        />
      ) : null}
    </div>
  );
}
