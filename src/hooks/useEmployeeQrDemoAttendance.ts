"use client";

import { useCallback, useEffect, useState } from "react";

import {
  clearEmployeeQrDemoAttendance,
  readEmployeeQrDemoAttendance,
  scanEmployeeQrDemoAttendance,
  subscribeToEmployeeQrDemoAttendance,
  type EmployeeQrDemoAttendance,
  type EmployeeQrDemoScanResult,
} from "@/lib/employee/qr-demo-attendance";

export function useEmployeeQrDemoAttendance(employeeId: string) {
  const [demoAttendance, setDemoAttendance] =
    useState<EmployeeQrDemoAttendance | null>(null);

  const refreshDemoAttendance = useCallback(() => {
    setDemoAttendance(readEmployeeQrDemoAttendance(employeeId));
  }, [employeeId]);

  useEffect(() => {
    const unsubscribe = subscribeToEmployeeQrDemoAttendance(
      refreshDemoAttendance,
    );
    const initialReadId = window.setTimeout(refreshDemoAttendance, 0);

    return () => {
      window.clearTimeout(initialReadId);
      unsubscribe();
    };
  }, [refreshDemoAttendance]);

  const recordQrScan = useCallback(
    (now?: Date): EmployeeQrDemoScanResult => {
      const result = scanEmployeeQrDemoAttendance(employeeId, now);

      if (result.action !== "unavailable") {
        setDemoAttendance(result.attendance);
      }

      return result;
    },
    [employeeId],
  );

  const resetDemoAttendance = useCallback(() => {
    clearEmployeeQrDemoAttendance();
    setDemoAttendance(null);
  }, []);

  return {
    demoAttendance,
    recordQrScan,
    resetDemoAttendance,
  };
}
