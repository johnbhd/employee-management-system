import { formatCampusDateKey } from "@/lib/campus-time";
import {
    getAttendanceMonitoringData,
} from "@/server/hr/attendance-monitoring.service";
import {
    parseAttendanceMonitoringQuery,
} from "@/server/hr/attendance-monitoring-query";
import type { AttendanceMonitoringData } from "@/types/hr-attendance-monitoring";

import { AttendanceMonitoringPage } from "@/components/hr/attendance-monitoring/AttendanceMonitoringPage";

type PageProps = {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function toSearchParams(
    values: Record<string, string | string[] | undefined>,
) {
    const params = new URLSearchParams();

    Object.entries(values).forEach(([key, value]) => {
        if (typeof value === "string") {
            params.set(key, value);
        } else if (Array.isArray(value) && value[0]) {
            params.set(key, value[0]);
        }
    });

    return params;
}

export default async function Page({ searchParams }: PageProps) {
    const defaultDate = formatCampusDateKey(new Date());
    const resolvedSearchParams = searchParams ? await searchParams : {};
    const query = parseAttendanceMonitoringQuery(
        toSearchParams(resolvedSearchParams),
        defaultDate,
    );
    let data: AttendanceMonitoringData = {
        records: [],
        total: 0,
        page: query.page,
        pageSize: query.pageSize,
        hasNext: false,
        summary: {
            total: 0,
            present: 0,
            completed: 0,
            awaitingTimeOut: 0,
        },
        employees: [],
        departments: [],
    };
    let loadError = false;

    try {
        data = await getAttendanceMonitoringData(query);
    } catch {
        loadError = true;
    }

    return (
        <AttendanceMonitoringPage
            data={data}
            query={query}
            defaultDate={defaultDate}
            loadError={loadError}
        />
    );
}
