import type { ReactNode } from "react";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCampusDateKeyLabel } from "@/lib/campus-time";
import type { AttendanceMonitoringItem } from "@/types/hr-attendance-monitoring";

type AttendanceRecordDrawerProps = {
    record: AttendanceMonitoringItem | null;
    onClose: () => void;
};

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="hr-monitoring-detail-row">
            <dt>{label}</dt>
            <dd>{value}</dd>
        </div>
    );
}

function sourceLabel(record: AttendanceMonitoringItem) {
    const sources = Array.from(new Set([
        record.timeInSource,
        record.timeOutSource,
    ].filter((source): source is "QR" => source !== null)));

    return sources.join(" / ") || "No source recorded";
}

export function AttendanceRecordDrawer({ record, onClose }: AttendanceRecordDrawerProps) {
    if (!record) return null;

    return (
        <div className="hr-monitoring-drawer-layer">
            <button
                type="button"
                className="hr-monitoring-drawer-backdrop"
                onClick={onClose}
                aria-label="Close attendance record details"
            />
            <aside
                className="hr-monitoring-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="hr-monitoring-drawer-title"
            >
                <div className="hr-monitoring-drawer-header">
                    <div>
                        <p className="hr-section-kicker">Selected record</p>
                        <h2 id="hr-monitoring-drawer-title">Attendance details</h2>
                    </div>
                    <button
                        type="button"
                        className="hr-monitoring-close-button"
                        onClick={onClose}
                        aria-label="Close attendance record details"
                        autoFocus
                    >
                        <Icon name="close" />
                    </button>
                </div>

                <p className="hr-monitoring-drawer-date">
                    <Icon name="calendar" />
                    {formatCampusDateKeyLabel(record.date, "long")}
                </p>

                <section className="hr-monitoring-detail-section" aria-labelledby="hr-monitoring-employee-heading">
                    <h3 id="hr-monitoring-employee-heading">Employee information</h3>
                    <dl className="hr-monitoring-detail-list">
                        <DetailRow label="Employee" value={record.employeeName} />
                        <DetailRow label="Employee ID" value={record.employeeId} />
                        <DetailRow label="Department" value={record.department} />
                    </dl>
                </section>

                <section className="hr-monitoring-detail-section" aria-labelledby="hr-monitoring-record-heading">
                    <h3 id="hr-monitoring-record-heading">Attendance record</h3>
                    <dl className="hr-monitoring-detail-list">
                        <DetailRow label="Date" value={formatCampusDateKeyLabel(record.date, "long")} />
                        <DetailRow label="Time In" value={record.timeIn} />
                        <DetailRow label="Time Out" value={record.timeOut ?? "—"} />
                        <DetailRow label="Source" value={sourceLabel(record)} />
                        <DetailRow
                            label="Attendance status"
                            value={<StatusBadge tone={record.statusTone}>{record.statusLabel}</StatusBadge>}
                        />
                    </dl>
                </section>

                <div className="hr-monitoring-drawer-footer">
                    <button type="button" className="button-secondary" onClick={onClose}>
                        Close
                    </button>
                </div>
            </aside>
        </div>
    );
}
