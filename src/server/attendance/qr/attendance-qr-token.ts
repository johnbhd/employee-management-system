import "server-only";

import {
  AttendanceQrValidationError,
  createEmployeeQrPayloadWithSecret,
  verifyEmployeeQrPayloadWithSecret,
} from "./attendance-qr-token-core";

export { AttendanceQrValidationError } from "./attendance-qr-token-core";

export class AttendanceQrConfigurationError extends Error {
  readonly code = "QR_ATTENDANCE_CONFIGURATION_ERROR";

  constructor() {
    super("QR attendance signing is not configured.");
    this.name = "AttendanceQrConfigurationError";
  }
}

function getSigningSecret(): string {
  const secret = process.env.QR_ATTENDANCE_SIGNING_SECRET?.trim();

  if (!secret) {
    throw new AttendanceQrConfigurationError();
  }

  return secret;
}

export function createEmployeeQrPayload(employeeId: string): string {
  return createEmployeeQrPayloadWithSecret(employeeId, getSigningSecret());
}

export function verifyEmployeeQrPayload(rawValue: string): string {
  try {
    return verifyEmployeeQrPayloadWithSecret(rawValue, getSigningSecret());
  } catch (error) {
    if (error instanceof AttendanceQrConfigurationError) {
      throw error;
    }

    if (error instanceof AttendanceQrValidationError) {
      throw error;
    }

    throw new AttendanceQrValidationError();
  }
}
