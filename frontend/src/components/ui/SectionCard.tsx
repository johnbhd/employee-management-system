import type { ReactNode } from "react";

type SectionCardProps = {
  children: ReactNode;
  className?: string;
  title?: string;
  eyebrow?: string;
  actions?: ReactNode;
};

export function SectionCard({ children, className = "", title, eyebrow, actions }: SectionCardProps) {
  return (
    <section className={`dashboard-card ${className}`.trim()}>
      {title ? (
        <div className="panel-header">
          <div>
            {eyebrow ? <p className="section-kicker">{eyebrow}</p> : null}
            <h2>{title}</h2>
          </div>
          {actions ? <div className="panel-actions">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
