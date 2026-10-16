import type { IconName, StatusTone } from "@/types/ui";

export type AccountingIntegrationFlowStep = {
  label: string;
  detail: string;
  icon: IconName;
  tone: StatusTone;
  highlighted?: boolean;
};

export const accountingIntegrationFlow: AccountingIntegrationFlowStep[] = [
  {
    label: "Existing Payroll System",
    detail: "Source of approved Payroll Result information",
    icon: "payroll",
    tone: "info",
  },
  {
    label: "Approved Payroll Information",
    detail: "Persisted result and readiness snapshot",
    icon: "file",
    tone: "info",
  },
  {
    label: "Accounting Integration Service",
    detail: "Validates and prepares a local transfer snapshot",
    icon: "settings",
    tone: "success",
  },
  {
    label: "Validation",
    detail: "Server-side readiness and traceability checks",
    icon: "check",
    tone: "info",
    highlighted: true,
  },
  {
    label: "Prepared transfer",
    detail: "Persists the read-only Accounting handoff snapshot",
    icon: "refresh",
    tone: "info",
  },
  {
    label: "Existing Accounting System",
    detail: "No live API is configured in this environment",
    icon: "building",
    tone: "muted",
  },
];

export type AccountingConnectionStatus = {
  system: string;
  status: string;
  tone: StatusTone;
  lastSync: string;
  details: string;
};

export type AccountingAttentionTransfer = {
  transferId: string;
  payrollResultId: string;
  transactionReference: string;
  payrollReference: string;
  period: string;
  date: string;
  time: string;
  amount: string;
  error: string;
  status: string;
  tone: StatusTone;
};

export type AccountingSynchronizationRecord = {
  transferId: string;
  dateTime: string;
  transactionReference: string;
  payrollReference: string;
  records: string;
  amount: string;
  result: string;
  resultTone: StatusTone;
  acknowledgment: string;
};
