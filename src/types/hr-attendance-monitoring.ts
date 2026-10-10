import type { EmployeeReference } from "@/types/employee";
import type { StatusTone } from "@/types/ui";

export type AttendanceMonitoringStatus = "present" | "completed";

export type AttendanceMonitoringItem = {
    id: string;
    employeeName: string;
    employeeId: string;
    department: string;
    date: string;
    dateLabel: string;
    timeIn: string;
    timeOut: string | null;
    timeInSource: "QR";
    timeOutSource: "QR" | null;
    status: AttendanceMonitoringStatus;
    statusLabel: "Present" | "Completed";
    statusTone: StatusTone;
};

export type AttendanceMonitoringSummary = {
    total: number;
    present: number;
    completed: number;
    awaitingTimeOut: number;
};

export type AttendanceMonitoringEmployeeOption = Pick<
    EmployeeReference,
    "employeeId" | "displayName" | "department"
>;

export type AttendanceMonitoringData = {
    records: AttendanceMonitoringItem[];
    total: number;
    page: number;
    pageSize: number;
    hasNext: boolean;
    summary: AttendanceMonitoringSummary;
    employees: AttendanceMonitoringEmployeeOption[];
    departments: string[];
};
