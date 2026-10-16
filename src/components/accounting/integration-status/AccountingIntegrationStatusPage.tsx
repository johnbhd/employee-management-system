"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getAccountingTransferLabel } from "@/data/accounting/approved-payroll";
import { apiRequest } from "@/lib/api/client";
import type { ApiSuccessResponse } from "@/types/api/responses";
import type {
  AccountingIntegrationStatusData,
  AccountingTransferView,
} from "@/types/accounting-transfers";

import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { ActionButton } from "@/components/ui/ActionButton";
import { Icon } from "@/components/ui/Icon";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SummaryCard } from "@/components/ui/SummaryCard";

import { AccountingAttentionTable } from "./AccountingAttentionTable";
import { AccountingConnectionTable } from "./AccountingConnectionTable";
import { AccountingIntegrationStatusFlow } from "./AccountingIntegrationStatusFlow";
import { AccountingReadyPayrollTable } from "./AccountingReadyPayrollTable";
import { AccountingSynchronizationTable } from "./AccountingSynchronizationTable";
import { AccountingTransferDetailsDialog } from "./AccountingTransferDetailsDialog";

type AccountingIntegrationStatusPageProps = {
  initialData: AccountingIntegrationStatusData;
  loadError: boolean;
};

type AccountingIntegrationStatusApiResponse = ApiSuccessResponse<AccountingIntegrationStatusData>;

export function AccountingIntegrationStatusPage({
  initialData,
  loadError: initialLoadError,
}: AccountingIntegrationStatusPageProps) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [transferStatus, setTransferStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedTransferId, setSelectedTransferId] = useState<string | null>(null);
  const [preparingResultId, setPreparingResultId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(initialLoadError);
  const firstRender = useRef(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: String(data.pageSize || 5) });
    if (search.trim()) params.set("search", search.trim());
    if (transferStatus !== "all") params.set("transferStatus", transferStatus);

    try {
      const response = await apiRequest<AccountingIntegrationStatusApiResponse>(
        `/api/accounting/transfers?${params.toString()}`,
        { cache: "no-store" },
      );
      setData(response.data);
      setLoadError(false);
      setFeedback("");
    } catch (error) {
      setLoadError(true);
      setFeedback(error instanceof Error ? error.message : "Accounting transfer data could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, [data.pageSize, page, search, transferStatus]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    void loadData();
  }, [loadData]);

  const selectedTransfer = useMemo(
    () => data.transfers.find((transfer) => transfer.transferId === selectedTransferId) ?? null,
    [data.transfers, selectedTransferId],
  );

  async function prepareTransfer(payrollResultId: string) {
    if (!window.confirm(
      "Prepare this Payroll Result for Accounting transfer?\n\nA stable local snapshot will be created. No data will be sent to the external Accounting System yet.",
    )) return;
    setPreparingResultId(payrollResultId);
    try {
      const response = await apiRequest<ApiSuccessResponse<{ transferId: string }>>(
        `/api/accounting/payroll-results/${encodeURIComponent(payrollResultId)}/prepare`,
        {
          method: "POST",
        },
      );
      setFeedback("Accounting transfer prepared locally.");
      router.push(`/accounting/transfers/${encodeURIComponent(response.data.transferId)}`);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "The Accounting transfer could not be prepared.");
    } finally {
      setPreparingResultId(null);
    }
  }

  function viewTransfer(item: AccountingTransferView) {
    setSelectedTransferId(item.transferId);
  }

  const summaryMetrics = [
    {
      label: "Connection status",
      value: data.connectionStatuses.length > 0 ? "Online" : "Unavailable",
      note: "Local preparation boundary",
      icon: "activity" as const,
      tone: data.connectionStatuses.length > 0 ? "info" as const : "danger" as const,
    },
    {
      label: "Prepared transfers",
      value: String(data.summary.preparedTransfers),
      note: "Local read-only snapshots",
      icon: "check" as const,
      tone: "success" as const,
    },
    {
      label: "Pending records",
      value: String(data.summary.inProgress + data.summary.awaitingAcknowledgement),
      note: "Awaiting synchronization or acknowledgement",
      icon: "clock" as const,
      tone: "warning" as const,
    },
    {
      label: "Failed transfers",
      value: String(data.summary.failedTransfers),
      note: "Review and retry",
      icon: "warning" as const,
      tone: "danger" as const,
    },
    {
      label: "Last synchronization",
      value: data.connectionStatuses[0]?.lastSync ?? "—",
      note: "Latest persisted transfer activity",
      icon: "refresh" as const,
      tone: "info" as const,
    },
    {
      label: "Integration errors",
      value: String(data.summary.failedTransfers),
      note: "Open transfer issues",
      icon: "errors" as const,
      tone: "danger" as const,
    },
  ];

  const totalPages = Math.max(1, data.totalPages);
  const visiblePage = Math.min(data.page, totalPages);

  return (
    <div className={`accounting-integration-status${isLoading ? " is-loading" : ""}`}>
      <AdminPageHeader
        eyebrow="System integration"
        title="Accounting Integration Status"
        description="Prepare verified Payroll Results as local, traceable Accounting transfer snapshots."
        actions={(
          <ActionButton
            icon="refresh"
            action="Accounting integration status refreshed."
            onAction={() => void loadData()}
          >
            Refresh data
          </ActionButton>
        )}
      />

      {loadError ? (
        <div className="accounting-integration-status__load-error" role="alert">
          <Icon name="warning" />
          <span>{feedback || "Accounting transfer data could not be loaded."}</span>
          <button type="button" className="button-link" onClick={() => void loadData()}>Try again</button>
        </div>
      ) : null}

      <div className="metric-grid accounting-integration-status__metrics">
        {summaryMetrics.map((metric) => <SummaryCard key={metric.label} {...metric} />)}
      </div>

      <SectionCard
        title="Ready for Accounting Transfer"
        eyebrow="Validated Payroll Results"
        className="accounting-integration-status__ready-card"
      >
        <p className="accounting-integration-status__description">
          Select a completed Payroll Result to create one traceable Accounting transfer. Readiness is rechecked on the server.
        </p>
        <AccountingReadyPayrollTable
          items={data.readyRecords}
          preparingResultId={preparingResultId}
          onPrepare={(record) => void prepareTransfer(record.payrollResultId)}
        />
      </SectionCard>

      <SectionCard
        title="Integration Flow"
        eyebrow="Approved payroll to accounting system"
        className="accounting-integration-status__flow-card"
      >
        <AccountingIntegrationStatusFlow />
      </SectionCard>

      <div className="accounting-integration-status__split">
        <SectionCard
          title="System Connection Status"
          eyebrow="Current boundary status"
          className="accounting-integration-status__connection-card"
        >
          <AccountingConnectionTable items={data.connectionStatuses} />
        </SectionCard>

        <SectionCard
          title="Transfers Requiring Attention"
          eyebrow="Review failed transfer records"
          className="accounting-integration-status__attention-card"
        >
          <AccountingAttentionTable
            items={data.attention}
            onView={viewTransfer}
          />
        </SectionCard>
      </div>

      <SectionCard
        title="Synchronization History"
        eyebrow="Persisted Accounting transfer records"
        className="accounting-integration-status__history-card"
      >
        <div className="accounting-integration-status__history-tools">
          <label>
            <span>Search transfers</span>
            <input
              type="search"
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1); }}
              placeholder="Transfer, result, batch, or payroll reference"
            />
          </label>
          <label>
            <span>Transfer status</span>
            <select value={transferStatus} onChange={(event) => { setTransferStatus(event.target.value); setPage(1); }}>
              <option value="all">All transfer states</option>
              {data.transferStatusOptions.map((status) => (
                <option value={status} key={status}>{getAccountingTransferLabel(status)}</option>
              ))}
            </select>
          </label>
        </div>
        <AccountingSynchronizationTable items={data.history} onView={viewTransfer} />
        <footer className="accounting-integration-status__pagination">
          <span>Page {visiblePage} of {totalPages} · {data.total} transfer records</span>
          <div>
            <button type="button" className="accounting-integration-status__page-button" disabled={visiblePage === 1} onClick={() => setPage(visiblePage - 1)} aria-label="Previous transfer page">
              <Icon name="chevron-left" />
            </button>
            <button type="button" className="accounting-integration-status__page-button" disabled={!data.hasNext} onClick={() => setPage(visiblePage + 1)} aria-label="Next transfer page">
              <Icon name="chevron-right" />
            </button>
          </div>
        </footer>
      </SectionCard>

      <p className="accounting-integration-status__boundary-note">
        <Icon name="shield" />
        <span>
          <StatusBadge tone="info">Local preparation only</StatusBadge>
          {data.providerNote}
        </span>
      </p>

      <span className="sr-only" aria-live="polite">{feedback}</span>

      {selectedTransfer ? (
        <AccountingTransferDetailsDialog
          transfer={selectedTransfer}
          onClose={() => setSelectedTransferId(null)}
        />
      ) : null}
    </div>
  );
}
