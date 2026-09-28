export const CAMPUS_TIME_ZONE = "Asia/Manila";

const campusDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: CAMPUS_TIME_ZONE,
});

const campusNavbarDateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: CAMPUS_TIME_ZONE,
});

const campusTimeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: CAMPUS_TIME_ZONE,
});

const campusCalendarDateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  timeZone: CAMPUS_TIME_ZONE,
});

const campusMonthYearFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: CAMPUS_TIME_ZONE,
});

export type CampusDateParts = {
  year: number;
  month: number;
  day: number;
};

function getDatePart(parts: Intl.DateTimeFormatPart[], type: string) {
  return parts.find((part) => part.type === type)?.value ?? "";
}

export function formatCampusDate(date: Date) {
  return campusDateFormatter.format(date);
}

export function formatCampusNavbarDate(date: Date) {
  const parts = campusNavbarDateFormatter.formatToParts(date);
  const month = getDatePart(parts, "month");
  const day = getDatePart(parts, "day");
  const year = getDatePart(parts, "year");
  const weekday = getDatePart(parts, "weekday");

  return `${month} ${day}, ${year} · ${weekday}`;
}

export function formatCampusDateTime(date: Date) {
  return `${formatCampusDate(date)} · ${formatCampusTime(date)}`;
}

export function formatCampusTime(date: Date) {
  return campusTimeFormatter.format(date);
}

export function getCampusDateParts(date: Date): CampusDateParts {
  const parts = campusCalendarDateFormatter.formatToParts(date);

  return {
    year: Number(getDatePart(parts, "year")),
    month: Number(getDatePart(parts, "month")),
    day: Number(getDatePart(parts, "day")),
  };
}

export function formatCampusMonthYear(date: Date) {
  return campusMonthYearFormatter.format(date);
}
