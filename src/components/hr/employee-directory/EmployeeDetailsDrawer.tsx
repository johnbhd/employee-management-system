"use client";

import type { ReactNode } from "react";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { EmployeeReference } from "@/types/employee";

type EmployeeDetailsDrawerProps = {
    employee: EmployeeReference | null;
    onClose: () => void;
};

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="hr-directory-detail-row">
            <dt>{label}</dt>
            <dd>{value}</dd>
        </div>
    );
}

function employmentStatusLabel(status: EmployeeReference["employmentStatus"]) {
    return status === "active" ? "Active" : "Inactive";
}

export function EmployeeDetailsDrawer({
    employee,
    onClose,
}: EmployeeDetailsDrawerProps) {
    if (!employee) return null;

    return (
        <div className="hr-directory-drawer-layer">
            <button
                type="button"
                className="hr-directory-drawer-backdrop"
                onClick={onClose}
                aria-label="Close employee details"
            />
            <aside
                className="hr-directory-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="hr-directory-drawer-title"
            >
                <div className="hr-directory-drawer-header">
                    <div>
                        <p className="hr-section-kicker">Selected employee</p>
                        <h2 id="hr-directory-drawer-title">Employee reference</h2>
                        <p className="hr-directory-drawer-employee">{employee.displayName}</p>
                        <p className="hr-directory-drawer-meta">
                            {employee.employeeId} · {employee.department}
                        </p>
                    </div>
                    <button
                        type="button"
                        className="hr-directory-close-button"
                        onClick={onClose}
                        aria-label="Close employee details"
                        autoFocus
                    >
                        <Icon name="close" />
                    </button>
                </div>

                <section className="hr-directory-detail-section" aria-labelledby="hr-directory-employee-information-heading">
                    <h3 id="hr-directory-employee-information-heading">Employee information</h3>
                    <dl className="hr-directory-detail-list">
                        <DetailRow label="Employee ID" value={employee.employeeId} />
                        <DetailRow label="Full name" value={employee.displayName} />
                    </dl>
                </section>

                <section className="hr-directory-detail-section" aria-labelledby="hr-directory-employment-heading">
                    <h3 id="hr-directory-employment-heading">Employment information</h3>
                    <dl className="hr-directory-detail-list">
                        <DetailRow label="Department" value={employee.department} />
                        <DetailRow label="Position" value={employee.position ?? "—"} />
                        <DetailRow
                            label="Employment status"
                            value={
                                <StatusBadge tone={employee.employmentStatus === "active" ? "success" : "muted"}>
                                    {employmentStatusLabel(employee.employmentStatus)}
                                </StatusBadge>
                            }
                        />
                    </dl>
                </section>

                <div className="hr-directory-drawer-footer">
                    <button type="button" className="button-secondary" onClick={onClose}>
                        Close
                    </button>
                </div>
            </aside>
        </div>
    );
}
