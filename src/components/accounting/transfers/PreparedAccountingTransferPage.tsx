"use client";

import Link from "next/link";
import { useState } from "react";

import { getAccountingTransferLabel, getAccountingTransferTone } from "@/data/accounting/approved-payroll";
import { formatCampusDateTime } from "@/lib/campus-time";
import { apiRequest } from "@/lib/api/client";
import type { ApiSuccessResponse } from "@/types/api/responses";
import type { AccountingTransferRecord } from "@/types/accounting-transfers";

import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { Icon } from "@/components/ui/Icon";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";

type PreparedAccountingTransferPageProps = {
  transfer: AccountingTransferRecord;
  canSubmit: boolean;
  canAcknowledge: boolean;
};

function formatTimestamp(value: string | null) {
  return value ? formatCampusDateTime(new Date(value)) : "Not available";
}

export function PreparedAccountingTransferPage({
  transfer,
  canSubmit: canSubmitPermission,
  canAcknowledge: canAcknowledgePermission,
}: PreparedAccountingTransferPageProps) {
  const [currentTransfer, setCurrentTransfer] = useState(transfer);
  const [isBusy, setIsBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const snapshot = currentTransfer.snapshot;

  async function loadTransfer() {
    try {
      const response = await apiRequest<ApiSuccessResponse<AccountingTransferRecord>>(
        `/api/accounting/transfers/${encodeURIComponent(currentTransfer.transferId)}`,
        { cache: "no-store" },
      );
      setCurrentTransfer(response.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "The transfer status could not be refreshed.");
    }
  }

  async function runAction(
    endpoint: string,
    confirmation: string,
    successMessage: string,
  ) {
    if (!window.confirm(confirmation)) return;

    setIsBusy(true);
    setError("");
    setFeedback("");
    try {
      const response = await apiRequest<ApiSuccessResponse<AccountingTransferRecord>>(
        endpoint,
        {
          method: "POST",
          ...(endpoint.endsWith("/transfers")
            ? { body: JSON.stringify({ transferId: currentTransfer.transferId }) }
            : {}),
        },
      );
      setCurrentTransfer(response.data);
      setFeedback(successMessage);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "The Accounting operation could not be completed.");
      await loadTransfer();
    } finally {
      setIsBusy(false);
    }
  }

  const canSubmit = canSubmitPermission && currentTransfer.transferStatus === "prepared";
  const canRetry = canSubmitPermission
    && currentTransfer.transferStatus === "failed"
    && currentTransfer.attemptCount < 3;
  const canCheckAcknowledgement = canAcknowledgePermission
    && currentTransfer.transferStatus === "submitted"
    && currentTransfer.acknowledgementStatus !== "accepted"
    && currentTransfer.acknowledgementStatus !== "rejected";

  return (
    <div className="accounting-prepared-transfer">
      <AdminPageHeader
        eyebrow="Prepared Accounting transfer"
        title={currentTransfer.transferId}
        description="Submit the immutable Payroll snapshot, review acknowledgement, and retry only technical failures."
        actions={(
          <Link href="/accounting/approved-payroll" className="button-secondary">
            <Icon name="arrow" />
            Back to Payroll Results
          </Link>
        )}
      />

      <div className="accounting-prepared-transfer__notice" role="status">
        <Icon name="shield" />
        <div>
          <strong>
            {currentTransfer.transferStatus === "prepared"
              ? "Prepared locally — not submitted"
              : currentTransfer.transferStatus === "submitted"
                ? currentTransfer.acknowledgementStatus === "accepted"
                  ? "Acknowledged by the simulated Accounting System"
                  : currentTransfer.acknowledgementStatus === "rejected"
                    ? "Rejected by the simulated Accounting System"
                    : "Submitted — acknowledgement pending"
                : currentTransfer.transferStatus === "failed"
                  ? "Technical handoff failure"
                  : "Accounting handoff in progress"}
          </strong>
          <span>
            The adapter is simulated. Acknowledgement does not mean journal posting, and no Accounting computation is performed here.
          </span>
        </div>
      </div>

      {error ? <p className="accounting-prepared-transfer__feedback is-error" role="alert">{error}</p> : null}
      {feedback ? <p className="accounting-prepared-transfer__feedback" role="status">{feedback}</p> : null}

      <div className="accounting-prepared-transfer__actions" aria-label="Accounting transfer actions">
        {canSubmit ? (
          <button
            type="button"
            className="button-primary"
            disabled={isBusy}
            onClick={() => void runAction(
              "/api/accounting/transfers",
              "Submit this immutable prepared snapshot to the simulated Accounting adapter?",
              "Transfer submitted. The acknowledgement remains pending until checked.",
            )}
          >
            {isBusy ? "Submitting..." : "Submit to Accounting"}
          </button>
        ) : null}
        {canRetry ? (
          <button
            type="button"
            className="button-primary"
            disabled={isBusy}
            onClick={() => void runAction(
              `/api/accounting/transfers/${encodeURIComponent(currentTransfer.transferId)}/retry`,
              "Retry this technical Accounting handoff using the same transfer identity and prepared snapshot?",
              "Retry submitted using the same prepared snapshot.",
            )}
          >
            {isBusy ? "Retrying..." : `Retry transfer (${currentTransfer.attemptCount}/3)`}
          </button>
        ) : null}
        {canCheckAcknowledgement ? (
          <button
            type="button"
            className="button-secondary"
            disabled={isBusy}
            onClick={() => void runAction(
              `/api/accounting/transfers/${encodeURIComponent(currentTransfer.transferId)}/acknowledgement`,
              "Check the simulated Accounting acknowledgement for this submitted transfer?",
              "Acknowledgement status refreshed.",
            )}
          >
            {isBusy ? "Checking..." : "Check acknowledgement"}
          </button>
        ) : null}
        <button type="button" className="button-secondary" disabled={isBusy} onClick={() => void loadTransfer()}>
          Refresh status
        </button>
      </div>

      <div className="accounting-prepared-transfer__status-row">
        <StatusBadge tone={getAccountingTransferTone(currentTransfer.transferStatus)}>
          {getAccountingTransferLabel(currentTransfer.transferStatus)}
        </StatusBadge>
        <StatusBadge tone={currentTransfer.acknowledgementStatus === "accepted" ? "success" : currentTransfer.acknowledgementStatus === "rejected" ? "danger" : "warning"}>
          Acknowledgement: {currentTransfer.acknowledgementStatus.replaceAll("_", " ")}
        </StatusBadge>
        <span>Source: {snapshot?.source.mode === "simulated-payroll" ? "Simulated Payroll Result" : "Existing Payroll System Result"}</span>
      </div>

      <SectionCard title="Transfer details" eyebrow="Immutable preparation metadata">
        <dl className="accounting-prepared-transfer__details-grid">
          <div><dt>Transfer reference</dt><dd>{currentTransfer.transferId}</dd></div>
          <div><dt>Payroll Result</dt><dd>{currentTransfer.payrollResultId}</dd></div>
          <div><dt>Payroll batch</dt><dd>{currentTransfer.payrollBatchId}</dd></div>
          <div><dt>Payroll handoff</dt><dd>{currentTransfer.payrollHandoffId}</dd></div>
          <div><dt>Payroll period</dt><dd>{currentTransfer.period.label}</dd></div>
          <div><dt>External Payroll reference</dt><dd>{currentTransfer.externalPayrollReference}</dd></div>
          <div><dt>Prepared by</dt><dd>{currentTransfer.preparedBy?.displayName ?? currentTransfer.submittedBy.displayName}</dd></div>
          <div><dt>Prepared at</dt><dd>{formatTimestamp(currentTransfer.preparedAt ?? currentTransfer.submittedAt)}</dd></div>
          <div><dt>Last attempt</dt><dd>{formatTimestamp(currentTransfer.lastAttemptAt)}</dd></div>
          <div><dt>Accounting status</dt><dd>{getAccountingTransferLabel(currentTransfer.transferStatus)}</dd></div>
          <div><dt>Accounting reference</dt><dd>{currentTransfer.externalAccountingReference ?? "Not assigned"}</dd></div>
          <div><dt>Attempt count</dt><dd>{currentTransfer.attemptCount}</dd></div>
          <div><dt>Record count</dt><dd>{currentTransfer.employeeCount}</dd></div>
        </dl>
      </SectionCard>

      <SectionCard title="Prepared snapshot" eyebrow="Read-only Payroll output">
        {snapshot ? (
          <>
            <dl className="accounting-prepared-transfer__details-grid">
              <div><dt>Result status</dt><dd>{snapshot.payroll.resultStatus}</dd></div>
              <div><dt>Payroll provider</dt><dd>{snapshot.source.provider}</dd></div>
              <div><dt>Processed employees</dt><dd>{snapshot.summary.processedCount}</dd></div>
              <div><dt>Pending employees</dt><dd>{snapshot.summary.pendingCount}</dd></div>
              <div><dt>Rejected employees</dt><dd>{snapshot.summary.rejectedCount}</dd></div>
              <div><dt>Failed employees</dt><dd>{snapshot.summary.failedCount}</dd></div>
              <div><dt>Payslips available</dt><dd>{snapshot.summary.payslipAvailableCount}</dd></div>
              <div><dt>Snapshot items</dt><dd>{snapshot.items.length}</dd></div>
            </dl>

            <div className="accounting-prepared-transfer__items-wrap">
              <table className="data-table accounting-prepared-transfer__items-table">
                <caption className="sr-only">Prepared Payroll Result employee output</caption>
                <thead>
                  <tr>
                    <th scope="col">Employee</th>
                    <th scope="col">Department</th>
                    <th scope="col">Processing</th>
                    <th scope="col">Payslip</th>
                    <th scope="col">Issue</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.items.map((item) => (
                    <tr key={`${item.employeeId}-${item.externalEmployeeReference}`}>
                      <td>{item.employeeName}<small>{item.employeeId}</small></td>
                      <td>{item.department}</td>
                      <td>{item.processingStatus}</td>
                      <td>{item.payslipStatus}</td>
                      <td>{item.issueSummary ?? "None"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="accounting-prepared-transfer__empty" role="status">
            This transfer has no stored prepared snapshot and cannot be submitted safely.
          </p>
        )}
      </SectionCard>

      <p className="accounting-prepared-transfer__boundary-note">
        <Icon name="shield" />
        The snapshot is read-only and contains Payroll output summaries only. No salary calculation, journal entry, or ledger posting is performed here.
      </p>
    </div>
  );
}
