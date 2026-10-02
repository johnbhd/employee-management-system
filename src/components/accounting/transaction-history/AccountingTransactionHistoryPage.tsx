"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { ActionButton } from "@/components/ui/ActionButton";
import { Icon } from "@/components/ui/Icon";
import { SectionCard } from "@/components/ui/SectionCard";
import { SummaryCard } from "@/components/ui/SummaryCard";
import {
  accountingTransactions,
  accountingTransactionYears,
  type AccountingTransaction,
} from "@/data/accounting/transaction-history";

import {
  TransactionHistoryFilters,
  type TransactionHistoryAcknowledgementFilter,
  type TransactionHistoryStatusFilter,
} from "./TransactionHistoryFilters";
import { TransactionDetailsDialog } from "./TransactionDetailsDialog";
import { TransactionHistoryTable } from "./TransactionHistoryTable";

const pageSize = 4;

export function AccountingTransactionHistoryPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TransactionHistoryStatusFilter>("all");
  const [year, setYear] = useState("all");
  const [acknowledgement, setAcknowledgement] = useState<TransactionHistoryAcknowledgementFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState<AccountingTransaction | null>(null);

  const summaryMetrics = useMemo(() => {
    const successfulCount = accountingTransactions.filter(
      (transaction) => transaction.status === "successful",
    ).length;
    const pendingCount = accountingTransactions.filter(
      (transaction) => transaction.status === "pending",
    ).length;
    const failedCount = accountingTransactions.filter(
      (transaction) => transaction.status === "failed",
    ).length;

    return [
      {
        label: "Total Transactions",
        value: String(accountingTransactions.length),
        note: "Recorded transfers",
        icon: "layers" as const,
        tone: "info" as const,
      },
      {
        label: "Successful",
        value: String(successfulCount),
        note: "Completed transfers",
        icon: "check" as const,
        tone: "success" as const,
      },
      {
        label: "Pending",
        value: String(pendingCount),
        note: "Awaiting acknowledgement",
        icon: "clock" as const,
        tone: "warning" as const,
      },
      {
        label: "Needs Attention",
        value: String(failedCount),
        note: "Requires review",
        icon: "warning" as const,
        tone: "danger" as const,
      },
    ];
  }, []);

  const filteredTransactions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return accountingTransactions
      .filter((transaction) => {
        const searchableText = [
          transaction.transactionReference,
          transaction.payrollReference,
          transaction.payrollPeriod,
        ].join(" ").toLowerCase();
        const matchesSearch = !normalizedSearch || searchableText.includes(normalizedSearch);
        const matchesStatus = status === "all" || transaction.status === status;
        const matchesYear = year === "all" || transaction.year === year;
        const matchesAcknowledgement = acknowledgement === "all"
          || transaction.acknowledgement.toLowerCase().replaceAll(" ", "-") === acknowledgement;

        return matchesSearch && matchesStatus && matchesYear && matchesAcknowledgement;
      })
      .sort((first, second) => second.transactionAt.localeCompare(first.transactionAt));
  }, [acknowledgement, search, status, year]);

  const pageCount = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const safePage = Math.min(currentPage, pageCount);
  const pageStart = (safePage - 1) * pageSize;
  const visibleTransactions = filteredTransactions.slice(pageStart, pageStart + pageSize);
  const rangeStart = filteredTransactions.length === 0 ? 0 : pageStart + 1;
  const rangeEnd = Math.min(pageStart + pageSize, filteredTransactions.length);

  function resetResultState() {
    setCurrentPage(1);
    setSelectedTransaction(null);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    resetResultState();
  }

  function handleStatusChange(value: TransactionHistoryStatusFilter) {
    setStatus(value);
    resetResultState();
  }

  function handleYearChange(value: string) {
    setYear(value);
    resetResultState();
  }

  function handleAcknowledgementChange(value: TransactionHistoryAcknowledgementFilter) {
    setAcknowledgement(value);
    resetResultState();
  }

  function resetFilters() {
    setSearch("");
    setStatus("all");
    setYear("all");
    setAcknowledgement("all");
    resetResultState();
  }

  function handlePageChange(nextPage: number) {
    setCurrentPage(Math.min(Math.max(nextPage, 1), pageCount));
  }

  return (
    <div className="accounting-transaction-history">
      <AdminPageHeader
        eyebrow="Accounting records"
        title="Transaction History"
        description="Review payroll integration transactions and transfer activity with the Existing Accounting System."
        actions={(
          <div className="accounting-transaction-history__header-actions">
            <ActionButton icon="refresh" action="Transaction history refreshed.">
              Refresh data
            </ActionButton>
            <Link href="/accounting/integration-status" className="button-primary">
              <Icon name="accounting" />
              View integration status
            </Link>
          </div>
        )}
      />

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
          Previous transfers of approved payroll information to the Existing Accounting System.
        </p>

        <TransactionHistoryFilters
          search={search}
          status={status}
          year={year}
          acknowledgement={acknowledgement}
          years={accountingTransactionYears}
          onSearchChange={handleSearchChange}
          onStatusChange={handleStatusChange}
          onYearChange={handleYearChange}
          onAcknowledgementChange={handleAcknowledgementChange}
          onReset={resetFilters}
        />

        <div className="accounting-transaction-history__result-meta" aria-live="polite">
          <span>
            Showing {rangeStart}–{rangeEnd} of {filteredTransactions.length} transactions
          </span>
          <span>{accountingTransactions.length} total records</span>
        </div>

        <TransactionHistoryTable
          transactions={visibleTransactions}
          onViewDetails={setSelectedTransaction}
        />

        <footer className="accounting-transaction-history__pagination">
          <span>
            Page {safePage} of {pageCount}
          </span>
          <nav aria-label="Transaction history pages">
            <button
              type="button"
              className="accounting-transaction-history__page-button"
              onClick={() => handlePageChange(safePage - 1)}
              disabled={safePage === 1}
              aria-label="Previous transaction history page"
            >
              <Icon name="chevron-left" />
              Previous
            </button>
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
              <button
                type="button"
                className={`accounting-transaction-history__page-button ${page === safePage ? "is-active" : ""}`}
                key={page}
                onClick={() => handlePageChange(page)}
                aria-current={page === safePage ? "page" : undefined}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              className="accounting-transaction-history__page-button"
              onClick={() => handlePageChange(safePage + 1)}
              disabled={safePage === pageCount}
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
        This history records approved payroll handoffs only. The Existing Accounting System remains external, and this workspace does not create journal, ledger, or payroll calculations.
      </p>

      {selectedTransaction ? (
        <TransactionDetailsDialog
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      ) : null}
    </div>
  );
}
