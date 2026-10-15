export type {
  AdminAuditActorType,
  AdminAuditChange,
  AdminAuditLog,
} from "@/types/admin-audit-logs";

export const adminAuditOutcomeOptions = ["Successful", "Blocked", "Failed"] as const;
export type AdminAuditOutcome = (typeof adminAuditOutcomeOptions)[number];
