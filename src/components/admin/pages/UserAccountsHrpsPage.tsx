"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";

import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { Icon } from "@/components/ui/Icon";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SummaryCard } from "@/components/ui/SummaryCard";
import { apiRequest } from "@/lib/api/client";
import { applicationRoles, getRoleLabel, type ApplicationRole } from "@/lib/auth/roles";
import type { ApiSuccessResponse } from "@/types/api/responses";
import type {
  AdminUserAccount,
  AdminUserAccountCreateInput,
  AdminUserAccountsData,
} from "@/types/admin-user-accounts";
import type { EmployeeReference } from "@/types/employee";
import type { Metric, StatusTone } from "@/types/ui";

type UserAccountsApiResponse = ApiSuccessResponse<AdminUserAccountsData>;
type AccountApiResponse = ApiSuccessResponse<AdminUserAccount>;
type ModalState = "create" | "edit" | "details" | null;
const allValue = "all";

function formatTimestamp(value: string | null) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date(value));
}

function roleLabel(role: ApplicationRole | null) {
  return role ? getRoleLabel(role) : "Profile missing";
}

function accountStatus(account: AdminUserAccount): { label: string; tone: StatusTone } {
  if (account.authStatus === "disabled") return { label: "Disabled", tone: "danger" };
  if (account.authStatus === "missing") return { label: "Auth missing", tone: "warning" };
  if (account.profileStatus === "missing") return { label: "Profile missing", tone: "warning" };
  if (account.applicationStatus !== "active") return { label: "Profile blocked", tone: "warning" };
  return { label: "Active", tone: "success" };
}

function linkLabel(account: AdminUserAccount) {
  if (account.linkStatus === "linked") return `${account.employeeId} · ${account.employee?.department ?? "Employee"}`;
  if (account.linkStatus === "invalid") return `${account.employeeId ?? "Unknown"} · Not found`;
  return "Not linked";
}

function getMetrics(data: AdminUserAccountsData): Metric[] {
  return [
    { label: "Total accounts", value: String(data.summary.total), note: "Firebase identities in this application", icon: "users", tone: "info" },
    { label: "Active accounts", value: String(data.summary.active), note: "Enabled identity with valid profile", icon: "check", tone: "success" },
    { label: "Disabled accounts", value: String(data.summary.disabled), note: "Disabled in Firebase Authentication", icon: "lock", tone: "danger" },
    { label: "Employee links", value: String(data.summary.linked), note: "Linked to existing HRPS records", icon: "hrps", tone: "info" },
    { label: "Integrity issues", value: String(data.summary.integrityIssues), note: data.summary.integrityIssues ? "Review before granting access" : "No missing profile links", icon: "warning", tone: data.summary.integrityIssues ? "warning" : "success" },
  ];
}

export function UserAccountsHrpsPage({ initialData, loadError: initialLoadError, canManage }: { initialData: AdminUserAccountsData; loadError: boolean; canManage: boolean }) {
  const [data, setData] = useState(initialData);
  const [loadError, setLoadError] = useState(initialLoadError);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<typeof allValue | ApplicationRole>(allValue);
  const [status, setStatus] = useState<typeof allValue | "active" | "disabled" | "missing">(allValue);
  const [link, setLink] = useState<typeof allValue | "linked" | "unlinked" | "invalid">(allValue);
  const [page, setPage] = useState(initialData.page);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [modal, setModal] = useState<ModalState>(null);
  const [selected, setSelected] = useState<AdminUserAccount | null>(null);
  const [statusTarget, setStatusTarget] = useState<{ account: AdminUserAccount; disabled: boolean } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUserAccount | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const firstRender = useRef(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: String(data.pageSize || 10) });
    if (search.trim()) params.set("search", search.trim());
    if (role !== allValue) params.set("role", role);
    if (status !== allValue) params.set("status", status);
    if (link !== allValue) params.set("link", link);
    try {
      const response = await apiRequest<UserAccountsApiResponse>(`/api/v1/admin/user-accounts?${params.toString()}`, { cache: "no-store" });
      setData(response.data);
      setLoadError(false);
      setFeedback("");
    } catch (error) {
      setLoadError(true);
      setFeedback(error instanceof Error ? error.message : "User account data could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, [data.pageSize, link, page, role, search, status]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    void loadData();
  }, [loadData]);

  const metrics = useMemo(() => getMetrics(data), [data]);

  function updateFilter<T>(setter: (value: T) => void, value: T) {
    setter(value);
    setPage(1);
  }

  function openDetails(account: AdminUserAccount) {
    setSelected(account);
    setModal("details");
    setFeedback("");
  }

  function openEdit(account: AdminUserAccount) {
    if (!canManage || account.profileStatus === "missing") {
      setFeedback("This account has no valid application profile yet and cannot be edited from this page.");
      return;
    }
    setSelected(account);
    setModal("edit");
    setFeedback("");
  }

  function requestToggleDisabled(account: AdminUserAccount) {
    setStatusTarget({ account, disabled: account.authStatus !== "disabled" });
    setFeedback("");
  }

  async function toggleDisabled() {
    if (!statusTarget) return;
    const { account, disabled } = statusTarget;
    const action = disabled ? "disable" : "enable";
    setIsMutating(true);
    setFeedback("");
    try {
      await apiRequest<AccountApiResponse>(`/api/v1/admin/user-accounts/${encodeURIComponent(account.uid)}/${disabled ? "disable" : "enable"}`, { method: "POST" });
      setStatusTarget(null);
      setFeedback(`Account ${disabled ? "disabled" : "enabled"} successfully.`);
      await loadData();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : `The account could not be ${action}d.`);
    } finally {
      setIsMutating(false);
    }
  }

  function requestDelete(account: AdminUserAccount) {
    setDeleteTarget(account);
    setFeedback("");
  }

  async function deleteAccount() {
    if (!deleteTarget) return;
    setIsMutating(true);
    setFeedback("");
    try {
      await apiRequest<{ success: true }>(`/api/v1/admin/user-accounts/${encodeURIComponent(deleteTarget.uid)}`, { method: "DELETE" });
      setDeleteTarget(null);
      setSelected(null);
      setModal(null);
      setFeedback("Account permanently deleted. Employee and historical business records were preserved.");
      await loadData();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "The account could not be deleted safely.");
    } finally {
      setIsMutating(false);
    }
  }

  async function createAccount(input: AdminUserAccountCreateInput) {
    setIsMutating(true);
    setFeedback("");
    try {
      await apiRequest<AccountApiResponse>("/api/v1/admin/user-accounts", { method: "POST", body: JSON.stringify(input) });
      setModal(null);
      setFeedback("Account created. The temporary password was used only for Firebase provisioning and is not stored here.");
      setPage(1);
      await loadData();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "The account could not be created.");
    } finally {
      setIsMutating(false);
    }
  }

  async function updateAccount(input: { username: string; displayName: string; role: ApplicationRole; employeeId: string | null }) {
    if (!selected) return;
    setIsMutating(true);
    setFeedback("");
    try {
      await apiRequest<AccountApiResponse>(`/api/v1/admin/user-accounts/${encodeURIComponent(selected.uid)}`, { method: "PATCH", body: JSON.stringify(input) });
      setModal(null);
      setFeedback("Account profile updated successfully.");
      await loadData();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "The account profile could not be updated.");
    } finally {
      setIsMutating(false);
    }
  }

  return (
    <div className={`admin-page user-accounts-hrps-page${isLoading ? " is-loading" : ""}`} aria-busy={isLoading}>
      <AdminPageHeader eyebrow="Application access" title="User Accounts" description="Manage Firebase Authentication identities and application profiles while keeping official HRPS employee records read-only." actions={<div className="user-accounts-actions">{canManage ? <button type="button" className="button-primary" onClick={() => { setModal("create"); setFeedback(""); }}><Icon name="users" /> Create account</button> : null}<button type="button" className="button-secondary" onClick={() => void loadData()} disabled={isLoading}><Icon name="refresh" /> {isLoading ? "Refreshing…" : "Refresh"}</button></div>} />

      <div className="metric-grid user-accounts-hrps-metrics">{metrics.map((metric) => <SummaryCard key={metric.label} {...metric} />)}</div>

      <SectionCard title="Application accounts" eyebrow="Firebase Authentication + application profiles" actions={<span className="user-accounts-source-note">No passwords or tokens are returned</span>}>
        <div className="panel-body user-accounts-panel">
          <div className="user-accounts-filters" role="search" aria-label="Filter application accounts">
            <label className="user-accounts-search"><span className="sr-only">Search accounts</span><Icon name="search" /><input value={search} onChange={(event) => updateFilter(setSearch, event.target.value)} placeholder="Search name, email, UID, or employee" /></label>
            <label><span>Role</span><select value={role} onChange={(event) => updateFilter(setRole, event.target.value as typeof role)}><option value={allValue}>All roles</option>{applicationRoles.map((item) => <option key={item} value={item}>{getRoleLabel(item)}</option>)}</select></label>
            <label><span>Status</span><select value={status} onChange={(event) => updateFilter(setStatus, event.target.value as typeof status)}><option value={allValue}>All statuses</option><option value="active">Active</option><option value="disabled">Disabled</option><option value="missing">Auth/profile issue</option></select></label>
            <label><span>Employee link</span><select value={link} onChange={(event) => updateFilter(setLink, event.target.value as typeof link)}><option value={allValue}>All links</option><option value="linked">Linked</option><option value="unlinked">Not linked</option><option value="invalid">Invalid link</option></select></label>
          </div>

          {loadError && !data.items.length ? <div className="user-accounts-state user-accounts-error"><Icon name="warning" /><p>{feedback || "User account data could not be loaded."}</p><button type="button" className="button-secondary" onClick={() => void loadData()}>Try again</button></div> : data.items.length === 0 ? <div className="user-accounts-state"><Icon name="users" /><p>No real Firebase/application accounts match these filters.</p></div> : <div className="table-wrap user-accounts-table-wrap"><table className="data-table user-accounts-table"><caption className="sr-only">Firebase application accounts</caption><thead><tr><th scope="col">User</th><th scope="col">Role</th><th scope="col">Employee link</th><th scope="col">Status</th><th scope="col">Email</th><th scope="col">Last sign-in</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead><tbody>{data.items.map((account) => { const state = accountStatus(account); const canEdit = canManage && account.profileStatus === "valid" && account.authStatus !== "missing"; return <tr key={account.uid}><td><div className="user-account-identity"><strong>{account.displayName}</strong><span>{account.email ?? "No Firebase email"}</span><small>{account.uid}</small></div></td><td>{roleLabel(account.role)}</td><td><span className={account.linkStatus === "invalid" ? "user-account-invalid-link" : ""}>{linkLabel(account)}</span></td><td><StatusBadge tone={state.tone}>{state.label}</StatusBadge></td><td>{account.emailVerified ? <StatusBadge tone="success">Verified</StatusBadge> : <StatusBadge tone="warning">Unverified</StatusBadge>}</td><td>{formatTimestamp(account.lastSignInAt)}</td><td><div className="user-account-row-actions"><button type="button" className="button-link" onClick={() => openDetails(account)}>View</button>{canEdit ? <button type="button" className="button-link" onClick={() => openEdit(account)}>Edit</button> : null}{canManage && account.authStatus !== "missing" ? <button type="button" className="button-link user-account-status-action" onClick={() => requestToggleDisabled(account)} disabled={isMutating}>{account.authStatus === "disabled" ? "Enable" : "Disable"}</button> : null}{canManage ? <button type="button" className="button-link user-account-delete-action" onClick={() => requestDelete(account)} disabled={isMutating}>Delete</button> : null}</div></td></tr>; })}</tbody></table></div>}

          <div className="user-accounts-pagination"><span>Showing {data.items.length} of {data.total} matching account{data.total === 1 ? "" : "s"}</span><div><button type="button" className="button-secondary" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={data.page <= 1 || isLoading}>Previous</button><span>Page {data.page} of {data.totalPages}</span><button type="button" className="button-secondary" onClick={() => setPage((value) => value + 1)} disabled={!data.hasNext || isLoading}>Next</button></div></div>
        </div>
      </SectionCard>

      <div className="two-column user-accounts-lower-grid"><SectionCard title="Account activity" eyebrow="Recorded management events"><div className="panel-body timeline-list">{data.auditEvents.length ? data.auditEvents.map((event) => <div className="timeline-item" key={event.id}><div><strong>{event.action.replaceAll("_", " ")}</strong><p>{event.targetDisplayName} · {event.actorDisplayName}</p></div><small>{formatTimestamp(event.occurredAt)}</small></div>) : <p className="empty-state">No account management activity has been recorded yet.</p>}</div></SectionCard><SectionCard title="Access boundary" eyebrow="Identity and HRPS safety"><div className="panel-body list-stack"><div className="list-row"><div><strong>Firebase Authentication</strong><p>Email, verification, disabled state, and sign-in metadata.</p></div><StatusBadge tone="success">Authoritative</StatusBadge></div><div className="list-row"><div><strong>Application profile</strong><p>Role, username, and optional employee link in users/{"{uid}"}.</p></div><StatusBadge tone="info">Managed</StatusBadge></div><div className="list-row"><div><strong>HRPS employee record</strong><p>Displayed for context; official fields cannot be edited here.</p></div><StatusBadge tone="muted">Read-only</StatusBadge></div></div></SectionCard></div>

      {feedback ? <p className="page-feedback user-accounts-feedback" role="status"><Icon name="info" />{feedback}</p> : null}
      {modal === "create" ? <CreateAccountModal employees={data.employees} busy={isMutating} onClose={() => setModal(null)} onSubmit={(input) => void createAccount(input)} /> : null}
      {modal === "edit" && selected ? <EditAccountModal account={selected} employees={data.employees} busy={isMutating} onClose={() => setModal(null)} onSubmit={(input) => void updateAccount(input)} /> : null}
      {modal === "details" && selected ? <AccountDetailsModal account={selected} onClose={() => setModal(null)} onEdit={() => openEdit(selected)} /> : null}
      {statusTarget ? <AccountStatusModal account={statusTarget.account} disabled={statusTarget.disabled} busy={isMutating} onClose={() => setStatusTarget(null)} onConfirm={() => void toggleDisabled()} /> : null}
      {deleteTarget ? <DeleteAccountModal account={deleteTarget} busy={isMutating} onClose={() => setDeleteTarget(null)} onConfirm={() => void deleteAccount()} /> : null}
    </div>
  );
}

function ModalShell({ title, eyebrow, children, onClose }: { title: string; eyebrow: string; children: ReactNode; onClose: () => void }) {
  return <div className="user-accounts-modal-layer"><button type="button" className="user-accounts-modal-backdrop" onClick={onClose} aria-label="Close dialog" /><section className="user-accounts-modal" role="dialog" aria-modal="true" aria-labelledby="user-accounts-modal-title"><header><div><p className="page-eyebrow">{eyebrow}</p><h2 id="user-accounts-modal-title">{title}</h2></div><button type="button" className="button-secondary user-accounts-modal-close" onClick={onClose} aria-label="Close dialog"><Icon name="close" /></button></header>{children}</section></div>;
}

function AccountStatusModal({ account, disabled, busy, onClose, onConfirm }: { account: AdminUserAccount; disabled: boolean; busy: boolean; onClose: () => void; onConfirm: () => void }) {
  const action = disabled ? "Disable" : "Enable";
  return <ModalShell title={`${action} account?`} eyebrow="Access management" onClose={onClose}><div className="user-accounts-details"><div className="user-accounts-confirmation-copy"><strong>{account.displayName}</strong><span>{account.email ?? account.uid}</span></div><p>{disabled ? "This user will no longer be able to sign in. Their application profile, employee link, and historical records will not be deleted." : "This user will be allowed to sign in again using their existing authentication credentials. Their role and employee link will remain unchanged."}</p><div className="user-accounts-modal-actions"><button type="button" className="button-secondary" onClick={onClose} disabled={busy}>Cancel</button><button type="button" className={disabled ? "button-danger" : "button-primary"} onClick={onConfirm} disabled={busy}>{busy ? `${action}ing…` : `${action} account`}</button></div></div></ModalShell>;
}

function DeleteAccountModal({ account, busy, onClose, onConfirm }: { account: AdminUserAccount; busy: boolean; onClose: () => void; onConfirm: () => void }) {
  const [confirmation, setConfirmation] = useState("");
  const canConfirm = confirmation.trim().toUpperCase() === "DELETE";

  function submit(event: FormEvent) {
    event.preventDefault();
    if (canConfirm) onConfirm();
  }

  return <ModalShell title="Delete account?" eyebrow="Permanent access removal" onClose={onClose}><form className="user-accounts-form" onSubmit={submit}><div className="user-accounts-danger-note"><strong>{account.displayName}</strong><span>{account.email ?? account.uid}</span><p>This permanently deletes the Firebase Authentication identity and application profile. This action cannot be undone.</p></div><div className="user-accounts-confirmation-list"><strong>Will be removed</strong><ul><li>Firebase Authentication account</li><li>Application user/profile and current employee login link</li></ul><strong>Will remain</strong><ul><li>Official HRPS employee record</li><li>Attendance, payroll, accounting, and audit history</li></ul></div><label><span>Type DELETE to confirm</span><input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" autoFocus required /></label><div className="user-accounts-modal-actions"><button type="button" className="button-secondary" onClick={onClose} disabled={busy}>Cancel</button><button type="submit" className="button-danger" disabled={!canConfirm || busy}>{busy ? "Deleting…" : "Delete permanently"}</button></div></form></ModalShell>;
}

function EmployeeSelect({ employees, value, onChange, required = false }: { employees: EmployeeReference[]; value: string; onChange: (value: string) => void; required?: boolean }) {
  return <label><span>Employee link {required ? "(required for Employee role)" : "(optional)"}</span><select value={value} onChange={(event) => onChange(event.target.value)} required={required}><option value="">Not linked</option>{employees.map((employee) => <option key={employee.employeeId} value={employee.employeeId}>{employee.employeeId} · {employee.displayName} · {employee.department}</option>)}</select></label>;
}

function CreateAccountModal({ employees, busy, onClose, onSubmit }: { employees: EmployeeReference[]; busy: boolean; onClose: () => void; onSubmit: (input: AdminUserAccountCreateInput) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<ApplicationRole>("employee");
  const [employeeId, setEmployeeId] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    onSubmit({ email, password, username, displayName, role, employeeId: employeeId || null });
  }

  return <ModalShell title="Create account" eyebrow="Firebase provisioning" onClose={onClose}><form className="user-accounts-form" onSubmit={submit}><p className="user-accounts-form-note">The temporary password is sent to Firebase Authentication for provisioning and is never stored or shown after this request.</p><label><span>Email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="off" /></label><label><span>Temporary password</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required autoComplete="new-password" /></label><div className="user-accounts-form-grid"><label><span>Username</span><input value={username} onChange={(event) => setUsername(event.target.value)} required autoComplete="off" /></label><label><span>Display name</span><input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required /></label></div><label><span>Application role</span><select value={role} onChange={(event) => setRole(event.target.value as ApplicationRole)}>{applicationRoles.map((item) => <option key={item} value={item}>{getRoleLabel(item)}</option>)}</select></label><EmployeeSelect employees={employees} value={employeeId} onChange={setEmployeeId} required={role === "employee"} /><div className="user-accounts-modal-actions"><button type="button" className="button-secondary" onClick={onClose}>Cancel</button><button type="submit" className="button-primary" disabled={busy}>{busy ? "Creating…" : "Create account"}</button></div></form></ModalShell>;
}

function EditAccountModal({ account, employees, busy, onClose, onSubmit }: { account: AdminUserAccount; employees: EmployeeReference[]; busy: boolean; onClose: () => void; onSubmit: (input: { username: string; displayName: string; role: ApplicationRole; employeeId: string | null }) => void }) {
  const [username, setUsername] = useState(account.username ?? "");
  const [displayName, setDisplayName] = useState(account.displayName);
  const [role, setRole] = useState<ApplicationRole>(account.role ?? "employee");
  const [employeeId, setEmployeeId] = useState(account.employeeId ?? "");

  function submit(event: FormEvent) {
    event.preventDefault();
    onSubmit({ username, displayName, role, employeeId: employeeId || null });
  }

  return <ModalShell title="Edit application profile" eyebrow={account.email ?? account.uid} onClose={onClose}><form className="user-accounts-form" onSubmit={submit}><p className="user-accounts-form-note">Official HRPS employee information is read-only. Only the application profile is changed here.</p><label><span>Username</span><input value={username} onChange={(event) => setUsername(event.target.value)} required /></label><label><span>Display name</span><input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required /></label><label><span>Application role</span><select value={role} onChange={(event) => setRole(event.target.value as ApplicationRole)}>{applicationRoles.map((item) => <option key={item} value={item}>{getRoleLabel(item)}</option>)}</select></label><EmployeeSelect employees={employees} value={employeeId} onChange={setEmployeeId} required={role === "employee"} /><div className="user-accounts-modal-actions"><button type="button" className="button-secondary" onClick={onClose}>Cancel</button><button type="submit" className="button-primary" disabled={busy}>{busy ? "Saving…" : "Save profile"}</button></div></form></ModalShell>;
}

function AccountDetailsModal({ account, onClose, onEdit }: { account: AdminUserAccount; onClose: () => void; onEdit: () => void }) {
  const state = accountStatus(account);
  return <ModalShell title={account.displayName} eyebrow="Account details" onClose={onClose}><div className="user-accounts-details"><div className="user-accounts-detail-status"><StatusBadge tone={state.tone}>{state.label}</StatusBadge><StatusBadge tone={account.emailVerified ? "success" : "warning"}>{account.emailVerified ? "Email verified" : "Email unverified"}</StatusBadge></div><dl className="detail-list"><div><dt>Firebase UID</dt><dd className="user-accounts-mono">{account.uid}</dd></div><div><dt>Email</dt><dd>{account.email ?? "Not available"}</dd></div><div><dt>Username</dt><dd>{account.username ?? "No application profile"}</dd></div><div><dt>Application role</dt><dd>{roleLabel(account.role)}</dd></div><div><dt>Employee link</dt><dd>{linkLabel(account)}</dd></div><div><dt>Created</dt><dd>{formatTimestamp(account.createdAt)}</dd></div><div><dt>Last sign-in</dt><dd>{formatTimestamp(account.lastSignInAt)}</dd></div></dl>{account.employee ? <div className="user-accounts-linked-employee"><strong>HRPS employee reference</strong><p>{account.employee.displayName} · {account.employee.department}</p><small>{account.employee.employeeId} · {account.employee.position ?? "Position not provided"} · {account.employee.employmentStatus}</small></div> : null}<div className="user-accounts-modal-actions"><button type="button" className="button-secondary" onClick={onClose}>Close</button>{account.profileStatus === "valid" ? <button type="button" className="button-primary" onClick={onEdit}>Edit profile</button> : null}</div></div></ModalShell>;
}
