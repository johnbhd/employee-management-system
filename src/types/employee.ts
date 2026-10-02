export type EmployeeEmploymentStatus = "active" | "inactive";

export type EmployeeReference = {
    employeeId: string;
    displayName: string;
    department: string;
    position: string | null;
    employmentStatus: EmployeeEmploymentStatus;
};
