"use client";

import { useEffect, useMemo, useState } from "react";

import { Icon } from "@/components/ui/Icon";
import { SectionCard } from "@/components/ui/SectionCard";
import {
  adminAuditActionOptions,
  adminAuditActorRoleOptions,
  adminAuditLogs,
  adminAuditModuleOptions,
  adminAuditOutcomeOptions,
  type AdminAuditLog,
} from "@/data/admin-audit-logs";

import { AuditLogDetailsDrawer } from "./AuditLogDetailsDrawer";
import { AuditLogsFilters } from "./AuditLogsFilters";
import { AuditLogsSummary } from "./AuditLogsSummary";
import { AuditLogsTable } from "./AuditLogsTable";

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

function getActorOptions(events: readonly AdminAuditLog[]) {
  const actors = Array.from(new Set(events.map((event) => event.actor.name))).sort((first, second) =>
    first.localeCompare(second),
  );

  return withAllOption(actors, "All actors");
}

function getVisibleRange(total: number, currentPage: number) {
  if (total === 0) return "No events to display";

  const first = (currentPage - 1) * pageSize + 1;
  const last = Math.min(currentPage * pageSize, total);

  return `Showing ${first}–${last} of ${total} events`;
}

export function AuditLogsExplorer() {
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

  const actorOptions = useMemo(() => getActorOptions(adminAuditLogs), []);
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
  const pageStart = (currentPage - 1) * pageSize;
  const visibleEvents = filteredEvents.slice(pageStart, pageStart + pageSize);
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
    <div className="admin-audit-explorer">
      <AuditLogsSummary events={adminAuditLogs} />

      <AuditLogsFilters
        search={search}
        fromDate={fromDate}
        toDate={toDate}
        actor={actor}
        role={role}
        module={module}
        action={action}
        outcome={outcome}
        actors={actorOptions}
        roles={roleOptions}
        modules={moduleOptions}
        actions={actionOptions}
        outcomes={outcomeOptions}
        activeFilterCount={activeFilterCount}
        onSearchChange={(value) => updateFilter(setSearch, value)}
        onFromDateChange={(value) => updateFilter(setFromDate, value)}
        onToDateChange={(value) => updateFilter(setToDate, value)}
        onActorChange={(value) => updateFilter(setActor, value)}
        onRoleChange={(value) => updateFilter(setRole, value)}
        onModuleChange={(value) => updateFilter(setModule, value)}
        onActionChange={(value) => updateFilter(setAction, value)}
        onOutcomeChange={(value) => updateFilter(setOutcome, value)}
        onReset={resetFilters}
      />

      <SectionCard
        className="admin-audit-results-card"
        title="Audit events"
        eyebrow="Newest activity first"
        actions={<span className="admin-audit-readonly-label">Read-only records</span>}
      >
        <div className="admin-audit-result-toolbar">
          <p className="admin-audit-result-count" aria-live="polite">
            {getVisibleRange(filteredEvents.length, currentPage)}
          </p>
        </div>

        <AuditLogsTable events={visibleEvents} onSelectEvent={setSelectedEventId} />

        <div className="admin-audit-pagination">
          <span>{getVisibleRange(filteredEvents.length, currentPage)}</span>
          <div className="admin-audit-pagination-actions">
            <button
              type="button"
              className="button-secondary"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={currentPage === 1}
            >
              <Icon name="arrow" className="admin-audit-arrow-previous" />
              Previous
            </button>
            <span className="admin-audit-page-number" aria-label={`Page ${currentPage} of ${totalPages}`}>
              Page {currentPage} of {totalPages}
            </span>
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
        </div>
      </SectionCard>

      <AuditLogDetailsDrawer
        event={selectedEvent}
        relatedEvents={relatedEvents}
        onClose={() => setSelectedEventId(null)}
      />
    </div>
  );
}
