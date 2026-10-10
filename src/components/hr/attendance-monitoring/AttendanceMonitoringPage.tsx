import type { AttendanceMonitoringQuery } from "@/server/hr/attendance-monitoring-query";
import type { AttendanceMonitoringData } from "@/types/hr-attendance-monitoring";

import { AttendanceMonitoringExplorer } from "./AttendanceMonitoringExplorer";
import { AttendanceMonitoringRefreshButton } from "./AttendanceMonitoringRefreshButton";

type AttendanceMonitoringPageProps = {
    data: AttendanceMonitoringData;
    query: AttendanceMonitoringQuery;
    defaultDate: string;
    loadError?: boolean;
};

export function AttendanceMonitoringPage({
    data,
    query,
    defaultDate,
    loadError = false,
}: AttendanceMonitoringPageProps) {
    return (
        <div className="hr-dashboard-page hr-attendance-monitoring-page">
            <header className="hr-dashboard-header">
                <div className="hr-dashboard-heading">
                    <p className="hr-dashboard-eyebrow">Attendance operations</p>
                    <h1>Attendance Monitoring</h1>
                    <p className="hr-dashboard-description">
                        Monitor canonical employee attendance records from the QR scanner.
                    </p>
                </div>
                <div className="hr-dashboard-actions">
                    <AttendanceMonitoringRefreshButton />
                </div>
            </header>

            <AttendanceMonitoringExplorer
                key={[query.date, query.employeeId, query.department, query.status, query.source, query.search, query.page, query.pageSize].join("|")}
                data={data}
                query={query}
                defaultDate={defaultDate}
                loadError={loadError}
            />
        </div>
    );
}
