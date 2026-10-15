import Link from "next/link";

type PermissionDeniedPageProps = {
  title: string;
  description?: string;
  backHref: string;
  backLabel: string;
};

export function PermissionDeniedPage({
  title,
  description = "Your account is not assigned the permission required to open this page.",
  backHref,
  backLabel,
}: PermissionDeniedPageProps) {
  return (
    <div className="permission-denied-page" aria-labelledby="permission-denied-title">
      <section className="dashboard-card permission-denied-card">
        <p className="section-kicker">Access restricted</p>
        <h1 id="permission-denied-title">{title}</h1>
        <p>{description}</p>
        <Link className="button-secondary" href={backHref}>{backLabel}</Link>
      </section>
    </div>
  );
}
