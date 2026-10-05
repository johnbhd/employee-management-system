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

const campusDateKeyShortFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
});

const campusDateKeyLongFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
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

export function formatCampusDateKey(date: Date) {
  const { year, month, day } = getCampusDateParts(date);

  return [
    year,
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

export function formatCampusMonthYear(date: Date) {
  return campusMonthYearFormatter.format(date);
}

export function formatCampusDateKeyLabel(
    dateKey: string,
    format: "short" | "long" = "short",
) {
    const [year, month, day] = dateKey.split("-").map(Number);
    const date = new Date(Date.UTC(year, (month || 1) - 1, day || 1));

    if (
        !Number.isFinite(year)
        || !Number.isFinite(month)
        || !Number.isFinite(day)
        || Number.isNaN(date.getTime())
    ) {
        return dateKey;
    }

    return (format === "long"
        ? campusDateKeyLongFormatter
        : campusDateKeyShortFormatter
    ).format(date);
}
