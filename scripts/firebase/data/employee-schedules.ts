import { employeeSeedData } from "./employees";

export type SeedEmployeeSchedule = {
  scheduleId: string;
  employeeId: string;
  workStart: string;
  workEnd: string;
  breakStart: string;
  breakEnd: string;
  shiftLabel: string;
  workDays: readonly string[];
  restDays: readonly string[];
  workLocation: string;
  sourceSystem: "HRPS";
  dataSource: "development-seed";
};

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const restDays = ["Saturday", "Sunday"];

const scheduleByEmployeeId: ReadonlyMap<
  string,
  Pick<SeedEmployeeSchedule, "workStart" | "workEnd">
> = new Map([
  ["001", { workStart: "07:30", workEnd: "17:00" }],
  ["002", { workStart: "07:30", workEnd: "17:00" }],
  ["003", { workStart: "07:30", workEnd: "17:00" }],
  ["004", { workStart: "07:30", workEnd: "17:00" }],
  ["005", { workStart: "07:30", workEnd: "17:00" }],
  ["006", { workStart: "08:00", workEnd: "17:00" }],
  ["007", { workStart: "08:00", workEnd: "17:00" }],
  ["008", { workStart: "08:00", workEnd: "17:00" }],
  ["009", { workStart: "08:00", workEnd: "17:00" }],
  ["010", { workStart: "08:00", workEnd: "17:00" }],
]);

export const employeeScheduleSeedData: readonly SeedEmployeeSchedule[] =
  employeeSeedData
    .filter((employee) => scheduleByEmployeeId.has(employee.employeeId))
    .map((employee) => {
      const schedule = scheduleByEmployeeId.get(employee.employeeId);

      if (!schedule) {
        throw new Error("Missing development schedule for " + employee.employeeId + ".");
      }

      return {
        scheduleId: "schedule-" + employee.employeeId + "-regular",
        employeeId: employee.employeeId,
        workStart: schedule.workStart,
        workEnd: schedule.workEnd,
        breakStart: "12:00",
        breakEnd: "13:00",
        shiftLabel: "Regular Shift",
        workDays: weekdays,
        restDays,
        workLocation: "Main Campus · " + employee.department + " Office",
        sourceSystem: "HRPS",
        dataSource: "development-seed",
      };
    });
