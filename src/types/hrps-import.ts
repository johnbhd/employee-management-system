export const hrpsImportClassifications = [
  "NEW",
  "UPDATED",
  "UNCHANGED",
  "INVALID",
  "DUPLICATE",
  "NEEDS_REVIEW",
] as const;

export type HrpsImportClassification = (typeof hrpsImportClassifications)[number];

export type HrpsScheduleInput = {
  scheduleId: string;
  workStart: string;
  workEnd: string;
  breakStart: string | null;
  breakEnd: string | null;
  shiftLabel: string | null;
  workDays: string[];
  restDays: string[];
  workLocation: string | null;
  effectiveFrom: string | null;
  effectiveTo: string | null;
};

export type HrpsEmployeeInput = {
  employeeId: string;
  displayName: string;
  department: string;
  position: string | null;
  employmentStatus: "active" | "inactive";
  schedule: HrpsScheduleInput | null;
};

export type HrpsImportChange = {
  field: string;
  from: string | null;
  to: string | null;
};

export type HrpsImportPreviewRow = {
  rowNumber: number;
  employeeId: string | null;
  input: HrpsEmployeeInput | null;
  classification: HrpsImportClassification;
  errors: string[];
  warnings: string[];
  changes: HrpsImportChange[];
  accountStatus: "existing" | "will_create" | "needs_review" | "not_applicable";
};

export type HrpsImportSummary = {
  totalRows: number;
  newCount: number;
  updatedCount: number;
  unchangedCount: number;
  invalidCount: number;
  duplicateCount: number;
  needsReviewCount: number;
  createdEmployees: number;
  updatedEmployees: number;
  schedulesCreated: number;
  schedulesUpdated: number;
  accountsProvisioned: number;
  accountsPending: number;
  accountsFailed: number;
};

export type HrpsImportPreview = {
  previewToken: string;
  filename: string;
  supportedHeaders: string[];
  ignoredHeaders: string[];
  rows: HrpsImportPreviewRow[];
  summary: HrpsImportSummary;
};

export type HrpsImportHistoryItem = {
  id: string;
  filename: string;
  status: "PROCESSING" | "COMPLETED" | "COMPLETED_WITH_ERRORS" | "FAILED" | "ROLLING_BACK" | "ROLLED_BACK" | "ROLLBACK_FAILED";
  startedAt: string;
  completedAt: string | null;
  rollbackStartedAt: string | null;
  rolledBackAt: string | null;
  initiatedBy: { displayName: string; username: string } | null;
  rolledBackBy: { displayName: string; username: string; role: string } | null;
  summary: HrpsImportSummary;
  errorSummary: string | null;
  rollbackErrorSummary: string | null;
  rollbackSummary: HrpsRollbackSummary | null;
};

export type HrpsImportHistoryData = {
  items: HrpsImportHistoryItem[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
};

export type HrpsImportResult = {
  importId: string;
  status: HrpsImportHistoryItem["status"];
  preview: HrpsImportPreview;
  summary: HrpsImportSummary;
  accountPolicy: string;
};

export type HrpsRollbackSummary = {
  employeesDeleted: number;
  employeesRestored: number;
  schedulesDeleted: number;
  schedulesRestored: number;
  applicationUsersDeleted: number;
  firebaseAccountsDeleted: number;
};

export type HrpsRollbackBlockedRecord = {
  employeeId: string | null;
  rowNumber: number | null;
  reason: string;
};

export type HrpsRollbackPreview = {
  importId: string;
  filename: string;
  status: HrpsImportHistoryItem["status"];
  employeesToDelete: number;
  employeesToRestore: number;
  schedulesToDelete: number;
  schedulesToRestore: number;
  applicationUsersToDelete: number;
  firebaseUsersToDelete: number;
  blockedRecords: HrpsRollbackBlockedRecord[];
  warnings: string[];
  rollbackAllowed: boolean;
  alreadyRolledBack: boolean;
};

export type HrpsRollbackResult = {
  importId: string;
  status: HrpsImportHistoryItem["status"];
  summary: HrpsRollbackSummary;
  firebaseCleanup: "not_required" | "completed" | "failed";
};
