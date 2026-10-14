"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { ActionButton } from "@/components/ui/ActionButton";
import { Icon } from "@/components/ui/Icon";
import { SectionCard } from "@/components/ui/SectionCard";
import { SummaryCard } from "@/components/ui/SummaryCard";
import { apiRequest } from "@/lib/api/client";
import type { ApiSuccessResponse } from "@/types/api/responses";
import type {
  AccountingAcknowledgementStatus,
  AccountingTransferStatus,
} from "@/types/accounting-transfers";
import type {
  AccountingTransactionHistoryData,
  AccountingTransactionHistoryDetail,
  AccountingTransactionHistoryItem,
} from "@/types/accounting-transaction-history";

import {
  TransactionHistoryFilters,
  type TransactionHistoryAcknowledgementFilter,
  type TransactionHistoryStatusFilter,
} from "./TransactionHistoryFilters";
import { TransactionDetailsDialog } from "./TransactionDetailsDialog";
import { TransactionHistoryTable } from "./TransactionHistoryTable";

type AccountingTransactionHistoryPageProps = {
  initialData: AccountingTransactionHistoryData;
  loadError: boolean;
};

type AccountingTransactionHistoryApiResponse = ApiSuccessResponse<AccountingTransactionHistoryData>;
type AccountingTransactionHistoryDetailApiResponse = ApiSuccessResponse<AccountingTransactionHistoryDetail>;

export function AccountingTransactionHistoryPage({
  initialData,
  loadError: initialLoadError,
}: AccountingTransactionHistoryPageProps) {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TransactionHistoryStatusFilter>("all");
  const [period, setPeriod] = useState("all");
  const [acknowledgement, setAcknowledgement] = useState<TransactionHistoryAcknowledgementFilter>("all");
  const [page, setPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState<AccountingTransactionHistoryItem | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<AccountingTransactionHistoryDetail | null>(null);
  const [detailError, setDetailError] = useState("");
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(initialLoadError);
  const firstRender = useRef(true);
  const pageSize = data.pageSize || 5;

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (search.trim()) params.set("search", search.trim());
    if (period !== "all") params.set("periodStart", period);
    if (status !== "all") params.set("transferStatus", status);
    if (acknowledgement !== "all") params.set("acknowledgementStatus", acknowledgement);

    try {
      const response = await apiRequest<AccountingTransactionHistoryApiResponse>(
        `/api/accounting/transaction-history?${params.toString()}`,
        { cache: "no-store" },
      );
      setData(response.data);
      setLoadError(false);
      setFeedback("");
    } catch (error) {
      setLoadError(true);
      setFeedback(error instanceof Error
        ? error.message
        : "Accounting transaction history could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, [acknowledgement, page, pageSize, period, search, status]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    void loadHistory();
  }, [loadHistory]);

  async function loadTransactionDetail(transaction: AccountingTransactionHistoryItem) {
    setSelectedTransaction(transaction);
    setSelectedDetail(null);
    setDetailError("");
    setIsDetailLoading(true);

    try {
      const response = await apiRequest<AccountingTransactionHistoryDetailApiResponse>(
        `/api/accounting/transaction-history/${encodeURIComponent(transaction.transferId)}`,
        { cache: "no-store" },
      );
      setSelectedDetail(response.data);
    } catch (error) {
      setDetailError(error instanceof Error
        ? error.message
        : "The transaction details could not be loaded.");
    } finally {
      setIsDetailLoading(false);
    }
  }

  function closeDetails() {
    setSelectedTransaction(null);
    setSelectedDetail(null);
    setDetailError("");
  }

  function updateFilter<T>(update: (value: T) => void, value: T) {
    update(value);
    setPage(1);
    closeDetails();
  }

  function resetFilters() {
    setSearch("");
    setStatus("all");
    setPeriod("all");
    setAcknowledgement("all");
    setPage(1);
    closeDetails();
  }

  function handleSearchChange(value: string) {
    updateFilter(setSearch, value);
  }

  function handleStatusChange(value: TransactionHistoryStatusFilter) {
    updateFilter(setStatus, value);
  }

  function handlePeriodChange(value: string) {
    updateFilter(setPeriod, value);
  }

  function handleAcknowledgementChange(value: TransactionHistoryAcknowledgementFilter) {
    updateFilter(setAcknowledgement, value);
  }

  function retryDetails() {
    if (selectedTransaction) void loadTransactionDetail(selectedTransaction);
  }

  const totalPages = Math.max(1, data.totalPages);
  const visiblePage = Math.min(data.page, totalPages);
  const rangeStart = data.total === 0 ? 0 : (visiblePage - 1) * data.pageSize + 1;
  const rangeEnd = Math.min(visiblePage * data.pageSize, data.total);
  const hasActiveFilters = Boolean(search.trim())
    || status !== "all"
    || period !== "all"
    || acknowledgement !== "all";
  const emptyMessage = loadError
    ? "Accounting transaction history could not be loaded."
    : hasActiveFilters
      ? "No transaction records match the selected filters."
      : "No Accounting transaction history is available yet.";

  const summaryMetrics = [
    {
      label: "Total Transactions",
      value: String(data.summary.totalTransfers),
      note: "Recorded Accounting transfers",
      icon: "layers" as const,
      tone: "info" as const,
    },
    {
      label: "Successful",
      value: String(data.summary.successfulTransfers),
      note: data.summary.latestCompletedPeriod
        ? `Latest completed: ${data.summary.latestCompletedPeriod}`
        : "No completed period",
      icon: "check" as const,
      tone: "success" as const,
    },
    {
      label: "Pending",
      value: String(data.summary.awaitingAcknowledgement),
      note: "Awaiting acknowledgement",
      icon: "clock" as const,
      tone: "warning" as const,
    },
    {
      label: "Needs Attention",
      value: String(data.summary.failedOrRejected),
      note: "Failed or rejected transfers",
      icon: "warning" as const,
      tone: "danger" as const,
    },
  ];

  return (
    <div className={`accounting-transaction-history${isLoading ? " is-loading" : ""}`}>
      <AdminPageHeader
        eyebrow="Accounting records"
        title="Transaction History"
        description="Review payroll integration transactions and transfer activity with the Existing Accounting System."
        actions={(
          <div className="accounting-transaction-history__header-actions">
            <ActionButton
              icon="refresh"
              action="Transaction history refreshed."
              onAction={() => void loadHistory()}
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
        <div className="accounting-transaction-history__load-error" role="alert">
          <Icon name="warning" />
          <span>{feedback || "Accounting transaction history could not be loaded."}</span>
          <button type="button" className="button-link" onClick={() => void loadHistory()}>Try again</button>
        </div>
      ) : null}

      <div className="metric-grid accounting-transaction-history__summary">
        {summaryMetrics.map((metric) => (
          <SummaryCard key={metric.label} {...metric} />
        ))}
      </div>

      <SectionCard
        title="Accounting Transaction History"
        eyebrow="Approved payroll transfers"
        className="accounting-transaction-history__card"
      >
        <p className="accounting-transaction-history__description">
          Previous transfers of approved Payroll Results to the Existing Accounting System.
        </p>

        <TransactionHistoryFilters
          search={search}
          status={status}
          period={period}
          acknowledgement={acknowledgement}
          periods={data.periodOptions}
          transferStatuses={data.transferStatusOptions}
          acknowledgementStatuses={data.acknowledgementStatusOptions}
          onSearchChange={handleSearchChange}
          onStatusChange={handleStatusChange}
          onPeriodChange={handlePeriodChange}
          onAcknowledgementChange={handleAcknowledgementChange}
          onReset={resetFilters}
        />

        <div className="accounting-transaction-history__result-meta" aria-live="polite">
          <span>
            Showing {rangeStart}–{rangeEnd} of {data.total} transactions
          </span>
          <span>{data.summary.totalTransfers} total records</span>
        </div>

        <TransactionHistoryTable
          transactions={data.records}
          emptyMessage={emptyMessage}
          onViewDetails={(transaction) => void loadTransactionDetail(transaction)}
        />

        <footer className="accounting-transaction-history__pagination">
          <span>Page {visiblePage} of {totalPages}</span>
          <nav aria-label="Transaction history pages">
            <button
              type="button"
              className="accounting-transaction-history__page-button"
              onClick={() => setPage(Math.max(1, visiblePage - 1))}
              disabled={visiblePage === 1 || isLoading}
              aria-label="Previous transaction history page"
            >
              <Icon name="chevron-left" />
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
              <button
                type="button"
                className={`accounting-transaction-history__page-button ${pageNumber === visiblePage ? "is-active" : ""}`}
                key={pageNumber}
                onClick={() => setPage(pageNumber)}
                disabled={isLoading}
                aria-current={pageNumber === visiblePage ? "page" : undefined}
              >
                {pageNumber}
              </button>
            ))}
            <button
              type="button"
              className="accounting-transaction-history__page-button"
              onClick={() => setPage(Math.min(totalPages, visiblePage + 1))}
              disabled={visiblePage === totalPages || isLoading}
              aria-label="Next transaction history page"
            >
              Next
              <Icon name="chevron-right" />
            </button>
          </nav>
        </footer>
      </SectionCard>

      <p className="accounting-transaction-history__boundary-note">
        <Icon name="shield" />
        This history records approved Payroll Result handoffs only. The Existing Accounting System remains external, and this workspace does not create journal, ledger, or payroll calculations.
      </p>

      <span className="sr-only" aria-live="polite">{feedback}</span>

      {selectedTransaction ? (
        <TransactionDetailsDialog
          transaction={selectedTransaction}
          detail={selectedDetail}
          isLoading={isDetailLoading}
          error={detailError}
          onRetry={retryDetails}
          onClose={closeDetails}
        />
      ) : null}
    </div>
  );
}

export type {
  AccountingAcknowledgementStatus,
  AccountingTransferStatus,
};
