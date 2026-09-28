"use client";

import { useEffect, useState } from "react";

import {
  getAttendanceCalendarStatus,
  getCalendarStatusFromLabel,
  type CalendarAttendanceStatus,
} from "@/data/my-attendance-calendar";
import { employeeAttendanceProfile } from "@/data/my-attendance";
import {
  formatCampusMonthYear,
  getCampusDateParts,
  type CampusDateParts,
} from "@/lib/campus-time";
import { Icon } from "@/components/ui/Icon";

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const statusPresentation: Record<
  CalendarAttendanceStatus,
  { label: string; icon?: "check" | "clock" | "close" }
> = {
  present: { label: "Present", icon: "check" },
  late: { label: "Late", icon: "clock" },
  absent: { label: "Absent", icon: "close" },
  "no-record": { label: "No Record" },
};

type CalendarDay = {
  day: number | null;
  key: string;
};

export function MonthlyAttendanceCalendar() {
  const [campusDate, setCampusDate] = useState<CampusDateParts | null>(null);
  const calendarDays = campusDate
    ? buildCalendarDays(campusDate.year, campusDate.month)
    : [];

  useEffect(() => {
    const initialUpdateId = window.setTimeout(() => {
      setCampusDate(getCampusDateParts(new Date()));
    }, 0);
    const intervalId = window.setInterval(() => {
      setCampusDate(getCampusDateParts(new Date()));
    }, 60_000);

    return () => {
      window.clearTimeout(initialUpdateId);
      window.clearInterval(intervalId);
    };
  }, []);

  if (!campusDate) {
    return (
      <section
        className="my-attendance-calendar-section"
        aria-labelledby="my-attendance-calendar-title"
        aria-busy="true"
      >
        <div className="my-attendance-section-heading">
          <div>
            <span className="my-attendance-kicker">Monthly overview</span>
            <h2 id="my-attendance-calendar-title">Attendance Calendar</h2>
          </div>
          <span className="my-attendance-section-note">
            Review your attendance for this month
          </span>
        </div>
        <div className="my-attendance-calendar-surface my-attendance-calendar-loading">
          Loading current month...
        </div>
      </section>
    );
  }

  const monthDate = new Date(
    Date.UTC(campusDate.year, campusDate.month - 1, 1, 12),
  );
  const monthLabel = formatCampusMonthYear(monthDate);
  const currentDayStatus = getCalendarStatusFromLabel(
    employeeAttendanceProfile.status,
  );

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
          Review your attendance for this month
        </span>
      </div>

      <div className="my-attendance-calendar-surface">
        <div className="my-attendance-calendar-toolbar">
          <div className="my-attendance-calendar-month">
            <Icon name="calendar" />
            <h3>{monthLabel}</h3>
          </div>
          <div
            className="my-attendance-calendar-legend"
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

            const isToday = calendarDay.day === campusDate.day;
            const isFuture = calendarDay.day > campusDate.day;
            const status = isFuture
              ? null
              : isToday
                ? currentDayStatus
                : getAttendanceCalendarStatus(
                    campusDate.year,
                    campusDate.month,
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

function buildCalendarDays(year: number, month: number): CalendarDay[] {
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

  return Array.from({ length: totalCells }, (_, index) => {
    const day = index - firstWeekday + 1;

    return {
      day: day > 0 && day <= daysInMonth ? day : null,
      key: `${year}-${month}-${index}`,
    };
  });
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
  status: CalendarAttendanceStatus | null;
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
