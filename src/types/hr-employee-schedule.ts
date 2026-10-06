import type { EmployeeReference } from "@/types/employee";

export type EmployeeScheduleDetails = {
    scheduleId: string;
    employeeId: string;
    workStart: string | null;
    workEnd: string | null;
    breakStart: string | null;
    breakEnd: string | null;
    shiftLabel: string | null;
    workDays: string[];
    restDays: string[];
    workLocation: string | null;
};

export type EmployeeScheduleReference = EmployeeScheduleDetails & {
    sourceSystem: "HRPS";
    dataSource: "development-seed" | "synchronized";
};

export type EmployeeScheduleItem = {
    employee: EmployeeReference;
    schedule: EmployeeScheduleDetails | null;
};
