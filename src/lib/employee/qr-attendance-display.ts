import { CAMPUS_TIME_ZONE } from "@/lib/campus-time";

export type QrAttendanceDisplayStatus = "Present" | "Late";

const campusTimePartsFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
  timeZone: CAMPUS_TIME_ZONE,
});

export function getQrAttendanceDisplayStatus(input: {
  timeIn: string | null | undefined;
  timeInSource: "QR" | "BUNDY" | null | undefined;
  scheduledStart: string | null | undefined;
}): QrAttendanceDisplayStatus | null {
  if (
    input.timeInSource !== "QR"
    || !input.timeIn
    || !input.scheduledStart
  ) {
    return null;
  }

  const timeIn = new Date(input.timeIn);
  const timeInSeconds = getCampusTimeInSeconds(timeIn);
  const scheduledStartSeconds = parseTimeInSeconds(input.scheduledStart);

  if (timeInSeconds === null || scheduledStartSeconds === null) {
    return null;
  }

  return timeInSeconds > scheduledStartSeconds ? "Late" : "Present";
}

function getCampusTimeInSeconds(value: Date) {
  if (Number.isNaN(value.getTime())) {
    return null;
  }

  const parts = campusTimePartsFormatter.formatToParts(value);
  const hour = getNumericPart(parts, "hour");
  const minute = getNumericPart(parts, "minute");
  const second = getNumericPart(parts, "second");

  if (hour === null || minute === null || second === null) {
    return null;
  }

  return (hour * 60 * 60) + (minute * 60) + second;
}

function parseTimeInSeconds(value: string) {
  const match = /^(\d{1,2}):([0-5]\d)(?::([0-5]\d))?$/.exec(value.trim());

  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const second = Number(match[3] ?? "0");

  if (hour > 23) {
    return null;
  }

  return (hour * 60 * 60) + (minute * 60) + second;
}

function getNumericPart(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
) {
  const value = parts.find((part) => part.type === type)?.value;

  if (!value || !/^\d+$/.test(value)) {
    return null;
  }

  return Number(value);
}
