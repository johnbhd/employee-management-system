"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { FlowDiagram } from "@/components/admin/shared/FlowDiagram";
import { ProgressList } from "@/components/admin/shared/ProgressList";
import { ActionButton } from "@/components/ui/ActionButton";
import { Icon } from "@/components/ui/Icon";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SummaryCard } from "@/components/ui/SummaryCard";
import type { AdminAuditLog, AdminAuditLogsData } from "@/types/admin-audit-logs";
import type { StatusTone } from "@/types/ui";

import { AuditLogDetailsDrawer } from "./AuditLogDetailsDrawer";
import { AuditLogsTable } from "./AuditLogsTable";

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

const outcomeTones: Record<"Successful" | "Blocked" | "Failed", StatusTone> = {
  Successful: "success",
  Blocked: "warning",
  Failed: "danger",
};

const auditFlow = [
  { label: "Workspace action", detail: "HR · payroll · accounting", icon: "layers", status: "Captured", tone: "success" },
  { label: "Audit event", detail: "Actor + timestamp", icon: "audit", status: "Recorded", tone: "info" },
  { label: "Change detail", detail: "Safe metadata", icon: "file", status: "Traceable", tone: "info" },
  { label: "Related context", detail: "Read-only review", icon: "activity", status: "Available", tone: "warning" },
] as const;

type AdminAuditLogsPageProps = {
  initialData: AdminAuditLogsData | null;
  loadError: boolean;
};

function buildQuery(filters: AuditFilters, page: number, pageSize: number) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (filters.search) params.set("search", filters.search);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.role) params.set("role", filters.role);
  if (filters.module) params.set("module", filters.module);
  if (filters.action) params.set("action", filters.action);
  if (filters.outcome) params.set("outcome", filters.outcome);
  return params.toString();
}

export function AdminAuditLogsPage({ initialData, loadError }: AdminAuditLogsPageProps) {
  const [data, setData] = useState<AdminAuditLogsData | null>(initialData);
  const [filters, setFilters] = useState<AuditFilters>(initialFilters);
  const pageSize = initialData?.pageSize ?? 10;
  const [currentPage, setCurrentPage] = useState(initialData?.page ?? 1);
  const [selectedEvent, setSelectedEvent] = useState<AdminAuditLog | null>(null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(loadError);
  const firstRequest = useRef(true);

  const fetchData = async (signal?: AbortSignal) => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch(`/api/v1/admin/audit-logs?${buildQuery(filters, currentPage, pageSize)}`, {
        cache: "no-store",
        signal,
      });
      const payload = await response.json() as { success?: boolean; data?: AdminAuditLogsData };
      if (!response.ok || !payload.success || !payload.data) throw new Error("Audit logs could not be loaded.");
      setData(payload.data);
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === "AbortError") return;
      setError(true);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    if (firstRequest.current && initialData) {
      firstRequest.current = false;
      return undefined;
    }
    firstRequest.current = false;
    const controller = new AbortController();
    void fetchData(controller.signal);
    return () => controller.abort();
  // Fetching is intentionally keyed to server-side filter state.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, currentPage, pageSize]);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedEvent(null);
    }
    if (!selectedEvent) return undefined;
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [selectedEvent]);

  const summary = data?.summary ?? { recorded: 0, successful: 0, blocked: 0, failed: 0 };
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, data ? Math.ceil(data.total / data.pageSize) : 1);
  const safePage = data?.page ?? currentPage;
  const coverage = useMemo(() => {
    const max = Math.max(...(data?.coverage.map((item) => item.count) ?? [0]), 1);
    return (data?.coverage ?? []).map((item) => ({
      label: item.module,
      value: `${item.count} event${item.count === 1 ? "" : "s"}`,
      percent: Math.round((item.count / max) * 100),
      tone: "success" as const,
    }));
  }, [data]);

  function updateFilter<Key extends keyof AuditFilters>(key: Key, value: AuditFilters[Key]) {
    setFilters((current) => ({ ...current, [key]: value }));
    setCurrentPage(1);
  }

  function resetFilters() {
    setFilters(initialFilters);
    setCurrentPage(1);
  }

  async function openDetails(eventId: string) {
    const response = await fetch(`/api/v1/admin/audit-logs/${encodeURIComponent(eventId)}`, { cache: "no-store" });
    const payload = await response.json() as { success?: boolean; data?: AdminAuditLog };
    if (response.ok && payload.success && payload.data) setSelectedEvent(payload.data);
  }

  const summaryMetrics = [
    { label: "Recorded events", value: String(summary.recorded), note: "Matching audit activity", icon: "audit" as const, tone: "info" as const },
    { label: "Successful", value: String(summary.successful), note: "Completed actions", icon: "check" as const, tone: "success" as const },
    { label: "Blocked", value: String(summary.blocked), note: "Review or follow-up", icon: "lock" as const, tone: "warning" as const },
    { label: "Failed", value: String(summary.failed), note: "Requires attention", icon: "errors" as const, tone: "danger" as const },
  ];

  return (
    <div className="admin-page audit-logs-page">
      <AdminPageHeader
        eyebrow="Traceability workspace"
        title="Audit Logs"
        description="Review application-wide activity across account access, attendance workflows, and integration handoffs."
        actions={<ActionButton icon="refresh" action="Audit activity refreshed." onAction={() => void fetchData()}>Refresh activity</ActionButton>}
      />

      {error ? (
        <section className="section-card" role="alert">
          <div className="panel-body">
            <h2>Audit logs could not be loaded.</h2>
            <p>Try again to retrieve the current server-side audit activity.</p>
            <button type="button" className="button-secondary" onClick={() => void fetchData()}>Try again</button>
          </div>
        </section>
      ) : null}

      <section className="metric-grid audit-logs-summary" aria-label="Audit activity summary">
        {summaryMetrics.map((metric) => <SummaryCard key={metric.label} {...metric} />)}
      </section>

      <SectionCard title="Audit traceability flow" eyebrow="Action to recorded context">
        <FlowDiagram className="audit-logs-flow" nodes={auditFlow} />
        <p className="data-flow-note audit-logs-flow-note">Workspace actions are represented as immutable server records with an actor, timestamp, outcome, and safe related context.</p>
      </SectionCard>

      <SectionCard title="Audit ownership" eyebrow="Application-wide boundary">
        <div className="panel-body audit-logs-ownership-grid">
          <div className="audit-logs-ownership-node"><span className="audit-logs-ownership-icon"><Icon name="users" /></span><span className="audit-logs-ownership-label">Source workspaces</span><strong>HR, Payroll, Accounting, and Admin</strong><StatusBadge tone="muted">Recorded source</StatusBadge></div>
          <span className="audit-logs-ownership-arrow" aria-hidden="true"><Icon name="arrow" /></span>
          <div className="audit-logs-ownership-node audit-logs-ownership-node-active"><span className="audit-logs-ownership-icon"><Icon name="audit" /></span><span className="audit-logs-ownership-label">Monitored layer</span><strong>Application Audit Logs</strong><StatusBadge tone="info">Read-only</StatusBadge></div>
          <span className="audit-logs-ownership-arrow" aria-hidden="true"><Icon name="arrow" /></span>
          <div className="audit-logs-ownership-node"><span className="audit-logs-ownership-icon"><Icon name="shield" /></span><span className="audit-logs-ownership-label">Review boundary</span><strong>Administrator traceability</strong><StatusBadge tone="muted">Immutable record</StatusBadge></div>
        </div>
      </SectionCard>

      <div className="audit-logs-overview">
        <SectionCard title="Coverage summary" eyebrow="Areas represented in the current result set"><div className="panel-body"><ProgressList items={coverage.length > 0 ? coverage : [{ label: "No audit activity", value: "0 events", percent: 0, tone: "default" }]} /></div></SectionCard>
        <SectionCard title="Filtered outcomes" eyebrow="Current result set">
          <div className="panel-body audit-logs-outcome-list">
            {(["Successful", "Blocked", "Failed"] as const).map((outcome) => <div className="audit-logs-outcome-row" key={outcome}><span className={`audit-logs-outcome-icon status-${outcomeTones[outcome]}`} aria-hidden="true"><Icon name={outcome === "Successful" ? "check" : outcome === "Blocked" ? "lock" : "errors"} /></span><span className="audit-logs-outcome-copy"><strong>{outcome}</strong><small>{summary[outcome.toLowerCase() as "successful" | "blocked" | "failed"]} recorded events</small></span><StatusBadge tone={outcomeTones[outcome]}>{summary[outcome.toLowerCase() as "successful" | "blocked" | "failed"]}</StatusBadge></div>)}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Activity filters" eyebrow="Narrow the recorded activity">
        <div className="audit-logs-filter-form">
          <div className="audit-logs-filter-grid">
            <label className="field audit-logs-search-field"><span>Search activity</span><input type="search" value={filters.search} onChange={(event) => updateFilter("search", event.target.value)} placeholder="Search ID, actor, module, or target" /></label>
            <label className="field"><span>From date</span><input type="date" value={filters.from} onChange={(event) => updateFilter("from", event.target.value)} /></label>
            <label className="field"><span>To date</span><input type="date" value={filters.to} onChange={(event) => updateFilter("to", event.target.value)} /></label>
            <label className="field"><span>Actor role</span><select value={filters.role} onChange={(event) => updateFilter("role", event.target.value)}><option value="">All roles</option>{(data?.options.roles ?? []).map((role) => <option key={role} value={role}>{role}</option>)}</select></label>
            <label className="field"><span>Module</span><select value={filters.module} onChange={(event) => updateFilter("module", event.target.value)}><option value="">All modules</option>{(data?.options.modules ?? []).map((module) => <option key={module} value={module}>{module}</option>)}</select></label>
            <label className="field"><span>Action</span><select value={filters.action} onChange={(event) => updateFilter("action", event.target.value)}><option value="">All actions</option>{(data?.options.actions ?? []).map((action) => <option key={action} value={action}>{action}</option>)}</select></label>
            <label className="field"><span>Outcome</span><select value={filters.outcome} onChange={(event) => updateFilter("outcome", event.target.value)}><option value="">All outcomes</option>{["Successful", "Blocked", "Failed"].map((outcome) => <option key={outcome} value={outcome}>{outcome}</option>)}</select></label>
          </div>
          <div className="audit-logs-filter-actions"><p>{loading ? "Loading audit activity…" : `${total} matching event${total === 1 ? "" : "s"}`}</p><button type="button" className="button-secondary" onClick={resetFilters}><Icon name="refresh" />Reset filters</button></div>
        </div>
      </SectionCard>

      <SectionCard title="Recorded activity" eyebrow="Newest first" actions={<StatusBadge tone="info">Read-only records</StatusBadge>}>
        <div className="table-meta audit-logs-table-meta"><span>{loading ? "Loading real audit events…" : total === 0 ? "No audit events match the selected filters." : `Showing ${(safePage - 1) * (data?.pageSize ?? pageSize) + 1}–${Math.min(safePage * (data?.pageSize ?? pageSize), total)} of ${total} events`}</span><span>Open a row to inspect its trace details.</span></div>
        <AuditLogsTable logs={data?.events ?? []} onSelectEvent={(eventId) => void openDetails(eventId)} />
        <div className="audit-logs-pagination" aria-label="Audit log pagination"><button type="button" className="button-secondary" disabled={safePage <= 1 || loading} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>Previous</button><span>Page {safePage} of {totalPages}</span><button type="button" className="button-secondary" disabled={!data?.hasNext || loading} onClick={() => setCurrentPage((page) => page + 1)}>Next</button></div>
      </SectionCard>

      <section className="audit-logs-boundary"><Icon name="shield" /><div><p className="section-kicker">Audit boundary</p><h2>Audit Logs provide traceability without changing source records.</h2><p>These records are read-only and preserve the actor, target, timestamp, outcome, and safe change metadata for important application events.</p></div></section>

      {selectedEvent ? <AuditLogDetailsDrawer event={selectedEvent} relatedEvents={[]} onClose={() => setSelectedEvent(null)} /> : null}
    </div>
  );
}
