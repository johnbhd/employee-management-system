import type { IconName } from "@/types/ui";

export type EmployeeHelpLink = {
  id: string;
  label: string;
  description: string;
  icon: IconName;
  href: string;
  linkLabel: string;
};

export type EmployeeHelpTopic = {
  id: string;
  title: string;
  icon: IconName;
  summary: string;
  details: readonly string[];
  href?: string;
  linkLabel?: string;
};

export type EmployeeFaq = {
  id: string;
  question: string;
  answer: string;
};

export type EmployeeSupportChannel = {
  id: string;
  title: string;
  icon: IconName;
  description: string;
  contactLabel: string;
  href?: string;
  linkLabel?: string;
};

export const employeeHelpQuickLinks: readonly EmployeeHelpLink[] = [
  {
    id: "attendance",
    label: "How to record attendance",
    description: "Review your attendance details and recorded status.",
    icon: "calendar",
    href: "/employee/my-attendance",
    linkLabel: "Open attendance",
  },
  {
    id: "attendance-qr",
    label: "Use Attendance QR",
    description: "Open the QR attendance page and follow its instructions.",
    icon: "qr",
    href: "/employee/attendance-qr",
    linkLabel: "Open QR page",
  },
  {
    id: "attendance-history",
    label: "View attendance history",
    description: "Review previous dates, sources, times, and statuses.",
    icon: "clock",
    href: "/employee/attendance-history",
    linkLabel: "View history",
  },
  {
    id: "corrections",
    label: "Understand corrections",
    description: "Learn what happens when an attendance record needs review.",
    icon: "activity",
    href: "#attendance-corrections",
    linkLabel: "Read guide",
  },
  {
    id: "payslips",
    label: "View my payslip",
    description: "Find payroll records received from the Existing Payroll System.",
    icon: "file",
    href: "/employee/payslips",
    linkLabel: "Open payslips",
  },
  {
    id: "account",
    label: "Account and profile help",
    description: "Review your profile and understand read-only information.",
    icon: "user",
    href: "/employee/profile",
    linkLabel: "Open profile",
  },
];

export const employeeHelpTopics: readonly EmployeeHelpTopic[] = [
  {
    id: "attendance-basics",
    title: "Attendance",
    icon: "calendar",
    summary: "Attendance records may come from the available Bundy / Biometric or QR attendance source.",
    details: [
      "Your attendance view may show Time In, Time Out, Source, Status, Late, or Undertime information.",
      "Late and undertime values are based on the referenced work schedule and processed attendance record.",
    ],
    href: "/employee/my-attendance",
    linkLabel: "Review My Attendance",
  },
  {
    id: "qr-attendance",
    title: "QR Attendance",
    icon: "qr",
    summary: "QR Attendance is an additional attendance source and does not replace the Existing Bundy / Biometric System.",
    details: [
      "Open Show Attendance QR from the Employee Sidebar and follow the on-screen attendance instructions.",
      "If the QR page does not open or an attendance record does not appear, refresh the page and check your attendance record.",
    ],
    href: "/employee/attendance-qr",
    linkLabel: "Open Show Attendance QR",
  },
  {
    id: "attendance-corrections",
    title: "Attendance Corrections",
    icon: "activity",
    summary: "Use the correction process when an attendance record is incomplete or incorrect and the correction option is available.",
    details: [
      "The current flow is Employee submission, HR / Attendance Staff review, and then HR Verification.",
      "A request may be approved, rejected, or returned when more information is needed. Approval is separate from final attendance verification and payroll readiness.",
    ],
  },
  {
    id: "attendance-history",
    title: "Attendance History",
    icon: "clock",
    summary: "Use Attendance History to review past records for the selected period.",
    details: [
      "Records can include the date, schedule, Time In, Time Out, source, status, and related details.",
      "If a record is incomplete or appears incorrect, review it and submit a correction request when the option is available.",
    ],
    href: "/employee/attendance-history",
    linkLabel: "Open Attendance History",
  },
  {
    id: "payslips",
    title: "Payslips",
    icon: "file",
    summary: "My Payslips displays payroll information received from the Existing Payroll System.",
    details: [
      "The SIA application does not calculate payroll. Available records may show the payroll period, total pay, deductions, net pay, status, and release date according to the current payslip page.",
      "If a payslip is missing or its information appears incorrect, contact the appropriate Payroll or HR office.",
    ],
    href: "/employee/payslips",
    linkLabel: "Open My Payslips",
  },
  {
    id: "account-profile",
    title: "Account and Profile",
    icon: "user",
    summary: "Employee accounts are created by authorized staff, and official employee information may be read-only.",
    details: [
      "If your department, position, or other official information cannot be edited, the Existing HRPS remains the source of truth for that information.",
      "If you cannot access your account or believe your application access is incorrect, contact the system administrator or authorized support staff.",
    ],
    href: "/employee/profile",
    linkLabel: "Open My Profile",
  },
  {
    id: "announcements",
    title: "Announcements",
    icon: "activity",
    summary: "Announcements contains campus, payroll, and employee reminders.",
    details: [
      "Current announcement categories include Payroll, Notice, and Reminder.",
      "Open an announcement to read its full message and review the posting date.",
    ],
    href: "/employee/announcements",
    linkLabel: "Open Announcements",
  },
];

export const employeeHelpFaqs: readonly EmployeeFaq[] = [
  {
    id: "late",
    question: "Why is my attendance marked Late?",
    answer: "Attendance status is evaluated using your referenced work schedule and recorded Time-In. Check My Attendance or Attendance History for the schedule and recorded time.",
  },
  {
    id: "missing-time-out",
    question: "What should I do if my Time-Out is missing?",
    answer: "Review the attendance record and submit a correction request when available. HR / Attendance Staff will review the request.",
  },
  {
    id: "qr-and-bundy",
    question: "Does QR Attendance replace Bundy?",
    answer: "No. QR Attendance is an additional attendance source. The Existing Bundy / Biometric System remains part of the attendance integration.",
  },
  {
    id: "submit-correction",
    question: "How do I submit an attendance correction?",
    answer: "Review the affected record and use the correction option when it is available. Provide the requested details so authorized HR / Attendance Staff can review the request.",
  },
  {
    id: "correction-next-step",
    question: "What happens after I submit a correction?",
    answer: "The request is reviewed by authorized HR / Attendance Staff. It may be approved, rejected, or returned for more information before the attendance record proceeds through final HR Verification.",
  },
  {
    id: "correction-reviewer",
    question: "Who reviews my attendance correction?",
    answer: "For the current workflow, attendance correction requests are reviewed by authorized HR / Attendance Staff.",
  },
  {
    id: "hrps-fields",
    question: "Why cannot I edit my department or position?",
    answer: "Official employee information is referenced from the Existing HRPS, which remains the source of truth for employee data.",
  },
  {
    id: "payslip-unavailable",
    question: "Why is my payslip not available?",
    answer: "Payslip information is displayed when it is received or released from the Existing Payroll System. This application does not calculate payroll.",
  },
  {
    id: "account-access",
    question: "What should I do if I cannot access my account?",
    answer: "Contact the system administrator or authorized IT support staff for account access assistance. Do not share your password in a support request.",
  },
];

export const employeeSupportChannels: readonly EmployeeSupportChannel[] = [
  {
    id: "attendance-support",
    title: "Attendance / Correction Concern",
    icon: "clock",
    description: "For missing Time In, missing Time Out, attendance status, or correction-request concerns, contact HR / Attendance Staff.",
    contactLabel: "HR / Attendance Staff",
    href: "/employee/attendance-history",
    linkLabel: "Review attendance history",
  },
  {
    id: "account-support",
    title: "Account Access Concern",
    icon: "user",
    description: "If you cannot access your account or believe your application access is incorrect, contact the system administrator or authorized support staff.",
    contactLabel: "System administrator or authorized support staff",
    href: "/employee/profile",
    linkLabel: "Review profile",
  },
  {
    id: "payroll-support",
    title: "Payslip / Payroll Concern",
    icon: "file",
    description: "For questions about payroll values or released payslips, contact the appropriate Payroll / HR office.",
    contactLabel: "Payroll / HR office",
    href: "/employee/payslips",
    linkLabel: "Review payslips",
  },
  {
    id: "technical-support",
    title: "Technical System Problem",
    icon: "support",
    description: "If a page does not load or an application feature does not work as expected, report the issue to IT support.",
    contactLabel: "IT Support",
  },
];
