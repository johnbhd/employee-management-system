import { Timestamp } from "firebase-admin/firestore";

import { mapAttendance, mapEmployee, mapPayslip } from "./mappings";
import type { SourceRecord } from "./types";

export function runMigrationSelfCheck(): void {
  const employee: SourceRecord = {
    collection: "employees",
    id: "001",
    path: "employees/001",
    data: {
      employeeId: "001",
      displayName: "Sample Employee",
      department: "IT",
      position: "Developer",
      employmentStatus: "active",
    },
  };
  const mappedEmployee = mapEmployee(employee);
  assert("value" in mappedEmployee && mappedEmployee.value.employeeId === "001", "employee IDs preserve leading zeros");

  const attendance: SourceRecord = {
    collection: "attendance",
    id: "001_2026-10-14",
    path: "attendance/001_2026-10-14",
    data: {
      employeeId: "001",
      attendanceDate: "2026-10-14",
      timeIn: Timestamp.fromDate(new Date("2026-10-14T00:00:00.000Z")),
      timeInSource: "QR",
      status: "present",
      timeInOperator: {
        uid: "firebase-admin",
        username: "admin",
        displayName: "IT Administrator",
        role: "admin",
      },
    },
  };
  const mappedAttendance = mapAttendance(attendance);
  assert("value" in mappedAttendance && mappedAttendance.value.timeIn.toISOString() === "2026-10-14T00:00:00.000Z", "Firestore Timestamp transforms to Date");

  const payslip: SourceRecord = {
    collection: "payrollPayslips",
    id: "payslip-001",
    path: "payrollPayslips/payslip-001",
    data: {
      employeeId: "001",
      periodStart: "2026-10-01",
      periodEnd: "2026-10-15",
      payFrequency: "Semi-monthly",
      monthlyBasicSalary: "22000.00",
      deductions: [{ label: "SSS", amount: "550.00" }],
      status: "released",
      source: "PAYROLL_SYSTEM",
      payrollReference: "PAY-001-2026-10-01",
    },
  };
  const mappedPayslip = mapPayslip(payslip);
  assert("value" in mappedPayslip && mappedPayslip.value.monthlyBasicSalary?.toString() === "22000", "monetary strings remain Decimal-safe");

  console.log("Migration self-check passed: employee IDs, timestamps, and Decimal money mapping.");
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`Migration self-check failed: ${message}.`);
}
