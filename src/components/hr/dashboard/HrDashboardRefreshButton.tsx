"use client";

import { useRouter } from "next/navigation";

import { ActionButton } from "@/components/ui/ActionButton";

export function HrDashboardRefreshButton() {
  const router = useRouter();

  return (
    <ActionButton
      icon="refresh"
      action="Attendance summary refreshed."
      onAction={() => router.refresh()}
    >
      Refresh data
    </ActionButton>
  );
}
