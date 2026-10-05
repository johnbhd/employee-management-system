"use client";

import { useState } from "react";

import { Icon } from "@/components/ui/Icon";
import {
  getAttendanceCalendarStatus,
  getCalendarStatusFromLabel,
  type CalendarAttendanceStatus,
} from "@/data/my-attendance-calendar";
import {
  formatCampusMonthYear,
  type CampusDateParts,
} from "@/lib/campus-time";
import type { TodayAttendanceData } from "@/types/attendance-qr";

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const supportedCalendarYears = [2025, 2026] as const;
const monthOptions = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
] as const;

const statusPresentation: Record<
  CalendarAttendanceStatus | "unavailable",
  { label: string; icon?: "check" | "clock" | "close" | "warning" }
> = {
  present: { label: "Present", icon: "check" },
  late: { label: "Late", icon: "clock" },
  absent: { label: "Absent", icon: "close" },
  "no-record": { label: "No Record" },
  unavailable: { label: "Unavailable", icon: "warning" },
};

type CalendarView = {
  year: number;
  month: number;
};

type CalendarDay = {
  day: number | null;
  key: string;
};

export function MonthlyAttendanceCalendar({
  attendanceLoadError,
  todayAttendance,
}: {
  attendanceLoadError: boolean;
  todayAttendance: TodayAttendanceData;
}) {
  const campusDate = getCampusDateFromKey(todayAttendance.attendanceDate);
  const [calendarView, setCalendarView] = useState<CalendarView>(() => ({
    year: campusDate.year,
    month: campusDate.month,
  }));

  const calendarDays = buildCalendarDays(calendarView.year, calendarView.month);
  const monthDate = new Date(
    Date.UTC(calendarView.year, calendarView.month - 1, 1, 12),
  );
  const monthLabel = formatCampusMonthYear(monthDate);
  const currentDayStatus = attendanceLoadError
    ? "unavailable" as const
    : todayAttendance.attendance
      ? getCalendarStatusFromLabel("Present")
      : getCalendarStatusFromLabel("No Record");
  const yearOptions = getYearOptions(calendarView.year);

  function handlePreviousMonth() {
    moveCalendarView(-1);
  }

  function handleNextMonth() {
    moveCalendarView(1);
  }

  function handleMonthChange(nextMonth: number) {
    setCalendarView((currentView) => {
      if (!currentView) {
        return currentView;
      }

      return { ...currentView, month: nextMonth };
    });
  }

  function handleYearChange(nextYear: number) {
    setCalendarView((currentView) => {
      if (!currentView) {
        return currentView;
      }

      return { year: nextYear, month: 1 };
    });
  }

  function moveCalendarView(monthOffset: number) {
    setCalendarView((currentView) => {
      if (!currentView) {
        return currentView;
      }

      const nextMonthDate = new Date(
        Date.UTC(currentView.year, currentView.month - 1 + monthOffset, 1, 12),
      );

      return {
        year: nextMonthDate.getUTCFullYear(),
        month: nextMonthDate.getUTCMonth() + 1,
      };
    });
  }

  return (
    <section
      className="my-attendance-calendar-section"
      aria-labelledby="my-attendance-calendar-title"
    >
      <div className="my-attendance-section-heading">
        <div>
          <span className="my-attendance-kicker">Monthly overview</span>
          <h2 id="my-attendance-calendar-title">Attendance Calendar</h2>
        </div>
        <span className="my-attendance-section-note">
          Review your attendance for the selected month
        </span>
      </div>

      <div className="my-attendance-calendar-surface">
        <div className="my-attendance-calendar-toolbar">
          <div className="my-attendance-calendar-toolbar-main">
            <div className="my-attendance-calendar-month">
              <Icon name="calendar" />
              <h3>{monthLabel}</h3>
            </div>

            <div
              className="my-attendance-calendar-navigation"
              role="group"
              aria-label="Attendance calendar navigation"
            >
              <button
                type="button"
                className="my-attendance-calendar-nav-button"
                onClick={handlePreviousMonth}
                aria-label="Previous month"
              >
                <Icon name="chevron-left" />
              </button>

              <div className="my-attendance-calendar-controls">
                <label className="my-attendance-calendar-control">
                  <span>Month</span>
                  <select
                    value={calendarView.month}
                    onChange={(event) => {
                      handleMonthChange(Number(event.target.value));
                    }}
                    aria-label="Select attendance month"
                  >
                    {monthOptions.map((option) => (
                      <option value={option.value} key={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="my-attendance-calendar-control">
                  <span>Year</span>
                  <select
                    value={calendarView.year}
                    onChange={(event) => {
                      handleYearChange(Number(event.target.value));
                    }}
                    aria-label="Select attendance year"
                  >
                    {yearOptions.map((year) => (
                      <option value={year} key={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <button
                type="button"
                className="my-attendance-calendar-nav-button"
                onClick={handleNextMonth}
                aria-label="Next month"
              >
                <Icon name="chevron-right" />
              </button>
            </div>
          </div>

          <div
            className="my-attendance-calendar-legend"
            role="group"
            aria-label="Attendance status legend"
          >
            <LegendItem status="present" />
            <LegendItem status="late" />
            <LegendItem status="absent" />
            <LegendItem status="no-record" />
          </div>
        </div>

        <div className="my-attendance-calendar-weekdays">
          {weekdays.map((weekday) => (
            <span key={weekday}>{weekday}</span>
          ))}
        </div>

        <div
          className="my-attendance-calendar-grid"
          role="grid"
          aria-label={`${monthLabel} attendance calendar`}
        >
          {calendarDays.map((calendarDay) => {
            if (calendarDay.day === null) {
              return (
                <span
                  className="my-attendance-calendar-day is-empty"
                  aria-hidden="true"
                  key={calendarDay.key}
                />
              );
            }

            const isToday = isSameCalendarDate(
              calendarView.year,
              calendarView.month,
              calendarDay.day,
              campusDate,
            );
            const isFuture = isCalendarDateAfter(
              calendarView.year,
              calendarView.month,
              calendarDay.day,
              campusDate,
            );
            const status = isFuture
              ? null
              : isToday
                ? currentDayStatus
                : getAttendanceCalendarStatus(
                    calendarView.year,
                    calendarView.month,
                    calendarDay.day,
                  );

            return (
              <CalendarDayCell
                day={calendarDay.day}
                isToday={isToday}
                key={calendarDay.key}
                monthLabel={monthLabel}
                status={status}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function getYearOptions(selectedYear: number) {
  return Array.from(new Set([...supportedCalendarYears, selectedYear])).sort(
    (firstYear, secondYear) => firstYear - secondYear,
  );
}

function getCampusDateFromKey(dateKey: string): CampusDateParts {
  const [year, month, day] = dateKey.split("-").map(Number);

  return {
    year,
    month,
    day,
  };
}

function buildCalendarDays(year: number, month: number): CalendarDay[] {
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

  return Array.from({ length: totalCells }, (_, index) => {
    const day = index - firstWeekday + 1;
    const isDateCell = day > 0 && day <= daysInMonth;

    return {
      day: isDateCell ? day : null,
      key: isDateCell
        ? formatCalendarDateKey(year, month, day)
        : `empty-${year}-${month}-${index}`,
    };
  });
}

function formatCalendarDateKey(year: number, month: number, day: number) {
  return [
    year,
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

function isSameCalendarDate(
  year: number,
  month: number,
  day: number,
  referenceDate: CampusDateParts,
) {
  return (
    year === referenceDate.year
    && month === referenceDate.month
    && day === referenceDate.day
  );
}

function isCalendarDateAfter(
  year: number,
  month: number,
  day: number,
  referenceDate: CampusDateParts,
) {
  const calendarDate = Date.UTC(year, month - 1, day);
  const referenceCalendarDate = Date.UTC(
    referenceDate.year,
    referenceDate.month - 1,
    referenceDate.day,
  );

  return calendarDate > referenceCalendarDate;
}

function LegendItem({ status }: { status: CalendarAttendanceStatus }) {
  return (
    <span className={`my-attendance-calendar-legend-item is-${status}`}>
      <span className="my-attendance-calendar-legend-mark" aria-hidden="true" />
      <span>{statusPresentation[status].label}</span>
    </span>
  );
}

function CalendarDayCell({
  day,
  isToday,
  monthLabel,
  status,
}: {
  day: number;
  isToday: boolean;
  monthLabel: string;
  status: CalendarAttendanceStatus | "unavailable" | null;
}) {
  const statusDetails = status ? statusPresentation[status] : null;
  const statusLabel = statusDetails?.label ?? "Upcoming";
  const ariaLabel = `${monthLabel} ${day}, ${
    isToday ? "today, " : ""
  }${statusLabel}`;

  return (
    <div
      className={`my-attendance-calendar-day${
        isToday ? " is-today" : ""
      }${status ? ` has-${status}` : " is-upcoming"}`}
      role="gridcell"
      aria-label={ariaLabel}
    >
      <div className="my-attendance-calendar-day-top">
        <span className="my-attendance-calendar-day-number">{day}</span>
        {isToday ? (
          <span className="my-attendance-calendar-today">Today</span>
        ) : null}
      </div>

      <span className="my-attendance-calendar-status">
        {statusDetails?.icon ? (
          <Icon name={statusDetails.icon} />
        ) : (
          <span
            className="my-attendance-calendar-status-mark"
            aria-hidden="true"
          >
            —
          </span>
        )}
        <span className="my-attendance-calendar-status-label">
          {statusLabel}
        </span>
      </span>
    </div>
  );
}
