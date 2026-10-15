import type { IconName, StatusTone } from "@/types/ui";

export type HrSummaryMetric = {
  label: string;
  value: string;
  note: string;
  icon: IconName;
  tone: StatusTone;
};

export type HrPendingAction = {
  label: string;
  count: string;
  note: string;
  icon: IconName;
  tone: StatusTone;
};
