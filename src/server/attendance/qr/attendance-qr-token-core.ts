import { createHmac, timingSafeEqual } from "node:crypto";

const QR_PREFIX = "aujsc-attendance:";
const QR_VERSION = "v1";
const MAX_EMPLOYEE_ID_LENGTH = 128;

type ParsedAttendanceQr = {
  encodedPayload: string;
  signature: string;
};

export class AttendanceQrValidationError extends Error {
  readonly code = "INVALID_ATTENDANCE_QR";

  constructor() {
    super("The QR value is not a valid AU-JSC attendance QR.");
    this.name = "AttendanceQrValidationError";
  }
}

function normalizeEmployeeId(employeeId: string): string {
  const normalizedEmployeeId = employeeId.trim();

  if (
    !normalizedEmployeeId
    || normalizedEmployeeId.length > MAX_EMPLOYEE_ID_LENGTH
    || !/^[A-Za-z0-9_-]+$/.test(normalizedEmployeeId)
  ) {
    throw new AttendanceQrValidationError();
  }

  return normalizedEmployeeId;
}

function getSignedContent(encodedPayload: string): string {
  return `${QR_VERSION}:${encodedPayload}`;
}

function createSignature(signedContent: string, secret: string): string {
  return createHmac("sha256", secret)
    .update(signedContent, "utf8")
    .digest("base64url");
}

export function createEmployeeQrPayloadWithSecret(
  employeeId: string,
  secret: string,
): string {
  const normalizedEmployeeId = normalizeEmployeeId(employeeId);
  const encodedPayload = Buffer.from(
    JSON.stringify({
      employeeId: normalizedEmployeeId,
    }),
    "utf8",
  ).toString("base64url");
  const signedContent = getSignedContent(encodedPayload);
  const signature = createSignature(signedContent, secret);

  return `${QR_PREFIX}${QR_VERSION}:${encodedPayload}.${signature}`;
}

function parseEmployeeQrPayload(
  rawValue: string,
): ParsedAttendanceQr | null {
  const value = rawValue.trim();
  const prefix = `${QR_PREFIX}${QR_VERSION}:`;

  if (!value.startsWith(prefix)) {
    return null;
  }

  const token = value.slice(prefix.length);
  const [encodedPayload, signature, ...extraParts] = token.split(".");

  if (
    !encodedPayload
    || !signature
    || extraParts.length > 0
    || !/^[A-Za-z0-9_-]+$/.test(encodedPayload)
    || !/^[A-Za-z0-9_-]+$/.test(signature)
  ) {
    return null;
  }

  try {
    const decodedPayload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as { employeeId?: unknown };

    if (
      typeof decodedPayload.employeeId !== "string"
      || normalizeEmployeeId(decodedPayload.employeeId)
        !== decodedPayload.employeeId
    ) {
      return null;
    }
  } catch {
    return null;
  }

  return {
    encodedPayload,
    signature,
  };
}

export function verifyEmployeeQrPayloadWithSecret(
  rawValue: string,
  secret: string,
): string {
  const parsedPayload = parseEmployeeQrPayload(rawValue);

  if (!parsedPayload) {
    throw new AttendanceQrValidationError();
  }

  const expectedSignature = createSignature(
    getSignedContent(parsedPayload.encodedPayload),
    secret,
  );
  const actualSignature = Buffer.from(parsedPayload.signature, "base64url");
  const expectedSignatureBuffer = Buffer.from(expectedSignature, "base64url");

  if (
    actualSignature.length !== expectedSignatureBuffer.length
    || !timingSafeEqual(actualSignature, expectedSignatureBuffer)
  ) {
    throw new AttendanceQrValidationError();
  }

  const decodedPayload = JSON.parse(
    Buffer.from(parsedPayload.encodedPayload, "base64url").toString("utf8"),
  ) as { employeeId: string };

  return decodedPayload.employeeId;
}
