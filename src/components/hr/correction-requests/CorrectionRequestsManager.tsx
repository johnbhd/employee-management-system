"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { apiRequest } from "@/lib/api/client";
import type {
  AttendanceCorrectionData,
  AttendanceCorrectionDecision,
} from "@/types/attendance-correction";

import { CorrectionDecisionDialog } from "./CorrectionDecisionDialog";
import { CorrectionRequestDrawer } from "./CorrectionRequestDrawer";
import { CorrectionRequestFilters } from "./CorrectionRequestFilters";
import { CorrectionRequestSummary } from "./CorrectionRequestSummary";
import { CorrectionRequestsTable } from "./CorrectionRequestsTable";

const allValue = "all";

const statusOptions = [
  { value: allValue, label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const issueTypeOptions = [
  { value: allValue, label: "All issue types" },
  { value: "Missing Time-In", label: "Missing Time-In" },
  { value: "Missing Time-Out", label: "Missing Time-Out" },
  { value: "Incorrect Time-In", label: "Incorrect Time-In" },
  { value: "Incorrect Time-Out", label: "Incorrect Time-Out" },
  { value: "Time In and Time Out Correction", label: "Time In and Time Out" },
];

type CorrectionRequestsManagerProps = {
  data: AttendanceCorrectionData;
  loadError: boolean;
};

type DecisionResponse = {
  success: true;
  data: {
    requestId: string;
    decision: AttendanceCorrectionDecision;
  };
};

export function CorrectionRequestsManager({
  data,
  loadError,
}: CorrectionRequestsManagerProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(allValue);
  const [issueType, setIssueType] = useState(allValue);
  const [department, setDepartment] = useState(allValue);
  const [submittedDate, setSubmittedDate] = useState("");
  const [attendanceDate, setAttendanceDate] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [decision, setDecision] = useState<AttendanceCorrectionDecision | null>(null);
  const [decisionNote, setDecisionNote] = useState("");
  const [feedback, setFeedback] = useState("");
  const [mutationError, setMutationError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const departments = useMemo(
    () => [
      { value: allValue, label: "All departments" },
      ...data.departments.map((value) => ({ value, label: value })),
    ],
    [data.departments],
  );

  const filteredRequests = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return data.records.filter((request) => {
      const matchesSearch = !normalizedSearch
        || request.id.toLowerCase().includes(normalizedSearch)
        || request.employee?.displayName.toLowerCase().includes(normalizedSearch)
        || request.employeeId.toLowerCase().includes(normalizedSearch);
      const matchesStatus = status === allValue || request.status === status;
      const matchesIssueType = issueType === allValue || request.issueType === issueType;
      const matchesDepartment = department === allValue
        || request.employee?.department === department;
      const matchesSubmittedDate = !submittedDate || request.submittedDate === submittedDate;
      const matchesAttendanceDate = !attendanceDate
        || request.attendanceDate === attendanceDate;

      return matchesSearch
        && matchesStatus
        && matchesIssueType
        && matchesDepartment
        && matchesSubmittedDate
        && matchesAttendanceDate;
    });
  }, [attendanceDate, data.records, department, issueType, search, status, submittedDate]);

  const selectedRequest = data.records.find(
    (request) => request.id === selectedRequestId,
  ) ?? null;

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
      if (event.key !== "Escape" || isSubmitting) return;

      setDecision(null);
      setSelectedRequestId(null);
      setDecisionNote("");
    }

    document.addEventListener("keydown", closeOnEscape);

    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [decision, isSubmitting, selectedRequestId]);

  function resetFilters() {
    setSearch("");
    setStatus(allValue);
    setIssueType(allValue);
    setDepartment(allValue);
    setSubmittedDate("");
    setAttendanceDate("");
  }

  function openDecision(nextDecision: AttendanceCorrectionDecision) {
    if (!selectedRequest || selectedRequest.status !== "pending") return;

    setMutationError("");
    setDecision(nextDecision);
    setDecisionNote("");
  }

  async function confirmDecision() {
    if (!selectedRequest || !decision || isSubmitting) return;

    setIsSubmitting(true);
    setMutationError("");
    setFeedback("");

    try {
      await apiRequest<DecisionResponse>(
        `/api/v1/hr/attendance-corrections/${encodeURIComponent(selectedRequest.id)}`,
        {
          method: "POST",
          body: JSON.stringify({
            decision,
            reviewNote: decisionNote.trim() || null,
          }),
        },
      );

      setFeedback(decision === "approve"
        ? "Correction approved successfully. Attendance was updated and the original values were preserved in correction history."
        : "Correction request rejected. The attendance record was not changed.");
      setDecision(null);
      setSelectedRequestId(null);
      setDecisionNote("");
      router.refresh();
    } catch (error) {
      setMutationError(
        error instanceof Error
          ? error.message
          : "The correction decision could not be completed.",
      );
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="hr-correction-manager">
      <CorrectionRequestSummary summary={data.summary} />

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

      <section
        className="hr-dashboard-panel hr-correction-queue"
        aria-labelledby="hr-correction-queue-heading"
      >
        <div className="hr-panel-header">
          <div>
            <p className="hr-section-kicker">Operational records</p>
            <h2 id="hr-correction-queue-heading">Correction request queue</h2>
            <p className="hr-panel-description">
              Review original attendance and the persisted employee request before deciding.
            </p>
          </div>
          <span className="hr-correction-result-count">
            {loadError
              ? "Requests unavailable"
              : `Showing ${filteredRequests.length} of ${data.records.length} requests`}
          </span>
        </div>

        {loadError ? (
          <div className="hr-correction-empty-state" role="alert">
            <p>Correction requests could not be loaded. Try refreshing the page.</p>
            <button type="button" className="button-secondary" onClick={() => router.refresh()}>
              Try again
            </button>
          </div>
        ) : (
          <CorrectionRequestsTable
            requests={filteredRequests}
            onSelectRequest={setSelectedRequestId}
          />
        )}
      </section>

      {feedback ? (
        <p className="hr-correction-feedback" role="status" aria-live="polite">
          {feedback}
        </p>
      ) : null}

      {mutationError ? (
        <p className="hr-correction-feedback is-error" role="alert">
          {mutationError}
        </p>
      ) : null}

      <CorrectionRequestDrawer
        request={selectedRequest}
        onClose={() => setSelectedRequestId(null)}
        onDecision={openDecision}
      />

      <CorrectionDecisionDialog
        request={selectedRequest}
        decision={decision}
        note={decisionNote}
        isSubmitting={isSubmitting}
        onNoteChange={setDecisionNote}
        onClose={() => {
          if (!isSubmitting) {
            setDecision(null);
            setDecisionNote("");
          }
        }}
        onConfirm={confirmDecision}
      />
    </div>
  );
}
