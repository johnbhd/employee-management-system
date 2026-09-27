import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";

import { SystemSettingsManager } from "./SystemSettingsManager";

export function SystemSettingsPage() {
  return (
    <div className="admin-page admin-settings-page">
      <AdminPageHeader
        eyebrow="Application administration"
        title="System & Settings"
        description="Configure application preferences and review system information for the AU-JSC integration platform."
        actions={(
          <StatusBadge tone="success">
            <Icon name="check" />
            Application operational
          </StatusBadge>
        )}
      />

      <SystemSettingsManager />
    </div>
  );
}
