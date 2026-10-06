import Link from "next/link";

import { Icon } from "@/components/ui/Icon";
import {
  employeeHelpFaqs,
  employeeHelpQuickLinks,
  employeeHelpTopics,
} from "@/data/employee-help";

import { HelpSupportFaq } from "./HelpSupportFaq";
import { SupportRequestSection } from "./SupportRequestSection";

export function EmployeeHelpSupportPage() {
  return (
    <div className="employee-help-support-page">
      <header className="employee-help-support-heading">
        <span className="employee-help-support-heading-label">Employee support</span>
        <p>
          Find answers to common questions and guidance for attendance, QR,
          corrections, payslips, and account access.
        </p>
      </header>

      <SupportRequestSection />

      <section
        className="employee-help-section employee-help-quick-help"
        aria-labelledby="employee-help-quick-help-title"
      >
        <div className="employee-help-section-heading">
          <div>
            <span className="employee-help-section-kicker">Start here</span>
            <h2 id="employee-help-quick-help-title">Quick Help</h2>
          </div>
          <span className="employee-help-section-note">Common employee tasks</span>
        </div>

        <div className="employee-help-quick-grid">
          {employeeHelpQuickLinks.map((item) => (
            <article className="employee-help-quick-item" key={item.id}>
              <div className="employee-help-icon employee-help-icon-blue" aria-hidden="true">
                <Icon name={item.icon} />
              </div>
              <div className="employee-help-item-copy">
                <h3>{item.label}</h3>
                <p>{item.description}</p>
                <Link href={item.href} className="employee-help-inline-link">
                  {item.linkLabel}
                  <Icon name="arrow" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        className="employee-help-section employee-help-topics"
        aria-labelledby="employee-help-topics-title"
      >
        <div className="employee-help-section-heading">
          <div>
            <span className="employee-help-section-kicker">Guides</span>
            <h2 id="employee-help-topics-title">Help Topics</h2>
          </div>
          <span className="employee-help-section-note">Attendance and account guidance</span>
        </div>

        <div className="employee-help-topic-list">
          {employeeHelpTopics.map((topic) => (
            <article className="employee-help-topic" id={topic.id} key={topic.id}>
              <div className="employee-help-icon employee-help-icon-red" aria-hidden="true">
                <Icon name={topic.icon} />
              </div>
              <div className="employee-help-item-copy">
                <h3>{topic.title}</h3>
                <p className="employee-help-topic-summary">{topic.summary}</p>
                <ul>
                  {topic.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
                {topic.href && topic.linkLabel ? (
                  <Link href={topic.href} className="employee-help-inline-link">
                    {topic.linkLabel}
                    <Icon name="arrow" />
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        className="employee-help-section employee-help-faq"
        aria-labelledby="employee-help-faq-title"
      >
        <div className="employee-help-section-heading">
          <div>
            <span className="employee-help-section-kicker">Common questions</span>
            <h2 id="employee-help-faq-title">Frequently Asked Questions</h2>
          </div>
          <span className="employee-help-section-note">Select a question to read the answer</span>
        </div>

        <HelpSupportFaq faqs={employeeHelpFaqs} />
      </section>
    </div>
  );
}
