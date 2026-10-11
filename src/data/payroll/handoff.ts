import type { Metric, StatusTone } from "@/types/ui";

export type PayrollHandoffTransferStatus = "Processing" | "Acknowledged" | "Failed";
export type PayrollHandoffAcknowledgement = "Pending" | "Accepted" | "Rejected";

export type PayrollReadyBatch = {
  id: string;
  period: string;
  employees: number;
  departments: number;
  createdAt: string;
};

export type PayrollHandoffRecord = {
  id: string;
  period: string;
  employees: number;
  submittedAt: string;
  date: string;
  transferStatus: PayrollHandoffTransferStatus;
  acknowledgement: PayrollHandoffAcknowledgement;
  reference: string;
};

export const payrollHandoffPeriods = [
  "All periods",
  "Sep 1–15, 2026",
  "Aug 16–31, 2026",
  "Aug 1–15, 2026",
  "Jul 16–31, 2026",
] as const;

export const initialPayrollReadyBatches: readonly PayrollReadyBatch[] = [
  {
    id: "PAY-2026-0915-B",
    period: "Sep 1–15, 2026",
    employees: 31,
    departments: 5,
    createdAt: "Sep 16, 2026, 10:24 AM",
  },
  {
    id: "PAY-2026-0915-C",
    period: "Sep 1–15, 2026",
    employees: 17,
    departments: 3,
    createdAt: "Sep 16, 2026, 11:10 AM",
  },
];

export const initialPayrollHandoffHistory: readonly PayrollHandoffRecord[] = [
  {
    id: "PAY-2026-0915-A",
    period: "Sep 1–15, 2026",
    employees: 48,
    submittedAt: "Sep 16, 2026, 02:30 PM",
    date: "2026-09-16",
    transferStatus: "Processing",
    acknowledgement: "Pending",
    reference: "—",
  },
  {
    id: "PAY-2026-0901-A",
    period: "Aug 16–31, 2026",
    employees: 52,
    submittedAt: "Aug 31, 2026, 03:15 PM",
    date: "2026-08-31",
    transferStatus: "Acknowledged",
    acknowledgement: "Accepted",
    reference: "PR-2026-0831-001",
  },
  {
    id: "PAY-2026-0831-B",
    period: "Aug 1–15, 2026",
    employees: 39,
    submittedAt: "Aug 10, 2026, 10:40 AM",
    date: "2026-08-10",
    transferStatus: "Acknowledged",
    acknowledgement: "Accepted",
    reference: "PR-2026-0815-002",
  },
  {
    id: "PAY-2026-0801-A",
    period: "Aug 1–15, 2026",
    employees: 45,
    submittedAt: "Aug 4, 2026, 04:20 PM",
    date: "2026-08-04",
    transferStatus: "Failed",
    acknowledgement: "Rejected",
    reference: "PR-2026-0815-003",
  },
  {
    id: "PAY-2026-0731-A",
    period: "Jul 16–31, 2026",
    employees: 51,
    submittedAt: "Jul 31, 2026, 01:10 PM",
    date: "2026-07-31",
    transferStatus: "Acknowledged",
    acknowledgement: "Accepted",
    reference: "PR-2026-0731-004",
  },
  {
    id: "PAY-2026-0731-B",
    period: "Jul 16–31, 2026",
    employees: 44,
    submittedAt: "Jul 30, 2026, 11:25 AM",
    date: "2026-07-30",
    transferStatus: "Acknowledged",
    acknowledgement: "Accepted",
    reference: "PR-2026-0731-005",
  },
  {
    id: "PAY-2026-0815-A",
    period: "Aug 1–15, 2026",
    employees: 36,
    submittedAt: "Aug 14, 2026, 02:05 PM",
    date: "2026-08-14",
    transferStatus: "Acknowledged",
    acknowledgement: "Accepted",
    reference: "PR-2026-0815-006",
  },
  {
    id: "PAY-2026-0831-A",
    period: "Aug 16–31, 2026",
    employees: 28,
    submittedAt: "Aug 29, 2026, 10:15 AM",
    date: "2026-08-29",
    transferStatus: "Acknowledged",
    acknowledgement: "Accepted",
    reference: "PR-2026-0831-007",
  },
];

export function getPayrollHandoffTransferTone(status: PayrollHandoffTransferStatus): StatusTone {
  switch (status) {
    case "Processing":
      return "warning";
    case "Acknowledged":
      return "success";
    case "Failed":
      return "danger";
  }
}

export function getPayrollHandoffAcknowledgementTone(acknowledgement: PayrollHandoffAcknowledgement): StatusTone {
  switch (acknowledgement) {
    case "Pending":
      return "warning";
    case "Accepted":
      return "success";
    case "Rejected":
      return "danger";
  }
}

export function getPayrollHandoffResponse(record: PayrollHandoffRecord): string {
  if (record.transferStatus === "Processing") {
    return "Transfer in progress. Waiting for a response from the Existing Payroll System.";
  }

  if (record.transferStatus === "Failed") {
    return "The batch was rejected by the Existing Payroll System. Review the batch records, then retry the transfer.";
  }

  return "The batch was accepted by the Existing Payroll System.";
}

export function getPayrollHandoffSummaryMetrics(
  readyBatches: readonly PayrollReadyBatch[],
  history: readonly PayrollHandoffRecord[],
): Metric[] {
  return [
    {
      label: "Ready for handoff",
      value: String(readyBatches.length),
      note: "Batches ready to submit",
      icon: "arrow",
      tone: "info",
    },
    {
      label: "In progress",
      value: String(history.filter((record) => record.transferStatus === "Processing").length),
      note: "Transfer currently processing",
      icon: "activity",
      tone: "warning",
    },
    {
      label: "Acknowledged",
      value: String(history.filter((record) => record.transferStatus === "Acknowledged").length),
      note: "Accepted by Existing Payroll",
      icon: "check",
      tone: "success",
    },
    {
      label: "Failed transfers",
      value: String(history.filter((record) => record.transferStatus === "Failed").length),
      note: "Requires follow-up",
      icon: "warning",
      tone: "danger",
    },
    {
      label: "Awaiting acknowledgement",
      value: String(history.filter((record) => record.acknowledgement === "Pending").length),
      note: "Submitted, response pending",
      icon: "clock",
      tone: "warning",
    },
  ];
}
