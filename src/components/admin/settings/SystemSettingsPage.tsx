import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { AdminSettingsData } from "@/types/admin-settings";

import { SystemSettingsManager } from "./SystemSettingsManager";

export function SystemSettingsPage({
  initialData,
  loadError,
  canManage,
}: {
  initialData: AdminSettingsData | null;
  loadError: boolean;
  canManage: boolean;
}) {
  return (
    <div className="admin-page admin-settings-page">
      <AdminPageHeader
        eyebrow="Application administration"
        title="System & Settings"
        description="Configure application preferences and review system information for the AU-JSC integration platform."
        actions={(
          <StatusBadge tone="success">
            <Icon name="check" />
            {loadError ? "Settings unavailable" : canManage ? "Configuration access" : "Read-only access"}
          </StatusBadge>
        )}
      />

      <SystemSettingsManager initialData={initialData} loadError={loadError} canManage={canManage} />
    </div>
  );
}
