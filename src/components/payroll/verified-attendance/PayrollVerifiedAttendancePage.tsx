"use client";

import { useEffect, useMemo, useState } from "react";

import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { ActionButton } from "@/components/ui/ActionButton";
import { Icon } from "@/components/ui/Icon";
import { SectionCard } from "@/components/ui/SectionCard";
import { SummaryCard } from "@/components/ui/SummaryCard";
import {
  payrollVerifiedAttendanceDepartments,
  payrollVerifiedAttendanceRecords,
  type PayrollBatchFilter,
  type PayrollReadinessFilter,
  type PayrollVerifiedAttendanceRecord,
  verifiedAttendanceSummaryMetrics,
} from "@/data/payroll/verified-attendance";

import { PayrollVerifiedAttendanceDetailsModal } from "./PayrollVerifiedAttendanceDetailsModal";
import { PayrollVerifiedAttendanceFilters } from "./PayrollVerifiedAttendanceFilters";
import { PayrollVerifiedAttendanceTable } from "./PayrollVerifiedAttendanceTable";

export function PayrollVerifiedAttendancePage() {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [readiness, setReadiness] = useState<PayrollReadinessFilter | "">("");
  const [batch, setBatch] = useState<PayrollBatchFilter | "">("");
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());
  const [selectedRecord, setSelectedRecord] = useState<PayrollVerifiedAttendanceRecord | null>(null);
  const [feedback, setFeedback] = useState("");

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return payrollVerifiedAttendanceRecords.filter((record) => {
      const matchesSearch = !query
        || record.employeeName.toLowerCase().includes(query)
        || record.employeeId.toLowerCase().includes(query)
        || record.department.toLowerCase().includes(query);
      const matchesDepartment = !department || record.department === department;
      const matchesReadiness = !readiness || record.readinessFilter === readiness;
      const matchesBatch = !batch || record.batchFilter === batch;

      return matchesSearch && matchesDepartment && matchesReadiness && matchesBatch;
    });
  }, [batch, department, readiness, search]);

  useEffect(() => {
    if (!selectedRecord) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedRecord(null);
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [selectedRecord]);

  function showFeedback(message: string) {
    setFeedback(message);
    window.setTimeout(() => setFeedback(""), 2400);
  }

  function toggleAllVisible(checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);
      filteredRecords.forEach((record) => {
        if (checked) next.add(record.employeeId);
        else next.delete(record.employeeId);
      });
      return next;
    });
  }

  function toggleRecord(employeeId: string, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(employeeId);
      else next.delete(employeeId);
      return next;
    });
  }

  function clearFilters() {
    setSearch("");
    setDepartment("");
    setReadiness("");
    setBatch("");
  }

  function addSelectedToBatch() {
    if (selectedIds.size === 0) {
      showFeedback("Select at least one attendance record before adding to a batch.");
      return;
    }

    showFeedback(`${selectedIds.size} selected record${selectedIds.size === 1 ? "" : "s"} queued for a draft batch. No external write was made.`);
  }

  return (
    <div className="payroll-verified-attendance">
      <AdminPageHeader
        eyebrow="Payroll readiness"
        title="Verified Attendance"
        description="Review HR-verified attendance records that are eligible for payroll preparation and handoff."
        actions={<ActionButton icon="refresh" action="Verified attendance data refreshed.">Refresh data</ActionButton>}
      />

      <p className="payroll-verified-attendance__period">
        <Icon name="calendar" />
        Payroll period: September 1–15, 2026
      </p>

      <div className="metric-grid payroll-verified-attendance__summary">
        {verifiedAttendanceSummaryMetrics.map((metric) => <SummaryCard key={metric.label} {...metric} />)}
      </div>

      <SectionCard
        title="Verified Attendance Records"
        eyebrow="Employee records"
        className="payroll-verified-attendance__records-card"
        actions={(
          <div className="payroll-verified-attendance__header-actions">
            <button type="button" className="button-secondary" onClick={clearFilters}>Clear filters</button>
            <button
              type="button"
              className="button-primary"
              onClick={addSelectedToBatch}
              disabled={selectedIds.size === 0}
            >
              <Icon name="layers" /> Add to batch ({selectedIds.size})
            </button>
          </div>
        )}
      >
        <p className="payroll-verified-attendance__description">
          List of employees with HR-verified attendance for the selected payroll period.
        </p>

        <PayrollVerifiedAttendanceFilters
          search={search}
          department={department}
          readiness={readiness}
          batch={batch}
          departments={payrollVerifiedAttendanceDepartments}
          onSearchChange={setSearch}
          onDepartmentChange={setDepartment}
          onReadinessChange={setReadiness}
          onBatchChange={setBatch}
          onReset={clearFilters}
        />

        <p className="payroll-verified-attendance__result-meta" aria-live="polite">
          Showing {filteredRecords.length ? `1 to ${filteredRecords.length}` : "0"} of 124 records · {filteredRecords.length} sample records loaded
        </p>

        <PayrollVerifiedAttendanceTable
          records={filteredRecords}
          selectedIds={selectedIds}
          onToggleAll={toggleAllVisible}
          onToggleRecord={toggleRecord}
          onViewDetails={setSelectedRecord}
          onAddToBatch={(record) => {
            toggleRecord(record.employeeId, true);
            showFeedback(`${record.employeeName} selected for the draft batch. No external write was made.`);
          }}
          onMarkReview={(record) => showFeedback(`${record.employeeName} marked for HR follow-up. No verification was changed.`)}
        />

        <footer className="payroll-verified-attendance__pagination">
          <span>Sample data shows the first five records from the 124-record payroll period.</span>
          <nav aria-label="Verified attendance pages">
            <button type="button" className="payroll-verified-attendance__page-button" disabled aria-label="Previous page">
              <Icon name="chevron-left" />
            </button>
            <button type="button" className="payroll-verified-attendance__page-button is-active" aria-current="page">1</button>
            <button type="button" className="payroll-verified-attendance__page-button" onClick={() => showFeedback("Additional payroll records are not connected in this prototype.")}>2</button>
            <button type="button" className="payroll-verified-attendance__page-button" onClick={() => showFeedback("Additional payroll records are not connected in this prototype.")}>3</button>
            <button type="button" className="payroll-verified-attendance__page-button" onClick={() => showFeedback("Additional payroll records are not connected in this prototype.")}>4</button>
            <span aria-hidden="true">…</span>
            <button type="button" className="payroll-verified-attendance__page-button" onClick={() => showFeedback("Additional payroll records are not connected in this prototype.")}>25</button>
            <button type="button" className="payroll-verified-attendance__page-button" onClick={() => showFeedback("Additional payroll records are not connected in this prototype.")} aria-label="Next page">
              <Icon name="chevron-right" />
            </button>
          </nav>
        </footer>
      </SectionCard>

      <p className="payroll-verified-attendance__boundary-note">
        <Icon name="shield" />
        Payroll Staff can review HR-verified records and prepare batch selections here. HR verification, attendance correction decisions, salary calculations, and external payroll writes remain outside this workspace.
      </p>

      <span className="sr-only" aria-live="polite">{feedback}</span>
      <PayrollVerifiedAttendanceDetailsModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />
    </div>
  );
}
