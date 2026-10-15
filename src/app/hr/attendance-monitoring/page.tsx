import { PermissionDeniedPage } from "@/components/auth/PermissionDeniedPage";
import { HrAttendanceReviewPage } from "@/components/hr/attendance-review/HrAttendanceReviewPage";
import { hasPermission } from "@/server/auth/permission.service";
import { requireRoleContext } from "@/server/auth/guards";
import { parseHrAttendanceReviewQuery } from "@/server/hr/attendance-review-query";
import { getHrAttendanceReviewData } from "@/server/hr/attendance-review.service";
import type { HrAttendanceReviewData } from "@/types/hr-attendance-review";

type PageProps = {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function toSearchParams(
    values: Record<string, string | string[] | undefined>,
) {
    const params = new URLSearchParams();

    Object.entries(values).forEach(([key, value]) => {
        if (typeof value === "string") {
            params.set(key, value);
        } else if (Array.isArray(value) && value[0]) {
            params.set(key, value[0]);
        }
    });

    return params;
}

const emptyData: HrAttendanceReviewData = {
    records: [],
    total: 0,
    page: 1,
    pageSize: 25,
    hasNext: false,
    summary: {
        needsReview: 0,
        missingIn: 0,
        missingOut: 0,
        pendingCorrections: 0,
        readyForVerification: 0,
        finalVerified: 0,
    },
    employees: [],
    departments: [],
    permissions: {
        canReviewCorrections: false,
        canVerifyAttendance: false,
    },
};

export default async function Page({ searchParams }: PageProps) {
    const context = await requireRoleContext("hr");
    if (!(await hasPermission(context.user, "hr.attendance.view"))) {
        return (
            <PermissionDeniedPage
                title="Attendance review unavailable"
                backHref="/hr/dashboard"
                backLabel="Back to HR Dashboard"
            />
        );
    }

    const resolvedSearchParams = searchParams ? await searchParams : {};
    const query = parseHrAttendanceReviewQuery(toSearchParams(resolvedSearchParams));
    let data = emptyData;
    let loadError = false;

    try {
        data = await getHrAttendanceReviewData(query, {
            canReviewCorrections: await hasPermission(context.user, "hr.correction.review"),
            canVerifyAttendance: await hasPermission(context.user, "hr.attendance.verify"),
        });
    } catch {
        loadError = true;
    }

    return (
        <HrAttendanceReviewPage
            data={data}
            query={query}
            loadError={loadError}
        />
    );
}
