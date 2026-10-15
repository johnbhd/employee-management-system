import { PermissionDeniedPage } from "@/components/auth/PermissionDeniedPage";
import { UnifiedAttendancePage } from "@/components/admin/unified-attendance/UnifiedAttendancePage";
import { getAdminIntegrationMonitoringData } from "@/server/admin/integration-monitoring.service";
import { listUnifiedAttendanceProcessingRuns } from "@/server/attendance/unified-attendance-processing.service";
import {
  countUnifiedAttendance,
  listUnifiedAttendance,
} from "@/server/repositories/attendance/unified-attendance.repository";
import { hasPermission } from "@/server/auth/permission.service";
import { requireRoleContext } from "@/server/auth/guards";
import type { AdminIntegrationMonitoringData } from "@/types/admin-integration-monitoring";

export const dynamic = "force-dynamic";

export default async function Page() {
  const context = await requireRoleContext("admin");
  if (!(await hasPermission(context.user, "admin.integration_monitoring.view"))) {
    return <PermissionDeniedPage title="Unified Attendance unavailable" backHref="/admin/dashboard" backLabel="Back to Admin Dashboard" />;
  }

  let monitoring: AdminIntegrationMonitoringData | null = null;
  let records: Awaited<ReturnType<typeof listUnifiedAttendance>> | null = null;
  let runs: Awaited<ReturnType<typeof listUnifiedAttendanceProcessingRuns>> | null = null;
  let reviewCount: number | null = null;

  const results = await Promise.allSettled([
    getAdminIntegrationMonitoringData(),
    listUnifiedAttendance({ page: 1, pageSize: 25 }),
    listUnifiedAttendanceProcessingRuns({ page: 1, pageSize: 10 }),
    countUnifiedAttendance({ requiresReview: true }),
  ]);
  const [monitoringResult, recordsResult, runsResult, reviewResult] = results;
  if (monitoringResult.status === "fulfilled") monitoring = monitoringResult.value;
  if (recordsResult.status === "fulfilled") records = recordsResult.value;
  if (runsResult.status === "fulfilled") runs = runsResult.value;
  if (reviewResult.status === "fulfilled") reviewCount = reviewResult.value;

  return (
    <UnifiedAttendancePage
      initialMonitoring={monitoring}
      initialRecords={records ? {
        items: records.rows,
        page: records.page,
        pageSize: records.pageSize,
        total: records.total,
        hasNext: records.hasNext,
        reviewCount: reviewCount ?? 0,
      } : null}
      initialRuns={runs}
      initialReviewCount={reviewCount}
      initialLoadError={results.some((result) => result.status === "rejected")}
      canProcess={await hasPermission(context.user, "admin.integration_monitoring.retry")}
    />
  );
}
