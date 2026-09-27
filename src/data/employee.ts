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

export const announcements = [
  {
    title: "Payroll Release Schedule",
    category: "Payroll",
    tone: "danger",
    message: "The payroll for the 1st semester will be released on July 31, 2026.",
    date: "Jul 20, 2026",
  },
  {
    title: "Campus Holiday: Ninoy Aquino Day",
    category: "Notice",
    tone: "info",
    message: "Please be informed that classes and work are suspended on August 21, 2026.",
    date: "Jul 19, 2026",
  },
  {
    title: "HR Document Submission",
    category: "Reminder",
    tone: "warning",
    message: "Submit your updated government IDs on or before August 5, 2026.",
    date: "Jul 18, 2026",
  },
] as const;
