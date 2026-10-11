"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { ActionButton } from "@/components/ui/ActionButton";
import { Icon } from "@/components/ui/Icon";
import { SectionCard } from "@/components/ui/SectionCard";
import { SummaryCard } from "@/components/ui/SummaryCard";
import {
  accountingPayrollBatches,
  type AccountingPayrollBatch,
} from "@/data/accounting/dashboard";

import { ApprovedPayrollDetailsDialog } from "./ApprovedPayrollDetailsDialog";
import { ApprovedPayrollTable } from "./ApprovedPayrollTable";

const pageSize = 4;
const approvalStatuses = ["Approved", "Pending Approval"] as const;
const accountingStatuses = ["Ready for Transfer", "Transferred", "Transfer Failed", "Pending"] as const;

type ApprovalStatusFilter = "all" | (typeof approvalStatuses)[number];
type AccountingStatusFilter = "all" | (typeof accountingStatuses)[number];

export function ApprovedPayrollPage() {
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("all");
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatusFilter>("all");
  const [accountingStatus, setAccountingStatus] = useState<AccountingStatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBatch, setSelectedBatch] = useState<AccountingPayrollBatch | null>(null);

  const periods = useMemo(
    () => Array.from(new Set(accountingPayrollBatches.map((batch) => batch.payrollPeriod))),
    [],
  );

  const summaryMetrics = useMemo(() => {
    const approvedCount = accountingPayrollBatches.filter((batch) => batch.approvalStatus === "Approved").length;
    const readyCount = accountingPayrollBatches.filter((batch) => batch.accountingStatus === "Ready for Transfer").length;
    const transferredCount = accountingPayrollBatches.filter((batch) => batch.accountingStatus === "Transferred").length;
    const issueCount = accountingPayrollBatches.filter((batch) => batch.accountingStatus === "Transfer Failed").length;

    return [
      { label: "Approved payroll", value: `${approvedCount} batches`, note: "Available from payroll", icon: "payroll" as const, tone: "info" as const },
      { label: "Ready for transfer", value: `${readyCount} batch${readyCount === 1 ? "" : "es"}`, note: "Awaiting accounting handoff", icon: "arrow" as const, tone: "warning" as const },
      { label: "Successfully transferred", value: `${transferredCount} batches`, note: "Transfer history confirmed", icon: "check" as const, tone: "success" as const },
      { label: "Integration issues", value: `${issueCount} batch${issueCount === 1 ? "" : "es"}`, note: "Requires review", icon: "warning" as const, tone: "danger" as const },
    ];
  }, []);

  const filteredBatches = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return accountingPayrollBatches.filter((batch) => {
      const searchableText = `${batch.payrollReference} ${batch.payrollPeriod} ${batch.employeeCount}`.toLowerCase();
      return (
        (!normalizedSearch || searchableText.includes(normalizedSearch))
        && (period === "all" || batch.payrollPeriod === period)
        && (approvalStatus === "all" || batch.approvalStatus === approvalStatus)
        && (accountingStatus === "all" || batch.accountingStatus === accountingStatus)
      );
    });
  }, [accountingStatus, approvalStatus, period, search]);

  const pageCount = Math.max(1, Math.ceil(filteredBatches.length / pageSize));
  const safePage = Math.min(currentPage, pageCount);
  const pageStart = (safePage - 1) * pageSize;
  const visibleBatches = filteredBatches.slice(pageStart, pageStart + pageSize);
  const rangeStart = filteredBatches.length === 0 ? 0 : pageStart + 1;
  const rangeEnd = Math.min(pageStart + pageSize, filteredBatches.length);

  function resetResultState() {
    setCurrentPage(1);
    setSelectedBatch(null);
  }

  function resetFilters() {
    setSearch("");
    setPeriod("all");
    setApprovalStatus("all");
    setAccountingStatus("all");
    resetResultState();
  }

  function handlePageChange(nextPage: number) {
    setCurrentPage(Math.min(Math.max(nextPage, 1), pageCount));
  }

  return (
    <div className="accounting-approved-payroll">
      <AdminPageHeader
        eyebrow="Approved payroll"
        title="Approved Payroll Information"
        description="Review payroll information approved by Payroll Staff before it is transferred to the Existing Accounting System."
        actions={(
          <div className="accounting-approved-payroll__header-actions">
            <ActionButton icon="refresh" action="Approved payroll data refreshed from the local integration snapshot.">
              Refresh data
            </ActionButton>
            <Link href="/accounting/integration-status" className="button-primary">
              <Icon name="accounting" />
              View integration status
            </Link>
          </div>
        )}
      />

      <div className="metric-grid accounting-approved-payroll__summary">
        {summaryMetrics.map((metric) => <SummaryCard key={metric.label} {...metric} />)}
      </div>

      <SectionCard
        title="Approved Payroll Information"
        eyebrow="Incoming from Existing Payroll System"
        className="accounting-approved-payroll__card"
      >
        <p className="accounting-approved-payroll__description">
          Review approved payroll periods, employee totals, amounts, and accounting handoff readiness.
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
                onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }}
                placeholder="Search payroll reference or period"
                aria-label="Search approved payroll"
              />
            </span>
          </label>
          <label className="accounting-approved-payroll__field">
            <span>Payroll period</span>
            <select value={period} onChange={(event) => { setPeriod(event.target.value); setCurrentPage(1); }} aria-label="Filter by payroll period">
              <option value="all">All periods</option>
              {periods.map((option) => <option value={option} key={option}>{option}</option>)}
            </select>
          </label>
          <label className="accounting-approved-payroll__field">
            <span>Approval</span>
            <select value={approvalStatus} onChange={(event) => { setApprovalStatus(event.target.value as ApprovalStatusFilter); setCurrentPage(1); }} aria-label="Filter by approval status">
              <option value="all">All statuses</option>
              {approvalStatuses.map((option) => <option value={option} key={option}>{option}</option>)}
            </select>
          </label>
          <label className="accounting-approved-payroll__field">
            <span>Accounting</span>
            <select value={accountingStatus} onChange={(event) => { setAccountingStatus(event.target.value as AccountingStatusFilter); setCurrentPage(1); }} aria-label="Filter by accounting status">
              <option value="all">All statuses</option>
              {accountingStatuses.map((option) => <option value={option} key={option}>{option}</option>)}
            </select>
          </label>
          <button type="button" className="button-secondary" onClick={resetFilters}>Reset</button>
        </form>

        <div className="accounting-approved-payroll__result-meta" aria-live="polite">
          <span>Showing {rangeStart}-{rangeEnd} of {filteredBatches.length} batches</span>
          <span>{accountingPayrollBatches.length} total records</span>
        </div>

        <ApprovedPayrollTable batches={visibleBatches} onViewDetails={setSelectedBatch} />

        <footer className="accounting-approved-payroll__pagination">
          <span>Page {safePage} of {pageCount}</span>
          <nav aria-label="Approved payroll pages">
            <button type="button" className="accounting-approved-payroll__page-button" onClick={() => handlePageChange(safePage - 1)} disabled={safePage === 1} aria-label="Previous approved payroll page"><Icon name="chevron-left" /></button>
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
              <button type="button" className={`accounting-approved-payroll__page-button ${page === safePage ? "is-active" : ""}`} key={page} onClick={() => handlePageChange(page)} aria-current={page === safePage ? "page" : undefined}>{page}</button>
            ))}
            <button type="button" className="accounting-approved-payroll__page-button" onClick={() => handlePageChange(safePage + 1)} disabled={safePage === pageCount} aria-label="Next approved payroll page"><Icon name="chevron-right" /></button>
          </nav>
        </footer>
      </SectionCard>

      <p className="accounting-approved-payroll__boundary-note">
        <Icon name="shield" />
        This is a migration prototype. Approved payroll data is read-only deterministic integration data; this page does not calculate payroll, edit approvals, or write to the Existing Accounting System.
      </p>

      {selectedBatch ? <ApprovedPayrollDetailsDialog batch={selectedBatch} onClose={() => setSelectedBatch(null)} /> : null}
    </div>
  );
}
