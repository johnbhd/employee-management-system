export type SeedAttendanceCorrection = {
  requestId: string;
  employeeId: string;
  attendanceDate: string;
  timeIn: string;
  timeOut: string | null;
  requestedTimeIn?: string;
  requestedTimeOut?: string;
  issueType: "Missing Time-Out" | "Incorrect Time-In";
  reason: string;
  submittedAt: string;
};

export const attendanceCorrectionSeedData: readonly SeedAttendanceCorrection[] = [
  {
    requestId: "CR-DEV-001",
    employeeId: "001",
    attendanceDate: "2026-10-06",
    timeIn: "2026-10-06T00:03:00.000Z",
    timeOut: null,
    requestedTimeOut: "2026-10-06T09:01:00.000Z",
    issueType: "Missing Time-Out",
    reason: "The employee left at 5:01 PM but missed the QR Time-out scan.",
    submittedAt: "2026-10-06T10:12:00.000Z",
  },
  {
    requestId: "CR-DEV-002",
    employeeId: "002",
    attendanceDate: "2026-10-05",
    timeIn: "2026-10-05T00:05:00.000Z",
    timeOut: "2026-10-05T09:00:00.000Z",
    requestedTimeIn: "2026-10-05T00:00:00.000Z",
    issueType: "Incorrect Time-In",
    reason: "The employee arrived at 8:00 AM but the recorded Time-in was five minutes late.",
    submittedAt: "2026-10-05T02:15:00.000Z",
  },
] as const;
