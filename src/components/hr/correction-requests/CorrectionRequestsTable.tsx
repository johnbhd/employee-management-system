import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { AttendanceCorrectionRecord } from "@/types/attendance-correction";

type CorrectionRequestsTableProps = {
  requests: readonly AttendanceCorrectionRecord[];
  onSelectRequest: (requestId: string) => void;
};

function requestedChange(request: AttendanceCorrectionRecord) {
  const changes: string[] = [];

  if (request.requestedChanges.timeIn) {
    changes.push(
      `Time In: ${request.currentAttendance?.timeIn ?? "—"} → ${request.requestedChanges.timeIn}`,
    );
  }

  if (request.requestedChanges.timeOut) {
    changes.push(
      `Time Out: ${request.currentAttendance?.timeOut ?? "—"} → ${request.requestedChanges.timeOut}`,
    );
  }

  return changes.length > 0 ? changes.join(" · ") : "Review requested correction";
}

export function CorrectionRequestsTable({
  requests,
  onSelectRequest,
}: CorrectionRequestsTableProps) {
  return (
    <div className="hr-correction-table-scroll">
      <table className="hr-correction-table">
        <caption className="sr-only">Employee attendance correction requests</caption>
        <thead>
          <tr>
            <th scope="col">Request</th>
            <th scope="col">Employee</th>
            <th scope="col">Attendance date</th>
            <th scope="col">Issue</th>
            <th scope="col">Requested change</th>
            <th scope="col">Submitted</th>
            <th scope="col">Status</th>
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.id}>
              <td>
                <strong className="hr-correction-request-id">{request.id}</strong>
                <span className="hr-correction-request-meta">Attendance correction</span>
              </td>
              <td>
                <strong className="hr-correction-employee-name">
                  {request.employee?.displayName ?? "Employee reference unavailable"}
                </strong>
                <span className="hr-correction-employee-meta">
                  {request.employeeId} · {request.employee?.department ?? "Unavailable"}
                </span>
              </td>
              <td>{request.attendanceDateLabel}</td>
              <td>{request.issueType}</td>
              <td className="hr-correction-change-cell">{requestedChange(request)}</td>
              <td>{request.submittedAt}</td>
              <td>
                <StatusBadge tone={request.statusTone}>{request.statusLabel}</StatusBadge>
              </td>
              <td>
                <button
                  type="button"
                  className="button-secondary hr-correction-review-button"
                  onClick={() => onSelectRequest(request.id)}
                >
                  <Icon name="file" />
                  Review
                </button>
              </td>
            </tr>
          ))}
          {requests.length === 0 ? (
            <tr>
              <td colSpan={8} className="hr-correction-empty-row">
                No correction requests match the selected filters.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
