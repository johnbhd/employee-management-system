"use client";

import { useEffect, useMemo, useState } from "react";

import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { FlowDiagram } from "@/components/admin/shared/FlowDiagram";
import { ProgressList } from "@/components/admin/shared/ProgressList";
import { ActionButton } from "@/components/ui/ActionButton";
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
import type { AdminAuditLog, AdminAuditOutcome } from "@/data/admin-audit-logs";
import type { StatusTone } from "@/types/ui";

import { AuditLogDetailsDrawer } from "./AuditLogDetailsDrawer";
import { AuditLogsTable } from "./AuditLogsTable";

const defaultAuditPageSize = 10;
const supportedAuditPageSizes = [10, 25, 50] as const;

type AuditFilters = {
  search: string;
  from: string;
  to: string;
  role: string;
  module: string;
  action: string;
  outcome: string;
};

const initialFilters: AuditFilters = {
  search: "",
  from: "",
  to: "",
  role: "",
  module: "",
  action: "",
  outcome: "",
};

const outcomeTones: Record<AdminAuditOutcome, StatusTone> = {
  Successful: "success",
  Blocked: "warning",
  Failed: "danger",
};

const auditFlow = [
  {
    label: "Workspace action",
    detail: "Account · role · integration",
    icon: "layers",
    status: "Captured",
    tone: "success",
  },
  {
    label: "Audit event",
    detail: "Actor + timestamp",
    icon: "audit",
    status: "Recorded",
    tone: "info",
  },
  {
    label: "Change detail",
    detail: "Before + after values",
    icon: "file",
    status: "Traceable",
    tone: "info",
  },
  {
    label: "Related context",
    detail: "Linked activity",
    icon: "activity",
    status: "Available",
    tone: "warning",
  },
] as const;

function countOutcome(outcome: AdminAuditOutcome) {
  return adminAuditLogs.filter((event) => event.outcome === outcome).length;
}

function includesSearchText(event: AdminAuditLog, search: string) {
  if (!search.trim()) return true;

  const searchableText = [
    event.id,
    event.action,
    event.module,
    event.actor.name,
    event.actor.role,
    event.target.reference,
    event.target.label,
    event.details,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchableText.includes(search.trim().toLowerCase());
}

export function AdminAuditLogsPage() {
  const [filters, setFilters] = useState<AuditFilters>(initialFilters);
  const [pageSize, setPageSize] = useState<number>(defaultAuditPageSize);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const filteredLogs = useMemo(() => {
    return [...adminAuditLogs]
      .sort((first, second) => second.occurredAtTimestamp - first.occurredAtTimestamp)
      .filter((event) => {
        if (!includesSearchText(event, filters.search)) return false;
        if (filters.from && event.occurredAtDate < filters.from) return false;
        if (filters.to && event.occurredAtDate > filters.to) return false;
        if (filters.role && event.actor.role !== filters.role) return false;
        if (filters.module && event.module !== filters.module) return false;
        if (filters.action && event.action !== filters.action) return false;
        if (filters.outcome && event.outcome !== filters.outcome) return false;

        return true;
      });
  }, [filters]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const visibleLogs = filteredLogs.slice((safePage - 1) * pageSize, safePage * pageSize);
  const selectedEvent = selectedEventId
    ? adminAuditLogs.find((event) => event.id === selectedEventId) ?? null
    : null;
  const relatedEvents = selectedEvent?.relatedEventIds
    ? selectedEvent.relatedEventIds
        .map((eventId) => adminAuditLogs.find((event) => event.id === eventId))
        .filter((event): event is AdminAuditLog => Boolean(event))
    : [];

  const summaryMetrics = [
    {
      label: "Recorded events",
      value: String(adminAuditLogs.length),
      note: "Application-wide activity",
      icon: "audit" as const,
      tone: "info" as const,
    },
    {
      label: "Successful",
      value: String(countOutcome("Successful")),
      note: "Completed actions",
      icon: "check" as const,
      tone: "success" as const,
    },
    {
      label: "Blocked",
      value: String(countOutcome("Blocked")),
      note: "Review or follow-up",
      icon: "lock" as const,
      tone: "warning" as const,
    },
    {
      label: "Failed",
      value: String(countOutcome("Failed")),
      note: "Requires attention",
      icon: "errors" as const,
      tone: "danger" as const,
    },
  ];

  const outcomeSummary = adminAuditOutcomeOptions.map((outcome) => ({
    label: outcome,
    count: filteredLogs.filter((event) => event.outcome === outcome).length,
    tone: outcomeTones[outcome],
  }));

  function updateFilter<Key extends keyof AuditFilters>(key: Key, value: AuditFilters[Key]) {
    setFilters((current) => ({ ...current, [key]: value }));
    setCurrentPage(1);
  }

  function resetFilters() {
    setFilters(initialFilters);
    setCurrentPage(1);
  }

  useEffect(() => {
    const storedSettings = window.localStorage.getItem("au-jsc-admin-settings");
    if (!storedSettings) return;

    try {
      const settings = JSON.parse(storedSettings) as {
        auditPageSize?: number;
        auditOutcome?: string;
      };

      const storedPageSize = settings.auditPageSize && supportedAuditPageSizes.includes(settings.auditPageSize as 10 | 25 | 50)
        ? settings.auditPageSize
        : undefined;
      const storedOutcome = settings.auditOutcome && ["Successful", "Blocked", "Failed"].includes(settings.auditOutcome)
        ? settings.auditOutcome
        : undefined;
      const hydrationId = window.setTimeout(() => {
        if (storedPageSize) setPageSize(storedPageSize);
        if (storedOutcome) setFilters((current) => ({ ...current, outcome: storedOutcome }));
      }, 0);

      return () => window.clearTimeout(hydrationId);
    } catch {
      // Ignore malformed browser preferences and keep the default audit view.
    }
  }, []);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedEventId(null);
    }

    if (!selectedEvent) return undefined;

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [selectedEvent]);

  return (
    <div className="admin-page audit-logs-page">
      <AdminPageHeader
        eyebrow="Traceability workspace"
        title="Audit Logs"
        description="Review application-wide activity across account access, attendance workflows, and integration handoffs."
        actions={(
          <ActionButton icon="refresh" action="Audit activity refreshed in the prototype.">
            Refresh activity
          </ActionButton>
        )}
      />

      <section className="metric-grid audit-logs-summary" aria-label="Audit activity summary">
        {summaryMetrics.map((metric) => (
          <SummaryCard key={metric.label} {...metric} />
        ))}
      </section>

      <SectionCard title="Audit traceability flow" eyebrow="Action to recorded context">
        <FlowDiagram className="audit-logs-flow" nodes={auditFlow} />
        <p className="data-flow-note audit-logs-flow-note">
          Workspace actions are represented as read-only records with an actor, timestamp, outcome, and related
          context. The audit workspace does not change the source module or external system.
        </p>
      </SectionCard>

      <SectionCard title="Audit ownership" eyebrow="Application-wide boundary">
        <div className="panel-body audit-logs-ownership-grid">
          <div className="audit-logs-ownership-node">
            <span className="audit-logs-ownership-icon">
              <Icon name="users" />
            </span>
            <span className="audit-logs-ownership-label">Source workspaces</span>
            <strong>Admin, HR, and Employee actions</strong>
            <StatusBadge tone="muted">Recorded source</StatusBadge>
          </div>
          <span className="audit-logs-ownership-arrow" aria-hidden="true">
            <Icon name="arrow" />
          </span>
          <div className="audit-logs-ownership-node audit-logs-ownership-node-active">
            <span className="audit-logs-ownership-icon">
              <Icon name="audit" />
            </span>
            <span className="audit-logs-ownership-label">Monitored layer</span>
            <strong>Application Audit Logs</strong>
            <StatusBadge tone="info">Read-only</StatusBadge>
          </div>
          <span className="audit-logs-ownership-arrow" aria-hidden="true">
            <Icon name="arrow" />
          </span>
          <div className="audit-logs-ownership-node">
            <span className="audit-logs-ownership-icon">
              <Icon name="shield" />
            </span>
            <span className="audit-logs-ownership-label">Review boundary</span>
            <strong>Administrator traceability</strong>
            <StatusBadge tone="muted">Prototype record</StatusBadge>
          </div>
        </div>
      </SectionCard>

      <div className="audit-logs-overview">
        <SectionCard title="Coverage summary" eyebrow="Areas represented in the log">
          <div className="panel-body">
            <ProgressList
              items={[
                { label: "Access and permissions", value: "3 events", percent: 86, tone: "success" },
                { label: "Attendance workflow", value: "3 events", percent: 62, tone: "warning" },
                { label: "Integration activity", value: "9 events", percent: 100, tone: "success" },
              ]}
            />
          </div>
        </SectionCard>

        <SectionCard title="Filtered outcomes" eyebrow="Current result set">
          <div className="panel-body audit-logs-outcome-list">
            {outcomeSummary.map((item) => (
              <div className="audit-logs-outcome-row" key={item.label}>
                <span className={`audit-logs-outcome-icon status-${item.tone}`} aria-hidden="true">
                  <Icon name={item.label === "Successful" ? "check" : item.label === "Blocked" ? "lock" : "errors"} />
                </span>
                <span className="audit-logs-outcome-copy">
                  <strong>{item.label}</strong>
                  <small>{item.count} recorded events</small>
                </span>
                <StatusBadge tone={item.tone}>{item.count}</StatusBadge>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Activity filters" eyebrow="Narrow the recorded activity">
        <div className="audit-logs-filter-form">
          <div className="audit-logs-filter-grid">
            <label className="field audit-logs-search-field">
              <span>Search activity</span>
              <input
                type="search"
                value={filters.search}
                onChange={(event) => updateFilter("search", event.target.value)}
                placeholder="Search ID, actor, module, or target"
              />
            </label>
            <label className="field">
              <span>From date</span>
              <input type="date" value={filters.from} onChange={(event) => updateFilter("from", event.target.value)} />
            </label>
            <label className="field">
              <span>To date</span>
              <input type="date" value={filters.to} onChange={(event) => updateFilter("to", event.target.value)} />
            </label>
            <label className="field">
              <span>Actor role</span>
              <select value={filters.role} onChange={(event) => updateFilter("role", event.target.value)}>
                <option value="">All roles</option>
                {adminAuditActorRoleOptions.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Module</span>
              <select value={filters.module} onChange={(event) => updateFilter("module", event.target.value)}>
                <option value="">All modules</option>
                {adminAuditModuleOptions.map((module) => <option key={module} value={module}>{module}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Action</span>
              <select value={filters.action} onChange={(event) => updateFilter("action", event.target.value)}>
                <option value="">All actions</option>
                {adminAuditActionOptions.map((action) => <option key={action} value={action}>{action}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Outcome</span>
              <select value={filters.outcome} onChange={(event) => updateFilter("outcome", event.target.value)}>
                <option value="">All outcomes</option>
                {adminAuditOutcomeOptions.map((outcome) => <option key={outcome} value={outcome}>{outcome}</option>)}
              </select>
            </label>
          </div>
          <div className="audit-logs-filter-actions">
            <p>{filteredLogs.length} matching events</p>
            <button type="button" className="button-secondary" onClick={resetFilters}>
              <Icon name="refresh" />
              Reset filters
            </button>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Recorded activity"
        eyebrow="Newest first"
        actions={<StatusBadge tone="info">Read-only records</StatusBadge>}
      >
        <div className="table-meta audit-logs-table-meta">
          <span>
            {filteredLogs.length === 0
              ? "No events match the selected filters."
              : `Showing ${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filteredLogs.length)} of ${filteredLogs.length} events`}
          </span>
          <span>Open a row to inspect its trace details.</span>
        </div>
        <AuditLogsTable logs={visibleLogs} onSelectEvent={setSelectedEventId} />
        <div className="audit-logs-pagination" aria-label="Audit log pagination">
          <button
            type="button"
            className="button-secondary"
            disabled={safePage <= 1}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
          >
            Previous
          </button>
          <span>Page {safePage} of {totalPages}</span>
          <button
            type="button"
            className="button-secondary"
            disabled={safePage >= totalPages}
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
          >
            Next
          </button>
        </div>
      </SectionCard>

      <section className="audit-logs-boundary">
        <Icon name="shield" />
        <div>
          <p className="section-kicker">Audit boundary</p>
          <h2>Audit Logs provide traceability without changing source records.</h2>
          <p>
            This prototype shows deterministic application activity. It does not persist audit changes, contact HRPS,
            Payroll, Accounting, or attendance systems, or replace each source workspace&apos;s ownership.
          </p>
        </div>
      </section>

      {selectedEvent ? (
        <AuditLogDetailsDrawer event={selectedEvent} relatedEvents={relatedEvents} onClose={() => setSelectedEventId(null)} />
      ) : null}
    </div>
  );
}
