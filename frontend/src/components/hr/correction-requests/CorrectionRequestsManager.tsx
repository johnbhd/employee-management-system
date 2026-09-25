"use client";

import { useEffect, useMemo, useState } from "react";

import { hrAttendanceMonitoringRecords } from "@/data/hr";
import type {
  HrCorrectionRequest,
  HrCorrectionRequestStatus,
} from "@/data/hr-correction-requests";

import { CorrectionRequestDrawer } from "./CorrectionRequestDrawer";
import { CorrectionRequestFilters } from "./CorrectionRequestFilters";
import { CorrectionRequestSummary } from "./CorrectionRequestSummary";
import { CorrectionDecisionDialog } from "./CorrectionDecisionDialog";
import { CorrectionRequestsTable } from "./CorrectionRequestsTable";
import type { CorrectionDecisionType } from "./types";

const allValue = "all";
const decisionTimestamp = "Sep 16, 2026 · 11:30 AM";

const statusOptions = [
  { value: allValue, label: "All statuses" },
  { value: "Submitted", label: "Submitted" },
  { value: "Under Review", label: "Under Review" },
  { value: "Needs Additional Information", label: "Needs Additional Information" },
  { value: "Approved", label: "Approved" },
  { value: "Rejected", label: "Rejected" },
];

const issueTypeOptions = [
  { value: allValue, label: "All issue types" },
  { value: "Missing Time-In", label: "Missing Time-In" },
  { value: "Missing Time-Out", label: "Missing Time-Out" },
  { value: "Incorrect Time-In", label: "Incorrect Time-In" },
  { value: "Attendance Source Conflict", label: "Attendance Source Conflict" },
];

const decisionConfig: Record<CorrectionDecisionType, { status: HrCorrectionRequestStatus; tone: HrCorrectionRequest["statusTone"]; action: string }> = {
  approve: { status: "Approved", tone: "success", action: "Correction approved" },
  reject: { status: "Rejected", tone: "danger", action: "Correction rejected" },
  information: {
    status: "Needs Additional Information",
    tone: "warning",
    action: "Additional information requested",
  },
};

type CorrectionRequestsManagerProps = {
  requests: readonly HrCorrectionRequest[];
};

export function CorrectionRequestsManager({ requests }: CorrectionRequestsManagerProps) {
  const [requestState, setRequestState] = useState([...requests]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(allValue);
  const [issueType, setIssueType] = useState(allValue);
  const [department, setDepartment] = useState(allValue);
  const [submittedDate, setSubmittedDate] = useState("");
  const [attendanceDate, setAttendanceDate] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [decision, setDecision] = useState<CorrectionDecisionType | null>(null);
  const [decisionNote, setDecisionNote] = useState("");
  const [feedback, setFeedback] = useState("");

  const departments = useMemo(
    () => [
      { value: allValue, label: "All departments" },
      ...Array.from(new Set(requestState.map((request) => request.department)))
        .sort()
        .map((value) => ({ value, label: value })),
    ],
    [requestState],
  );

  const filteredRequests = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return requestState.filter((request) => {
      const matchesSearch = !normalizedSearch
        || request.id.toLowerCase().includes(normalizedSearch)
        || request.employeeName.toLowerCase().includes(normalizedSearch)
        || request.employeeId.toLowerCase().includes(normalizedSearch);
      const matchesStatus = status === allValue || request.status === status;
      const matchesIssueType = issueType === allValue || request.issueType === issueType;
      const matchesDepartment = department === allValue || request.department === department;
      const matchesSubmittedDate = !submittedDate || request.submittedDate === submittedDate;
      const matchesAttendanceDate = !attendanceDate || request.attendanceDate === attendanceDate;

      return matchesSearch
        && matchesStatus
        && matchesIssueType
        && matchesDepartment
        && matchesSubmittedDate
        && matchesAttendanceDate;
    });
  }, [attendanceDate, department, issueType, requestState, search, status, submittedDate]);

  const selectedRequest = requestState.find((request) => request.id === selectedRequestId) ?? null;
  const selectedAttendanceRecord = selectedRequest
    ? hrAttendanceMonitoringRecords.find((record) => record.id === selectedRequest.attendanceRecordId) ?? null
    : null;

  const activeFilterCount = [
    search.trim(),
    status !== allValue ? status : "",
    issueType !== allValue ? issueType : "",
    department !== allValue ? department : "",
    submittedDate,
    attendanceDate,
  ].filter(Boolean).length;

  useEffect(() => {
    if (!selectedRequestId && !decision) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setDecision(null);
      setSelectedRequestId(null);
      setDecisionNote("");
    }

    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [decision, selectedRequestId]);

  function resetFilters() {
    setSearch("");
    setStatus(allValue);
    setIssueType(allValue);
    setDepartment(allValue);
    setSubmittedDate("");
    setAttendanceDate("");
  }

  function openDecision(nextDecision: CorrectionDecisionType) {
    setDecision(nextDecision);
    setDecisionNote("");
  }

  function confirmDecision() {
    if (!selectedRequest || !decision) return;

    const selectedDecision = decisionConfig[decision];
    const note = decisionNote.trim();
    const historyNote = note || undefined;

    setRequestState((currentRequests) => currentRequests.map((request) => {
      if (request.id !== selectedRequest.id) return request;

      return {
        ...request,
        status: selectedDecision.status,
        statusTone: selectedDecision.tone,
        decisionAt: decisionTimestamp,
        decisionNote: historyNote,
        history: [
          ...request.history,
          {
            id: `${request.id}-${decision}-${Date.now()}`,
            action: selectedDecision.action,
            actor: "HR / Attendance Staff",
            occurredAt: decisionTimestamp,
            note: historyNote,
          },
        ],
      };
    }));

    setFeedback(`${selectedDecision.action}.`);
    setDecision(null);
    setDecisionNote("");
  }

  return (
    <div className="hr-correction-manager">
      <CorrectionRequestSummary requests={requestState} />

      <CorrectionRequestFilters
        search={search}
        status={status}
        issueType={issueType}
        department={department}
        submittedDate={submittedDate}
        attendanceDate={attendanceDate}
        statuses={statusOptions}
        issueTypes={issueTypeOptions}
        departments={departments}
        activeFilterCount={activeFilterCount}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onIssueTypeChange={setIssueType}
        onDepartmentChange={setDepartment}
        onSubmittedDateChange={setSubmittedDate}
        onAttendanceDateChange={setAttendanceDate}
        onReset={resetFilters}
      />

      <section className="hr-dashboard-panel hr-correction-queue" aria-labelledby="hr-correction-queue-heading">
        <div className="hr-panel-header">
          <div>
            <p className="hr-section-kicker">Operational records</p>
            <h2 id="hr-correction-queue-heading">Correction request queue</h2>
            <p className="hr-panel-description">Review the current attendance record and the employee&apos;s requested change before deciding.</p>
          </div>
          <span className="hr-correction-result-count">Showing {filteredRequests.length} of {requestState.length} requests</span>
        </div>

        <CorrectionRequestsTable requests={filteredRequests} onSelectRequest={setSelectedRequestId} />
      </section>

      {feedback ? (
        <p className="hr-correction-feedback" role="status" aria-live="polite">
          {feedback}
        </p>
      ) : null}

      <CorrectionRequestDrawer
        request={selectedRequest}
        attendanceRecord={selectedAttendanceRecord}
        onClose={() => setSelectedRequestId(null)}
        onDecision={openDecision}
      />

      <CorrectionDecisionDialog
        request={selectedRequest}
        decision={decision}
        note={decisionNote}
        onNoteChange={setDecisionNote}
        onClose={() => {
          setDecision(null);
          setDecisionNote("");
        }}
        onConfirm={confirmDecision}
      />
    </div>
  );
}
