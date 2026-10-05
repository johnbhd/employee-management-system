import type { QrAttendanceAction } from "@/types/attendance-qr";

export const QR_ATTENDANCE_DUPLICATE_WINDOW_MS = 5_000;

export type QrAttendanceState = {
    timeIn: Date;
    timeOut: Date | null;
};

export function determineQrAttendanceAction(
    attendance: QrAttendanceState | null,
    now: Date,
    duplicateWindowMs = QR_ATTENDANCE_DUPLICATE_WINDOW_MS,
): QrAttendanceAction {
    if (!attendance) {
        return "time_in";
    }

    if (attendance.timeOut) {
        return "already_completed";
    }

    const elapsedMs = now.getTime() - attendance.timeIn.getTime();

    if (elapsedMs >= 0 && elapsedMs < duplicateWindowMs) {
        return "duplicate_scan";
    }

    return "time_out";
}
