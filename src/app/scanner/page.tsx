import { ScannerPage } from "@/components/scanner/ScannerPage";
import { PermissionDeniedPage } from "@/components/auth/PermissionDeniedPage";
import { hasPermission } from "@/server/auth/permission.service";
import { requireAnyRoleContext } from "@/server/auth/guards";

export default async function Page() {
  const context = await requireAnyRoleContext("admin", "hr");
  if (context.user.role === "hr" && !(await hasPermission(context.user, "hr.attendance.scan"))) {
    return <PermissionDeniedPage title="Scanner unavailable" backHref="/hr/dashboard" backLabel="Back to HR Dashboard" />;
  }

  return (
    <main className="scanner-route">
      <ScannerPage />
    </main>
  );
}
