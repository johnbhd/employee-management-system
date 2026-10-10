import type { AttendanceCorrectionData } from "@/types/attendance-correction";

import { CorrectionRequestsManager } from "./CorrectionRequestsManager";
import { CorrectionRequestsRefreshButton } from "./CorrectionRequestsRefreshButton";

type CorrectionRequestsPageProps = {
  data: AttendanceCorrectionData;
  loadError?: boolean;
};

export function CorrectionRequestsPage({
  data,
  loadError = false,
}: CorrectionRequestsPageProps) {
  return (
    <div className="hr-dashboard-page hr-correction-requests-page">
      <header className="hr-dashboard-header">
        <div className="hr-dashboard-heading">
          <p className="hr-dashboard-eyebrow">Attendance operations</p>
          <h1>Correction Requests</h1>
          <p className="hr-dashboard-description">
            Review employee requests to correct incomplete or inaccurate attendance records.
          </p>
        </div>
        <div className="hr-dashboard-actions">
          <CorrectionRequestsRefreshButton />
        </div>
      </header>

      <CorrectionRequestsManager data={data} loadError={loadError} />
    </div>
  );
}
