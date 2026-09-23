"use client";

import { type FormEvent, useMemo, useState } from "react";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  type LinkedHrpsEmployee,
  type UserAccount,
  type UserAccountActivity,
  type UserAccountRole,
  type UserAccountStatus,
} from "@/data/user-accounts";

type UserAccountsManagerProps = {
  initialAccounts: readonly UserAccount[];
  employees: readonly LinkedHrpsEmployee[];
  initialActivity: readonly UserAccountActivity[];
};

type AccountFormState = {
  username: string;
  role: UserAccountRole;
  status: UserAccountStatus;
  employeeId: string;
};

type PendingAction =
  | { type: "status"; accountId: string; nextStatus: UserAccountStatus }
  | { type: "role"; accountId: string; form: AccountFormState }
  | { type: "reset"; accountId: string };

const prototypeTimestamp = "Sep 23, 2026 • Prototype";

function accountStatusTone(status: UserAccountStatus) {
  return status === "Active" ? "success" as const : "muted" as const;
}

function accountRoleTone(role: UserAccountRole) {
  return role === "IT Administrator" ? "info" as const : "muted" as const;
}

function nextAccountId(accounts: readonly UserAccount[]) {
  const largestId = accounts.reduce((largest, account) => {
    const numericId = Number(account.accountId.replace("USR-", ""));
    return Number.isNaN(numericId) ? largest : Math.max(largest, numericId);
  }, 0);

  return `USR-${String(largestId + 1).padStart(3, "0")}`;
}

export function UserAccountsManager({ initialAccounts, employees, initialActivity }: UserAccountsManagerProps) {
  const [accounts, setAccounts] = useState<UserAccount[]>(() => [...initialAccounts]);
  const [activity, setActivity] = useState<UserAccountActivity[]>(() => [...initialActivity]);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [selectedAccountId, setSelectedAccountId] = useState(initialAccounts[0]?.accountId ?? "");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [formError, setFormError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [createForm, setCreateForm] = useState<AccountFormState>({
    username: "",
    role: "Employee",
    status: "Active",
    employeeId: "",
  });
  const [editForm, setEditForm] = useState<AccountFormState>({
    username: "",
    role: "Employee",
    status: "Active",
    employeeId: "",
  });

  const availableEmployees = useMemo(() => {
    const linkedIds = new Set(
      accounts
        .filter((account) => account.role === "Employee")
        .map((account) => account.linkedEmployee?.employeeId)
        .filter((employeeId): employeeId is string => Boolean(employeeId)),
    );

    return employees.filter((employee) => !linkedIds.has(employee.employeeId));
  }, [accounts, employees]);

  const filteredAccounts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return accounts.filter((account) => {
      const searchableValues = [
        account.accountId,
        account.username,
        account.role,
        account.status,
        account.linkedEmployee?.employeeId,
        account.linkedEmployee?.employeeName,
      ];
      const matchesSearch = !normalizedQuery || searchableValues.some((value) => value?.toLowerCase().includes(normalizedQuery));
      const matchesRole = roleFilter === "All Roles" || account.role === roleFilter;
      const matchesStatus = statusFilter === "All Statuses" || account.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [accounts, query, roleFilter, statusFilter]);

  const selectedAccount = filteredAccounts.find((account) => account.accountId === selectedAccountId) ?? filteredAccounts[0] ?? null;
  const selectedCreateEmployee = employees.find((employee) => employee.employeeId === createForm.employeeId) ?? null;
  const pendingAccount = pendingAction ? accounts.find((account) => account.accountId === pendingAction.accountId) ?? null : null;

  function addActivity(newActivity: UserAccountActivity) {
    setActivity((current) => [newActivity, ...current].slice(0, 5));
  }

  function setManagerFeedback(message: string) {
    setFeedback(message);
    setFormError("");
  }

  function validateUsername(username: string, accountId?: string) {
    if (!username) return "Please enter a username.";

    const usernameExists = accounts.some((account) => (
      account.accountId !== accountId && account.username.toLowerCase() === username.toLowerCase()
    ));

    return usernameExists ? "This username is already in use." : "";
  }

  function validateEmployeeLink(form: AccountFormState, accountId?: string) {
    if (form.role !== "Employee") return "";
    if (!form.employeeId) return "Please select an existing HRPS employee for an Employee account.";

    const linkedEmployee = employees.find((employee) => employee.employeeId === form.employeeId);
    if (!linkedEmployee) return "Please select an existing HRPS employee.";

    const duplicateEmployeeLink = accounts.some((account) => (
      account.accountId !== accountId
      && account.role === "Employee"
      && account.linkedEmployee?.employeeId === form.employeeId
    ));

    return duplicateEmployeeLink ? "This Employee ID already has an application account." : "";
  }

  function openCreateForm() {
    setCreateForm({ username: "", role: "Employee", status: "Active", employeeId: "" });
    setFormError("");
    setFeedback("");
    setShowEditForm(false);
    setShowCreateForm(true);
  }

  function openEditForm() {
    if (!selectedAccount || selectedAccount.isPrimaryAdministrator) return;

    setEditForm({
      username: selectedAccount.username,
      role: selectedAccount.role,
      status: selectedAccount.status,
      employeeId: selectedAccount.linkedEmployee?.employeeId ?? "",
    });
    setFormError("");
    setFeedback("");
    setShowCreateForm(false);
    setShowEditForm(true);
  }

  function closeForms() {
    setShowCreateForm(false);
    setShowEditForm(false);
    setFormError("");
  }

  function clearFilters() {
    setQuery("");
    setRoleFilter("All Roles");
    setStatusFilter("All Statuses");
    setSelectedAccountId(initialAccounts[0]?.accountId ?? "");
  }

  function handleCreateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const username = createForm.username.trim();
    const usernameError = validateUsername(username);
    const employeeError = validateEmployeeLink(createForm);

    if (usernameError || employeeError) {
      setFormError(usernameError || employeeError);
      return;
    }

    const linkedEmployee = createForm.role === "Employee"
      ? employees.find((employee) => employee.employeeId === createForm.employeeId) ?? null
      : null;
    const newAccount: UserAccount = {
      accountId: nextAccountId(accounts),
      username,
      role: createForm.role,
      status: createForm.status,
      linkedEmployee,
      lastLogin: null,
      createdAt: prototypeTimestamp,
      updatedAt: prototypeTimestamp,
    };

    setAccounts((current) => [...current, newAccount]);
    setSelectedAccountId(newAccount.accountId);
    setShowCreateForm(false);
    setManagerFeedback("Account created in the frontend prototype.");
    addActivity({
      event: "Account created",
      detail: `${newAccount.username} was added to the prototype access directory.`,
      actor: "IT Administrator",
      time: prototypeTimestamp,
      tone: "success",
    });
  }

  function applyEdit(accountId: string, form: AccountFormState) {
    const account = accounts.find((item) => item.accountId === accountId);
    if (!account) return;

    const usernameChanged = account.username !== form.username.trim();
    const roleChanged = account.role !== form.role;
    setAccounts((current) => current.map((item) => item.accountId === accountId ? {
      ...item,
      username: form.username.trim(),
      role: form.role,
      updatedAt: prototypeTimestamp,
    } : item));
    setShowEditForm(false);
    setPendingAction(null);
    setManagerFeedback("Account access details updated in the frontend prototype.");
    addActivity({
      event: roleChanged ? "Application role changed" : "Account details updated",
      detail: `${form.username.trim()} ${usernameChanged || roleChanged ? "was updated" : "was reviewed"}; linked HRPS data remains unchanged.`,
      actor: "IT Administrator",
      time: prototypeTimestamp,
      tone: "info",
    });
  }

  function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedAccount) return;

    const form = { ...editForm, username: editForm.username.trim() };
    const usernameError = validateUsername(form.username, selectedAccount.accountId);
    const employeeError = validateEmployeeLink(form, selectedAccount.accountId);

    if (usernameError || employeeError) {
      setFormError(usernameError || employeeError);
      return;
    }

    if (form.role !== selectedAccount.role) {
      setPendingAction({ type: "role", accountId: selectedAccount.accountId, form });
      return;
    }

    applyEdit(selectedAccount.accountId, form);
  }

  function requestStatusChange(account: UserAccount) {
    if (account.isPrimaryAdministrator) return;

    setPendingAction({
      type: "status",
      accountId: account.accountId,
      nextStatus: account.status === "Active" ? "Disabled" : "Active",
    });
  }

  function requestPasswordReset(account: UserAccount) {
    setPendingAction({ type: "reset", accountId: account.accountId });
  }

  function confirmPendingAction() {
    if (!pendingAction || !pendingAccount) return;

    if (pendingAction.type === "status") {
      setAccounts((current) => current.map((account) => account.accountId === pendingAccount.accountId ? {
        ...account,
        status: pendingAction.nextStatus,
        updatedAt: prototypeTimestamp,
      } : account));
      setManagerFeedback(`Account ${pendingAction.nextStatus === "Active" ? "enabled" : "disabled"} in the frontend prototype.`);
      addActivity({
        event: pendingAction.nextStatus === "Active" ? "Account enabled" : "Account disabled",
        detail: `${pendingAccount.username} application access changed; the linked HRPS record was not changed.`,
        actor: "IT Administrator",
        time: prototypeTimestamp,
        tone: pendingAction.nextStatus === "Active" ? "success" : "info",
      });
    }

    if (pendingAction.type === "role") {
      applyEdit(pendingAction.accountId, pendingAction.form);
    }

    if (pendingAction.type === "reset") {
      setManagerFeedback("Password reset has been simulated for this prototype.");
      addActivity({
        event: "Password reset simulated",
        detail: `${pendingAccount.username} received a prototype-only reset acknowledgement; no password was generated or displayed.`,
        actor: "IT Administrator",
        time: prototypeTimestamp,
        tone: "info",
      });
    }

    setPendingAction(null);
  }

  function pendingTitle() {
    if (!pendingAction || !pendingAccount) return "Confirm account action";
    if (pendingAction.type === "reset") return `Simulate password reset for ${pendingAccount.username}?`;
    if (pendingAction.type === "role") return `Change role from ${pendingAccount.role} to ${pendingAction.form.role}?`;
    return `${pendingAction.nextStatus === "Active" ? "Enable" : "Disable"} ${pendingAccount.username}?`;
  }

  function pendingDescription() {
    if (!pendingAction || !pendingAccount) return "This action updates the prototype only.";
    if (pendingAction.type === "reset") return "This only records a prototype reset request. No password will be generated, displayed, stored, or sent.";
    if (pendingAction.type === "role") return "This changes the role for this integration application only. Linked HRPS employee information remains read-only.";
    return pendingAction.nextStatus === "Active"
      ? "This enables access to the integration application only. It does not change the linked HRPS employee record."
      : "This disables access to the integration application only. It does not terminate employment or change HRPS, Payroll, or Accounting records.";
  }

  return (
    <div className="user-accounts-manager">
      <div className="user-accounts-manager-heading">
        <div>
          <p className="section-kicker">Application access directory</p>
          <h3>Prototype user accounts</h3>
          <p>Manage access to this integration application without editing official HRPS employee data.</p>
        </div>
        <button type="button" className="button-primary" onClick={openCreateForm}>
          <Icon name="users" />
          Create Account
        </button>
      </div>

      <div className="user-accounts-filters" role="search" aria-label="Filter user accounts">
        <label className="field user-accounts-search" htmlFor="user-account-search">
          <span>Search accounts</span>
          <input
            id="user-account-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search username, account ID, employee ID, or name"
          />
        </label>
        <label className="field" htmlFor="user-account-role">
          <span>Role</span>
          <select id="user-account-role" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
            <option>All Roles</option>
            <option>IT Administrator</option>
            <option>Employee</option>
          </select>
        </label>
        <label className="field" htmlFor="user-account-status">
          <span>Account status</span>
          <select id="user-account-status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option>All Statuses</option>
            <option>Active</option>
            <option>Disabled</option>
          </select>
        </label>
        <button type="button" className="button-secondary user-accounts-clear" onClick={clearFilters}>
          <Icon name="filter" />
          Clear filters
        </button>
      </div>

      <div className="table-meta">
        <span>Showing {filteredAccounts.length} of {accounts.length} accounts</span>
        <span>Prototype directory · no live account provider</span>
      </div>

      <div className="user-accounts-table-scroll">
        <table className="data-table user-accounts-table">
          <caption className="sr-only">Integration application user accounts</caption>
          <thead>
            <tr>
              <th scope="col">Account ID</th>
              <th scope="col">Username</th>
              <th scope="col">Employee ID</th>
              <th scope="col">Employee</th>
              <th scope="col">Role</th>
              <th scope="col">Account status</th>
              <th scope="col">Last login</th>
              <th scope="col"><span className="sr-only">Action</span></th>
            </tr>
          </thead>
          <tbody>
            {filteredAccounts.map((account) => (
              <tr className={selectedAccount?.accountId === account.accountId ? "is-selected" : ""} key={account.accountId}>
                <td>{account.accountId}</td>
                <td><strong className="user-account-username">{account.username}</strong></td>
                <td>{account.linkedEmployee?.employeeId ?? "Not linked"}</td>
                <td>
                  {account.linkedEmployee ? (
                    <span className="user-account-person">
                      <strong>{account.linkedEmployee.employeeName}</strong>
                      <small>{account.linkedEmployee.department}</small>
                    </span>
                  ) : "—"}
                </td>
                <td><StatusBadge tone={accountRoleTone(account.role)}>{account.role}</StatusBadge></td>
                <td><StatusBadge tone={accountStatusTone(account.status)}>{account.status}</StatusBadge></td>
                <td>{account.lastLogin ?? "Never"}</td>
                <td>
                  <button
                    type="button"
                    className="button-link user-account-view-button"
                    aria-label={`View details for ${account.username}`}
                    onClick={() => {
                      setSelectedAccountId(account.accountId);
                      setShowCreateForm(false);
                      setShowEditForm(false);
                    }}
                  >
                    <Icon name="file" />
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredAccounts.length === 0 ? <p className="empty-state">No user accounts match the selected filters.</p> : null}
      </div>

      {showCreateForm ? (
        <section className="user-account-form-panel" aria-labelledby="create-account-title">
          <div className="user-account-form-heading">
            <div>
              <p className="section-kicker">Prototype action</p>
              <h3 id="create-account-title">Create application account</h3>
              <p>This creates access for an existing application user. It does not create an employee or HRPS record.</p>
            </div>
            <button type="button" className="icon-button" aria-label="Close create account form" onClick={closeForms}>
              <Icon name="close" />
            </button>
          </div>
          <form className="user-account-form" onSubmit={handleCreateSubmit}>
            <div className="user-account-form-grid">
              <label className="field" htmlFor="create-account-username">
                <span>Username</span>
                <input
                  id="create-account-username"
                  value={createForm.username}
                  onChange={(event) => setCreateForm((current) => ({ ...current, username: event.target.value }))}
                  aria-describedby={formError ? "create-account-error" : undefined}
                  autoComplete="off"
                  required
                />
              </label>
              <label className="field" htmlFor="create-account-role">
                <span>Application role</span>
                <select
                  id="create-account-role"
                  value={createForm.role}
                  onChange={(event) => {
                    const role = event.target.value as UserAccountRole;
                    setCreateForm((current) => ({ ...current, role, employeeId: role === "Employee" ? current.employeeId : "" }));
                  }}
                >
                  <option>Employee</option>
                  <option>IT Administrator</option>
                </select>
              </label>
              <label className="field" htmlFor="create-account-status">
                <span>Account status</span>
                <select
                  id="create-account-status"
                  value={createForm.status}
                  onChange={(event) => setCreateForm((current) => ({
                    ...current,
                    status: event.target.value as UserAccountStatus,
                  }))}
                >
                  <option>Active</option>
                  <option>Disabled</option>
                </select>
              </label>
              <label className="field" htmlFor="create-account-employee">
                <span>Linked HRPS Employee ID</span>
                <select
                  id="create-account-employee"
                  value={createForm.employeeId}
                  disabled={createForm.role !== "Employee"}
                  onChange={(event) => setCreateForm((current) => ({ ...current, employeeId: event.target.value }))}
                >
                  <option value="">{createForm.role === "Employee" ? "Select existing employee" : "Not required for administrator"}</option>
                  {availableEmployees.map((employee) => (
                    <option key={employee.employeeId} value={employee.employeeId}>
                      {employee.employeeId} · {employee.employeeName}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {selectedCreateEmployee ? (
              <div className="user-account-employee-preview">
                <p className="section-kicker">Read-only HRPS reference</p>
                <strong>{selectedCreateEmployee.employeeName}</strong>
                <span>{selectedCreateEmployee.department} · {selectedCreateEmployee.position} · Employment: {selectedCreateEmployee.employmentStatus}</span>
              </div>
            ) : null}
            {formError ? (
              <p className="user-account-form-error" id="create-account-error" role="alert">
                {formError}
              </p>
            ) : null}
            <div className="user-account-form-actions">
              <button type="button" className="button-secondary" onClick={closeForms}>Cancel</button>
              <button type="submit" className="button-primary"><Icon name="users" />Create Account</button>
            </div>
          </form>
        </section>
      ) : null}

      {showEditForm && selectedAccount ? (
        <section className="user-account-form-panel" aria-labelledby="edit-account-title">
          <div className="user-account-form-heading">
            <div>
              <p className="section-kicker">Application access only</p>
              <h3 id="edit-account-title">Edit {selectedAccount.username}</h3>
              <p>Username and role are application fields. Linked HRPS employee information remains read-only.</p>
            </div>
            <button type="button" className="icon-button" aria-label="Close edit account form" onClick={closeForms}>
              <Icon name="close" />
            </button>
          </div>
          <form className="user-account-form" onSubmit={handleEditSubmit}>
            <div className="user-account-form-grid user-account-edit-grid">
              <label className="field" htmlFor="edit-account-username">
                <span>Username</span>
                <input
                  id="edit-account-username"
                  value={editForm.username}
                  readOnly={selectedAccount.isPrimaryAdministrator}
                  onChange={(event) => setEditForm((current) => ({ ...current, username: event.target.value }))}
                  aria-describedby={formError ? "edit-account-error" : undefined}
                  autoComplete="off"
                  required
                />
              </label>
              <label className="field" htmlFor="edit-account-role">
                <span>Application role</span>
                <select
                  id="edit-account-role"
                  value={editForm.role}
                  disabled={selectedAccount.isPrimaryAdministrator}
                  onChange={(event) => setEditForm((current) => ({ ...current, role: event.target.value as UserAccountRole }))}
                >
                  <option>Employee</option>
                  <option>IT Administrator</option>
                </select>
              </label>
            </div>
            {selectedAccount.isPrimaryAdministrator ? (
              <p className="user-account-protected">
                <Icon name="shield" />
                The primary prototype administrator cannot change its username or administrator role in this demo.
              </p>
            ) : null}
            {formError ? (
              <p className="user-account-form-error" id="edit-account-error" role="alert">
                {formError}
              </p>
            ) : null}
            <div className="user-account-form-actions">
              <button type="button" className="button-secondary" onClick={closeForms}>Cancel</button>
              <button type="submit" className="button-primary"><Icon name="check" />Save Access Details</button>
            </div>
          </form>
        </section>
      ) : null}

      {selectedAccount ? (
        <section className="user-account-details" aria-labelledby="user-account-details-title">
          <div className="user-account-details-heading">
            <div>
              <p className="section-kicker">Selected account</p>
              <h3 id="user-account-details-title">{selectedAccount.username}</h3>
              <p>{selectedAccount.accountId} · Prototype application account</p>
            </div>
            <StatusBadge tone={accountStatusTone(selectedAccount.status)}>{selectedAccount.status}</StatusBadge>
          </div>

          <div className="user-account-details-grid">
            <div className="user-account-domain-block">
              <div className="user-account-domain-heading">
                <div>
                  <p className="section-kicker">Application access</p>
                  <h4>Account Information</h4>
                </div>
                <Icon name="users" />
              </div>
              <dl className="user-account-facts">
                <div>
                  <dt>Account ID</dt>
                  <dd>{selectedAccount.accountId}</dd>
                </div>
                <div>
                  <dt>Username</dt>
                  <dd>{selectedAccount.username}</dd>
                </div>
                <div>
                  <dt>Role</dt>
                  <dd><StatusBadge tone={accountRoleTone(selectedAccount.role)}>{selectedAccount.role}</StatusBadge></dd>
                </div>
                <div>
                  <dt>Account status</dt>
                  <dd><StatusBadge tone={accountStatusTone(selectedAccount.status)}>{selectedAccount.status}</StatusBadge></dd>
                </div>
                <div>
                  <dt>Last login</dt>
                  <dd>{selectedAccount.lastLogin ?? "Never"}</dd>
                </div>
                <div>
                  <dt>Created</dt>
                  <dd>{selectedAccount.createdAt}</dd>
                </div>
                <div>
                  <dt>Updated</dt>
                  <dd>{selectedAccount.updatedAt}</dd>
                </div>
              </dl>
            </div>

            <div className="user-account-domain-block user-account-hrps-block">
              <div className="user-account-domain-heading">
                <div>
                  <p className="section-kicker">Existing HRPS reference</p>
                  <h4>Linked HRPS Employee</h4>
                </div>
                <Icon name="hrps" />
              </div>
              {selectedAccount.linkedEmployee ? (
                <dl className="user-account-facts">
                  <div>
                    <dt>Employee ID</dt>
                    <dd>{selectedAccount.linkedEmployee.employeeId}</dd>
                  </div>
                  <div>
                    <dt>Employee name</dt>
                    <dd>{selectedAccount.linkedEmployee.employeeName}</dd>
                  </div>
                  <div>
                    <dt>Department</dt>
                    <dd>{selectedAccount.linkedEmployee.department}</dd>
                  </div>
                  <div>
                    <dt>Position</dt>
                    <dd>{selectedAccount.linkedEmployee.position}</dd>
                  </div>
                  <div>
                    <dt>Employment status</dt>
                    <dd>
                      <StatusBadge tone={selectedAccount.linkedEmployee.employmentStatus === "Active" ? "success" : "warning"}>
                        {selectedAccount.linkedEmployee.employmentStatus}
                      </StatusBadge>
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="user-account-unlinked">
                  Not linked to an HRPS employee. An IT Administrator account may remain unlinked in this prototype.
                </p>
              )}
              <p className="user-account-read-only">
                <Icon name="lock" />
                Employee ID, name, department, position, and employment status are read-only here.
              </p>
            </div>
          </div>

          {selectedAccount.reviewNote ? (
            <div className="user-account-review-notice">
              <Icon name="warning" />
              <p>{selectedAccount.reviewNote} This is a review signal only; it does not automatically disable access.</p>
            </div>
          ) : null}

          <div className="user-account-detail-actions">
            <div className="user-account-action-group">
              <button
                type="button"
                className="button-secondary"
                onClick={openEditForm}
                disabled={Boolean(selectedAccount.isPrimaryAdministrator)}
              >
                <Icon name="settings" />
                Edit Access
              </button>
              <button type="button" className="button-secondary" onClick={() => requestPasswordReset(selectedAccount)}>
                <Icon name="key" />
                Reset Password
              </button>
              {!selectedAccount.isPrimaryAdministrator ? (
                <button type="button" className={selectedAccount.status === "Active" ? "button-danger" : "button-primary"} onClick={() => requestStatusChange(selectedAccount)}>
                  <Icon name={selectedAccount.status === "Active" ? "close" : "check"} />
                  {selectedAccount.status === "Active" ? "Disable Account" : "Enable Account"}
                </button>
              ) : (
                <span className="user-account-protected">
                  <Icon name="shield" />
                  Primary administrator protected
                </span>
              )}
            </div>
            <p className="user-account-action-boundary">
              <Icon name="info" />
              These actions change this application only.
            </p>
          </div>
        </section>
      ) : (
        <div className="user-account-details user-account-details-empty">
          <Icon name="users" />
          <h3>No account selected</h3>
          <p>No user accounts match the selected filters.</p>
        </div>
      )}

      <section className="user-account-activity" aria-labelledby="user-account-activity-title">
        <div className="user-account-activity-heading">
          <div>
            <p className="section-kicker">Account-specific preview</p>
            <h3 id="user-account-activity-title">Recent Account Activity</h3>
          </div>
          <StatusBadge tone="info">Prototype only</StatusBadge>
        </div>
        <div className="user-account-activity-list">
          {activity.map((item) => (
            <article className="user-account-activity-item" key={`${item.event}-${item.time}`}>
              <span className={`user-account-activity-icon status-${item.tone}`}>
                <Icon name={item.tone === "success" ? "check" : item.tone === "warning" ? "warning" : "info"} />
              </span>
              <div>
                <strong>{item.event}</strong>
                <p>{item.detail}</p>
                <small>{item.actor} · {item.time}</small>
              </div>
            </article>
          ))}
        </div>
        <p className="user-account-activity-note">
          <Icon name="info" />
          This is a small account-management preview, not the full Audit Logs feature.
        </p>
      </section>

      {feedback ? (
        <p className="user-account-feedback" role="status" aria-live="polite">
          <Icon name="check" />
          {feedback}
        </p>
      ) : null}

      {pendingAction && pendingAccount ? (
        <div
          className="user-account-confirmation"
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-account-confirmation-title"
          aria-describedby="user-account-confirmation-description"
          tabIndex={-1}
          onKeyDown={(event) => {
            if (event.key === "Escape") setPendingAction(null);
          }}
        >
          <div className="user-account-confirmation-icon">
            <Icon name="warning" />
          </div>
          <div className="user-account-confirmation-copy">
            <h3 id="user-account-confirmation-title">{pendingTitle()}</h3>
            <p id="user-account-confirmation-description">{pendingDescription()}</p>
          </div>
          <div className="user-account-confirmation-actions">
            <button type="button" className="button-secondary" autoFocus onClick={() => setPendingAction(null)}>
              Cancel
            </button>
            <button type="button" className="button-primary" onClick={confirmPendingAction}>
              Confirm action
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
