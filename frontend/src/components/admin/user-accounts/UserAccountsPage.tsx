import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { Icon } from "@/components/ui/Icon";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SummaryCard } from "@/components/ui/SummaryCard";
import { accountActivity, linkedHrpsEmployees, userAccounts } from "@/data/user-accounts";

import { UserAccountsManager } from "./UserAccountsManager";

export function UserAccountsPage() {
  const activeAccounts = userAccounts.filter((account) => account.status === "Active");
  const disabledAccounts = userAccounts.filter((account) => account.status === "Disabled");
  const administratorAccounts = userAccounts.filter((account) => account.role === "IT Administrator");

  const accountMetrics = [
    {
      label: "Total Accounts",
      value: String(userAccounts.length),
      note: "Prototype directory",
      icon: "users" as const,
      tone: "info" as const,
    },
    {
      label: "Active Accounts",
      value: String(activeAccounts.length),
      note: "Application access enabled",
      icon: "check" as const,
      tone: "success" as const,
    },
    {
      label: "Disabled Accounts",
      value: String(disabledAccounts.length),
      note: "Application access disabled",
      icon: "close" as const,
      tone: "warning" as const,
    },
    {
      label: "Administrator Accounts",
      value: String(administratorAccounts.length),
      note: "IT Administrator role",
      icon: "roles" as const,
      tone: "info" as const,
    },
  ];

  return (
    <div className="admin-page user-accounts-page">
      <AdminPageHeader
        eyebrow="Access management / Prototype"
        title="User Accounts"
        description="Manage access accounts and role assignments for the AU-JSC integration application. Official employee information remains owned by the Existing HRPS."
        actions={<StatusBadge tone="info"><Icon name="shield" /> Prototype access only</StatusBadge>}
      />

      <section className="notice user-accounts-prototype-notice">
        <Icon name="info" />
        <p>
          <strong>Simulated account management.</strong>
          Create, edit, enable, disable, and password-reset actions update this page only.
          No live authentication provider or external system is contacted.
        </p>
      </section>

      <div className="metric-grid user-account-metrics">
        {accountMetrics.map((metric) => <SummaryCard key={metric.label} {...metric} />)}
      </div>

      <SectionCard title="Application accounts" eyebrow="Access directory">
        <UserAccountsManager
          initialAccounts={userAccounts}
          employees={linkedHrpsEmployees}
          initialActivity={accountActivity}
        />
      </SectionCard>

      <SectionCard title="Access Management Boundary" eyebrow="Keep domains separate">
        <div className="panel-body user-account-boundary-grid">
          <article className="user-account-boundary-card">
            <span className="user-account-boundary-icon">
              <Icon name="users" />
            </span>
            <div>
              <h3>Integration application account</h3>
              <p>This page manages application username, supported role, account status, and the Employee ID linkage.</p>
            </div>
          </article>
          <article className="user-account-boundary-card">
            <span className="user-account-boundary-icon">
              <Icon name="hrps" />
            </span>
            <div>
              <h3>Official HRPS employee record</h3>
              <p>Employee name, department, position, employment status, and work schedule remain read-only references from the Existing HRPS.</p>
            </div>
          </article>
          <article className="user-account-boundary-card">
            <span className="user-account-boundary-icon">
              <Icon name="lock" />
            </span>
            <div>
              <h3>Secrets stay protected</h3>
              <p>Passwords, tokens, hashes, temporary passwords, and authentication credentials are never displayed or stored by this page.</p>
            </div>
          </article>
        </div>
      </SectionCard>

      <p className="page-feedback">
        <Icon name="info" />
        User account changes are simulated for the frontend prototype and are not persisted.
      </p>
    </div>
  );
}
