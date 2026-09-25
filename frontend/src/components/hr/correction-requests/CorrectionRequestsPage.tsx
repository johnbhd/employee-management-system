import { ActionButton } from "@/components/ui/ActionButton";
import { hrCorrectionRequests } from "@/data/hr-correction-requests";

import { CorrectionRequestsManager } from "./CorrectionRequestsManager";

export function CorrectionRequestsPage() {
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
          <ActionButton icon="refresh" action="Correction requests refreshed.">
            Refresh requests
          </ActionButton>
        </div>
      </header>

      <CorrectionRequestsManager requests={hrCorrectionRequests} />
    </div>
  );
}
