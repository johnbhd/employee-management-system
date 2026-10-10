import "server-only";

import {
    listEmployeeScheduleReferences,
} from "@/server/repositories/employee-schedules/employee-schedule.repository";
import { listEmployees } from "@/server/repositories/employees/employee.repository";
import type {
    EmployeeScheduleItem,
    EmployeeScheduleDetails,
} from "@/types/hr-employee-schedule";

export type EmployeeSchedulesData = {
    records: EmployeeScheduleItem[];
};

function toSafeScheduleDetails(
    schedule: Awaited<ReturnType<typeof listEmployeeScheduleReferences>>[number],
): EmployeeScheduleDetails {
    return {
        scheduleId: schedule.scheduleId,
        employeeId: schedule.employeeId,
        workStart: schedule.workStart,
        workEnd: schedule.workEnd,
        breakStart: schedule.breakStart,
        breakEnd: schedule.breakEnd,
        shiftLabel: schedule.shiftLabel,
        workDays: schedule.workDays,
        restDays: schedule.restDays,
        workLocation: schedule.workLocation,
    };
}

export async function getEmployeeSchedulesData(): Promise<EmployeeSchedulesData> {
    const [employees, schedules] = await Promise.all([
        listEmployees(),
        listEmployeeScheduleReferences(),
    ]);
    const schedulesByEmployeeId = new Map(
        schedules.map((schedule) => [schedule.employeeId, schedule]),
    );

    return {
        records: employees.map((employee) => {
            const schedule = schedulesByEmployeeId.get(employee.employeeId);

            return {
                employee,
                schedule: schedule ? toSafeScheduleDetails(schedule) : null,
            };
        }),
    };
}
