import type { EmployeeEmploymentStatus } from "@prisma/client";

export const bundyRequiredHeaders = [
  "bundy_log_id",
  "device_employee_id",
  "timestamp",
  "event",
  "device_id",
] as const;

export const bundyOptionalHeaders = [
  "import_batch",
  "processing_status",
  "matched_hrps_employee_id",
] as const;

export type BundyEventType = "IN" | "OUT";
export type BundyMatchStatus = "MATCHED" | "UNMATCHED" | "EMPLOYEE_INACTIVE";
export type BundyValidationStatus = "VALID" | "INVALID";
export type BundyDuplicateStatus = "UNIQUE" | "DUPLICATE_SCAN";
export type BundyImportAction = "IMPORT" | "ALREADY_IMPORTED" | "SOURCE_CONFLICT" | "INVALID";
export type BundyImportStatus = "PROCESSING" | "COMPLETED" | "COMPLETED_WITH_ERRORS" | "FAILED";

export type BundyEmployeeMatch = {
  employeeId: string;
  displayName: string;
  department: string;
  employmentStatus: EmployeeEmploymentStatus;
};

export type BundyPreviewRow = {
  rowNumber: number;
  bundyLogId: string | null;
  deviceEmployeeId: string | null;
  sourceTimestamp: string | null;
  occurredAt: string | null;
  event: BundyEventType | null;
  deviceId: string | null;
  sourceBatch: string | null;
  sourceProcessingStatus: string | null;
  sourceMatchedHrpsEmployeeId: string | null;
  employee: BundyEmployeeMatch | null;
  matchStatus: BundyMatchStatus | null;
  validationStatus: BundyValidationStatus;
  duplicateStatus: BundyDuplicateStatus;
  importAction: BundyImportAction;
  anomalyCodes: string[];
  errors: string[];
  warnings: string[];
};

export type BundyImportSummary = {
  totalRows: number;
  inCount: number;
  outCount: number;
  matchedCount: number;
  unmatchedCount: number;
  inactiveCount: number;
  duplicateScanCount: number;
  alreadyImportedCount: number;
  invalidCount: number;
  sourceConflictCount: number;
  importedCount: number;
};

export type BundyImportPreview = {
  previewToken: string;
  filename: string;
  supportedHeaders: string[];
  ignoredHeaders: string[];
  devices: string[];
  sourceBatches: string[];
  employeesAvailable: number;
  rows: BundyPreviewRow[];
  summary: BundyImportSummary;
};

export type BundyImportHistoryItem = {
  id: string;
  filename: string;
  startedAt: string;
  completedAt: string | null;
  status: BundyImportStatus;
  initiatedBy: { displayName: string; username: string } | null;
  summary: BundyImportSummary;
  devices: string[];
  sourceBatches: string[];
  errorSummary: string | null;
};

export type BundyImportHistoryData = {
  items: BundyImportHistoryItem[];
  page: number;
  pageSize: number;
  total: number;
  hasNext: boolean;
};

export type BundyRawEventItem = {
  id: string;
  sourceLogId: string;
  deviceEmployeeId: string;
  employee: BundyEmployeeMatch | null;
  sourceTimestamp: string;
  occurredAt: string;
  event: BundyEventType;
  deviceId: string;
  sourceBatch: string | null;
  matchStatus: BundyMatchStatus;
  validationStatus: BundyValidationStatus;
  duplicateStatus: BundyDuplicateStatus;
  anomalyCodes: string[];
  importId: string;
};

export type BundyRawEventData = {
  items: BundyRawEventItem[];
  page: number;
  pageSize: number;
  total: number;
  hasNext: boolean;
};

export type BundyImportResult = {
  importId: string;
  status: BundyImportStatus;
  preview: BundyImportPreview;
  summary: BundyImportSummary;
  accountBoundary: string;
};

export type BundyPageData = {
  history: BundyImportHistoryData;
  events: BundyRawEventData;
};
