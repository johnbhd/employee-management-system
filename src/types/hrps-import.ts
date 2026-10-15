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
  accountStatus: "existing" | "pending_onboarding" | "needs_review" | "not_applicable";
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
  status: "PROCESSING" | "COMPLETED" | "COMPLETED_WITH_ERRORS" | "FAILED";
  startedAt: string;
  completedAt: string | null;
  initiatedBy: { displayName: string; username: string } | null;
  summary: HrpsImportSummary;
  errorSummary: string | null;
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
