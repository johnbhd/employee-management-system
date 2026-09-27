export type AdminAuditActorRole =
  | "IT Administrator"
  | "HR / Attendance Staff"
  | "Employee"
  | "System Process";

export type AdminAuditOutcome = "Successful" | "Failed" | "Blocked";

export type AdminAuditModule =
  | "User Accounts"
  | "Roles & Permissions"
  | "Integration Errors"
  | "Payroll Integration"
  | "Accounting Integration"
  | "HRPS Integration"
  | "Bundy / Biometric ETL"
  | "QR Attendance"
  | "Unified Attendance"
  | "Correction Requests";

export type AdminAuditAction =
  | "Account Review Flagged"
  | "User Account Viewed"
  | "Permissions Reviewed"
  | "Integration Error Reviewed"
  | "Payroll Handoff Status Updated"
  | "Accounting Synchronization Completed"
  | "Integration Error Status Updated"
  | "HRPS Synchronization Completed"
  | "Bundy Import Completed"
  | "QR Attendance Batch Completed"
  | "Attendance Correction Reviewed"
  | "Attendance Correction Submitted"
  | "User Account Disabled"
  | "User Account Created"
  | "Integration Retry Failed";

export type AdminAuditChange = {
  field: string;
  previousValue: string;
  newValue: string;
};

export type AdminAuditTarget = {
  type: string;
  reference: string;
  label: string;
};

export type AdminAuditLog = {
  id: string;
  occurredAt: string;
  occurredAtDate: string;
  occurredAtTimestamp: number;
  action: AdminAuditAction;
  module: AdminAuditModule;
  actor: {
    name: string;
    role: AdminAuditActorRole;
    userId?: string;
  };
  target: AdminAuditTarget;
  outcome: AdminAuditOutcome;
  changes: readonly AdminAuditChange[];
  details?: string;
  relatedEventIds?: readonly string[];
};

export const adminAuditActorRoleOptions: readonly AdminAuditActorRole[] = [
  "IT Administrator",
  "HR / Attendance Staff",
  "Employee",
  "System Process",
];

export const adminAuditActionOptions: readonly AdminAuditAction[] = [
  "Account Review Flagged",
  "User Account Viewed",
  "Permissions Reviewed",
  "Integration Error Reviewed",
  "Payroll Handoff Status Updated",
  "Accounting Synchronization Completed",
  "Integration Error Status Updated",
  "HRPS Synchronization Completed",
  "Bundy Import Completed",
  "QR Attendance Batch Completed",
  "Attendance Correction Reviewed",
  "Attendance Correction Submitted",
  "User Account Disabled",
  "User Account Created",
  "Integration Retry Failed",
];

export const adminAuditModuleOptions: readonly AdminAuditModule[] = [
  "User Accounts",
  "Roles & Permissions",
  "Integration Errors",
  "Payroll Integration",
  "Accounting Integration",
  "HRPS Integration",
  "Bundy / Biometric ETL",
  "QR Attendance",
  "Unified Attendance",
  "Correction Requests",
];

export const adminAuditOutcomeOptions: readonly AdminAuditOutcome[] = [
  "Successful",
  "Failed",
  "Blocked",
];

const itAdministrator = {
  name: "aujsc.admin",
  role: "IT Administrator" as const,
  userId: "USR-001",
};

const hrAttendanceStaff = {
  name: "HR / Attendance Staff",
  role: "HR / Attendance Staff" as const,
};

const employee = {
  name: "Maria Santos",
  role: "Employee" as const,
  userId: "AU-EMP-2026-0194",
};

const systemProcess = {
  name: "Integration Layer",
  role: "System Process" as const,
};

function eventTimestamp(value: string) {
  return new Date(value).getTime();
}

export const adminAuditLogs: readonly AdminAuditLog[] = [
  {
    id: "AUD-2026-0923-001",
    occurredAt: "Sep 23, 2026 · 10:16 AM",
    occurredAtDate: "2026-09-23",
    occurredAtTimestamp: eventTimestamp("2026-09-23T10:16:00+08:00"),
    action: "Account Review Flagged",
    module: "User Accounts",
    actor: systemProcess,
    target: {
      type: "User account",
      reference: "USR-004",
      label: "employee3",
    },
    outcome: "Blocked",
    changes: [],
    details: "The linked HRPS employee is inactive, so the account was flagged for administrator review.",
  },
  {
    id: "AUD-2026-0923-002",
    occurredAt: "Sep 23, 2026 · 10:12 AM",
    occurredAtDate: "2026-09-23",
    occurredAtTimestamp: eventTimestamp("2026-09-23T10:12:00+08:00"),
    action: "User Account Viewed",
    module: "User Accounts",
    actor: itAdministrator,
    target: {
      type: "User account",
      reference: "USR-004",
      label: "employee3",
    },
    outcome: "Successful",
    changes: [],
    details: "The account details were opened for review. No account data was changed.",
    relatedEventIds: ["AUD-2026-0923-001"],
  },
  {
    id: "AUD-2026-0922-001",
    occurredAt: "Sep 22, 2026 · 02:40 PM",
    occurredAtDate: "2026-09-22",
    occurredAtTimestamp: eventTimestamp("2026-09-22T14:40:00+08:00"),
    action: "Permissions Reviewed",
    module: "Roles & Permissions",
    actor: itAdministrator,
    target: {
      type: "Role",
      reference: "ROLE-IT-ADMIN",
      label: "IT Administrator",
    },
    outcome: "Successful",
    changes: [],
    details: "The current role permissions were reviewed from the administration workspace.",
  },
  {
    id: "AUD-2026-0920-001",
    occurredAt: "Sep 20, 2026 · 09:25 AM",
    occurredAtDate: "2026-09-20",
    occurredAtTimestamp: eventTimestamp("2026-09-20T09:25:00+08:00"),
    action: "Integration Error Reviewed",
    module: "Integration Errors",
    actor: itAdministrator,
    target: {
      type: "Integration error",
      reference: "ERR-2026-0204",
      label: "Payroll Integration",
    },
    outcome: "Successful",
    changes: [],
    details: "The payroll handoff issue was opened to review the affected batch and current retry state.",
    relatedEventIds: ["AUD-2026-0918-001"],
  },
  {
    id: "AUD-2026-0918-001",
    occurredAt: "Sep 18, 2026 · 04:18 PM",
    occurredAtDate: "2026-09-18",
    occurredAtTimestamp: eventTimestamp("2026-09-18T16:18:00+08:00"),
    action: "Payroll Handoff Status Updated",
    module: "Payroll Integration",
    actor: systemProcess,
    target: {
      type: "Payroll batch",
      reference: "PAY-2026-09-B",
      label: "September payroll handoff",
    },
    outcome: "Blocked",
    changes: [
      {
        field: "Transfer status",
        previousValue: "Queued",
        newValue: "Retry pending",
      },
    ],
    details: "The handoff remains pending while the integration error is reviewed.",
    relatedEventIds: ["AUD-2026-0920-001"],
  },
  {
    id: "AUD-2026-0917-001",
    occurredAt: "Sep 17, 2026 · 05:02 PM",
    occurredAtDate: "2026-09-17",
    occurredAtTimestamp: eventTimestamp("2026-09-17T17:02:00+08:00"),
    action: "Accounting Synchronization Completed",
    module: "Accounting Integration",
    actor: systemProcess,
    target: {
      type: "Accounting batch",
      reference: "ACC-2026-09-002",
      label: "September accounting batch",
    },
    outcome: "Successful",
    changes: [
      {
        field: "Synchronization status",
        previousValue: "In progress",
        newValue: "Completed",
      },
    ],
    details: "The accounting integration completed its recorded synchronization for the batch.",
  },
  {
    id: "AUD-2026-0917-002",
    occurredAt: "Sep 17, 2026 · 03:36 PM",
    occurredAtDate: "2026-09-17",
    occurredAtTimestamp: eventTimestamp("2026-09-17T15:36:00+08:00"),
    action: "Integration Error Status Updated",
    module: "Integration Errors",
    actor: itAdministrator,
    target: {
      type: "Integration error",
      reference: "ERR-2026-0200",
      label: "Accounting Integration",
    },
    outcome: "Successful",
    changes: [
      {
        field: "Error status",
        previousValue: "Under review",
        newValue: "Resolved",
      },
    ],
    details: "The recorded accounting integration issue was marked resolved after review.",
    relatedEventIds: ["AUD-2026-0917-001"],
  },
  {
    id: "AUD-2026-0916-001",
    occurredAt: "Sep 16, 2026 · 10:38 AM",
    occurredAtDate: "2026-09-16",
    occurredAtTimestamp: eventTimestamp("2026-09-16T10:38:00+08:00"),
    action: "HRPS Synchronization Completed",
    module: "HRPS Integration",
    actor: systemProcess,
    target: {
      type: "Synchronization run",
      reference: "HRPS-SYNC-2026-09-16-1038",
      label: "Employee master data",
    },
    outcome: "Successful",
    changes: [],
    details: "The latest employee master data synchronization completed for the HRPS integration.",
  },
  {
    id: "AUD-2026-0916-002",
    occurredAt: "Sep 16, 2026 · 10:25 AM",
    occurredAtDate: "2026-09-16",
    occurredAtTimestamp: eventTimestamp("2026-09-16T10:25:00+08:00"),
    action: "QR Attendance Batch Completed",
    module: "QR Attendance",
    actor: systemProcess,
    target: {
      type: "Attendance batch",
      reference: "QR-SYNC-2026-09-16-1025",
      label: "QR station attendance",
    },
    outcome: "Successful",
    changes: [],
    details: "QR attendance records were received and made available to the unified attendance layer.",
  },
  {
    id: "AUD-2026-0916-003",
    occurredAt: "Sep 16, 2026 · 10:18 AM",
    occurredAtDate: "2026-09-16",
    occurredAtTimestamp: eventTimestamp("2026-09-16T10:18:00+08:00"),
    action: "Bundy Import Completed",
    module: "Bundy / Biometric ETL",
    actor: systemProcess,
    target: {
      type: "Import batch",
      reference: "BND-00482",
      label: "Bundy attendance import",
    },
    outcome: "Successful",
    changes: [],
    details: "The Bundy import completed and its attendance records were passed to the integration layer.",
  },
  {
    id: "AUD-2026-0916-004",
    occurredAt: "Sep 16, 2026 · 09:04 AM",
    occurredAtDate: "2026-09-16",
    occurredAtTimestamp: eventTimestamp("2026-09-16T09:04:00+08:00"),
    action: "Attendance Correction Reviewed",
    module: "Correction Requests",
    actor: hrAttendanceStaff,
    target: {
      type: "Correction request",
      reference: "CR-2026-0042",
      label: "Maria Santos · Incorrect Time-In",
    },
    outcome: "Successful",
    changes: [
      {
        field: "Request status",
        previousValue: "Submitted",
        newValue: "Under Review",
      },
    ],
    details: "The attendance correction request was opened for HR review.",
    relatedEventIds: ["AUD-2026-0916-005"],
  },
  {
    id: "AUD-2026-0916-005",
    occurredAt: "Sep 16, 2026 · 08:12 AM",
    occurredAtDate: "2026-09-16",
    occurredAtTimestamp: eventTimestamp("2026-09-16T08:12:00+08:00"),
    action: "Attendance Correction Submitted",
    module: "Correction Requests",
    actor: employee,
    target: {
      type: "Correction request",
      reference: "CR-2026-0042",
      label: "Maria Santos · Incorrect Time-In",
    },
    outcome: "Successful",
    changes: [
      {
        field: "Request status",
        previousValue: "—",
        newValue: "Submitted",
      },
    ],
    details: "An attendance correction request was submitted with supporting evidence for HR review.",
    relatedEventIds: ["AUD-2026-0916-004"],
  },
  {
    id: "AUD-2026-0910-001",
    occurredAt: "Sep 10, 2026 · 03:24 PM",
    occurredAtDate: "2026-09-10",
    occurredAtTimestamp: eventTimestamp("2026-09-10T15:24:00+08:00"),
    action: "User Account Disabled",
    module: "User Accounts",
    actor: itAdministrator,
    target: {
      type: "User account",
      reference: "USR-005",
      label: "employee4",
    },
    outcome: "Successful",
    changes: [
      {
        field: "Account status",
        previousValue: "Active",
        newValue: "Disabled",
      },
    ],
    details: "Application access was disabled. The linked HRPS employee record was not changed.",
  },
  {
    id: "AUD-2026-0905-001",
    occurredAt: "Sep 05, 2026 · 09:10 AM",
    occurredAtDate: "2026-09-05",
    occurredAtTimestamp: eventTimestamp("2026-09-05T09:10:00+08:00"),
    action: "User Account Created",
    module: "User Accounts",
    actor: itAdministrator,
    target: {
      type: "User account",
      reference: "USR-003",
      label: "employee2",
    },
    outcome: "Successful",
    changes: [
      {
        field: "Account status",
        previousValue: "—",
        newValue: "Active",
      },
      {
        field: "Linked employee",
        previousValue: "—",
        newValue: "AU-EMP-2026-0194",
      },
    ],
    details: "The application account was created and linked to the existing HRPS employee record.",
  },
  {
    id: "AUD-2026-0904-001",
    occurredAt: "Sep 04, 2026 · 11:46 AM",
    occurredAtDate: "2026-09-04",
    occurredAtTimestamp: eventTimestamp("2026-09-04T11:46:00+08:00"),
    action: "Integration Retry Failed",
    module: "Integration Errors",
    actor: systemProcess,
    target: {
      type: "Integration error",
      reference: "ERR-2026-0203",
      label: "Bundy / Biometric ETL",
    },
    outcome: "Failed",
    changes: [],
    details: "The recorded retry attempt did not complete, so the issue remained available for administrator review.",
  },
];
