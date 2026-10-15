import type { HrAttendanceReviewData } from "@/types/hr-attendance-review";
import type { HrAttendanceReviewQuery } from "@/server/hr/attendance-review-query";

import { HrAttendanceReviewExplorer } from "./HrAttendanceReviewExplorer";

type HrAttendanceReviewPageProps = {
    data: HrAttendanceReviewData;
    query: HrAttendanceReviewQuery;
    loadError?: boolean;
};

export function HrAttendanceReviewPage({
    data,
    query,
    loadError = false,
}: HrAttendanceReviewPageProps) {
    return (
        <div className="hr-dashboard-page hr-attendance-review-page">
            <header className="hr-dashboard-header">
                <div className="hr-dashboard-heading">
                    <p className="hr-dashboard-eyebrow">Attendance operations</p>
                    <h1>Attendance Review</h1>
                    <p className="hr-dashboard-description">
                        Review canonical attendance, source evidence, corrections, and final verification before Payroll.
                    </p>
                </div>
            </header>

            <HrAttendanceReviewExplorer
                key={[
                    query.search,
                    query.employeeId,
                    query.department,
                    query.fromDate,
                    query.toDate,
                    query.technicalState,
                    query.businessStatus,
                    query.reviewState,
                    query.correctionStatus,
                    query.verificationStatus,
                    query.page,
                    query.pageSize,
                ].join("|")}
                data={data}
                query={query}
                loadError={loadError}
            />
        </div>
    );
}
