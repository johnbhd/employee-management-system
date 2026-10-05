import { demoEmployeeSeedAccounts } from "../firebase/data/demo-employees";
import {
  createEmployeeQrPayloadWithSecret,
  verifyEmployeeQrPayloadWithSecret,
} from "../../src/server/attendance/qr/attendance-qr-token-core";

const verificationSecret = "task-082-local-verification-secret";
process.env.QR_ATTENDANCE_SIGNING_SECRET = verificationSecret;

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function expectInvalidQr(qrValue: string, label: string): void {
  try {
    verifyEmployeeQrPayloadWithSecret(qrValue, verificationSecret);
  } catch {
    return;
  }

  throw new Error(`${label} was accepted unexpectedly.`);
}

function decodePayload(qrValue: string): Record<string, unknown> {
  const prefix = "aujsc-attendance:v1:";
  assert(qrValue.startsWith(prefix), "QR payload has an unexpected prefix.");

  const token = qrValue.slice(prefix.length);
  const separatorIndex = token.indexOf(".");
  assert(separatorIndex > 0, "QR payload is missing its signature separator.");

  const encodedPayload = token.slice(0, separatorIndex);
  const decodedPayload: unknown = JSON.parse(
    Buffer.from(encodedPayload, "base64url").toString("utf8"),
  );

  assert(
    typeof decodedPayload === "object"
      && decodedPayload !== null
      && !Array.isArray(decodedPayload),
    "QR payload does not contain an object.",
  );

  return decodedPayload as Record<string, unknown>;
}

function tamperSignature(qrValue: string): string {
  const separatorIndex = qrValue.lastIndexOf(".");
  assert(separatorIndex > 0, "QR payload is missing its signature.");

  const signatureStart = separatorIndex + 1;
  const currentCharacter = qrValue[signatureStart];
  const replacement = currentCharacter === "a" ? "b" : "a";

  return `${qrValue.slice(0, signatureStart)}${replacement}${qrValue.slice(signatureStart + 1)}`;
}

const employeeIds = demoEmployeeSeedAccounts.map(
  (employee) => employee.employeeId,
);
const expectedEmployeeIds = Array.from(
  { length: 10 },
  (_, index) => String(index + 1).padStart(3, "0"),
);

assert(
  JSON.stringify(employeeIds) === JSON.stringify(expectedEmployeeIds),
  "Demo employee QR verification requires the seeded IDs 001 through 010.",
);

const qrValues = employeeIds.map((employeeId) => ({
  employeeId,
  qrValue: createEmployeeQrPayloadWithSecret(employeeId, verificationSecret),
}));
const uniqueQrValues = new Set(qrValues.map(({ qrValue }) => qrValue));

assert(uniqueQrValues.size === employeeIds.length, "QR values are not unique per employee.");

for (const { employeeId, qrValue } of qrValues) {
  assert(
    createEmployeeQrPayloadWithSecret(employeeId, verificationSecret) === qrValue,
    `QR value for Employee ${employeeId} is not stable across generation.`,
  );
  assert(
    verifyEmployeeQrPayloadWithSecret(qrValue, verificationSecret) === employeeId,
    `QR value for Employee ${employeeId} resolved to the wrong employee.`,
  );

  const payload = decodePayload(qrValue);
  assert(
    JSON.stringify(Object.keys(payload).sort()) === JSON.stringify(["employeeId"]),
    `QR value for Employee ${employeeId} contains unexpected profile data.`,
  );
  assert(
    payload.employeeId === employeeId,
    `QR payload for Employee ${employeeId} contains the wrong employee ID.`,
  );
}

expectInvalidQr("hello", "Random QR value");
expectInvalidQr(tamperSignature(qrValues[0].qrValue), "Tampered QR value");

console.log(
  `Employee QR verification passed for ${employeeIds.length} unique, stable employee IDs (001-010).`,
);
