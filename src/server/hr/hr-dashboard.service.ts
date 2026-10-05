import "server-only";

import {
    formatCampusDateKey,
    formatCampusTime,
} from "@/lib/campus-time";
import { listAttendanceByDate } from "@/server/repositories/attendance/attendance.repository";
import { listEmployees } from "@/server/repositories/employees/employee.repository";
import type {
    HrDashboardAttendanceItem,
    HrDashboardIssue,
    HrDashboardSummary,
} from "@/types/hr-dashboard";

export async function getHrDashboardSummary(
    now = new Date(),
): Promise<HrDashboardSummary> {
    const attendanceDate = formatCampusDateKey(now);
    const [employees, attendanceDocuments] = await Promise.all([
        listEmployees(),
        listAttendanceByDate(attendanceDate),
    ]);
    const employeesById = new Map(
        employees.map((employee) => [employee.employeeId, employee]),
    );
    const attendanceRecords = attendanceDocuments.map(
        ({ id, record }): HrDashboardAttendanceItem => {
            const employee = employeesById.get(record.employeeId);
            const isCompleted = record.status === "completed"
                && record.timeOut !== null;

            return {
                id,
                employeeId: record.employeeId,
                employeeName: employee?.displayName
                    ?? "Employee information unavailable",
                department: employee?.department ?? "Unavailable",
                schedule: "—",
                timeIn: formatCampusTime(record.timeIn.toDate()),
                timeOut: record.timeOut
                    ? formatCampusTime(record.timeOut.toDate())
                    : "—",
                source: record.timeInSource,
                status: isCompleted ? "Completed" : "Present",
                statusTone: isCompleted ? "success" : "warning",
                validationStatus: "Unavailable",
                validationTone: "muted",
                hrVerificationStatus: "Unavailable",
            };
        },
    );
    const awaitingRecords = attendanceDocuments.filter(
        ({ record }) => record.timeIn !== null && record.timeOut === null,
    );
    const recentIssues: HrDashboardIssue[] = awaitingRecords
        .slice(0, 3)
        .map(({ id, record }) => {
            const employee = employeesById.get(record.employeeId);

            return {
                id,
                employeeName: employee?.displayName
                    ?? "Employee information unavailable",
                title: "Awaiting Time-Out",
                description: "Time-In is recorded, but Time-Out is still pending.",
                time: `Today · ${formatCampusTime(record.timeIn.toDate())}`,
                status: "Awaiting Time-Out",
                tone: "warning",
            };
        });

    return {
        attendanceDate,
        activeEmployees: employees.filter(
            (employee) => employee.employmentStatus === "active",
        ).length,
        timedInToday: attendanceDocuments.filter(
            ({ record }) => record.timeIn !== null,
        ).length,
        completedToday: attendanceDocuments.filter(
            ({ record }) => record.status === "completed" && record.timeOut !== null,
        ).length,
        awaitingTimeOut: awaitingRecords.length,
        attendanceRecords,
        recentIssues,
    };
}
