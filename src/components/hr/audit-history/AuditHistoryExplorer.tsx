"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Icon } from "@/components/ui/Icon";
import type { HrAuditHistoryData } from "@/server/hr/audit-history.service";
import type { HrAuditHistoryQuery } from "@/types/hr-audit-history";

import { AuditEventDrawer } from "./AuditEventDrawer";
import { AuditHistoryFilters } from "./AuditHistoryFilters";
import { AuditHistorySummary } from "./AuditHistorySummary";
import { AuditHistoryTable } from "./AuditHistoryTable";

const allValue = "all";

type AuditHistoryExplorerProps = {
  data: HrAuditHistoryData;
  query: HrAuditHistoryQuery;
  loadError?: boolean;
};

function buildQueryString(query: HrAuditHistoryQuery) {
  const params = new URLSearchParams();

  if (query.search) params.set("search", query.search);
  if (query.fromDate) params.set("from", query.fromDate);
  if (query.toDate) params.set("to", query.toDate);
  if (query.action) params.set("action", query.action);
  if (query.area) params.set("area", query.area);
  if (query.actorRole) params.set("actorRole", query.actorRole);
  if (query.outcome) params.set("outcome", query.outcome);
  if (query.employeeId) params.set("employeeId", query.employeeId);
  if (query.page > 1) params.set("page", String(query.page));

  return params.toString();
}

function exportRangeLabel(fromDate: string, toDate: string) {
  if (fromDate && toDate) return `${fromDate}-to-${toDate}`;
  if (fromDate) return `${fromDate}-onward`;
  if (toDate) return `through-${toDate}`;
  return "all-records";
}

export function AuditHistoryExplorer({
  data,
  query,
  loadError = false,
}: AuditHistoryExplorerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(query.search);
  const [fromDate, setFromDate] = useState(query.fromDate ?? "");
  const [toDate, setToDate] = useState(query.toDate ?? "");
  const [action, setAction] = useState(query.action ?? allValue);
  const [area, setArea] = useState(query.area ?? allValue);
  const [actorRole, setActorRole] = useState(query.actorRole ?? allValue);
  const [outcome, setOutcome] = useState(query.outcome ?? allValue);
  const [employeeId, setEmployeeId] = useState(query.employeeId ?? allValue);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));
  const currentPage = data.page;
  const pageStart = data.total === 0 ? 0 : (currentPage - 1) * data.pageSize + 1;
  const pageEnd = Math.min(currentPage * data.pageSize, data.total);
  const selectedEvent = data.events.find((event) => event.id === selectedEventId) ?? null;
  const relatedEvents = selectedEvent
    ? data.events
      .filter((event) => {
        if (selectedEvent.correctionRequest && event.correctionRequest) {
          return event.correctionRequest.id === selectedEvent.correctionRequest.id;
        }

        return event.attendanceRecordId === selectedEvent.attendanceRecordId;
      })
      .sort((first, second) => first.occurredAtTimestamp - second.occurredAtTimestamp)
    : [];
  const filterQuery: HrAuditHistoryQuery = {
    ...query,
    search,
    fromDate: fromDate || null,
    toDate: toDate || null,
    action: action === allValue ? null : action as HrAuditHistoryQuery["action"],
    area: area === allValue ? null : area as HrAuditHistoryQuery["area"],
    actorRole: actorRole === allValue ? null : actorRole,
    outcome: outcome === allValue ? null : outcome as HrAuditHistoryQuery["outcome"],
    employeeId: employeeId === allValue ? null : employeeId,
  };
  const exportQuery = buildQueryString({ ...filterQuery, page: 1 });
  const exportHref = data.total > 0
    ? `/api/v1/hr/audit-history?format=csv${exportQuery ? `&${exportQuery}` : ""}`
    : undefined;
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

    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [selectedEventId]);

  function navigateToFilters(overrides: Partial<HrAuditHistoryQuery> = {}) {
    const nextQuery: HrAuditHistoryQuery = {
      ...filterQuery,
      page: 1,
      ...overrides,
    };
    const queryString = buildQueryString(nextQuery);

    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  }

  function resetFilters() {
    router.push(pathname);
  }

  return (
    <div className="hr-audit-explorer">
      {!loadError ? <AuditHistorySummary summary={data.summary} /> : null}

      <AuditHistoryFilters
        search={search}
        fromDate={fromDate}
        toDate={toDate}
        action={action}
        area={area}
        actorRole={actorRole}
        outcome={outcome}
        employeeId={employeeId}
        actions={data.actions}
        areas={data.areas}
        actorRoles={data.actorRoles}
        outcomes={data.outcomes}
        employees={data.employees}
        activeFilterCount={activeFilterCount}
        onSearchChange={(value) => {
          setSearch(value);
          navigateToFilters({ search: value });
        }}
        onFromDateChange={(value) => {
          setFromDate(value);
          navigateToFilters({ fromDate: value || null });
        }}
        onToDateChange={(value) => {
          setToDate(value);
          navigateToFilters({ toDate: value || null });
        }}
        onActionChange={(value) => {
          setAction(value);
          navigateToFilters({ action: value === allValue ? null : value as HrAuditHistoryQuery["action"] });
        }}
        onAreaChange={(value) => {
          setArea(value);
          navigateToFilters({ area: value === allValue ? null : value as HrAuditHistoryQuery["area"] });
        }}
        onActorRoleChange={(value) => {
          setActorRole(value);
          navigateToFilters({ actorRole: value === allValue ? null : value });
        }}
        onOutcomeChange={(value) => {
          setOutcome(value);
          navigateToFilters({ outcome: value === allValue ? null : value as HrAuditHistoryQuery["outcome"] });
        }}
        onEmployeeChange={(value) => {
          setEmployeeId(value);
          navigateToFilters({ employeeId: value === allValue ? null : value });
        }}
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
              Showing {pageStart}–{pageEnd} of {data.total} events
            </span>
            {exportHref ? (
              <a className="button-secondary" href={exportHref} download={`attendance-audit-history-${exportRangeLabel(fromDate, toDate)}.csv`}>
                <Icon name="download" />
                Export CSV
              </a>
            ) : null}
          </div>
        </div>

        <AuditHistoryTable
          events={data.events}
          onSelectEvent={setSelectedEventId}
          emptyMessage={loadError
            ? "Unable to load audit history. Please refresh the page and try again."
            : "No audit events match the selected filters."}
        />

        {data.total > 0 ? (
          <nav className="hr-audit-pagination" aria-label="Audit event pages">
            <button type="button" className="button-secondary" onClick={() => navigateToFilters({ page: Math.max(1, currentPage - 1) })} disabled={currentPage === 1}>
              Previous
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button type="button" className="button-secondary" onClick={() => navigateToFilters({ page: Math.min(totalPages, currentPage + 1) })} disabled={!data.hasNext || currentPage === totalPages}>
              Next
            </button>
          </nav>
        ) : null}
      </section>

      <AuditEventDrawer event={selectedEvent} relatedEvents={relatedEvents} onClose={() => setSelectedEventId(null)} />
    </div>
  );
}
