export type UnifiedAttendanceProcessingRunStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "COMPLETED_WITH_ERRORS"
  | "FAILED";

export type UnifiedAttendanceProcessingItemStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

export type UnifiedAttendanceProcessingRunType = "INITIAL" | "REPROCESS";

export type UnifiedAttendanceProcessingRunView = {
  id: string;
  runType: UnifiedAttendanceProcessingRunType;
  dateFrom: string;
  dateTo: string;
  status: UnifiedAttendanceProcessingRunStatus;
  initiatedBy: { uid: string | null; displayName: string; role: string | null };
  startedAt: string;
  completedAt: string | null;
  totalItems: number;
  pendingItems: number;
  processingItems: number;
  completedItems: number;
  failedItems: number;
  createdCount: number;
  updatedCount: number;
  unchangedCount: number;
  needsReviewCount: number;
  errorSummary: string | null;
};

export type UnifiedAttendanceProcessingItemView = {
  id: string;
  runId: string;
  employeeId: string;
  employeeName: string;
  attendanceDate: string;
  attendanceRecordId: string | null;
  status: UnifiedAttendanceProcessingItemStatus;
  operation: "CREATED" | "UPDATED" | "UNCHANGED" | null;
  technicalState: string | null;
  businessStatus: string | null;
  requiresReview: boolean;
  attemptCount: number;
  errorCode: string | null;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
};

export type UnifiedAttendanceProcessingRunResult = {
  run: UnifiedAttendanceProcessingRunView;
};
