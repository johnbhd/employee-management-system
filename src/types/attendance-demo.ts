import type { ApiSuccessResponse } from "@/types/api/responses";
import type { QrAttendanceData } from "@/types/attendance-qr";

export type AttendanceDemoSettingsData = {
  featureEnabled: boolean;
  enabled: boolean;
  customTime: string | null;
  attendanceDate: string;
  attendance: QrAttendanceData | null;
  resetAvailable: boolean;
  resetBlockedReason: string | null;
};

export type AttendanceDemoSettingsSuccessResponse =
  ApiSuccessResponse<AttendanceDemoSettingsData>;
