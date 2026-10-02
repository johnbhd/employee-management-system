import type { StatusTone } from "@/types/ui";

export type AccountingTransactionStatus = "successful" | "pending" | "failed";

export type AccountingTransaction = {
  id: string;
  transactionReference: string;
  payrollReference: string;
  payrollPeriod: string;
  year: string;
  transactionAt: string;
  dateTime: string;
  employeeCount: number;
  approvedAmount: number;
  status: AccountingTransactionStatus;
  statusLabel: string;
  statusTone: StatusTone;
  acknowledgement: string;
  acknowledgementTone: StatusTone;
  detail: string;
  lastUpdatedAt: string;
  acknowledgementDetail: string;
  errorSummary?: string;
  lastAttempt?: string;
  retryStatus?: string;
};

export const accountingTransactions: readonly AccountingTransaction[] = [
  {
    id: "accounting-transaction-1048",
    transactionReference: "ACC-TXN-1048",
    payrollReference: "PAY-2026-016",
    payrollPeriod: "Aug 16–31, 2026",
    year: "2026",
    transactionAt: "2026-10-02T10:18:00+08:00",
    dateTime: "Oct 2, 2026 · 10:18 AM",
    employeeCount: 86,
    approvedAmount: 482650,
    status: "pending",
    statusLabel: "Pending",
    statusTone: "warning",
    acknowledgement: "Waiting",
    acknowledgementTone: "warning",
    detail: "Approved payroll is ready for the next accounting integration handoff.",
    lastUpdatedAt: "Oct 2, 2026 · 10:18 AM",
    acknowledgementDetail: "The Existing Accounting System has not acknowledged this transfer.",
  },
  {
    id: "accounting-transaction-1041",
    transactionReference: "ACC-TXN-1041",
    payrollReference: "PAY-2026-015",
    payrollPeriod: "Aug 1–15, 2026",
    year: "2026",
    transactionAt: "2026-09-30T16:20:00+08:00",
    dateTime: "Sep 30, 2026 · 4:20 PM",
    employeeCount: 85,
    approvedAmount: 476820,
    status: "successful",
    statusLabel: "Successful",
    statusTone: "success",
    acknowledgement: "Acknowledged",
    acknowledgementTone: "success",
    detail: "The transfer was accepted by the simulated accounting integration service.",
    lastUpdatedAt: "Sep 30, 2026 · 4:20 PM",
    acknowledgementDetail: "Acknowledgement received from the Existing Accounting System.",
  },
  {
    id: "accounting-transaction-1038",
    transactionReference: "ACC-TXN-1038",
    payrollReference: "PAY-2026-014",
    payrollPeriod: "Jul 16–31, 2026",
    year: "2026",
    transactionAt: "2026-09-16T15:06:00+08:00",
    dateTime: "Sep 16, 2026 · 3:06 PM",
    employeeCount: 84,
    approvedAmount: 469500,
    status: "successful",
    statusLabel: "Successful",
    statusTone: "success",
    acknowledgement: "Acknowledged",
    acknowledgementTone: "success",
    detail: "The approved payroll batch completed the accounting transfer.",
    lastUpdatedAt: "Sep 16, 2026 · 3:06 PM",
    acknowledgementDetail: "Acknowledgement received from the Existing Accounting System.",
  },
  {
    id: "accounting-transaction-1035",
    transactionReference: "ACC-TXN-1035",
    payrollReference: "PAY-2026-013",
    payrollPeriod: "Jul 1–15, 2026",
    year: "2026",
    transactionAt: "2026-09-02T11:42:00+08:00",
    dateTime: "Sep 2, 2026 · 11:42 AM",
    employeeCount: 84,
    approvedAmount: 465900,
    status: "failed",
    statusLabel: "Failed",
    statusTone: "danger",
    acknowledgement: "Not acknowledged",
    acknowledgementTone: "danger",
    detail: "The transfer requires review because validation did not complete.",
    lastUpdatedAt: "Sep 2, 2026 · 11:42 AM",
    acknowledgementDetail: "No acknowledgement was received from the Existing Accounting System.",
    errorSummary: "The transfer validation did not complete before the request expired.",
    lastAttempt: "Sep 2, 2026 · 11:42 AM",
    retryStatus: "Retry remains available to a future integration workflow.",
  },
  {
    id: "accounting-transaction-1032",
    transactionReference: "ACC-TXN-1032",
    payrollReference: "PAY-2026-012",
    payrollPeriod: "Jun 16–30, 2026",
    year: "2026",
    transactionAt: "2026-08-30T14:15:00+08:00",
    dateTime: "Aug 30, 2026 · 2:15 PM",
    employeeCount: 82,
    approvedAmount: 451200,
    status: "pending",
    statusLabel: "Pending",
    statusTone: "warning",
    acknowledgement: "Waiting",
    acknowledgementTone: "warning",
    detail: "This transaction remains queued until payroll approval is complete.",
    lastUpdatedAt: "Aug 30, 2026 · 2:15 PM",
    acknowledgementDetail: "The transfer is not eligible for external acknowledgement yet.",
  },
];

export const accountingTransactionYears = Array.from(
  new Set(accountingTransactions.map((transaction) => transaction.year)),
).sort((firstYear, secondYear) => secondYear.localeCompare(firstYear));
