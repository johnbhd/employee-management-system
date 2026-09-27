"use client";

import { useEffect, useMemo, useState } from "react";

import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { FlowDiagram } from "@/components/admin/shared/FlowDiagram";
import { Icon } from "@/components/ui/Icon";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SummaryCard } from "@/components/ui/SummaryCard";
import {
  adminAuditActionOptions,
  adminAuditActorRoleOptions,
  adminAuditLogs,
  adminAuditModuleOptions,
  adminAuditOutcomeOptions,
} from "@/data/admin-audit-logs";

import { AuditLogAccountingDrawer } from "./AuditLogAccountingDrawer";
import { AuditLogAccountingTable } from "./AuditLogAccountingTable";

const allValue = "all";
const pageSize = 8;

type FilterOption = {
  value: string;
  label: string;
};

function withAllOption(values: readonly string[], label: string): FilterOption[] {
  return [
    { value: allValue, label },
    ...values.map((value) => ({ value, label: value })),
  ];
}

function getRangeLabel(total: number, currentPage: number) {
  if (total === 0) return "No events to display";

  const first = (currentPage - 1) * pageSize + 1;
  const last = Math.min(currentPage * pageSize, total);

  return `Showing ${first}–${last} of ${total} events`;
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly FilterOption[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="admin-audit-accounting-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option value={option.value} key={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function AdminAuditLogAccountingPage() {
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [actor, setActor] = useState(allValue);
  const [role, setRole] = useState(allValue);
  const [module, setModule] = useState(allValue);
  const [action, setAction] = useState(allValue);
  const [outcome, setOutcome] = useState(allValue);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const actorOptions = useMemo(() => {
    const actors = Array.from(new Set(adminAuditLogs.map((event) => event.actor.name))).sort((first, second) =>
      first.localeCompare(second),
    );

    return withAllOption(actors, "All actors");
  }, []);
  const roleOptions = useMemo(() => withAllOption(adminAuditActorRoleOptions, "All roles"), []);
  const moduleOptions = useMemo(() => withAllOption(adminAuditModuleOptions, "All modules"), []);
  const actionOptions = useMemo(() => withAllOption(adminAuditActionOptions, "All action types"), []);
  const outcomeOptions = useMemo(() => withAllOption(adminAuditOutcomeOptions, "All outcomes"), []);

  const filteredEvents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return adminAuditLogs
      .filter((event) => {
        const searchableValues = [
          event.id,
          event.action,
          event.module,
          event.actor.name,
          event.actor.role,
          event.target.type,
          event.target.label,
          event.target.reference,
          event.details ?? "",
        ];
        const matchesSearch = !normalizedSearch
          || searchableValues.some((value) => value.toLowerCase().includes(normalizedSearch));
        const matchesFromDate = !fromDate || event.occurredAtDate >= fromDate;
        const matchesToDate = !toDate || event.occurredAtDate <= toDate;
        const matchesActor = actor === allValue || event.actor.name === actor;
        const matchesRole = role === allValue || event.actor.role === role;
        const matchesModule = module === allValue || event.module === module;
        const matchesAction = action === allValue || event.action === action;
        const matchesOutcome = outcome === allValue || event.outcome === outcome;

        return matchesSearch
          && matchesFromDate
          && matchesToDate
          && matchesActor
          && matchesRole
          && matchesModule
          && matchesAction
          && matchesOutcome;
      })
      .sort((first, second) => second.occurredAtTimestamp - first.occurredAtTimestamp);
  }, [action, actor, fromDate, module, outcome, role, search, toDate]);

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleEvents = filteredEvents.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selectedEvent = adminAuditLogs.find((event) => event.id === selectedEventId) ?? null;
  const relatedEvents = selectedEvent
    ? adminAuditLogs
      .filter((event) => {
        const selectedRelatedIds = selectedEvent.relatedEventIds ?? [];
        const eventRelatedIds = event.relatedEventIds ?? [];
        const sharesTarget = event.target.reference === selectedEvent.target.reference
          && event.module === selectedEvent.module;

        return event.id === selectedEvent.id
          || selectedRelatedIds.includes(event.id)
          || eventRelatedIds.includes(selectedEvent.id)
          || sharesTarget;
      })
      .sort((first, second) => first.occurredAtTimestamp - second.occurredAtTimestamp)
    : [];
  const successfulCount = filteredEvents.filter((event) => event.outcome === "Successful").length;
  const blockedCount = filteredEvents.filter((event) => event.outcome === "Blocked").length;
  const failedCount = filteredEvents.filter((event) => event.outcome === "Failed").length;
  const coveredModuleCount = new Set(filteredEvents.map((event) => event.module)).size;
  const accessEventCount = filteredEvents.filter(
    (event) => event.module === "User Accounts" || event.module === "Roles & Permissions",
  ).length;
  const attendanceEventCount = filteredEvents.filter(
    (event) => event.module === "Correction Requests"
      || event.module === "Unified Attendance"
      || event.module === "QR Attendance"
      || event.module === "Bundy / Biometric ETL",
  ).length;
  const integrationEventCount = filteredEvents.filter(
    (event) => event.module === "Integration Errors"
      || event.module === "Payroll Integration"
      || event.module === "Accounting Integration"
      || event.module === "HRPS Integration",
  ).length;
  const activeFilterCount = [
    search.trim(),
    fromDate,
    toDate,
    actor !== allValue ? actor : "",
    role !== allValue ? role : "",
    module !== allValue ? module : "",
    action !== allValue ? action : "",
    outcome !== allValue ? outcome : "",
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
    setActor(allValue);
    setRole(allValue);
    setModule(allValue);
    setAction(allValue);
    setOutcome(allValue);
    setPage(1);
  }

  function updateFilter(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  return (
    <div className="admin-page admin-audit-accounting-page">
      <AdminPageHeader
        eyebrow="Traceability workspace"
        title="Audit Logs"
        description="Review application-wide account, permission, attendance, and integration activity in chronological order."
      />

      <section className="metric-grid admin-audit-accounting-summary" aria-label="Audit activity summary">
        <SummaryCard
          label="Total events"
          value={String(filteredEvents.length)}
          note="Current record set"
          icon="audit"
          tone="info"
        />
        <SummaryCard
          label="Successful"
          value={String(successfulCount)}
          note="Completed activity"
          icon="check"
          tone="success"
        />
        <SummaryCard
          label="Blocked"
          value={String(blockedCount)}
          note="Needs attention"
          icon="warning"
          tone="warning"
        />
        <SummaryCard
          label="Failed"
          value={String(failedCount)}
          note="Recorded failures"
          icon="errors"
          tone="danger"
        />
      </section>

      <SectionCard title="Audit activity flow" eyebrow="Action to traceable record">
        <FlowDiagram
          className="admin-audit-accounting-flow"
          nodes={[
            {
              label: "Workspace action",
              detail: "Account or integration activity",
              icon: "activity",
              status: "Captured",
              tone: "info",
            },
            {
              label: "Audit record",
              detail: "Actor + reference",
              icon: "audit",
              status: "Recorded",
              tone: "success",
            },
            {
              label: "Change detail",
              detail: "Previous + new values",
              icon: "file",
              status: "Available",
              tone: "info",
            },
            {
              label: "Related activity",
              detail: "Chronological context",
              icon: "layers",
              status: "Read-only",
              tone: "muted",
            },
          ]}
        />
        <p className="data-flow-note admin-audit-accounting-flow-note">
          Recorded activity stays read-only. Selecting an event opens its actor, module, target, change details, and
          related activity without changing the source record.
        </p>
      </SectionCard>

      <SectionCard title="Audit coverage" eyebrow="Workspace modules">
        <div className="panel-body admin-audit-accounting-coverage-grid">
          <div className="admin-audit-accounting-coverage-node">
            <span className="admin-audit-accounting-coverage-icon">
              <Icon name="users" />
            </span>
            <span className="admin-audit-accounting-coverage-label">Access and permissions</span>
            <strong>{accessEventCount} events</strong>
            <StatusBadge tone="info">User Accounts · Roles</StatusBadge>
          </div>
          <span className="admin-audit-accounting-coverage-arrow" aria-hidden="true">
            <Icon name="arrow" />
          </span>
          <div className="admin-audit-accounting-coverage-node admin-audit-accounting-coverage-node-active">
            <span className="admin-audit-accounting-coverage-icon">
              <Icon name="unified" />
            </span>
            <span className="admin-audit-accounting-coverage-label">Attendance workflow</span>
            <strong>{attendanceEventCount} events</strong>
            <StatusBadge tone="success">Sources · Corrections</StatusBadge>
          </div>
          <span className="admin-audit-accounting-coverage-arrow" aria-hidden="true">
            <Icon name="arrow" />
          </span>
          <div className="admin-audit-accounting-coverage-node">
            <span className="admin-audit-accounting-coverage-icon">
              <Icon name="accounting" />
            </span>
            <span className="admin-audit-accounting-coverage-label">Integration activity</span>
            <strong>{integrationEventCount} events</strong>
            <StatusBadge tone="warning">Downstream traceability</StatusBadge>
          </div>
        </div>
      </SectionCard>

      <div className="admin-audit-accounting-overview">
        <SectionCard title="Activity filters" eyebrow="Narrow the record set">
          <div className="panel-body admin-audit-accounting-filter-panel">
            <div className="admin-audit-accounting-filter-grid">
              <label className="admin-audit-accounting-field admin-audit-accounting-search-field">
                <span>Search</span>
                <span className="admin-audit-accounting-input-wrap">
                  <Icon name="search" />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => updateFilter(setSearch, event.target.value)}
                    placeholder="Action, actor, module, or reference"
                  />
                </span>
              </label>

              <label className="admin-audit-accounting-field">
                <span>From</span>
                <input
                  type="date"
                  value={fromDate}
                  max={toDate || undefined}
                  onChange={(event) => updateFilter(setFromDate, event.target.value)}
                />
              </label>

              <label className="admin-audit-accounting-field">
                <span>To</span>
                <input
                  type="date"
                  value={toDate}
                  min={fromDate || undefined}
                  onChange={(event) => updateFilter(setToDate, event.target.value)}
                />
              </label>

              <SelectField
                label="Actor"
                value={actor}
                options={actorOptions}
                onChange={(value) => updateFilter(setActor, value)}
              />
              <SelectField
                label="Role"
                value={role}
                options={roleOptions}
                onChange={(value) => updateFilter(setRole, value)}
              />
              <SelectField
                label="Module"
                value={module}
                options={moduleOptions}
                onChange={(value) => updateFilter(setModule, value)}
              />
              <SelectField
                label="Action type"
                value={action}
                options={actionOptions}
                onChange={(value) => updateFilter(setAction, value)}
              />
              <SelectField
                label="Outcome"
                value={outcome}
                options={outcomeOptions}
                onChange={(value) => updateFilter(setOutcome, value)}
              />
            </div>
            <div className="admin-audit-accounting-filter-footer">
              <span>{activeFilterCount > 0 ? `${activeFilterCount} filters active` : "All recorded activity"}</span>
              <button type="button" className="button-secondary" onClick={resetFilters}>
                <Icon name="refresh" />
                Reset filters
              </button>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Outcome summary" eyebrow="Current filtered view">
          <div className="panel-body admin-audit-accounting-outcome-list">
            <div className="admin-audit-accounting-outcome-row">
              <span>Successful activity</span>
              <StatusBadge tone="success">{successfulCount} events</StatusBadge>
            </div>
            <div className="admin-audit-accounting-outcome-row">
              <span>Blocked activity</span>
              <StatusBadge tone="warning">{blockedCount} events</StatusBadge>
            </div>
            <div className="admin-audit-accounting-outcome-row">
              <span>Failed activity</span>
              <StatusBadge tone="danger">{failedCount} events</StatusBadge>
            </div>
            <div className="admin-audit-accounting-outcome-row">
              <span>Modules represented</span>
              <StatusBadge tone="info">{coveredModuleCount} modules</StatusBadge>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Recorded activity"
        eyebrow="Newest activity first"
        actions={<StatusBadge tone="info">Read-only records</StatusBadge>}
      >
        <div className="table-meta admin-audit-accounting-table-meta">
          <span>{getRangeLabel(filteredEvents.length, currentPage)}</span>
          <span>Page {currentPage} of {totalPages}</span>
        </div>
        <AuditLogAccountingTable events={visibleEvents} onSelectEvent={setSelectedEventId} />
        <div className="admin-audit-accounting-pagination">
          <button
            type="button"
            className="button-secondary"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={currentPage === 1}
          >
            <Icon name="arrow" className="admin-audit-accounting-arrow-previous" />
            Previous
          </button>
          <button
            type="button"
            className="button-secondary"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={currentPage === totalPages}
          >
            Next
            <Icon name="arrow" />
          </button>
        </div>
      </SectionCard>

      <section className="admin-audit-accounting-boundary">
        <Icon name="shield" />
        <div>
          <p className="section-kicker">Traceability boundary</p>
          <h2>Audit records show activity without adding mutation controls.</h2>
          <p>
            Account changes, attendance workflow events, and integration outcomes remain owned by their source
            modules. This page provides read-only context for administrator review.
          </p>
        </div>
      </section>

      <AuditLogAccountingDrawer
        event={selectedEvent}
        relatedEvents={relatedEvents}
        onClose={() => setSelectedEventId(null)}
      />
    </div>
  );
}
