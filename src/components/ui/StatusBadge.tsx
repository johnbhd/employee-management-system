import type { ReactNode } from "react";
import type { StatusTone } from "@/types/ui";

type StatusBadgeProps = {
  children: ReactNode;
  tone?: StatusTone;
  dot?: boolean;
};

export function StatusBadge({ children, tone = "muted", dot = true }: StatusBadgeProps) {
  return (
    <span className={`status-badge status-${tone}`}>
      {dot ? <span className="status-dot" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
