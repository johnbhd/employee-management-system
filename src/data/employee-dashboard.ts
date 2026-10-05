import {
  attendanceHistory,
  employeeStats,
} from "@/data/employee";
import type { Metric, StatusTone } from "@/types/ui";

// These fixtures keep the dashboard testable until attendance and payroll
// contracts are available from their authoritative backend systems.
export type EmployeeDashboardTodayAttendance = {
  status: string;
  tone: StatusTone;
  timeIn: string | null;
  timeOut: string | null;
  workHours: string | null;
  sourceLabel: string;
};

export type EmployeeDashboardPayslip = {
  period: string;
  amount: string;
  releasedDate: string;
};

export type EmployeeDashboardAttendanceRecord = {
  date: string;
  timeIn: string;
  timeOut: string;
  hours: string;
  status: string;
  tone: StatusTone;
};

export type EmployeeDashboardData = {
  source: "development-seed" | "empty-test-fixture";
  stats: readonly Metric[];
  todayAttendance: EmployeeDashboardTodayAttendance | null;
  attendanceHistory: readonly EmployeeDashboardAttendanceRecord[];
  latestPayslip: EmployeeDashboardPayslip | null;
};

const seededAttendanceHistory: readonly EmployeeDashboardAttendanceRecord[] =
  attendanceHistory;

function createSeededDashboardData({
  statValues,
  timeIn,
  amount,
}: {
  statValues: readonly [string, string, string, string];
  timeIn: string;
  amount: string;
}): EmployeeDashboardData {
  return {
    source: "development-seed",
    stats: employeeStats.map((stat, index) => ({
      ...stat,
      value: statValues[index],
    })),
    todayAttendance: {
      status: "On time",
      tone: "success",
      timeIn,
      timeOut: null,
      workHours: null,
      sourceLabel: "Recorded via Bundy",
    },
    attendanceHistory: seededAttendanceHistory,
    latestPayslip: {
      period: "July 1–15, 2026",
      amount,
      releasedDate: "Released July 18, 2026",
    },
  };
}

const emptyDashboardData: EmployeeDashboardData = {
  source: "empty-test-fixture",
  stats: employeeStats.map((stat) => ({
    ...stat,
    value: "0",
    note: "No records",
  })),
  todayAttendance: null,
  attendanceHistory: [],
  latestPayslip: null,
};

const employeeDashboardDataByEmployeeId: Readonly<
  Record<string, EmployeeDashboardData>
> = {
  "001": createSeededDashboardData({
    statValues: ["18", "2", "0", "6.5"],
    timeIn: "7:24 AM",
    amount: "₱24,850.00",
  }),
  "002": createSeededDashboardData({
    statValues: ["17", "1", "1", "4.0"],
    timeIn: "7:31 AM",
    amount: "₱23,600.00",
  }),
  "003": createSeededDashboardData({
    statValues: ["19", "0", "0", "8.0"],
    timeIn: "7:18 AM",
    amount: "₱26,100.00",
  }),
  "004": createSeededDashboardData({
    statValues: ["16", "3", "1", "2.5"],
    timeIn: "7:45 AM",
    amount: "₱22,950.00",
  }),
  "005": createSeededDashboardData({
    statValues: ["18", "2", "0", "6.5"],
    timeIn: "7:26 AM",
    amount: "₱24,250.00",
  }),
  "006": createSeededDashboardData({
    statValues: ["15", "4", "2", "1.5"],
    timeIn: "7:52 AM",
    amount: "₱21,800.00",
  }),
  "007": createSeededDashboardData({
    statValues: ["20", "0", "0", "9.0"],
    timeIn: "7:12 AM",
    amount: "₱27,400.00",
  }),
  "008": createSeededDashboardData({
    statValues: ["18", "1", "1", "3.0"],
    timeIn: "7:35 AM",
    amount: "₱25,500.00",
  }),
  "009": createSeededDashboardData({
    statValues: ["14", "5", "2", "0.0"],
    timeIn: "8:02 AM",
    amount: "₱20,750.00",
  }),
  "010": emptyDashboardData,
};

export function getEmployeeDashboardData(
  employeeId: string,
): EmployeeDashboardData {
  return employeeDashboardDataByEmployeeId[employeeId] ?? emptyDashboardData;
}
