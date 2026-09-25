import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { ActionButton } from "@/components/ui/ActionButton";
import { Icon } from "@/components/ui/Icon";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SummaryCard } from "@/components/ui/SummaryCard";
import {
  integrationErrorSources,
  integrationErrors,
  resolutionHistory,
  type IntegrationErrorSource,
} from "@/data/integration-errors";
import type { IconName } from "@/types/ui";

import { IntegrationErrorsExplorer } from "./IntegrationErrorsExplorer";

const sourceIcons: Record<IntegrationErrorSource, IconName> = {
  HRPS: "hrps",
  "Bundy / Biometric": "bundy",
  "QR Attendance": "qr",
  "Unified Attendance": "unified",
  "Payroll Integration": "payroll",
  "Accounting Integration": "accounting",
};

export function IntegrationErrorsPage() {
  const openErrors = integrationErrors.filter((error) => error.status !== "Resolved");
  const criticalErrors = integrationErrors.filter((error) => error.severity === "Critical" && error.status !== "Resolved");
  const retryPending = integrationErrors.filter((error) => error.retryable && error.status !== "Resolved");
  const resolvedToday = integrationErrors.filter((error) => error.status === "Resolved");

  const summaryMetrics = [
    { label: "Open errors", value: String(openErrors.length), note: "Review required", icon: "errors" as const, tone: "danger" as const },
    { label: "Critical errors", value: String(criticalErrors.length), note: "Immediate attention", icon: "warning" as const, tone: "danger" as const },
    { label: "Retry pending", value: String(retryPending.length), note: "Eligible for retry", icon: "refresh" as const, tone: "warning" as const },
    { label: "Resolved today", value: String(resolvedToday.length), note: "Closed in prototype queue", icon: "check" as const, tone: "success" as const },
  ];

  return (
    <div className="admin-page integration-errors-page">
      <AdminPageHeader
        eyebrow="Operations / Error review"
        title="Integration Errors"
        description="Centralize, inspect, and track technical integration problems across the employee management system's monitored boundaries."
        actions={<ActionButton icon="refresh" action="Error queue refreshed in the prototype.">Refresh error queue</ActionButton>}
      />

      <div className="metric-grid integration-error-metrics">
        {summaryMetrics.map((metric) => <SummaryCard key={metric.label} {...metric} />)}
      </div>

      <SectionCard title="Error overview by system" eyebrow="Current operational queue">
        <div className="panel-body integration-error-overview-grid">
          {integrationErrorSources.map((source) => {
            const sourceErrors = integrationErrors.filter((error) => error.source === source.source);
            const activeErrors = sourceErrors.filter((error) => error.status !== "Resolved");
            const criticalCount = activeErrors.filter((error) => error.severity === "Critical").length;
            const retryCount = activeErrors.filter((error) => error.retryable).length;
            const tone = activeErrors.length === 0 ? "success" : criticalCount > 0 ? "danger" : "warning";

            return (
              <Link className="integration-error-system-card" href={source.href} key={source.source}>
                <div className="integration-error-system-heading">
                  <span className="integration-error-system-icon"><Icon name={sourceIcons[source.source]} /></span>
                  <span><strong>{source.source}</strong><small>{source.detail}</small></span>
                  <StatusBadge tone={tone}>{activeErrors.length ? `${activeErrors.length} active` : "Clear"}</StatusBadge>
                </div>
                <div className="integration-error-system-meta">
                  <span>{criticalCount} critical</span>
                  <span>{retryCount} retry eligible</span>
                  <span>{sourceErrors.length} tracked</span>
                </div>
              </Link>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="Integration error explorer" eyebrow="Search, filter, and inspect">
        <IntegrationErrorsExplorer />
      </SectionCard>

      <SectionCard title="Recent resolution history" eyebrow="Closed technical issues">
        <div className="integration-error-history-table table-wrap">
          <table className="data-table">
            <caption className="sr-only">Recent resolved integration errors</caption>
            <thead>
              <tr>
                <th scope="col">Error ID</th>
                <th scope="col">Source</th>
                <th scope="col">Resolution</th>
                <th scope="col">Resolved by</th>
                <th scope="col">Resolved at</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {resolutionHistory.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.source}</td>
                  <td>{item.resolution}</td>
                  <td>{item.actor}</td>
                  <td>{item.time}</td>
                  <td><StatusBadge tone="success">Resolved</StatusBadge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <section className="notice integration-error-privacy">
        <Icon name="shield" />
        <div>
          <strong>Privacy and security boundary</strong>
          <p>Error summaries expose operational references only. They never display passwords, credentials, tokens, biometric templates, secrets, file paths, or raw stack traces.</p>
        </div>
      </section>
      <p className="page-feedback"><Icon name="info" /> Mock queue snapshot · Error details are illustrative and contain no live integration payloads.</p>
    </div>
  );
}
