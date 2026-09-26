import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { FlowDiagram } from "@/components/admin/shared/FlowDiagram";
import { ProgressList } from "@/components/admin/shared/ProgressList";
import { ActionButton } from "@/components/ui/ActionButton";
import { FilterableTable } from "@/components/ui/FilterableTable";
import { Icon } from "@/components/ui/Icon";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SummaryCard } from "@/components/ui/SummaryCard";
import {
  userAccountsHrpsFlow,
  userAccountsHrpsIssues,
  userAccountsHrpsMappings,
  userAccountsHrpsMetrics,
  userAccountsHrpsRecords,
  userAccountsHrpsSyncHistory,
} from "@/data/user-accounts-hrps-flow";

export function UserAccountsHrpsPage() {
  return (
    <div className="admin-page user-accounts-hrps-page">
      <AdminPageHeader
        eyebrow="Application access reference"
        title="User Accounts"
        description="Review application accounts against the authoritative HRPS employee reference without exposing credentials or changing employee records."
        actions={(
          <>
            <ActionButton icon="refresh" action="User account reference sync queued.">
              Sync references
            </ActionButton>
            <ActionButton variant="secondary" action="Access boundary test completed successfully.">
              Test access boundary
            </ActionButton>
          </>
        )}
      />

      <div className="metric-grid user-accounts-hrps-metrics">
        {userAccountsHrpsMetrics.map((metric) => (
          <SummaryCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="two-column">
        <SectionCard title="Connection status" eyebrow="HRPS reference endpoint">
          <div className="panel-body connection-summary">
            <div className="connection-status">
              <span className="status-dot status-success" />
              <strong>Connected</strong>
              <StatusBadge tone="success">Healthy</StatusBadge>
            </div>
            <dl className="detail-list">
              <div>
                <dt>Endpoint</dt>
                <dd>hrps.aujsc.edu.ph · prototype</dd>
              </div>
              <div>
                <dt>Authentication</dt>
                <dd>Service account boundary</dd>
              </div>
              <div>
                <dt>Last successful sync</dt>
                <dd>Today at 10:38 AM</dd>
              </div>
              <div>
                <dt>Reference policy</dt>
                <dd>Employee ID match only</dd>
              </div>
            </dl>
          </div>
        </SectionCard>

        <SectionCard title="Latest sync" eyebrow="Account reference data">
          <div className="panel-body">
            <ProgressList
              items={[
                { label: "Account records received", value: "5", percent: 100, tone: "success" },
                { label: "Employee ID links verified", value: "4", percent: 80, tone: "success" },
                { label: "Records requiring review", value: "1", percent: 20, tone: "warning" },
              ]}
            />
          </div>
        </SectionCard>
      </div>

      <SectionCard title="User account data flow" eyebrow="Authoritative employee reference">
        <FlowDiagram nodes={userAccountsHrpsFlow} />
      </SectionCard>

      <SectionCard title="Field mapping" eyebrow="Account reference contract">
        <div className="panel-body mapping-grid">
          {userAccountsHrpsMappings.map(([source, target]) => (
            <div className="mapping-row" key={source}>
              <span>{source}</span>
              <strong>
                <Icon name="arrow" />
              </strong>
              <span>{target}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Application accounts" eyebrow="Latest sample records">
        <FilterableTable
          rows={userAccountsHrpsRecords}
          columns={[
            { key: "id", label: "Account ID" },
            { key: "username", label: "Username" },
            { key: "employeeId", label: "Employee ID" },
            { key: "employee", label: "Employee" },
            { key: "role", label: "Role" },
            { key: "status", label: "Account status" },
            { key: "employment", label: "HRPS status" },
            { key: "result", label: "Result" },
            { key: "time", label: "Sync time" },
          ]}
          filters={[
            { key: "status", label: "Account status", options: ["All", "Active", "Disabled"] },
            { key: "employment", label: "HRPS status", options: ["All", "Active", "Inactive", "Not Linked"] },
            { key: "result", label: "Result", options: ["All", "Updated", "No Change", "Needs Review", "Protected"] },
          ]}
          searchPlaceholder="Search application accounts"
          caption="Application account references"
          emptyMessage="No application accounts match the selected filters."
          note="Sample account records · prototype only"
        />
      </SectionCard>

      <div className="two-column">
        <SectionCard title="Records requiring review" eyebrow="Access quality">
          <div className="panel-body issue-list">
            {userAccountsHrpsIssues.map((issue) => (
              <article className={`issue-card ${issue.tone}`} key={issue.title}>
                <div>
                  <h3>{issue.title}</h3>
                  <p>{issue.detail}</p>
                </div>
                <ActionButton variant="link" action="Account review queue opened.">
                  Review
                </ActionButton>
              </article>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Connection and access handling" eyebrow="Operational notes">
          <div className="panel-body list-stack">
            <div className="list-row">
              <div>
                <strong>Retry policy</strong>
                <p>Manual retry is available after a failed mock reference sync.</p>
              </div>
              <StatusBadge tone="info">Manual</StatusBadge>
            </div>
            <div className="list-row">
              <div>
                <strong>Failure boundary</strong>
                <p>HRPS reference errors remain isolated from application access.</p>
              </div>
              <StatusBadge tone="muted">Isolated</StatusBadge>
            </div>
            <div className="list-row">
              <div>
                <strong>Credential handling</strong>
                <p>Passwords and tokens are never returned in this workspace.</p>
              </div>
              <StatusBadge tone="success">Protected</StatusBadge>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Synchronization history" eyebrow="Recent account reference activity">
        <div className="panel-body timeline-list">
          {userAccountsHrpsSyncHistory.map((event) => (
            <div className="timeline-item" key={`${event.title}-${event.time}`}>
              <div>
                <strong>{event.title}</strong>
                <p>{event.detail}</p>
              </div>
              <small>{event.time}</small>
            </div>
          ))}
        </div>
      </SectionCard>

      <p className="page-feedback user-accounts-hrps-feedback">
        <Icon name="info" />
        Application access remains separate from the authoritative HRPS employee record.
      </p>
    </div>
  );
}
