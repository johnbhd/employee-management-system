import "server-only";

import {
    formatCampusDateKeyLabel,
    formatCampusTime,
} from "@/lib/campus-time";
import {
    listAttendanceForMonitoring,
} from "@/server/repositories/attendance/attendance.repository";
import { listEmployees } from "@/server/repositories/employees/employee.repository";
import type { EmployeeReference } from "@/types/employee";
import type {
    AttendanceMonitoringData,
    AttendanceMonitoringItem,
} from "@/types/hr-attendance-monitoring";

import type { AttendanceMonitoringQuery } from "./attendance-monitoring-query";

function matchesSearch(employee: EmployeeReference, search: string) {
    if (!search) return true;

    const normalizedSearch = search.toLowerCase();

    return [employee.displayName, employee.employeeId, employee.department]
        .some((value) => value.toLowerCase().includes(normalizedSearch));
}

function toMonitoringItem(
    id: string,
    record: Awaited<ReturnType<typeof listAttendanceForMonitoring>>[number]["record"],
    employee: EmployeeReference,
): AttendanceMonitoringItem {
    const isCompleted = record.status === "completed" && record.timeOut !== null;

    return {
        id,
        employeeName: employee.displayName,
        employeeId: employee.employeeId,
        department: employee.department,
        date: record.attendanceDate,
        dateLabel: formatCampusDateKeyLabel(record.attendanceDate),
        timeIn: formatCampusTime(record.timeIn.toDate()),
        timeOut: record.timeOut ? formatCampusTime(record.timeOut.toDate()) : null,
        timeInSource: record.timeInSource,
        timeOutSource: record.timeOutSource,
        status: isCompleted ? "completed" : "present",
        statusLabel: isCompleted ? "Completed" : "Present",
        statusTone: isCompleted ? "success" : "warning",
    };
}

export async function getAttendanceMonitoringData(
    query: AttendanceMonitoringQuery,
): Promise<AttendanceMonitoringData> {
    const [employees, attendanceDocuments] = await Promise.all([
        listEmployees(),
        listAttendanceForMonitoring({
            attendanceDate: query.date,
            employeeId: query.employeeId,
            status: query.status,
            source: query.source,
        }),
    ]);
    const employeesById = new Map(
        employees.map((employee) => [employee.employeeId, employee]),
    );
    const filteredRecords = attendanceDocuments
        .map(({ id, record }) => {
            const employee = employeesById.get(record.employeeId);

            return employee ? { id, record, employee } : null;
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .filter(({ employee }) => (
            (!query.department || employee.department === query.department)
            && matchesSearch(employee, query.search)
        ))
        .map(({ id, record, employee }) => toMonitoringItem(id, record, employee));
    const total = filteredRecords.length;
    const summary = {
        total,
        present: filteredRecords.filter((record) => record.status === "present").length,
        completed: filteredRecords.filter((record) => record.status === "completed").length,
        awaitingTimeOut: filteredRecords.filter((record) => record.timeOut === null).length,
    };
    const employeeOptions = employees.map((employee) => ({
        employeeId: employee.employeeId,
        displayName: employee.displayName,
        department: employee.department,
    }));
    const page = total === 0
        ? 1
        : Math.min(query.page, Math.ceil(total / query.pageSize));
    const firstRecordIndex = (page - 1) * query.pageSize;

    return {
        records: filteredRecords.slice(firstRecordIndex, firstRecordIndex + query.pageSize),
        total,
        page,
        pageSize: query.pageSize,
        hasNext: firstRecordIndex + query.pageSize < total,
        summary,
        employees: employeeOptions,
        departments: Array.from(new Set(employees.map((employee) => employee.department))).sort(),
    };
}
