import { PermissionDeniedPage } from "@/components/auth/PermissionDeniedPage";
import { CorrectionRequestsPage } from "@/components/hr/correction-requests/CorrectionRequestsPage";
import { hasPermission } from "@/server/auth/permission.service";
import { requireRoleContext } from "@/server/auth/guards";
import { getAttendanceCorrectionsData } from "@/server/hr/attendance-corrections.service";
import type { AttendanceCorrectionData } from "@/types/attendance-correction";

const emptyData: AttendanceCorrectionData = {
    records: [],
    summary: {
        pending: 0,
        approved: 0,
        rejected: 0,
    },
    departments: [],
};

export default async function Page() {
    const context = await requireRoleContext("hr");
    if (!(await hasPermission(context.user, "hr.correction.view"))) {
        return <PermissionDeniedPage title="Correction Requests unavailable" backHref="/hr/dashboard" backLabel="Back to HR Dashboard" />;
    }

    let data = emptyData;
    let loadError = false;

    try {
        data = await getAttendanceCorrectionsData();
    } catch {
        loadError = true;
    }

    return (
        <CorrectionRequestsPage
            data={data}
            loadError={loadError}
        />
    );
}
