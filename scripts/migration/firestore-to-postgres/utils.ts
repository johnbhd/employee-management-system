import { createHash } from "node:crypto";

import { Timestamp } from "firebase-admin/firestore";
import { Prisma } from "@prisma/client";

import type { ActorSnapshot, MigrationFinding, SourceRecord } from "./types";

export type UnknownRecord = Record<string, unknown>;

export function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function requiredString(data: UnknownRecord, ...fields: string[]): string | null {
  for (const field of fields) {
    const value = stringValue(data[field]);
    if (value) return value;
  }
  return null;
}

export function nullableString(data: UnknownRecord, ...fields: string[]): string | null {
  for (const field of fields) {
    if (!(field in data)) continue;
    const value = data[field];
    return value === null || value === undefined ? null : stringValue(value);
  }
  return null;
}

export function numberValue(value: unknown, integer = false): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return integer && !Number.isInteger(value) ? null : value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && (!integer || Number.isInteger(parsed))) return parsed;
  }

  return null;
}

export function nonNegativeNumber(data: UnknownRecord, ...fields: string[]): number | null {
  for (const field of fields) {
    if (!(field in data)) continue;
    const value = numberValue(data[field]);
    return value !== null && value >= 0 ? value : null;
  }
  return null;
}

export function integerValue(data: UnknownRecord, ...fields: string[]): number | null {
  for (const field of fields) {
    if (!(field in data)) continue;
    const value = numberValue(data[field], true);
    return value !== null && value >= 0 ? value : null;
  }
  return null;
}

export function timestampValue(value: unknown): Date | null {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

export function timestampFrom(data: UnknownRecord, ...fields: string[]): Date | null {
  for (const field of fields) {
    if (!(field in data)) continue;
    return timestampValue(data[field]);
  }
  return null;
}

export function dateOnlyValue(value: unknown): Date | null {
  const date = timestampValue(value);
  if (!date) return null;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function dateOnlyFrom(data: UnknownRecord, ...fields: string[]): Date | null {
  for (const field of fields) {
    if (!(field in data)) continue;
    return dateOnlyValue(data[field]);
  }
  return null;
}

export function timeValue(value: unknown): Date | null {
  const raw = stringValue(value);
  if (!raw) return null;
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(raw);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3] ?? "0");
  if (hours > 23 || minutes > 59 || seconds > 59) return null;
  return new Date(Date.UTC(1970, 0, 1, hours, minutes, seconds));
}

export function timeFrom(data: UnknownRecord, ...fields: string[]): Date | null {
  for (const field of fields) {
    if (!(field in data)) continue;
    return timeValue(data[field]);
  }
  return null;
}

export function nestedRecord(data: UnknownRecord, ...fields: string[]): UnknownRecord | null {
  for (const field of fields) {
    if (isRecord(data[field])) return data[field];
  }
  return null;
}

export function arrayOfStrings(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  return value.every((item) => typeof item === "string") ? value.map((item) => item.trim()) : null;
}

export function arrayFrom(data: UnknownRecord, ...fields: string[]): string[] | null {
  for (const field of fields) {
    if (!(field in data)) continue;
    return arrayOfStrings(data[field]);
  }
  return null;
}

export function actorValue(value: unknown): ActorSnapshot | null {
  if (!isRecord(value)) return null;
  const uid = requiredString(value, "uid", "firebaseUid");
  const username = requiredString(value, "username");
  const displayName = requiredString(value, "displayName", "name");
  const role = requiredString(value, "role");
  return uid && username && displayName && role ? { uid, username, displayName, role } : null;
}

export function actorFrom(data: UnknownRecord, ...fields: string[]): ActorSnapshot | null {
  for (const field of fields) {
    if (!(field in data)) continue;
    return actorValue(data[field]);
  }
  return null;
}

export function jsonValue(value: unknown): Prisma.InputJsonValue {
  if (value === null || value === undefined) return null as unknown as Prisma.InputJsonValue;
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (Array.isArray(value)) return value.map((item) => jsonValue(item));
  if (isRecord(value)) {
    const object: Record<string, Prisma.InputJsonValue> = {};
    for (const [key, nested] of Object.entries(value)) {
      if (nested !== undefined) object[key] = jsonValue(nested);
    }
    return object as Prisma.InputJsonObject;
  }
  return String(value);
}

export function jsonObject(value: unknown): Prisma.InputJsonObject {
  const normalized = jsonValue(value);
  return isRecord(normalized) ? normalized as Prisma.InputJsonObject : {};
}

export function decimalValue(value: unknown): Prisma.Decimal | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const raw = String(value).trim();
  if (!/^-?\d+(\.\d+)?$/.test(raw)) return null;
  try {
    return new Prisma.Decimal(raw);
  } catch {
    return null;
  }
}

export function periodValue(data: UnknownRecord): { start: Date; end: Date; label: string } | null {
  const period = nestedRecord(data, "period", "payrollPeriod");
  const source = period ?? data;
  const start = dateOnlyFrom(source, "start", "periodStart", "startDate");
  const end = dateOnlyFrom(source, "end", "periodEnd", "endDate");
  const label = requiredString(source, "label", "periodLabel")
    ?? (start && end ? `${start.toISOString().slice(0, 10)} to ${end.toISOString().slice(0, 10)}` : null);
  return start && end && label && start <= end ? { start, end, label } : null;
}

export function sourceHash(record: SourceRecord): string {
  return createHash("sha256").update(stableSerialize(record.data)).digest("hex");
}

function stableSerialize(value: unknown): string {
  if (value instanceof Timestamp) return JSON.stringify(value.toDate().toISOString());
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
  if (isRecord(value)) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

export function targetHash(value: unknown): string {
  return createHash("sha256").update(stableSerialize(value)).digest("hex");
}

export function addFinding(
  findings: MigrationFinding[],
  finding: MigrationFinding,
): void {
  findings.push(finding);
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function isQuotaError(error: unknown): boolean {
  const message = errorMessage(error).toLowerCase();
  return message.includes("resource_exhausted")
    || message.includes("quota exceeded")
    || message.includes("code 8")
    || (isRecord(error) && error.code === 8);
}

export function compactError(error: unknown): string {
  return errorMessage(error).replace(/\s+/g, " ").trim().slice(0, 500);
}

export function sourceKey(collection: string, id: string): string {
  return `${collection}/${id}`;
}

export function fieldOrNull(data: UnknownRecord, ...fields: string[]): unknown {
  for (const field of fields) {
    if (field in data) return data[field];
  }
  return null;
}
