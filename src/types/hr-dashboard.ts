import type { StatusTone } from "@/types/ui";

export type HrDashboardAttendanceItem = {
    id: string;
    employeeId: string;
    employeeName: string;
    department: string;
    schedule: string;
    timeIn: string;
    timeOut: string;
    source: string | null;
    status: "Present" | "Completed";
    statusTone: StatusTone;
    validationStatus: "Unavailable";
    validationTone: "muted";
    hrVerificationStatus: "Unavailable";
};

export type HrDashboardIssue = {
    id: string;
    employeeName: string;
    title: string;
    description: string;
    time: string;
    status: string;
    tone: StatusTone;
};

export type HrDashboardSummary = {
    attendanceDate: string;
    activeEmployees: number;
    timedInToday: number;
    completedToday: number;
    awaitingTimeOut: number;
    attendanceRecords: HrDashboardAttendanceItem[];
    recentIssues: HrDashboardIssue[];
};
