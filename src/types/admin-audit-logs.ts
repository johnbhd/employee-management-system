export type AdminAuditActorType = "user" | "system" | "integration";
export type AdminAuditOutcome = "Successful" | "Failed" | "Blocked";

export type AdminAuditChange = {
  field: string;
  previousValue: string;
  newValue: string;
};

export type AdminAuditLog = {
  id: string;
  eventType: string;
  occurredAt: string;
  occurredAtDate: string;
  occurredAtTimestamp: number;
  action: string;
  module: string;
  actor: {
    type: AdminAuditActorType;
    name: string;
    role: string | null;
    userId: string | null;
  };
  target: {
    type: string;
    id: string | null;
    reference: string;
    label: string;
  };
  outcome: AdminAuditOutcome;
  changes: readonly AdminAuditChange[];
  details: string;
  metadata: Readonly<Record<string, string | number | boolean | null | string[]>>;
};

export type AdminAuditLogsData = {
  events: AdminAuditLog[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  summary: {
    recorded: number;
    successful: number;
    blocked: number;
    failed: number;
  };
  coverage: Array<{ module: string; count: number }>;
  options: {
    roles: string[];
    modules: string[];
    actions: string[];
    outcomes: AdminAuditOutcome[];
  };
};

export type AdminAuditLogsQuery = {
  search: string;
  from: string | null;
  to: string | null;
  role: string | null;
  module: string | null;
  action: string | null;
  outcome: AdminAuditOutcome | null;
  page: number;
  pageSize: number;
};
