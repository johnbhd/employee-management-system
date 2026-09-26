import type { HrAttendanceMonitoringRecord, HrAttendanceSource } from "./hr";
import type { StatusTone } from "@/types/ui";

export type HrCorrectionRequestStatus =
  | "Submitted"
  | "Under Review"
  | "Needs Additional Information"
  | "Approved"
  | "Rejected";

export type HrCorrectionIssueType =
  | "Missing Time-In"
  | "Missing Time-Out"
  | "Incorrect Time-In"
  | "Attendance Source Conflict";

export type HrCorrectionValues = {
  timeIn?: string;
  timeOut?: string;
  source?: Exclude<HrAttendanceSource, null>;
};

export type HrCorrectionEvidence = {
  id: string;
  fileName: string;
  fileType: string;
  submittedAt: string;
};

export type HrCorrectionHistoryItem = {
  id: string;
  action: string;
  actor: string;
  occurredAt: string;
  note?: string;
};

export type HrCorrectionRequest = {
  id: string;
  attendanceRecordId: HrAttendanceMonitoringRecord["id"];
  employeeId: string;
  employeeName: string;
  department: string;
  attendanceDate: string;
  submittedDate: string;
  submittedAt: string;
  issueType: HrCorrectionIssueType;
  status: HrCorrectionRequestStatus;
  statusTone: StatusTone;
  explanation: string;
  currentValues: HrCorrectionValues;
  requestedValues: HrCorrectionValues;
  evidence: readonly HrCorrectionEvidence[];
  history: readonly HrCorrectionHistoryItem[];
  decisionAt?: string;
  decisionNote?: string;
};

const submittedByEmployee = "Employee";
const hrReviewer = "HR / Attendance Staff";

export const hrCorrectionRequests: HrCorrectionRequest[] = [
  {
    id: "CR-2026-0042",
    attendanceRecordId: "AU-EMP-2026-0194",
    employeeId: "AU-EMP-2026-0194",
    employeeName: "Maria Santos",
    department: "Human Resources",
    attendanceDate: "2026-09-16",
    submittedDate: "2026-09-16",
    submittedAt: "Sep 16, 2026 · 8:12 AM",
    issueType: "Incorrect Time-In",
    status: "Under Review",
    statusTone: "info",
    explanation: "The Bundy clock recorded my arrival one minute late while I was already at the office entrance.",
    currentValues: { timeIn: "7:31 AM" },
    requestedValues: { timeIn: "7:30 AM" },
    evidence: [
      {
        id: "evidence-0042",
        fileName: "office-entry-log.pdf",
        fileType: "PDF",
        submittedAt: "Sep 16, 2026 · 8:12 AM",
      },
    ],
    history: [
      {
        id: "history-0042-1",
        action: "Request submitted",
        actor: submittedByEmployee,
        occurredAt: "Sep 16, 2026 · 8:12 AM",
      },
      {
        id: "history-0042-2",
        action: "Opened for review",
        actor: hrReviewer,
        occurredAt: "Sep 16, 2026 · 9:04 AM",
      },
    ],
  },
  {
    id: "CR-2026-0043",
    attendanceRecordId: "AU-EMP-2026-0332",
    employeeId: "AU-EMP-2026-0332",
    employeeName: "Robert Cruz",
    department: "Administration",
    attendanceDate: "2026-09-16",
    submittedDate: "2026-09-16",
    submittedAt: "Sep 16, 2026 · 5:38 PM",
    issueType: "Missing Time-Out",
    status: "Submitted",
    statusTone: "info",
    explanation: "I left the office at approximately 5:04 PM but forgot to record my Time-out at the QR station.",
    currentValues: { timeOut: "—" },
    requestedValues: { timeOut: "5:04 PM" },
    evidence: [
      {
        id: "evidence-0043",
        fileName: "attendance-note.pdf",
        fileType: "PDF",
        submittedAt: "Sep 16, 2026 · 5:38 PM",
      },
    ],
    history: [
      {
        id: "history-0043-1",
        action: "Request submitted",
        actor: submittedByEmployee,
        occurredAt: "Sep 16, 2026 · 5:38 PM",
      },
    ],
  },
  {
    id: "CR-2026-0044",
    attendanceRecordId: "AU-EMP-2026-0177",
    employeeId: "AU-EMP-2026-0177",
    employeeName: "Ana Reyes",
    department: "Office Support",
    attendanceDate: "2026-09-16",
    submittedDate: "2026-09-17",
    submittedAt: "Sep 17, 2026 · 8:02 AM",
    issueType: "Missing Time-In",
    status: "Needs Additional Information",
    statusTone: "warning",
    explanation: "I arrived before the scheduled time, but the Bundy device did not register my Time-in.",
    currentValues: { timeIn: "—" },
    requestedValues: { timeIn: "7:58 AM" },
    evidence: [],
    history: [
      {
        id: "history-0044-1",
        action: "Request submitted",
        actor: submittedByEmployee,
        occurredAt: "Sep 17, 2026 · 8:02 AM",
      },
      {
        id: "history-0044-2",
        action: "Additional information requested",
        actor: hrReviewer,
        occurredAt: "Sep 17, 2026 · 9:16 AM",
        note: "Please provide supporting documentation or clarify the requested Time-in.",
      },
    ],
    decisionAt: "Sep 17, 2026 · 9:16 AM",
    decisionNote: "Please provide supporting documentation or clarify the requested Time-in.",
  },
  {
    id: "CR-2026-0045",
    attendanceRecordId: "AU-EMP-2026-0208",
    employeeId: "AU-EMP-2026-0208",
    employeeName: "Paolo Mendoza",
    department: "Human Resources",
    attendanceDate: "2026-09-16",
    submittedDate: "2026-09-16",
    submittedAt: "Sep 16, 2026 · 10:21 AM",
    issueType: "Attendance Source Conflict",
    status: "Rejected",
    statusTone: "danger",
    explanation: "The QR scan shows my expected arrival time, but the source records do not agree.",
    currentValues: { source: "QR" },
    requestedValues: { source: "Bundy" },
    evidence: [],
    history: [
      {
        id: "history-0045-1",
        action: "Request submitted",
        actor: submittedByEmployee,
        occurredAt: "Sep 16, 2026 · 10:21 AM",
      },
      {
        id: "history-0045-2",
        action: "Correction rejected",
        actor: hrReviewer,
        occurredAt: "Sep 16, 2026 · 11:02 AM",
        note: "The source conflict requires reconciliation between the source records before a correction can be approved.",
      },
    ],
    decisionAt: "Sep 16, 2026 · 11:02 AM",
    decisionNote: "The source conflict requires reconciliation between the source records before a correction can be approved.",
  },
  {
    id: "CR-2026-0046",
    attendanceRecordId: "AU-EMP-2026-0314",
    employeeId: "AU-EMP-2026-0314",
    employeeName: "Daniel Flores",
    department: "Administration",
    attendanceDate: "2026-09-16",
    submittedDate: "2026-09-16",
    submittedAt: "Sep 16, 2026 · 5:27 PM",
    issueType: "Missing Time-Out",
    status: "Approved",
    statusTone: "success",
    explanation: "The Time-out was missed during a busy closing period. My attendance confirmation indicates that I left at 5:01 PM.",
    currentValues: { timeOut: "—" },
    requestedValues: { timeOut: "5:01 PM" },
    evidence: [
      {
        id: "evidence-0046",
        fileName: "attendance-confirmation.pdf",
        fileType: "PDF",
        submittedAt: "Sep 16, 2026 · 5:27 PM",
      },
    ],
    history: [
      {
        id: "history-0046-1",
        action: "Request submitted",
        actor: submittedByEmployee,
        occurredAt: "Sep 16, 2026 · 5:27 PM",
      },
      {
        id: "history-0046-2",
        action: "Correction approved",
        actor: hrReviewer,
        occurredAt: "Sep 16, 2026 · 5:48 PM",
        note: "The submitted attendance confirmation supported the requested Time-out.",
      },
    ],
    decisionAt: "Sep 16, 2026 · 5:48 PM",
    decisionNote: "The submitted attendance confirmation supported the requested Time-out.",
  },
  {
    id: "CR-2026-0047",
    attendanceRecordId: "AU-EMP-2026-0271",
    employeeId: "AU-EMP-2026-0271",
    employeeName: "Carla Bautista",
    department: "Office Support",
    attendanceDate: "2026-09-16",
    submittedDate: "2026-09-16",
    submittedAt: "Sep 16, 2026 · 8:35 AM",
    issueType: "Incorrect Time-In",
    status: "Approved",
    statusTone: "success",
    explanation: "The QR record is one minute earlier than the time shown on my attendance confirmation.",
    currentValues: { timeIn: "7:58 AM" },
    requestedValues: { timeIn: "8:00 AM" },
    evidence: [],
    history: [
      {
        id: "history-0047-1",
        action: "Request submitted",
        actor: submittedByEmployee,
        occurredAt: "Sep 16, 2026 · 8:35 AM",
      },
      {
        id: "history-0047-2",
        action: "Correction approved",
        actor: hrReviewer,
        occurredAt: "Sep 16, 2026 · 9:01 AM",
        note: "The requested Time-in was accepted after review.",
      },
    ],
    decisionAt: "Sep 16, 2026 · 9:01 AM",
    decisionNote: "The requested Time-in was accepted after review.",
  },
];
