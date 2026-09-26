"use client";

import { useMemo } from "react";

import { ActionButton } from "@/components/ui/ActionButton";
import {
  hrDashboardDate,
  hrRecentIssues,
  type HrPendingAction,
  type HrSummaryMetric,
} from "@/data/hr";
import { useHrWorkflow } from "@/components/layouts/hr/HrWorkflowContext";

import { HrAttendanceSummary } from "./HrAttendanceSummary";
import { HrPendingActions } from "./HrPendingActions";
import { HrRecentIssues } from "./HrRecentIssues";
import { HrTodayAttendance } from "./HrTodayAttendance";

export function HrDashboardPage() {
  const { attendanceRecords, correctionRequests } = useHrWorkflow();
  const summaryMetrics = useMemo<HrSummaryMetric[]>(() => [
    { label: "Present Today", value: String(attendanceRecords.filter((record) => record.status === "Present").length), note: "Employees recorded", icon: "check", tone: "success" },
    { label: "Late Today", value: String(attendanceRecords.filter((record) => record.status === "Late").length), note: "Needs monitoring", icon: "clock", tone: "warning" },
    { label: "Absent", value: String(attendanceRecords.filter((record) => record.status === "Absent").length), note: "Needs review", icon: "close", tone: "danger" },
    { label: "Missing Time-Out", value: String(attendanceRecords.filter((record) => record.status === "Missing Time-Out").length), note: "Open attendance gaps", icon: "warning", tone: "warning" },
    { label: "Pending Corrections", value: String(correctionRequests.filter((request) => !["Approved", "Rejected"].includes(request.status)).length), note: "Awaiting HR review", icon: "comment", tone: "info" },
    { label: "Pending Verification", value: String(attendanceRecords.filter((record) => record.hrVerificationStatus !== "Verified").length), note: "Needs final HR review", icon: "activity", tone: "warning" },
  ], [attendanceRecords, correctionRequests]);

  const pendingActions = useMemo<HrPendingAction[]>(() => [
    {
      label: "Correction Requests",
      count: String(correctionRequests.filter((request) => !["Approved", "Rejected"].includes(request.status)).length),
      note: "Awaiting HR review",
      icon: "comment",
      tone: "info",
    },
    {
      label: "Missing Time-Out",
      count: String(attendanceRecords.filter((record) => record.status === "Missing Time-Out").length),
      note: "Attendance gaps to resolve",
      icon: "warning",
      tone: "warning",
    },
    {
      label: "Needs Correction",
      count: String(attendanceRecords.filter((record) => record.hrVerificationStatus === "Needs Correction").length),
      note: "Validation or correction issue",
      icon: "activity",
      tone: "danger",
    },
    {
      label: "Pending Verification",
      count: String(attendanceRecords.filter((record) => record.hrVerificationStatus === "Pending Review").length),
      note: "Ready for final HR review",
      icon: "check",
      tone: "warning",
    },
  ], [attendanceRecords, correctionRequests]);

  return (
    <div className="hr-dashboard-page">
      <header className="hr-dashboard-header">
        <div className="hr-dashboard-heading">
          <p className="hr-dashboard-eyebrow">Attendance operations</p>
          <h1>HR / Attendance Dashboard</h1>
          <p className="hr-dashboard-description">
            Monitor employee attendance, exceptions, corrections, and attendance readiness.
          </p>
          <p className="hr-dashboard-date">{hrDashboardDate}</p>
        </div>
        <div className="hr-dashboard-actions">
          <ActionButton icon="refresh" action="Attendance summary refreshed.">
            Refresh data
          </ActionButton>
        </div>
      </header>

      <HrAttendanceSummary metrics={summaryMetrics} />

      <HrTodayAttendance records={attendanceRecords.slice(0, 5)} />

      <div className="hr-dashboard-lower-grid">
        <HrPendingActions actions={pendingActions} />
        <HrRecentIssues issues={hrRecentIssues} />
      </div>
    </div>
  );
}
