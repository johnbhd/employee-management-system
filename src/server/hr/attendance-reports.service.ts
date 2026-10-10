import "server-only";

import {
    formatCampusDateKey,
    formatCampusDateKeyLabel,
    formatCampusDateTime,
    formatCampusTime,
} from "@/lib/campus-time";
import {
    buildAttendanceReportSummary,
    buildMonthlyAttendanceRows,
    buildSourceUsageSummary,
    type AttendanceReportCorrectionRecord,
    type AttendanceReportRecord,
    type MonthlyAttendanceRow,
    type SourceUsageSummary,
} from "@/data/hr-attendance-reports";
import {
    listAttendanceCorrectionRequests,
} from "@/server/repositories/attendance-corrections/attendance-correction.repository";
import {
    listAttendanceForReport,
} from "@/server/repositories/attendance/attendance.repository";
import { listEmployees } from "@/server/repositories/employees/employee.repository";
import type { EmployeeReference } from "@/types/employee";

import type { AttendanceReportsQuery } from "./attendance-reports-query";

export type AttendanceReportsData = {
    records: AttendanceReportRecord[];
    monthlyRows: MonthlyAttendanceRow[];
    correctionRequests: AttendanceReportCorrectionRecord[];
    summary: ReturnType<typeof buildAttendanceReportSummary>;
    sourceSummary: SourceUsageSummary;
    employees: Array<Pick<EmployeeReference, "employeeId" | "displayName" | "department">>;
    departments: string[];
};

function correctionStatusLabel(status: "pending" | "approved" | "rejected") {
    if (status === "approved") return "Approved" as const;
    if (status === "rejected") return "Rejected" as const;
    return "Pending" as const;
}

function correctionStatusTone(status: "pending" | "approved" | "rejected") {
    if (status === "approved") return "success" as const;
    if (status === "rejected") return "danger" as const;
    return "warning" as const;
}

function toReportRecord(
    id: string,
    record: Awaited<ReturnType<typeof listAttendanceForReport>>[number]["record"],
    employee: EmployeeReference,
): AttendanceReportRecord {
    const isCompleted = record.status === "completed" && record.timeOut !== null;

    return {
        id,
        employeeId: employee.employeeId,
        employeeName: employee.displayName,
        department: employee.department,
        date: record.attendanceDate,
        dateLabel: formatCampusDateKeyLabel(record.attendanceDate, "long"),
        timeIn: formatCampusTime(record.timeIn.toDate()),
        timeOut: record.timeOut ? formatCampusTime(record.timeOut.toDate()) : null,
        source: record.timeInSource,
        status: isCompleted ? "Completed" : "Present",
        statusTone: isCompleted ? "success" : "warning",
        timeInSource: record.timeInSource,
        timeOutSource: record.timeOutSource,
    };
}

function toCorrectionRecord(
    request: Awaited<ReturnType<typeof listAttendanceCorrectionRequests>>[number],
    employee: EmployeeReference,
): AttendanceReportCorrectionRecord {
    return {
        id: request.id,
        attendanceRecordId: request.attendanceRecordId,
        employeeId: request.employeeId,
        employeeName: employee.displayName,
        department: employee.department,
        attendanceDate: request.attendanceDate,
        attendanceDateLabel: formatCampusDateKeyLabel(request.attendanceDate, "long"),
        submittedDate: formatCampusDateKey(request.submittedAt.toDate()),
        submittedAt: formatCampusDateTime(request.submittedAt.toDate()),
        issueType: request.issueType,
        status: correctionStatusLabel(request.status),
        statusTone: correctionStatusTone(request.status),
        decisionAt: request.reviewedAt
            ? formatCampusDateTime(request.reviewedAt.toDate())
            : null,
    };
}

function matchesReportScope(
    date: string,
    month: string,
    query: AttendanceReportsQuery,
) {
    return query.reportType === "monthly"
        ? date.startsWith(`${month}-`)
        : date === query.date;
}

export async function getAttendanceReportsData(
    query: AttendanceReportsQuery,
): Promise<AttendanceReportsData> {
    const [employees, attendanceDocuments] = await Promise.all([
        listEmployees(),
        listAttendanceForReport({
            attendanceDate: query.reportType === "monthly" ? null : query.date,
            attendanceMonth: query.reportType === "monthly" ? query.month : null,
            employeeId: query.employeeId,
            status: query.status,
        }),
    ]);
    const employeesById = new Map(
        employees.map((employee) => [employee.employeeId, employee]),
    );
    const attendanceRecords = attendanceDocuments
        .map(({ id, record }) => {
            const employee = employeesById.get(record.employeeId);

            return employee ? toReportRecord(id, record, employee) : null;
        })
        .filter((record): record is AttendanceReportRecord => record !== null)
        .filter((record) => (
            matchesReportScope(record.date, query.month, query)
            && (!query.department || record.department === query.department)
        ));
    const records = query.reportType === "missing-time-out"
        ? attendanceRecords.filter((record) => record.timeOut === null)
        : attendanceRecords;
    const correctionRequests = query.reportType === "correction-summary"
        ? (await listAttendanceCorrectionRequests())
            .map((request) => {
                const employee = employeesById.get(request.employeeId);

                return employee ? toCorrectionRecord(request, employee) : null;
            })
            .filter((request): request is AttendanceReportCorrectionRecord => request !== null)
            .filter((request) => (
                matchesReportScope(request.attendanceDate, query.month, query)
                && (!query.department || request.department === query.department)
                && (!query.employeeId || request.employeeId === query.employeeId)
            ))
        : [];
    const employeesForFilter = employees.map((employee) => ({
        employeeId: employee.employeeId,
        displayName: employee.displayName,
        department: employee.department,
    }));

    return {
        records,
        monthlyRows: buildMonthlyAttendanceRows(attendanceRecords),
        correctionRequests,
        summary: buildAttendanceReportSummary(records),
        sourceSummary: buildSourceUsageSummary(records),
        employees: employeesForFilter,
        departments: Array.from(new Set(employees.map((employee) => employee.department))).sort(),
    };
}
