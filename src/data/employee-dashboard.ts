import {
  employeeStats,
} from "@/data/employee";
import type { Metric } from "@/types/ui";

// These fixtures remain limited to dashboard sections whose authoritative
// backend contracts are not part of the current attendance integration.
export type EmployeeDashboardPayslip = {
  period: string;
  amount: string;
  releasedDate: string;
};

export type EmployeeDashboardData = {
  source: "development-seed" | "empty-test-fixture";
  stats: readonly Metric[];
  latestPayslip: EmployeeDashboardPayslip | null;
};

function createSeededDashboardData({
  statValues,
  amount,
}: {
  statValues: readonly [string, string, string, string];
  amount: string;
}): EmployeeDashboardData {
  return {
    source: "development-seed",
    stats: employeeStats.map((stat, index) => ({
      ...stat,
      value: statValues[index],
    })),
    latestPayslip: {
      period: "July 1-15, 2026",
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
  latestPayslip: null,
};

const employeeDashboardDataByEmployeeId: Readonly<
  Record<string, EmployeeDashboardData>
> = {
  "001": createSeededDashboardData({
    statValues: ["18", "2", "0", "6.5"],
    amount: "PHP 24,850.00",
  }),
  "002": createSeededDashboardData({
    statValues: ["17", "1", "1", "4.0"],
    amount: "PHP 23,600.00",
  }),
  "003": createSeededDashboardData({
    statValues: ["19", "0", "0", "8.0"],
    amount: "PHP 26,100.00",
  }),
  "004": createSeededDashboardData({
    statValues: ["16", "3", "1", "2.5"],
    amount: "PHP 22,950.00",
  }),
  "005": createSeededDashboardData({
    statValues: ["18", "2", "0", "6.5"],
    amount: "PHP 24,250.00",
  }),
  "006": createSeededDashboardData({
    statValues: ["15", "4", "2", "1.5"],
    amount: "PHP 21,800.00",
  }),
  "007": createSeededDashboardData({
    statValues: ["20", "0", "0", "9.0"],
    amount: "PHP 27,400.00",
  }),
  "008": createSeededDashboardData({
    statValues: ["18", "1", "1", "3.0"],
    amount: "PHP 25,500.00",
  }),
  "009": createSeededDashboardData({
    statValues: ["14", "5", "2", "0.0"],
    amount: "PHP 20,750.00",
  }),
  "010": emptyDashboardData,
};

export function getEmployeeDashboardData(
  employeeId: string,
): EmployeeDashboardData {
  return employeeDashboardDataByEmployeeId[employeeId] ?? emptyDashboardData;
}
