import {
  formatCampusDateKey,
  formatCampusTime,
} from "@/lib/campus-time";

export const EMPLOYEE_QR_DEMO_STORAGE_KEY =
  "aujsc:employee:qr-attendance-demo";
export const EMPLOYEE_QR_DEMO_CHANGE_EVENT =
  "aujsc:employee:qr-attendance-demo-change";

const EMPLOYEE_QR_DEMO_VERSION = 1 as const;

export type EmployeeQrDemoStatus = "Present" | "Completed";

export type EmployeeQrDemoAttendance = {
  version: typeof EMPLOYEE_QR_DEMO_VERSION;
  employeeId: string;
  attendanceDate: string;
  source: "QR";
  status: EmployeeQrDemoStatus;
  timeIn: string;
  timeOut: string | null;
  timeInTimestamp: string;
  timeOutTimestamp: string | null;
};

export type EmployeeQrDemoScanResult =
  | {
      action: "time-in" | "time-out";
      attendance: EmployeeQrDemoAttendance;
    }
  | {
      action: "completed";
      attendance: EmployeeQrDemoAttendance;
    }
  | {
      action: "unavailable";
      attendance: null;
    };

export function readEmployeeQrDemoAttendance(
  employeeId: string,
  now = new Date(),
): EmployeeQrDemoAttendance | null {
  const storage = getLocalStorage();

  if (!storage || !isValidDate(now)) {
    return null;
  }

  let rawValue: string | null;

  try {
    rawValue = storage.getItem(EMPLOYEE_QR_DEMO_STORAGE_KEY);
  } catch {
    return null;
  }

  if (!rawValue) {
    return null;
  }

  let parsedValue: unknown;

  try {
    parsedValue = JSON.parse(rawValue);
  } catch {
    removeStoredAttendance(storage);
    return null;
  }

  const currentDate = formatCampusDateKey(now);

  if (
    !isEmployeeQrDemoAttendance(parsedValue)
    || parsedValue.employeeId !== employeeId
    || parsedValue.attendanceDate !== currentDate
  ) {
    removeStoredAttendance(storage);
    return null;
  }

  return parsedValue;
}

export function scanEmployeeQrDemoAttendance(
  employeeId: string,
  now = new Date(),
): EmployeeQrDemoScanResult {
  if (!isValidDate(now)) {
    return { action: "unavailable", attendance: null };
  }

  const existingAttendance = readEmployeeQrDemoAttendance(employeeId, now);

  if (!existingAttendance) {
    const attendance = createTimeInAttendance(employeeId, now);

    return persistAttendance(attendance)
      ? { action: "time-in", attendance }
      : { action: "unavailable", attendance: null };
  }

  if (existingAttendance.status === "Completed") {
    return { action: "completed", attendance: existingAttendance };
  }

  const attendance = {
    ...existingAttendance,
    status: "Completed" as const,
    timeOut: formatCampusTime(now),
    timeOutTimestamp: now.toISOString(),
  };

  return persistAttendance(attendance)
    ? { action: "time-out", attendance }
    : { action: "unavailable", attendance: null };
}

export function clearEmployeeQrDemoAttendance() {
  const storage = getLocalStorage();

  if (!storage) {
    return;
  }

  removeStoredAttendance(storage);
  notifyAttendanceChange();
}

export function subscribeToEmployeeQrDemoAttendance(onChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleSameTabChange = () => {
    onChange();
  };
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === EMPLOYEE_QR_DEMO_STORAGE_KEY) {
      onChange();
    }
  };

  window.addEventListener(
    EMPLOYEE_QR_DEMO_CHANGE_EVENT,
    handleSameTabChange,
  );
  window.addEventListener("storage", handleStorageChange);

  return () => {
    window.removeEventListener(
      EMPLOYEE_QR_DEMO_CHANGE_EVENT,
      handleSameTabChange,
    );
    window.removeEventListener("storage", handleStorageChange);
  };
}

export function isEmployeeQrDemoAttendance(
  value: unknown,
): value is EmployeeQrDemoAttendance {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const status = candidate.status;
  const timeOut = candidate.timeOut;
  const timeOutTimestamp = candidate.timeOutTimestamp;
  const hasValidTimeOut =
    timeOut === null || typeof timeOut === "string";
  const hasValidTimeOutTimestamp =
    timeOutTimestamp === null || typeof timeOutTimestamp === "string";

  if (
    candidate.version !== EMPLOYEE_QR_DEMO_VERSION
    || typeof candidate.employeeId !== "string"
    || candidate.employeeId.trim().length === 0
    || !isValidDateKey(candidate.attendanceDate)
    || candidate.source !== "QR"
    || (status !== "Present" && status !== "Completed")
    || typeof candidate.timeIn !== "string"
    || candidate.timeIn.trim().length === 0
    || !hasValidTimeOut
    || !hasValidTimeOutTimestamp
    || typeof candidate.timeInTimestamp !== "string"
    || !isValidTimestamp(candidate.timeInTimestamp)
    || (typeof timeOut === "string" && timeOut.trim().length === 0)
    || (typeof timeOutTimestamp === "string"
      && !isValidTimestamp(timeOutTimestamp))
  ) {
    return false;
  }

  if (status === "Present") {
    return timeOut === null && timeOutTimestamp === null;
  }

  return typeof timeOut === "string" && typeof timeOutTimestamp === "string";
}

function createTimeInAttendance(
  employeeId: string,
  now: Date,
): EmployeeQrDemoAttendance {
  const timestamp = now.toISOString();

  return {
    version: EMPLOYEE_QR_DEMO_VERSION,
    employeeId,
    attendanceDate: formatCampusDateKey(now),
    source: "QR",
    status: "Present",
    timeIn: formatCampusTime(now),
    timeOut: null,
    timeInTimestamp: timestamp,
    timeOutTimestamp: null,
  };
}

function persistAttendance(attendance: EmployeeQrDemoAttendance) {
  const storage = getLocalStorage();

  if (!storage) {
    return false;
  }

  try {
    storage.setItem(
      EMPLOYEE_QR_DEMO_STORAGE_KEY,
      JSON.stringify(attendance),
    );
  } catch {
    return false;
  }

  notifyAttendanceChange();
  return true;
}

function getLocalStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function removeStoredAttendance(storage: Storage) {
  try {
    storage.removeItem(EMPLOYEE_QR_DEMO_STORAGE_KEY);
  } catch {
    // Ignore storage failures so readers fall back to the original mock data.
  }
}

function notifyAttendanceChange() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.dispatchEvent(new CustomEvent(EMPLOYEE_QR_DEMO_CHANGE_EVENT));
  } catch {
    // The storage write is still valid if event dispatch is unavailable.
  }
}

function isValidDate(value: Date) {
  return !Number.isNaN(value.getTime());
}

function isValidTimestamp(value: string) {
  return !Number.isNaN(Date.parse(value));
}

function isValidDateKey(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
  );
}
