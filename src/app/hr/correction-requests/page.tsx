import { CorrectionRequestsPage } from "@/components/hr/correction-requests/CorrectionRequestsPage";
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
