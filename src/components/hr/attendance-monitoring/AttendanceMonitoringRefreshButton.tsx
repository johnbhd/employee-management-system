"use client";

import { useRouter } from "next/navigation";

import { ActionButton } from "@/components/ui/ActionButton";

export function AttendanceMonitoringRefreshButton() {
    const router = useRouter();

    return (
        <ActionButton
            icon="refresh"
            action="Attendance monitoring refreshed."
            onAction={() => router.refresh()}
        >
            Refresh records
        </ActionButton>
    );
}
