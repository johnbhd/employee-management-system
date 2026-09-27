"use client";

import { useState } from "react";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  type PermissionDefinition,
  permissionCategoryOrder,
  type RoleDefinition,
} from "@/data/roles-permissions";

export type RoleWithUsers = RoleDefinition & {
  assignedUsers: number;
};

type PermissionAssignment = Record<string, boolean>;
type RoleAssignments = Record<string, PermissionAssignment>;

type RolesPermissionsManagerProps = {
  roles: readonly RoleWithUsers[];
  permissions: readonly PermissionDefinition[];
};

function createAssignments(
  roles: readonly RoleWithUsers[],
  permissions: readonly PermissionDefinition[],
): RoleAssignments {
  return roles.reduce<RoleAssignments>((result, role) => {
    result[role.id] = permissions.reduce<PermissionAssignment>((rolePermissions, permission) => {
      rolePermissions[permission.id] = role.permissionIds.includes(permission.id);
      return rolePermissions;
    }, {});
    return result;
  }, {});
}

function isProtectedPermission(role: RoleWithUsers, permission: PermissionDefinition) {
  return role.id === "it-administrator" && Boolean(permission.protectedForPrimaryAdministrator);
}

export function RolesPermissionsManager({ roles, permissions }: RolesPermissionsManagerProps) {
  const [selectedRoleId, setSelectedRoleId] = useState(roles[0]?.id ?? "");
  const [roleAssignments, setRoleAssignments] = useState<RoleAssignments>(() => createAssignments(roles, permissions));
  const [permissionDraft, setPermissionDraft] = useState<PermissionAssignment>({});
  const [isEditing, setIsEditing] = useState(false);
  const [feedback, setFeedback] = useState("");

  const selectedRole = roles.find((role) => role.id === selectedRoleId) ?? null;
  const selectedAssignments = selectedRole ? roleAssignments[selectedRole.id] ?? {} : {};
  const visibleAssignments = isEditing ? permissionDraft : selectedAssignments;
  const permissionGroups = permissionCategoryOrder
    .map((category) => ({
      category,
      permissions: permissions.filter((permission) => permission.category === category),
    }))
    .filter((group) => group.permissions.length > 0);

  function selectRole(roleId: string) {
    if (roleId === selectedRoleId) return;

    setSelectedRoleId(roleId);
    setIsEditing(false);
    setPermissionDraft({});
    setFeedback("Unsaved permission changes were discarded.");
  }

  function startEditing() {
    if (!selectedRole) return;

    setPermissionDraft({ ...selectedAssignments });
    setIsEditing(true);
    setFeedback("");
  }

  function cancelEditing() {
    setPermissionDraft({});
    setIsEditing(false);
    setFeedback("Permission changes were discarded.");
  }

  function togglePermission(permission: PermissionDefinition) {
    if (!selectedRole || isProtectedPermission(selectedRole, permission)) return;

    setPermissionDraft((current) => ({
      ...current,
      [permission.id]: !current[permission.id],
    }));
  }

  function savePermissions() {
    if (!selectedRole) return;

    setRoleAssignments((current) => ({
      ...current,
      [selectedRole.id]: { ...permissionDraft },
    }));
    setPermissionDraft({});
    setIsEditing(false);
    setFeedback("Permission changes were saved in the frontend prototype.");
  }

  return (
    <>
      <section className="dashboard-card roles-workspace-card" aria-labelledby="roles-workspace-heading">
        <div className="panel-header">
          <div>
            <p className="section-kicker">Application access model</p>
            <h2 id="roles-workspace-heading">Role management</h2>
            <p className="roles-panel-description">
              Select a system role to review its application capabilities and assignment scope.
            </p>
          </div>
          <StatusBadge tone="info"><Icon name="shield" /> Application roles</StatusBadge>
        </div>

        <div className="roles-workspace">
          <aside className="roles-list" aria-labelledby="roles-list-heading">
            <div className="roles-list-heading">
              <p className="section-kicker">Available roles</p>
              <h3 id="roles-list-heading">Role catalog</h3>
              <p>Active roles for this integration application.</p>
            </div>
            <div className="roles-list-items">
              {roles.length > 0 ? roles.map((role) => {
                const selected = role.id === selectedRoleId;

                return (
                  <button
                    type="button"
                    className={`role-selector ${selected ? "is-selected" : ""}`}
                    key={role.id}
                    aria-pressed={selected}
                    onClick={() => selectRole(role.id)}
                  >
                    <span className="role-selector-copy">
                      <strong>{role.name}</strong>
                      <span>{role.description}</span>
                    </span>
                    <span className="role-selector-meta">
                      <StatusBadge tone="success">{role.status}</StatusBadge>
                      <small>{role.assignedUsers} {role.assignedUsers === 1 ? "user" : "users"}</small>
                    </span>
                  </button>
                );
              }) : (
                <p className="roles-empty-state">No application roles are available.</p>
              )}
            </div>
          </aside>

          <div className="role-details">
            {selectedRole ? (
              <>
                <div className="role-details-heading">
                  <div className="role-details-title">
                    <p className="section-kicker">Selected role</p>
                    <h3>{selectedRole.name}</h3>
                    <p>{selectedRole.description}</p>
                  </div>
                  <div className="role-details-actions">
                    <div className="role-badges">
                      <StatusBadge tone="success">{selectedRole.status}</StatusBadge>
                      <StatusBadge tone="muted"><Icon name="lock" /> {selectedRole.type}</StatusBadge>
                    </div>
                    {!isEditing ? (
                      <button type="button" className="button-primary" onClick={startEditing}>
                        <Icon name="key" />
                        Edit permissions
                      </button>
                    ) : (
                      <StatusBadge tone="warning">Edit mode</StatusBadge>
                    )}
                  </div>
                </div>

                <dl className="role-details-meta">
                  <div>
                    <dt>Status</dt>
                    <dd><StatusBadge tone="success">Active</StatusBadge></dd>
                  </div>
                  <div>
                    <dt>Role type</dt>
                    <dd>{selectedRole.type}</dd>
                  </div>
                  <div>
                    <dt>Assigned users</dt>
                    <dd>{selectedRole.assignedUsers}</dd>
                  </div>
                  <div>
                    <dt>Last updated</dt>
                    <dd>{selectedRole.lastUpdated}</dd>
                  </div>
                </dl>

                <p className="role-protected-note">
                  <Icon name="shield" />
                  <span>
                    {selectedRole.id === "it-administrator"
                      ? "The primary administrator role is maintained by the prototype catalog, and its core access remains protected."
                      : "The Employee system role is maintained by the prototype catalog for self-service access."}
                  </span>
                </p>
              </>
            ) : (
              <p className="roles-empty-state">Select a role to view its details.</p>
            )}
          </div>
        </div>
      </section>

      <section className="dashboard-card roles-permissions-card" aria-labelledby="roles-permissions-heading">
        <div className="panel-header">
          <div>
            <p className="section-kicker">Grouped capability review</p>
            <h2 id="roles-permissions-heading">Access permissions</h2>
            <p className="roles-panel-description">
              Review application capabilities by feature area. External system permissions are intentionally excluded.
            </p>
          </div>
          <StatusBadge tone={isEditing ? "warning" : "muted"}>{isEditing ? "Editing" : "View mode"}</StatusBadge>
        </div>

        <div className="roles-permissions-body">
          {selectedRole ? (
            <>
              <div className="roles-permissions-context">
                <p>
                  Showing permissions for <strong>{selectedRole.name}</strong>.
                </p>
                <span>{Object.values(visibleAssignments).filter(Boolean).length} of {permissions.length} allowed</span>
              </div>

              <div className="permission-groups">
                {permissionGroups.map((group) => {
                  const allowedCount = group.permissions.filter((permission) => visibleAssignments[permission.id]).length;

                  return (
                    <fieldset className="permission-group" key={group.category}>
                      <legend>
                        <span className="permission-group-title">{group.category}</span>
                        <span className="permission-group-count">{allowedCount} of {group.permissions.length} allowed</span>
                      </legend>
                      <div className="permission-list">
                        {group.permissions.map((permission) => {
                          const allowed = Boolean(visibleAssignments[permission.id]);
                          const protectedPermission = isProtectedPermission(selectedRole, permission);
                          const descriptionId = `${selectedRole.id}-${permission.id}-description`;

                          if (isEditing) {
                            return (
                              <label className={`permission-row permission-row-edit ${protectedPermission ? "is-protected" : ""}`} key={permission.id}>
                                <input
                                  type="checkbox"
                                  checked={allowed}
                                  disabled={protectedPermission}
                                  aria-describedby={descriptionId}
                                  onChange={() => togglePermission(permission)}
                                />
                                <span className="permission-copy">
                                  <strong>{permission.name}</strong>
                                  <span id={descriptionId}>{permission.description}</span>
                                </span>
                                {protectedPermission ? (
                                  <span className="permission-protected" title="Required for the primary administrator">
                                    <Icon name="lock" /> Required
                                  </span>
                                ) : null}
                              </label>
                            );
                          }

                          return (
                            <div className={`permission-row ${allowed ? "is-allowed" : "is-not-allowed"}`} key={permission.id}>
                              <span className="permission-state-icon" aria-hidden="true">
                                <Icon name={allowed ? "check" : "close"} />
                              </span>
                              <span className="permission-copy">
                                <strong>{permission.name}</strong>
                                <span>{permission.description}</span>
                              </span>
                              <StatusBadge tone={allowed ? "success" : "muted"}>{allowed ? "Allowed" : "Not allowed"}</StatusBadge>
                            </div>
                          );
                        })}
                      </div>
                    </fieldset>
                  );
                })}
              </div>

              {isEditing ? (
                <div className="roles-save-bar">
                  <div>
                    <strong>Permission changes are simulated.</strong>
                    <span>Save or cancel this frontend-only edit session.</span>
                  </div>
                  <div className="roles-save-actions">
                    <button type="button" className="button-secondary" onClick={cancelEditing}>Cancel</button>
                    <button type="button" className="button-primary" onClick={savePermissions}><Icon name="check" /> Save changes</button>
                  </div>
                </div>
              ) : null}

              <p className="roles-feedback" role="status" aria-live="polite">{feedback}</p>
            </>
          ) : (
            <p className="roles-empty-state">Select a role to view its permissions.</p>
          )}
        </div>
      </section>
    </>
  );
}
