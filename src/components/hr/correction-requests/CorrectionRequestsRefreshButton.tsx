"use client";

import { useRouter } from "next/navigation";

import { Icon } from "@/components/ui/Icon";

export function CorrectionRequestsRefreshButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      className="button-secondary"
      onClick={() => router.refresh()}
    >
      <Icon name="refresh" />
      Refresh requests
    </button>
  );
}
