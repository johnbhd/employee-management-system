"use client";

import { useEffect, useMemo, useState } from "react";

import { Icon } from "@/components/ui/Icon";
import { useHrWorkflow } from "@/components/layouts/hr/HrWorkflowContext";
import {
  auditActionOptions,
  auditActorRoleOptions,
  auditAreaOptions,
  auditOutcomeOptions,
  type AttendanceAuditAction,
  type AttendanceAuditActorRole,
  type AttendanceAuditArea,
  type AttendanceAuditEvent,
  type AttendanceAuditOutcome,
} from "@/data/hr-attendance-audit";

import { AuditEventDrawer } from "./AuditEventDrawer";
import { AuditHistoryFilters } from "./AuditHistoryFilters";
import { AuditHistorySummary } from "./AuditHistorySummary";
import { AuditHistoryTable } from "./AuditHistoryTable";

const allValue = "all" as const;
const pageSize = 10;

function escapeCsv(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function createAuditCsv(events: readonly AttendanceAuditEvent[]) {
  const headers = [
    "Audit Event ID",
    "Date / Time",
    "Action",
    "Actor",
    "Actor Role",
    "Employee ID",
    "Employee Name",
    "Attendance Record ID",
    "Correction Request ID",
    "Field Changed",
    "Previous Value",
    "New Value",
    "Outcome",
  ];
  const rows = events.flatMap((event) => {
    const changes = event.changes.length > 0 ? event.changes : [{ field: "—", previousValue: "—", newValue: "—" }];

    return changes.map((change) => [
      event.id,
      event.occurredAt,
      event.action,
      event.actor.name,
      event.actor.role,
      event.employee.employeeId,
      event.employee.name,
      event.attendanceRecordId,
      event.correctionRequest?.id ?? "—",
      change.field,
      change.previousValue,
      change.newValue,
      event.outcome,
    ]);
  });

  return [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
}

function exportRangeLabel(fromDate: string, toDate: string) {
  if (fromDate && toDate) return `${fromDate}-to-${toDate}`;
  if (fromDate) return `${fromDate}-onward`;
  if (toDate) return `through-${toDate}`;
  return "all-records";
}

export function AuditHistoryExplorer() {
  const { auditEvents: events } = useHrWorkflow();
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [action, setAction] = useState<AttendanceAuditAction | "all">(allValue);
  const [area, setArea] = useState<AttendanceAuditArea | "all">(allValue);
  const [actorRole, setActorRole] = useState<AttendanceAuditActorRole | "all">(allValue);
  const [outcome, setOutcome] = useState<AttendanceAuditOutcome | "all">(allValue);
  const [employeeId, setEmployeeId] = useState<string>(allValue);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const employees = useMemo(() => {
    const employeeMap = new Map(events.map((event) => [event.employee.employeeId, event.employee.name]));

    return [
      { value: allValue, label: "All employees" },
      ...Array.from(employeeMap.entries())
        .sort((first, second) => first[1].localeCompare(second[1]))
        .map(([value, label]) => ({ value, label: `${label} · ${value}` })),
    ];
  }, [events]);

  const filteredEvents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return events
      .filter((event) => {
        const searchableValues = [
          event.id,
          event.action,
          event.area,
          event.actor.name,
          event.actor.role,
          event.employee.name,
          event.employee.employeeId,
          event.attendanceRecordId,
          event.correctionRequest?.id ?? "",
          event.note ?? "",
        ];
        const matchesSearch = !normalizedSearch
          || searchableValues.some((value) => value.toLowerCase().includes(normalizedSearch));
        const matchesFromDate = !fromDate || event.occurredAtDate >= fromDate;
        const matchesToDate = !toDate || event.occurredAtDate <= toDate;
        const matchesAction = action === allValue || event.action === action;
        const matchesArea = area === allValue || event.area === area;
        const matchesActorRole = actorRole === allValue || event.actor.role === actorRole;
        const matchesOutcome = outcome === allValue || event.outcome === outcome;
        const matchesEmployee = employeeId === allValue || event.employee.employeeId === employeeId;

        return matchesSearch
          && matchesFromDate
          && matchesToDate
          && matchesAction
          && matchesArea
          && matchesActorRole
          && matchesOutcome
          && matchesEmployee;
      })
      .sort((first, second) => second.occurredAtTimestamp - first.occurredAtTimestamp);
  }, [action, actorRole, area, employeeId, events, fromDate, outcome, search, toDate]);

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const visibleEvents = filteredEvents.slice(pageStart, pageStart + pageSize);
  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? null;
  const relatedEvents = selectedEvent
    ? events
      .filter((event) => {
        if (selectedEvent.correctionRequest && event.correctionRequest) {
          return event.correctionRequest.id === selectedEvent.correctionRequest.id;
        }

        return event.attendanceRecordId === selectedEvent.attendanceRecordId;
      })
      .sort((first, second) => first.occurredAtTimestamp - second.occurredAtTimestamp)
    : [];
  const exportHref = filteredEvents.length > 0
    ? `data:text/csv;charset=utf-8,${encodeURIComponent(createAuditCsv(filteredEvents))}`
    : undefined;
  const exportFileName = `attendance-audit-history-${exportRangeLabel(fromDate, toDate)}.csv`;
  const activeFilterCount = [
    search.trim(),
    fromDate,
    toDate,
    action !== allValue ? action : "",
    area !== allValue ? area : "",
    actorRole !== allValue ? actorRole : "",
    outcome !== allValue ? outcome : "",
    employeeId !== allValue ? employeeId : "",
  ].filter(Boolean).length;

  useEffect(() => {
    if (!selectedEventId) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedEventId(null);
    }

    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [selectedEventId]);

  function resetFilters() {
    setSearch("");
    setFromDate("");
    setToDate("");
    setAction(allValue);
    setArea(allValue);
    setActorRole(allValue);
    setOutcome(allValue);
    setEmployeeId(allValue);
    setPage(1);
  }

  function updateSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function updateFromDate(value: string) {
    setFromDate(value);
    setPage(1);
  }

  function updateToDate(value: string) {
    setToDate(value);
    setPage(1);
  }

  function updateAction(value: AttendanceAuditAction | "all") {
    setAction(value);
    setPage(1);
  }

  function updateArea(value: AttendanceAuditArea | "all") {
    setArea(value);
    setPage(1);
  }

  function updateActorRole(value: AttendanceAuditActorRole | "all") {
    setActorRole(value);
    setPage(1);
  }

  function updateOutcome(value: AttendanceAuditOutcome | "all") {
    setOutcome(value);
    setPage(1);
  }

  function updateEmployee(value: string) {
    setEmployeeId(value);
    setPage(1);
  }

  return (
    <div className="hr-audit-explorer">
      <AuditHistorySummary events={filteredEvents} />

      <AuditHistoryFilters
        search={search}
        fromDate={fromDate}
        toDate={toDate}
        action={action}
        area={area}
        actorRole={actorRole}
        outcome={outcome}
        employeeId={employeeId}
        actions={auditActionOptions}
        areas={auditAreaOptions}
        actorRoles={auditActorRoleOptions}
        outcomes={auditOutcomeOptions}
        employees={employees}
        activeFilterCount={activeFilterCount}
        onSearchChange={updateSearch}
        onFromDateChange={updateFromDate}
        onToDateChange={updateToDate}
        onActionChange={updateAction}
        onAreaChange={updateArea}
        onActorRoleChange={updateActorRole}
        onOutcomeChange={updateOutcome}
        onEmployeeChange={updateEmployee}
        onReset={resetFilters}
      />

      <section className="hr-dashboard-panel hr-audit-results" aria-labelledby="hr-audit-results-heading">
        <div className="hr-audit-result-toolbar">
          <div>
            <p className="hr-section-kicker">Historical activity</p>
            <h2 id="hr-audit-results-heading">Audit events</h2>
            <p className="hr-panel-description">Review attendance workflow actions and the records they reference.</p>
          </div>
          <div className="hr-audit-result-actions">
            <span className="hr-audit-result-count" aria-live="polite">
              Showing {filteredEvents.length === 0 ? 0 : pageStart + 1}–{Math.min(pageStart + pageSize, filteredEvents.length)} of {filteredEvents.length} events
            </span>
            {exportHref ? (
              <a className="button-secondary" href={exportHref} download={exportFileName}>
                <Icon name="download" />
                Export CSV
              </a>
            ) : null}
          </div>
        </div>

        <AuditHistoryTable events={visibleEvents} onSelectEvent={setSelectedEventId} />

        {filteredEvents.length > 0 ? (
          <nav className="hr-audit-pagination" aria-label="Audit event pages">
            <button type="button" className="button-secondary" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={currentPage === 1}>
              Previous
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button type="button" className="button-secondary" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={currentPage === totalPages}>
              Next
            </button>
          </nav>
        ) : null}
      </section>

      <AuditEventDrawer event={selectedEvent} relatedEvents={relatedEvents} onClose={() => setSelectedEventId(null)} />
    </div>
  );
}
