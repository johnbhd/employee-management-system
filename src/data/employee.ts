import type { StatusTone } from "@/types/ui";

export const employeeStats = [
  { label: "Days Present", value: "18", unit: "days", note: "This Month", tone: "success", icon: "calendar" },
  { label: "Days Late", value: "2", unit: "days", note: "This Month", tone: "warning", icon: "clock" },
  { label: "Days Absent", value: "0", unit: "days", note: "This Month", tone: "danger", icon: "close" },
  { label: "Overtime Hours", value: "6.5", unit: "hours", note: "This Month", tone: "info", icon: "clock" },
] as const;

export const attendanceHistory = [
  { date: "July 23, 2026 (Wed)", timeIn: "7:24 AM", timeOut: "—", hours: "—", status: "On Time", tone: "success" },
  { date: "July 22, 2026 (Tue)", timeIn: "7:28 AM", timeOut: "5:06 PM", hours: "9h 38m", status: "On Time", tone: "success" },
  { date: "July 21, 2026 (Mon)", timeIn: "7:42 AM", timeOut: "5:10 PM", hours: "9h 28m", status: "Late", tone: "warning" },
  { date: "July 20, 2026 (Sun)", timeIn: "7:30 AM", timeOut: "5:02 PM", hours: "9h 32m", status: "On Time", tone: "success" },
  { date: "July 19, 2026 (Sat)", timeIn: "—", timeOut: "—", hours: "—", status: "Absent", tone: "danger" },
] as const;

export type EmployeeAnnouncementCategory = "Payroll" | "Notice" | "Reminder";

export type EmployeeAnnouncement = {
  id: string;
  title: string;
  category: EmployeeAnnouncementCategory;
  tone: StatusTone;
  message: string;
  date: string;
  postedAt: string;
};

export const announcements: readonly EmployeeAnnouncement[] = [
  {
    id: "payroll-release-schedule",
    title: "Payroll Release Schedule",
    category: "Payroll",
    tone: "danger",
    message: "The payroll for the 1st semester will be released on July 31, 2026.",
    date: "Jul 20, 2026",
    postedAt: "2026-07-20",
  },
  {
    id: "ninoy-aquino-day",
    title: "Campus Holiday: Ninoy Aquino Day",
    category: "Notice",
    tone: "info",
    message: "Please be informed that classes and work are suspended on August 21, 2026.",
    date: "Jul 19, 2026",
    postedAt: "2026-07-19",
  },
  {
    id: "hr-document-submission",
    title: "HR Document Submission",
    category: "Reminder",
    tone: "warning",
    message: "Submit your updated government IDs on or before August 5, 2026.",
    date: "Jul 18, 2026",
    postedAt: "2026-07-18",
  },
  {
    id: "attendance-review-reminder",
    title: "Employee Attendance Reminder",
    category: "Reminder",
    tone: "warning",
    message: "Please review your attendance records regularly and report any concern through the proper HR channel.",
    date: "Jul 17, 2026",
    postedAt: "2026-07-17",
  },
  {
    id: "system-maintenance-notice",
    title: "System Maintenance Notice",
    category: "Notice",
    tone: "info",
    message: "The employee portal may be briefly unavailable during scheduled system maintenance.",
    date: "Jul 16, 2026",
    postedAt: "2026-07-16",
  },
  {
    id: "payroll-cutoff-reminder",
    title: "Payroll Cutoff Reminder",
    category: "Payroll",
    tone: "danger",
    message: "Please review your attendance records before the next payroll processing cycle.",
    date: "Jul 15, 2026",
    postedAt: "2026-07-15",
  },
];

export function getAnnouncementsNewestFirst(
  source: readonly EmployeeAnnouncement[] = announcements,
): EmployeeAnnouncement[] {
  return [...source].sort(
    (firstAnnouncement, secondAnnouncement) =>
      new Date(secondAnnouncement.postedAt).getTime()
      - new Date(firstAnnouncement.postedAt).getTime(),
  );
}

export function getLatestAnnouncements(
  limit: number,
  source: readonly EmployeeAnnouncement[] = announcements,
): EmployeeAnnouncement[] {
  return getAnnouncementsNewestFirst(source).slice(0, Math.max(0, limit));
}
