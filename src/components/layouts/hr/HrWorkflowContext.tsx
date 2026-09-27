"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import {
  createAttendanceVerifiedAuditEvent,
  createCorrectionWorkflowAuditEvent,
  hrAttendanceAuditEvents,
  type AttendanceAuditAction,
  type AttendanceAuditEvent,
} from "@/data/hr-attendance-audit";
import { hrAttendanceMonitoringRecords } from "@/data/hr";
import {
  getCorrectionStatus,
  getInitialHrVerificationStatus,
  getPayrollReadiness,
  type HrVerificationStatus,
  type HrWorkflowAttendanceRecord,
  type HrWorkflowCorrectionStatus,
  type PayrollReadiness,
} from "@/data/hr-workflow";
import {
  hrCorrectionRequests,
  type HrCorrectionRequest,
  type HrCorrectionRequestStatus,
} from "@/data/hr-correction-requests";

type HrWorkflowContextValue = {
  attendanceRecords: readonly HrWorkflowAttendanceRecord[];
  correctionRequests: readonly HrCorrectionRequest[];
  auditEvents: readonly AttendanceAuditEvent[];
  updateCorrectionRequest: (requestId: string, status: HrCorrectionRequestStatus, note?: string) => void;
  verifyAttendance: (recordId: string) => { ok: true } | { ok: false; reason: string };
};

const HrWorkflowContext = createContext<HrWorkflowContextValue | null>(null);

function toneForCorrectionStatus(status: HrCorrectionRequestStatus) {
  if (status === "Approved") return "success" as const;
  if (status === "Rejected") return "danger" as const;
  if (status === "Needs Additional Information") return "warning" as const;
  return "info" as const;
}

function actionForCorrectionStatus(status: HrCorrectionRequestStatus): Exclude<AttendanceAuditAction, "Attendance Verified"> {
  if (status === "Approved") return "Correction Approved";
  if (status === "Rejected") return "Correction Rejected";
  if (status === "Needs Additional Information") return "Information Requested";
  return "Correction Reviewed";
}

function initialVerificationState() {
  const requestsByAttendanceId = new Map(
    hrCorrectionRequests.map((request) => [request.attendanceRecordId, request]),
  );

  return Object.fromEntries(
    hrAttendanceMonitoringRecords.map((record) => [
      record.id,
      getInitialHrVerificationStatus(record, requestsByAttendanceId.get(record.id)),
    ]),
  ) as Record<string, HrVerificationStatus>;
}

function initialCorrectionRequests() {
  return hrCorrectionRequests.map((request) => ({
    ...request,
    history: [...request.history],
  }));
}

function formatDecisionTimestamp(value: Date) {
  const datePart = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
  const timePart = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(value);

  return `${datePart} · ${timePart}`;
}

export function HrWorkflowProvider({ children }: { children: ReactNode }) {
  const [verificationByRecordId, setVerificationByRecordId] = useState(initialVerificationState);
  const [correctionRequests, setCorrectionRequests] = useState(initialCorrectionRequests);
  const [auditEvents, setAuditEvents] = useState<readonly AttendanceAuditEvent[]>(hrAttendanceAuditEvents);

  const attendanceRecords = useMemo(() => {
    return hrAttendanceMonitoringRecords.map((record) => {
      const correctionRequest = correctionRequests.find((request) => request.attendanceRecordId === record.id);
      const correctionStatus: HrWorkflowCorrectionStatus = getCorrectionStatus(correctionRequest);
      const hrVerificationStatus = verificationByRecordId[record.id]
        ?? getInitialHrVerificationStatus(record, correctionRequest);
      const payrollReadiness: PayrollReadiness = getPayrollReadiness({
        hrVerificationStatus,
        validationStatus: record.validationStatus,
        correctionStatus,
      });

      return {
        ...record,
        correctionStatus,
        hrVerificationStatus,
        payrollReadiness,
      };
    });
  }, [correctionRequests, verificationByRecordId]);

  const updateCorrectionRequest = useCallback((requestId: string, status: HrCorrectionRequestStatus, note?: string) => {
    const currentRequest = correctionRequests.find((request) => request.id === requestId);

    if (!currentRequest) return;

    const occurredAt = new Date();
    const occurredAtLabel = formatDecisionTimestamp(occurredAt);
    const updatedRequest: HrCorrectionRequest = {
      ...currentRequest,
      status,
      statusTone: toneForCorrectionStatus(status),
      decisionAt: occurredAtLabel,
      decisionNote: note,
      history: [
        ...currentRequest.history,
        {
          id: `${currentRequest.id}-${status}-${occurredAt.getTime()}`,
          action: status === "Approved"
            ? "Correction approved"
            : status === "Rejected"
              ? "Correction rejected"
              : status === "Needs Additional Information"
                ? "Additional information requested"
                : "Opened for review",
          actor: "HR / Attendance Staff",
          occurredAt: occurredAtLabel,
          note,
        },
      ],
    };

    setCorrectionRequests((requests) => requests.map((request) => (
      request.id === requestId ? updatedRequest : request
    )));

    setVerificationByRecordId((current) => ({
      ...current,
      [currentRequest.attendanceRecordId]: status === "Approved" ? "Pending Review" : "Needs Correction",
    }));

    setAuditEvents((current) => [
      createCorrectionWorkflowAuditEvent({
        request: updatedRequest,
        action: actionForCorrectionStatus(status),
        previousStatus: currentRequest.status,
        note,
        occurredAt,
      }),
      ...current,
    ]);
  }, [correctionRequests]);

  const verifyAttendance = useCallback((recordId: string): { ok: true } | { ok: false; reason: string } => {
    const record = attendanceRecords.find((candidate) => candidate.id === recordId);

    if (!record) return { ok: false, reason: "The attendance record is no longer available." };
    if (record.hrVerificationStatus === "Verified") return { ok: false, reason: "This attendance record is already verified." };
    if (record.validationStatus !== "Verified") return { ok: false, reason: "Resolve the attendance validation issue before verification." };
    if (record.correctionStatus !== "No Correction Request" && record.correctionStatus !== "Approved") {
      return { ok: false, reason: "Resolve the pending correction request before verification." };
    }

    setVerificationByRecordId((current) => ({
      ...current,
      [recordId]: "Verified",
    }));
    setAuditEvents((current) => [
      createAttendanceVerifiedAuditEvent({
        record,
        previousVerification: record.hrVerificationStatus,
        previousPayrollReadiness: record.payrollReadiness,
      }),
      ...current,
    ]);

    return { ok: true };
  }, [attendanceRecords]);

  const value = useMemo(() => ({
    attendanceRecords,
    correctionRequests,
    auditEvents,
    updateCorrectionRequest,
    verifyAttendance,
  }), [attendanceRecords, auditEvents, correctionRequests, updateCorrectionRequest, verifyAttendance]);

  return <HrWorkflowContext.Provider value={value}>{children}</HrWorkflowContext.Provider>;
}

export function useHrWorkflow() {
  const context = useContext(HrWorkflowContext);

  if (!context) {
    throw new Error("useHrWorkflow must be used inside HrWorkflowProvider");
  }

  return context;
}
