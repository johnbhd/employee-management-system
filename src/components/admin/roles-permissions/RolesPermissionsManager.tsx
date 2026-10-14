"use client";

import { useMemo, useState } from "react";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { apiRequest } from "@/lib/api/client";
import type { ApiSuccessResponse } from "@/types/api/responses";
import type {
  PermissionDefinition,
  PermissionKey,
  RolePermissionView,
  RolesPermissionsData,
} from "@/types/permissions";

type RolePermissionsApiResponse = ApiSuccessResponse<RolePermissionView>;

export function RolesPermissionsManager({
  data,
  canManage,
  onDataChange,
}: {
  data: RolesPermissionsData;
  canManage: boolean;
  onDataChange: (data: RolesPermissionsData) => void;
}) {
  const [selectedRoleId, setSelectedRoleId] = useState<string>(data.roles[0]?.roleId ?? "");
  const [draft, setDraft] = useState<PermissionKey[] | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const selectedRole = data.roles.find((role) => role.roleId === selectedRoleId) ?? null;
  const selectedPermissions = draft ?? selectedRole?.permissions ?? [];
  const permissionGroups = useMemo(() => {
    const categories = [...new Set(data.permissions.map((permission) => permission.category))];
    return categories.map((category) => ({
      category,
      permissions: data.permissions.filter((permission) => permission.category === category),
    }));
  }, [data.permissions]);

  function selectRole(roleId: string) {
    if (roleId === selectedRoleId) return;
    setSelectedRoleId(roleId);
    setDraft(null);
    setFeedback("Unsaved permission changes were discarded.");
  }

  function startEditing() {
    if (!selectedRole || !canManage) return;
    setDraft([...selectedRole.permissions]);
    setFeedback("");
  }

  function cancelEditing() {
    setDraft(null);
    setFeedback("Permission changes were discarded.");
  }

  function isProtected(permission: PermissionDefinition) {
    return selectedRole
      ? Boolean(permission.requiredForRoles?.includes(selectedRole.roleId))
      : false;
  }

  function togglePermission(permission: PermissionDefinition) {
    if (!draft || isProtected(permission)) return;
    setDraft((current) => {
      if (!current) return current;
      return current.includes(permission.key)
        ? current.filter((key) => key !== permission.key)
        : [...current, permission.key];
    });
  }

  async function savePermissions() {
    if (!selectedRole || !draft || isSaving || !canManage) return;
    setIsSaving(true);
    setFeedback("");

    try {
      const response = await apiRequest<RolePermissionsApiResponse>(
        `/api/v1/admin/roles-permissions/${selectedRole.roleId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            permissions: draft,
            expectedVersion: selectedRole.version,
          }),
        },
      );
      onDataChange({
        ...data,
        roles: data.roles.map((role) => role.roleId === response.data.roleId ? response.data : role),
        summary: {
          ...data.summary,
          assignedPermissionCount: data.roles.reduce(
            (total, role) => total + (role.roleId === response.data.roleId ? response.data.permissions.length : role.permissions.length),
            0,
          ),
        },
      });
      setDraft(null);
      setFeedback("Permission changes saved.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "The permission changes could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <section className="dashboard-card roles-workspace-card" aria-labelledby="roles-workspace-heading">
        <div className="panel-header">
          <div>
            <p className="section-kicker">Application access model</p>
            <h2 id="roles-workspace-heading">Role management</h2>
            <p className="roles-panel-description">Select a system role to review its current capabilities and assignment scope.</p>
          </div>
          <StatusBadge tone={canManage ? "info" : "muted"}><Icon name="shield" /> {canManage ? "Application roles" : "Read-only"}</StatusBadge>
        </div>

        <div className="roles-workspace">
          <aside className="roles-list" aria-labelledby="roles-list-heading">
            <div className="roles-list-heading"><p className="section-kicker">Available roles</p><h3 id="roles-list-heading">Role catalog</h3><p>Core roles for this integration application.</p></div>
            <div className="roles-list-items">{data.roles.length > 0 ? data.roles.map((role) => <button type="button" className={`role-selector ${role.roleId === selectedRoleId ? "is-selected" : ""}`} key={role.roleId} aria-pressed={role.roleId === selectedRoleId} onClick={() => selectRole(role.roleId)}><span className="role-selector-copy"><strong>{role.roleName}</strong><span>{role.description}</span></span><span className="role-selector-meta"><StatusBadge tone="success">Active</StatusBadge><small>{role.memberCount} {role.memberCount === 1 ? "user" : "users"}</small></span></button>) : <p className="roles-empty-state">No application roles are available.</p>}</div>
          </aside>

          <div className="role-details">{selectedRole ? <><div className="role-details-heading"><div className="role-details-title"><p className="section-kicker">Selected role</p><h3>{selectedRole.roleName}</h3><p>{selectedRole.description}</p></div><div className="role-details-actions"><div className="role-badges"><StatusBadge tone="success">Active</StatusBadge><StatusBadge tone="muted"><Icon name="lock" /> System Role</StatusBadge></div>{draft ? <StatusBadge tone="warning">Unsaved changes</StatusBadge> : canManage ? <button type="button" className="button-primary" onClick={startEditing}><Icon name="key" /> Edit permissions</button> : null}</div></div><dl className="role-details-meta"><div><dt>Status</dt><dd><StatusBadge tone="success">Active</StatusBadge></dd></div><div><dt>Role type</dt><dd>System Role</dd></div><div><dt>Assigned users</dt><dd>{selectedRole.memberCount}</dd></div><div><dt>Last updated</dt><dd>{selectedRole.updatedAt ? formatTimestamp(selectedRole.updatedAt) : "Controlled baseline"}</dd></div></dl><p className="role-protected-note"><Icon name="shield" /><span>{selectedRole.roleId === "admin" ? "IT Administrator retains the required authorization-management path. Core management permissions are locked." : "Core application roles are controlled by the authentication architecture and cannot be deleted here."}</span></p></> : <p className="roles-empty-state">Select a role to view its details.</p>}</div>
        </div>
      </section>

      <section className="dashboard-card roles-permissions-card" aria-labelledby="roles-permissions-heading">
        <div className="panel-header"><div><p className="section-kicker">Grouped capability review</p><h2 id="roles-permissions-heading">Access permissions</h2><p className="roles-panel-description">Permissions are controlled by the server catalog. Changes apply to future protected operations.</p></div><StatusBadge tone={draft ? "warning" : "muted"}>{draft ? "Editing" : "View mode"}</StatusBadge></div>
        <div className="roles-permissions-body">{selectedRole ? <><div className="roles-permissions-context"><p>Showing permissions for <strong>{selectedRole.roleName}</strong>.</p><span>{selectedPermissions.length} of {data.permissions.length} allowed</span></div><div className="permission-groups">{permissionGroups.map((group) => <fieldset className="permission-group" key={group.category}><legend><span className="permission-group-title">{group.category}</span><span className="permission-group-count">{group.permissions.filter((permission) => selectedPermissions.includes(permission.key)).length} of {group.permissions.length} allowed</span></legend><div className="permission-list">{group.permissions.map((permission) => { const allowed = selectedPermissions.includes(permission.key); const locked = isProtected(permission); const descriptionId = `${selectedRole.roleId}-${permission.key}-description`; return draft ? <label className={`permission-row permission-row-edit ${locked ? "is-protected" : ""}`} key={permission.key}><input type="checkbox" checked={allowed} disabled={locked || isSaving} aria-describedby={descriptionId} onChange={() => togglePermission(permission)} /><span className="permission-copy"><strong>{permission.label}</strong><span id={descriptionId}>{permission.description}{permission.dependsOn?.length ? ` Requires: ${permission.dependsOn.join(", ")}.` : ""}</span></span>{locked ? <span className="permission-protected" title="Required for this system role"><Icon name="lock" /> Required</span> : null}</label> : <div className={`permission-row ${allowed ? "is-allowed" : "is-not-allowed"}`} key={permission.key}><span className="permission-state-icon" aria-hidden="true"><Icon name={allowed ? "check" : "close"} /></span><span className="permission-copy"><strong>{permission.label}</strong><span>{permission.description}</span></span><StatusBadge tone={allowed ? "success" : "muted"}>{allowed ? "Allowed" : "Not allowed"}</StatusBadge></div>; })}</div></fieldset>)}</div>{draft ? <div className="roles-save-bar"><div><strong>Unsaved permission changes</strong><span>Server validation checks dependencies and administrative lockout protection.</span></div><div className="roles-save-actions"><button type="button" className="button-secondary" onClick={cancelEditing} disabled={isSaving}>Cancel</button><button type="button" className="button-primary" onClick={() => void savePermissions()} disabled={isSaving}>{isSaving ? "Saving…" : "Save changes"}</button></div></div> : null}<p className="roles-feedback" role="status" aria-live="polite">{feedback}</p></> : <p className="roles-empty-state">Select a role to view its permissions.</p>}</div>
      </section>
    </>
  );
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date(value));
}
