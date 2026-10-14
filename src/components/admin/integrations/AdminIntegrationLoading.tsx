import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";

export function AdminIntegrationLoading({ title }: { title: string }) {
  return (
    <div className="admin-page admin-integration-detail-page" aria-busy="true">
      <AdminPageHeader
        eyebrow="Integration control"
        title={title}
        description="Loading current integration status…"
      />
      <div className="metric-grid admin-integration-detail-metrics">
        {Array.from({ length: 5 }, (_, index) => (
          <div className="metric-card admin-integration-detail-skeleton" key={index} />
        ))}
      </div>
      <div className="two-column admin-integration-detail-top-grid">
        <div className="dashboard-card admin-integration-detail-skeleton-panel" />
        <div className="dashboard-card admin-integration-detail-skeleton-panel" />
      </div>
      <div className="dashboard-card admin-integration-detail-skeleton-panel" />
    </div>
  );
}
