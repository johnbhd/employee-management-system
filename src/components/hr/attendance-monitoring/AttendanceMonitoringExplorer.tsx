"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import type { AttendanceMonitoringQuery } from "@/server/hr/attendance-monitoring-query";
import { attendanceMonitoringPageSizes } from "@/server/hr/attendance-monitoring-query";
import type {
    AttendanceMonitoringData,
    AttendanceMonitoringItem,
} from "@/types/hr-attendance-monitoring";

import { AttendanceMonitoringFilters } from "./AttendanceMonitoringFilters";
import { AttendanceMonitoringSummary } from "./AttendanceMonitoringSummary";
import { AttendanceMonitoringTable } from "./AttendanceMonitoringTable";
import { AttendanceRecordDrawer } from "./AttendanceRecordDrawer";

type AttendanceMonitoringExplorerProps = {
    data: AttendanceMonitoringData;
    query: AttendanceMonitoringQuery;
    defaultDate: string;
    loadError?: boolean;
};

const allValue = "";

const statusOptions = [
    { value: allValue, label: "All statuses" },
    { value: "present", label: "Present" },
    { value: "completed", label: "Completed" },
];

const sourceOptions = [
    { value: allValue, label: "All sources" },
    { value: "QR", label: "QR" },
];

function buildQueryString(values: {
    search: string;
    date: string;
    employeeId: string;
    department: string;
    status: string;
    source: string;
    page: number;
    pageSize: number;
}) {
    const params = new URLSearchParams();

    if (values.search.trim()) params.set("search", values.search.trim());
    params.set("date", values.date);
    if (values.employeeId) params.set("employeeId", values.employeeId);
    if (values.department) params.set("department", values.department);
    if (values.status) params.set("status", values.status);
    if (values.source) params.set("source", values.source);
    if (values.page > 1) params.set("page", String(values.page));
    if (values.pageSize !== attendanceMonitoringPageSizes[0]) {
        params.set("pageSize", String(values.pageSize));
    }

    return params.toString();
}

export function AttendanceMonitoringExplorer({
    data,
    query,
    defaultDate,
    loadError = false,
}: AttendanceMonitoringExplorerProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [search, setSearch] = useState(query.search);
    const [date, setDate] = useState(query.date ?? "");
    const [employeeId, setEmployeeId] = useState(query.employeeId ?? allValue);
    const [department, setDepartment] = useState(query.department ?? allValue);
    const [status, setStatus] = useState(query.status ?? allValue);
    const [source, setSource] = useState(query.source ?? allValue);
    const [selectedRecord, setSelectedRecord] = useState<AttendanceMonitoringItem | null>(null);

    useEffect(() => {
        if (!selectedRecord) return;

        function closeOnEscape(event: KeyboardEvent) {
            if (event.key === "Escape") setSelectedRecord(null);
        }

        document.addEventListener("keydown", closeOnEscape);

        return () => document.removeEventListener("keydown", closeOnEscape);
    }, [selectedRecord]);

    const employeeOptions = useMemo(() => [
        { value: allValue, label: "All employees" },
        ...data.employees.map((employee) => ({
            value: employee.employeeId,
            label: `${employee.displayName} (${employee.employeeId})`,
        })),
    ], [data.employees]);
    const departmentOptions = useMemo(() => [
        { value: allValue, label: "All departments" },
        ...data.departments.map((value) => ({ value, label: value })),
    ], [data.departments]);

    function navigateToFilters(overrides: Partial<{
        search: string;
        date: string;
        employeeId: string;
        department: string;
        status: string;
        source: string;
        page: number;
        pageSize: number;
    }> = {}) {
        const params = buildQueryString({
            search,
            date,
            employeeId,
            department,
            status,
            source,
            pageSize: query.pageSize,
            ...overrides,
            page: overrides.page ?? 1,
        });

        router.push(params ? `${pathname}?${params}` : pathname);
    }

    function resetFilters() {
        router.push(pathname);
    }

    const activeFilterCount = [
        search.trim(),
        date && date !== defaultDate ? date : "",
        employeeId,
        department,
        status,
        source,
    ].filter(Boolean).length;
    const firstVisibleRecord = data.total === 0 ? 0 : (data.page - 1) * data.pageSize + 1;
    const lastVisibleRecord = Math.min(data.page * data.pageSize, data.total);

    return (
        <div className="hr-monitoring-explorer">
            <AttendanceMonitoringSummary summary={data.summary} />

            <AttendanceMonitoringFilters
                search={search}
                date={date}
                employeeId={employeeId}
                department={department}
                status={status}
                source={source}
                employees={employeeOptions}
                departments={departmentOptions}
                statuses={statusOptions}
                sources={sourceOptions}
                activeFilterCount={activeFilterCount}
                onSearchChange={(value) => {
                    setSearch(value);
                    navigateToFilters({ search: value });
                }}
                onDateChange={(value) => {
                    setDate(value);
                    navigateToFilters({ date: value });
                }}
                onEmployeeChange={(value) => {
                    setEmployeeId(value);
                    navigateToFilters({ employeeId: value });
                }}
                onDepartmentChange={(value) => {
                    setDepartment(value);
                    navigateToFilters({ department: value });
                }}
                onStatusChange={(value) => {
                    setStatus(value);
                    navigateToFilters({ status: value });
                }}
                onSourceChange={(value) => {
                    setSource(value);
                    navigateToFilters({ source: value });
                }}
                onReset={resetFilters}
            />

            <section className="hr-dashboard-panel hr-monitoring-records" aria-labelledby="hr-monitoring-records-heading">
                <div className="hr-panel-header">
                    <div>
                        <p className="hr-section-kicker">Canonical attendance records</p>
                        <h2 id="hr-monitoring-records-heading">Attendance records</h2>
                        <p className="hr-panel-description">
                            Read-only monitoring of attendance recorded by the QR scanner.
                        </p>
                    </div>
                    <span className="hr-monitoring-result-count">
                        {loadError
                            ? "Records unavailable"
                            : `Showing ${firstVisibleRecord}-${lastVisibleRecord} of ${data.total} records`}
                    </span>
                </div>

                <AttendanceMonitoringTable
                    records={data.records}
                    onSelectRecord={setSelectedRecord}
                    emptyMessage={loadError
                        ? "Attendance records could not be loaded. Try refreshing the page."
                        : "No attendance records match the selected filters."}
                />

                <div className="hr-monitoring-table-footer">
                    <label className="hr-monitoring-page-size">
                        <span>Rows per page</span>
                        <select
                            value={query.pageSize}
                            onChange={(event) => navigateToFilters({
                                pageSize: Number(event.target.value),
                                page: 1,
                            })}
                        >
                            {attendanceMonitoringPageSizes.map((pageSize) => (
                                <option value={pageSize} key={pageSize}>{pageSize}</option>
                            ))}
                        </select>
                    </label>
                    <div className="hr-monitoring-pagination" aria-label="Attendance record pages">
                        <button
                            type="button"
                            className="button-secondary hr-monitoring-page-button"
                            onClick={() => navigateToFilters({ page: Math.max(1, data.page - 1) })}
                            disabled={data.page <= 1}
                        >
                            Previous
                        </button>
                        <span aria-live="polite">Page {data.page}</span>
                        <button
                            type="button"
                            className="button-secondary hr-monitoring-page-button"
                            onClick={() => navigateToFilters({ page: data.page + 1 })}
                            disabled={!data.hasNext}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </section>

            <AttendanceRecordDrawer
                record={selectedRecord}
                onClose={() => setSelectedRecord(null)}
            />
        </div>
    );
}
