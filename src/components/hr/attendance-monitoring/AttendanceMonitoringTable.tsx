import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { AttendanceMonitoringItem } from "@/types/hr-attendance-monitoring";

type AttendanceMonitoringTableProps = {
    records: readonly AttendanceMonitoringItem[];
    onSelectRecord: (record: AttendanceMonitoringItem) => void;
    emptyMessage?: string;
};

function sourceLabel(record: AttendanceMonitoringItem) {
    const sources = Array.from(new Set([
        record.timeInSource,
        record.timeOutSource,
    ].filter((source): source is "QR" => source !== null)));

    return sources.join(" / ") || "—";
}

export function AttendanceMonitoringTable({
    records,
    onSelectRecord,
    emptyMessage = "No attendance records match the selected filters.",
}: AttendanceMonitoringTableProps) {
    return (
        <div className="hr-monitoring-table-scroll">
            <table className="hr-monitoring-table">
                <caption className="sr-only">Employee attendance monitoring records</caption>
                <thead>
                    <tr>
                        <th scope="col">Employee</th>
                        <th scope="col">Date</th>
                        <th scope="col">Time In</th>
                        <th scope="col">Time Out</th>
                        <th scope="col">Source</th>
                        <th scope="col">Status</th>
                        <th scope="col">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {records.map((record) => (
                        <tr key={record.id}>
                            <td>
                                <strong className="hr-monitoring-employee-name">{record.employeeName}</strong>
                                <span className="hr-monitoring-employee-meta">{record.employeeId} · {record.department}</span>
                            </td>
                            <td>{record.dateLabel}</td>
                            <td>{record.timeIn}</td>
                            <td className={record.timeOut === null ? "hr-monitoring-missing-value" : undefined}>
                                {record.timeOut ?? "—"}
                            </td>
                            <td>
                                <StatusBadge tone="info">{sourceLabel(record)}</StatusBadge>
                            </td>
                            <td>
                                <StatusBadge tone={record.statusTone}>{record.statusLabel}</StatusBadge>
                            </td>
                            <td>
                                <button
                                    type="button"
                                    className="button-secondary hr-monitoring-view-button"
                                    onClick={() => onSelectRecord(record)}
                                >
                                    <Icon name="file" />
                                    View details
                                </button>
                            </td>
                        </tr>
                    ))}
                    {records.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="hr-monitoring-empty-row">
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : null}
                </tbody>
            </table>
        </div>
    );
}
