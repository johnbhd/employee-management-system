import "server-only";

export function isDemoAttendanceEnabled(): boolean {
  return process.env.DEMO_ATTENDANCE_ENABLED?.trim().toLowerCase() !== "false";
}
