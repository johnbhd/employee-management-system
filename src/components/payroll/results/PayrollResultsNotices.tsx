import type { PayrollResultNotice } from "@/data/payroll/results";

import { ActionButton } from "@/components/ui/ActionButton";
import { Icon } from "@/components/ui/Icon";

type PayrollResultsNoticesProps = {
  notices: readonly PayrollResultNotice[];
  onViewAll: () => void;
};

export function PayrollResultsNotices({ notices, onViewAll }: PayrollResultsNoticesProps) {
  return (
    <section className="dashboard-card payroll-results__notices" aria-labelledby="payroll-results-notices-heading">
      <div className="panel-header">
        <div>
          <p className="section-kicker">Payroll notices</p>
          <h2 id="payroll-results-notices-heading">Results &amp; Follow-up</h2>
          <p className="payroll-results__panel-description">Important updates and items that need attention.</p>
        </div>
        <ActionButton variant="secondary" action="Showing all payroll result notices in the prototype." onAction={onViewAll}>View all</ActionButton>
      </div>
      <div className="payroll-results__notice-list">
        {notices.map((notice) => (
          <article className="payroll-results__notice" key={notice.id}>
            <span className={`payroll-results__notice-icon payroll-results__notice-icon--${notice.tone}`}><Icon name={notice.tone === "success" ? "check" : notice.tone === "warning" ? "clock" : "close"} /></span>
            <div className="payroll-results__notice-body">
              <strong>{notice.title}</strong>
              <span>{notice.description}</span>
            </div>
            <time>{notice.date}<br />{notice.time}</time>
          </article>
        ))}
      </div>
    </section>
  );
}
